import { Info, Plus, X } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
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
  const { workspaces } = useWorkspace();
  const { currentWorkspace: activeWorkspace } = useWorkspace();
  const { setCurrentWorkspace } = useWorkspaceActions();
  const { loading } = useTasks();
  const fetchTasks = useFetchTasks();
  const lastWheelSwitchRef = useRef(0);

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

    return () => {
      window.removeEventListener('refreshTaskList', handleRefreshEvent);
    };
  }, [handleRefresh, activeWorkspace?.id]); // Add activeWorkspace?.id to dependencies

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
    if (Math.abs(e.deltaX) < threshold) return; 

    const now = Date.now();
    if (now - lastWheelSwitchRef.current < 350) return; // throttle rapid wheel events

    e.preventDefault();
    e.stopPropagation();

    const currentIndex = workspaces.findIndex(ws => ws.id === activeWorkspace.id);
    if (currentIndex === -1) return;

    // deltaX > 0 means scrolling right, deltaX < 0 means scrolling left
    const nextIndex = e.deltaX > 0
      ? (currentIndex + 1) % workspaces.length
      : (currentIndex - 1 + workspaces.length) % workspaces.length;

    const nextWorkspace = workspaces[nextIndex];
    if (nextWorkspace && nextWorkspace.id !== activeWorkspace.id) {
      try { localStorage.setItem('activeWorkspaceId', nextWorkspace.id); } catch {}
      setCurrentWorkspace(nextWorkspace);
      lastWheelSwitchRef.current = now;
    }
  }, [workspaces, activeWorkspace, setCurrentWorkspace]);

  if (!isVisible) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-16 sm:pt-20 pb-12 min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 pt-4 relative min-h-[calc(100vh-4rem)] z-0" onWheel={handleWheel}>
      <KanbanBoard />
      {/* Scroll Instruction Message */}
      {workspaces && workspaces.length > 1 && showScrollTip && (
        <div className="fixed bottom-6 left-6 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 shadow-lg antialiased z-40 flex items-center gap-3 text-sm text-[var(--text-secondary)] max-w-xs">
          <Info className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
          <span className="flex-1">Scroll to switch workspace</span>
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
  );
});

TasksPage.displayName = 'TasksPage';

export default TasksPage; 