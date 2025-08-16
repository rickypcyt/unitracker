import { memo, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { KanbanBoard } from '@/pages/tasks/KanbanBoard';
import LoginPromptModal from '@/modals/LoginPromptModal';
import { Plus } from 'lucide-react';
import TaskForm from '@/pages/tasks/TaskForm';
import WorkspaceCreateModal from '@/modals/WorkspaceCreateModal';
import { fetchTasks } from '@/store/TaskActions';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/navbar/NavigationContext';

const TasksPage = memo(() => {
  const { activePage } = useNavigation();
  const isVisible = activePage === 'tasks';
  const dispatch = useDispatch();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { isLoggedIn } = useAuth();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const workspaces = useSelector(state => state.workspace.workspaces);
  // const tasks = useSelector(state => state.tasks.tasks || []);
  const loading = useSelector(state => state.tasks.loading);

  const handleRefresh = useCallback(() => {
    if (isVisible) {
      dispatch(fetchTasks()); // Fetch tasks when the page is visible
    }
  }, [isVisible, dispatch]);

  useEffect(() => {
    // Initial fetch when the page becomes visible
    handleRefresh();

    // Listen for the custom refresh event
    const handleRefreshEvent = () => {
      console.warn('refreshTaskList event received'); // Log for debugging
      dispatch(fetchTasks());
    };

    window.addEventListener('refreshTaskList', handleRefreshEvent);

    return () => {
      window.removeEventListener('refreshTaskList', handleRefreshEvent);
    };
  }, [handleRefresh, dispatch]);

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
    <div className="w-full px-3 pt-4 sm:pt-10 relative min-h-[calc(100vh-4rem)] z-0">
      <KanbanBoard />
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
            dispatch(fetchTasks());
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