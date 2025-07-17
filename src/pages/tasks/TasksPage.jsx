import React, { memo, useCallback, useEffect, useState } from 'react';
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
      console.log('refreshTaskList event received'); // Log for debugging
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

  return (
    <div className="w-full px-3 pt-6 relative min-h-[calc(100vh-4rem)] z-0">
      <KanbanBoard />
      {/* Floating Action Button */}
      <button
        onClick={handleAddTask}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-transparent border-2 border-dashed border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-lg hover:bg-[var(--accent-primary)]/10 transition-colors flex items-center justify-center z-50"
        aria-label="Add new task"
      >
        <Plus size={32} />
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