import React, { memo, useEffect, useCallback } from 'react';
import { KanbanBoard } from '../components/tools/KanbanBoard';
import { useNavigation } from '../contexts/NavigationContext';

const TasksPage = memo(() => {
  const { activePage } = useNavigation();
  const isVisible = activePage === 'tasks';

  const handleRefresh = useCallback(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshTaskList'));
    }
  }, [isVisible]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

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