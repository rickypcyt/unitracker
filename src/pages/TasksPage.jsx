import React, { memo, useCallback, useEffect, useState } from 'react';

import { KanbanBoard } from '../components/tools/KanbanBoard';
import { Plus } from 'lucide-react';
import TaskForm from '../components/tools/TaskForm';
import { fetchTasks } from '../store/actions/TaskActions';
import { useDispatch } from 'react-redux';
import { useNavigation } from '../features/navigation/NavigationContext';

const TasksPage = memo(() => {
  const { activePage } = useNavigation();
  const isVisible = activePage === 'tasks';
  const dispatch = useDispatch();
  const [showTaskForm, setShowTaskForm] = useState(false);

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
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-full px-6 pt-10 relative min-h-[calc(100vh-4rem)]">
      <KanbanBoard />
      
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
    </div>
  );
});

TasksPage.displayName = 'TasksPage';

export default TasksPage; 