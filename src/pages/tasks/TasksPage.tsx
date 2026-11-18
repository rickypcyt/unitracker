import { Plus, Search, Settings as SettingsIcon, X } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFetchTasks, useTasksOnly, useWorkspace, useWorkspaceActions } from '@/store/appStore';

import { Helmet } from "react-helmet-async";
import { KanbanBoard } from '@/pages/tasks/KanbanBoard';
import DemoTaskModal from '@/modals/tasks/DemoTaskModal';
import { isDemoExplore } from '@/utils/demoExplore';
import LoginPromptModal from '@/modals/auth/LoginPromptModal';
import TaskFormManager from '@/pages/tasks/TaskFormManager';
import TaskPageSettingsModal, { type ColumnCount, type FabPosition, type ViewMode } from '@/modals/tasks/TaskPageSettingsModal';
import WorkspaceCreateModal from '@/modals/workspaces/WorkspaceCreateModal';
import WorkspaceSelector from '@/pages/calendar/WorkspaceSelector';
import { useAuth } from '@/hooks/auth/useAuth';
import { useNavigation } from '@/navigation/NavigationContext';

const TasksPage = memo(() => {
  const { activePage } = useNavigation();
  const isVisible = activePage === 'tasks';
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [columnCount, setColumnCount] = useState<ColumnCount>(() => {
    const saved = localStorage.getItem('taskPageColumnCount');
    return (Number(saved) as ColumnCount) || 4;
  });
  const [fabPosition, setFabPosition] = useState<FabPosition>(() => {
    return (localStorage.getItem('taskPageFabPosition') as FabPosition) || 'bottom-right';
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('taskPageViewMode') as ViewMode) || 'assignment';
  });
  const { isLoggedIn } = useAuth();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showDemoTask, setShowDemoTask] = useState(false);

  // Use Zustand selectors
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const { setCurrentWorkspace } = useWorkspaceActions();
  const fetchTasks = useFetchTasks();
  const allTasks = useTasksOnly();
  const [query, setQuery] = useState('');
  const lastWheelSwitchRef = useRef(0);

  // Summary for the toolbar: pending / due today / overdue in the current workspace
  const summary = useMemo(() => {
    const todayKey = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const scoped = (allTasks || []).filter((task: any) =>
      !task.completed && (!activeWorkspace || activeWorkspace.id === 'all' || task.workspace_id === activeWorkspace.id)
    );
    let today = 0;
    let overdue = 0;
    scoped.forEach((task: any) => {
      const raw = task.deadline || task.due_date;
      if (!raw) return;
      const key = String(raw).slice(0, 10);
      if (key === todayKey) today += 1;
      else if (key < todayKey) overdue += 1;
    });
    return { pending: scoped.length, today, overdue };
  }, [allTasks, activeWorkspace]);

  // Touch swipe refs and state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    // Fetch tasks when page becomes visible
    if (isVisible) {
      fetchTasks(activeWorkspace?.id);
    }

    // Touch event listeners for swipe navigation between workspaces
    if (isVisible) {
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeWorkspace?.id, isVisible, fetchTasks]);

  const handleAddTask = () => {
    if (!isLoggedIn) {
      // "Let me look around first" users can try a temporary task before being asked to sign in
      if (isDemoExplore()) setShowDemoTask(true);
      else setIsLoginPromptOpen(true);
      return;
    }
    if (!workspaces || workspaces.length === 0) {
      setShowWorkspaceModal(true);
      return;
    }
    setShowTaskForm(true);
  };

  useEffect(() => {
    const handleQuickAdd = () => handleAddTask();
    window.addEventListener('quickAddTask', handleQuickAdd);
    return () => window.removeEventListener('quickAddTask', handleQuickAdd);
  }, [handleAddTask]);

  useEffect(() => {
    const handleOpenWorkspaceModal = () => setShowWorkspaceModal(true);
    window.addEventListener('openWorkspaceModal', handleOpenWorkspaceModal);
    return () => window.removeEventListener('openWorkspaceModal', handleOpenWorkspaceModal);
  }, []);

  const handleColumnCountChange = (count: ColumnCount) => {
    setColumnCount(count);
    localStorage.setItem('taskPageColumnCount', String(count));
  };

  const handleFabPositionChange = (pos: FabPosition) => {
    setFabPosition(pos);
    localStorage.setItem('taskPageFabPosition', pos);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('taskPageViewMode', mode);
  };

  const fabPositionClass: Record<FabPosition, string> = {
    'bottom-right': 'bottom-20 right-6 sm:bottom-6',
    'bottom-left': 'bottom-20 left-6 sm:bottom-6',
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6',
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
  };

  const handleWorkspaceCreated = () => {
    setShowWorkspaceModal(false);
    setShowTaskForm(true);
  };

  // Mouse wheel switches between workspaces (left: previous, right: next)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!workspaces || workspaces.length <= 1 || !activeWorkspace) return;

    const threshold = 10; // ignore tiny trackpad deltas
    // Only proceed if swiping right (deltaX > 0)
    if (e.deltaX < threshold) return;

    const now = Date.now();
    if (now - lastWheelSwitchRef.current < 350) return; // throttle rapid wheel events

    e.preventDefault();
    e.stopPropagation();

    const currentIndex = workspaces.findIndex(ws => ws.id === activeWorkspace.id);
    if (currentIndex === -1) return;

    // Only move to the next workspace (right)
    const nextIndex = (currentIndex + 1) % workspaces.length;
    const nextWorkspace = workspaces[nextIndex];

    if (nextWorkspace && nextWorkspace.id !== activeWorkspace.id) {
      try { localStorage.setItem('activeWorkspaceId', nextWorkspace.id); } catch {}
      setCurrentWorkspace(nextWorkspace);
      lastWheelSwitchRef.current = now;
    }
  }, [workspaces, activeWorkspace, setCurrentWorkspace]);

  // Touch swipe switches between workspaces
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.screenX || 0;
    touchStartY.current = e.changedTouches[0]?.screenY || 0;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    touchEndX.current = e.changedTouches[0]?.screenX || 0;
    touchEndY.current = e.changedTouches[0]?.screenY || 0;

    const diffX = touchEndX.current - touchStartX.current;
    const diffY = touchEndY.current - touchStartY.current;

    // Only handle horizontal swipes (ignore vertical swipes)
    if (Math.abs(diffY) > Math.abs(diffX)) return;

    const threshold = 60; // minimum swipe distance
    if (Math.abs(diffX) < threshold) return;

    if (!workspaces || workspaces.length <= 1 || !activeWorkspace) return;

    const now = Date.now();
    if (now - lastWheelSwitchRef.current < 350) return; // throttle rapid gestures

    const currentIndex = workspaces.findIndex(ws => ws.id === activeWorkspace.id);
    if (currentIndex === -1) return;

    let nextWorkspace;
    if (diffX > 0) {
      // Swipe right: previous workspace
      const prevIndex = currentIndex === 0 ? workspaces.length - 1 : currentIndex - 1;
      nextWorkspace = workspaces[prevIndex];
    } else {
      // Swipe left: next workspace
      const nextIndex = (currentIndex + 1) % workspaces.length;
      nextWorkspace = workspaces[nextIndex];
    }

    if (nextWorkspace && nextWorkspace.id !== activeWorkspace.id) {
      try { localStorage.setItem('activeWorkspaceId', nextWorkspace.id); } catch {}
      setCurrentWorkspace(nextWorkspace);
      lastWheelSwitchRef.current = now;
    }
  }, [workspaces, activeWorkspace, setCurrentWorkspace]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Task Management & Kanban Board | UniTracker 2026</title>
        <meta
          name="description"
          content="Free task management app for students. Organize assignments, track progress with Kanban boards, and manage study tasks efficiently."
        />
        <meta
          name="keywords"
          content="task management, kanban board, assignment tracker, study tasks, project management, student planner, todo list"
        />
        <meta property="og:title" content="Task Management & Kanban Board | UniTracker 2026" />
        <meta
          property="og:description"
          content="Free task management app for students. Organize assignments, track progress with Kanban boards, and manage study tasks efficiently."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/tasks" />
        <link rel="canonical" href="https://unitracker.me/tasks" />
      </Helmet>
      <div className="tasks-ui w-full pb-24 relative bg-[var(--bg-primary)] z-0" onWheel={handleWheel}>
      {/* Mobile Workspace Selector (footer island shows the name from sm up) */}
      <div className="sm:hidden w-full mb-4">
        <WorkspaceSelector />
      </div>
      
      {/* Toolbar: title + live summary on the left, search on the right */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="m-0 p-0 text-[length:var(--t-page-title,24px)] font-bold leading-none tracking-tight text-[var(--text-primary)]">Tasks</h1>
          <div className="flex items-center gap-1.5 whitespace-nowrap text-[length:var(--t-meta,12px)] font-semibold leading-none tabular-nums">
            <span className="rounded-full bg-[var(--accent-primary)]/15 px-3 py-1.5 text-[var(--accent-primary)]">{summary.pending} pending</span>
            {summary.today > 0 && <span className="rounded-full bg-green-500/15 px-3 py-1.5 text-green-500">{summary.today} today</span>}
            {summary.overdue > 0 && <span className="rounded-full bg-red-500/15 px-3 py-1.5 text-red-400">{summary.overdue} overdue</span>}
          </div>
        </div>
        <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 transition-colors focus-within:border-[var(--accent-primary)] sm:w-72 2xl:w-80">
          <Search size={15} className="shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setQuery(''); }}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="min-w-0 flex-1 border-none bg-transparent text-[length:var(--t-title,14px)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 !outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="shrink-0 text-[var(--text-secondary)]" aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <KanbanBoard columnCount={columnCount} viewMode={viewMode} query={query} />
      {/* Floating buttons: settings + add task */}
      <div className={`fixed ${fabPositionClass[fabPosition]} z-50 flex flex-row items-center gap-2`}>
        <button
          onClick={() => setShowSettings(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[var(--border-primary)] text-[var(--text-secondary)] bg-[var(--bg-primary)] shadow-lg transition-all duration-300 flex items-center justify-center hover:scale-110 hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] active:scale-95"
          aria-label="Task page settings"
          title="Task page settings"
        >
          <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          data-tour="add-task"
          onClick={handleAddTask}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent shadow-lg shadow-[var(--accent-primary)]/20 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 overflow-hidden fab-shine"
          aria-label="Add new task"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300" />
        </button>
      </div>
      {/* Task Page Settings Modal */}
      <TaskPageSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        columnCount={columnCount}
        fabPosition={fabPosition}
        viewMode={viewMode}
        onColumnCountChange={handleColumnCountChange}
        onFabPositionChange={handleFabPositionChange}
        onViewModeChange={handleViewModeChange}
      />
      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskFormManager
          onClose={handleCloseTaskForm}
          onTaskCreated={() => {
            fetchTasks(activeWorkspace?.id);
            handleCloseTaskForm();
          }}
        />
      )}
      {/* Workspace Create Modal */}
      {showWorkspaceModal && (
        <WorkspaceCreateModal
          isOpen={showWorkspaceModal}
          onClose={() => setShowWorkspaceModal(false)}
          onWorkspaceCreated={handleWorkspaceCreated}
        />
      )}
      <DemoTaskModal
        isOpen={showDemoTask}
        onClose={() => setShowDemoTask(false)}
        workspaceId={
          activeWorkspace?.id?.startsWith('demo-ws-') ? activeWorkspace.id : workspaces?.[0]?.id ?? 'demo-ws-1'
        }
      />
      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
      />
    </div>
    </>
  );
});

TasksPage.displayName = 'TasksPage';

export default TasksPage; 