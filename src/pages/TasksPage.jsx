import React, { memo, useEffect, useCallback } from 'react';
import { KanbanBoard } from '../components/tools/KanbanBoard';
import { useNavigation } from '../features/navigation/NavigationContext';
import { useDispatch } from 'react-redux';
import { fetchTasks } from '../store/actions/TaskActions';

const TasksPage = memo(() => {
  const { activePage } = useNavigation();
  const isVisible = activePage === 'tasks';
  const dispatch = useDispatch();

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

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-full px-6 pt-10">
      <KanbanBoard />
    </div>
  );
});

TasksPage.displayName = 'TasksPage';

export default TasksPage; 