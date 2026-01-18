import { Info, Plus, X } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from "react-helmet-async";
import { useFetchTasks, useTasks, useWorkspace, useWorkspaceActions } from '@/store/appStore';

import { KanbanBoard } from '@/pages/tasks/KanbanBoard';
import LoginPromptModal from '@/modals/LoginPromptModal';
import TaskForm from '@/pages/tasks/TaskForm';
import WorkspaceCreateModal from '@/modals/WorkspaceCreateModal';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/navbar/NavigationContext';

const TasksPage = memo(() => {
  const { activePage } = useNavigation();
  const isVisible = activePage === 'tasks';
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { isLoggedIn } = useAuth();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showScrollTip, setShowScrollTip] = useState(() => {
    // Check if user has dismissed the tip before
    try {
      return localStorage.getItem('scrollTipDismissed') !== 'true';
    } catch {
      return true;
    }
  });

  // Use Zustand selectors
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const { setCurrentWorkspace } = useWorkspaceActions();
  const { loading } = useTasks();
  const fetchTasks = useFetchTasks();
  const lastWheelSwitchRef = useRef(0);

  // Touch swipe refs and state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const handleRefresh = useCallback(() => {
    if (isVisible) {
      fetchTasks(activeWorkspace?.id); // Fetch tasks for current workspace
    }
  }, [isVisible, activeWorkspace?.id, fetchTasks]);

  useEffect(() => {
    // Initial fetch when the page becomes visible
    handleRefresh();

    // Listen for the custom refresh event
    const handleRefreshEvent = () => {
      console.warn('refreshTaskList event received'); // Log for debugging
      fetchTasks(activeWorkspace?.id);
    };

    window.addEventListener('refreshTaskList', handleRefreshEvent);

    // Touch event listeners for swipe navigation between workspaces
    if (isVisible) {
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener('refreshTaskList', handleRefreshEvent);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleRefresh, activeWorkspace?.id, isVisible]); // Add activeWorkspace?.id to dependencies

  const handleAddTask = () => {
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true);
      return;
    }
    if (!workspaces || workspaces.length === 0) {
      setShowWorkspaceModal(true);
      return;
    }
    setShowTaskForm(true);
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
        <title>Task Management & Kanban Board | Uni Tracker 2026</title>
        <meta
          name="description"
          content="Free task management app for students. Organize assignments, track progress with Kanban boards, and manage study tasks efficiently."
        />
        <meta
          name="keywords"
          content="task management, kanban board, assignment tracker, study tasks, project management, student planner, todo list"
        />
        <meta property="og:title" content="Task Management & Kanban Board | Uni Tracker 2026" />
        <meta
          property="og:description"
          content="Free task management app for students. Organize assignments, track progress with Kanban boards, and manage study tasks efficiently."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://uni-tracker.vercel.app/tasks" />
        <link rel="canonical" href="https://uni-tracker.vercel.app/tasks" />
      </Helmet>
      <div className="w-full px-3 pt-4 relative min-h-[calc(100vh-4rem)] z-0" onWheel={handleWheel}>
      <KanbanBoard />
      {/* Scroll Instruction Message */}
      {workspaces && workspaces.length > 1 && showScrollTip && (
        <div className="fixed bottom-6 left-6 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 shadow-lg antialiased z-40 flex items-center gap-3 text-sm text-[var(--text-secondary)] max-w-xs">
          <Info className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
          <span className="flex-1">Swipe right to switch workspace</span>
          <button
            onClick={() => {
              setShowScrollTip(false);
              try {
                localStorage.setItem('scrollTipDismissed', 'true');
              } catch {
                // Silently fail if localStorage is not available
              }
            }}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--bg-secondary)]"
            aria-label="Close scroll tip"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {/* Floating Action Button */}
      <button
        onClick={handleAddTask}
        className="fixed bottom-6 right-6 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-transparent border-2 border-dashed border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-lg hover:bg-[var(--accent-primary)]/10 transition-colors flex items-center justify-center z-50"
        aria-label="Add new task"
      >
        <Plus className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
      </button>
      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
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