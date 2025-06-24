import React, { memo, useCallback, useEffect, useState } from 'react';

import { KanbanBoard } from '../components/tools/KanbanBoard';
import LoginPromptModal from '../components/modals/LoginPromptModal';
import { Plus } from 'lucide-react';
import TaskForm from '../components/tools/TaskForm';
import { fetchTasks } from '../store/actions/TaskActions';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { useNavigation } from '../features/navigation/NavigationContext';

const TasksPage = memo(() => {
  const { activePage } = useNavigation();
  const isVisible = activePage === 'tasks';
  const dispatch = useDispatch();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { isLoggedIn } = useAuth();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

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
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-full px-3 pt-6 relative min-h-[calc(100vh-4rem)]">
      {!isLoggedIn ? (
        <div className="text-center text-[var(--text-secondary)] py-8">
          Please log in to manage your tasks.
        </div>
      ) : (
        <KanbanBoard />
      )}
      
      {/* Floating Action Button */}
      <button
        onClick={handleAddTask}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[var(--accent-primary)] text-white shadow-lg hover:bg-[var(--accent-primary)]/90 transition-colors flex items-center justify-center z-50"
        aria-label="Add new task"
      >
        <Plus size={24} />
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