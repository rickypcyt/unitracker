import React, { memo, useEffect } from 'react';
import { TaskList } from '../../components/tools/TaskList';
import TaskForm from '../../components/tools/TaskForm';
import { useLocation } from 'react-router-dom';

const TasksPage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/tasks';

  // Actualizar la lista de tareas cuando la página se hace visible
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshTaskList'));
    }
  }, [isVisible]);

  return (
    <div className="container mx-auto px-4 pt-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Form */}
        <div>
          <TaskForm />
        </div>
        
        {/* Task List */}
        <div>
          <TaskList />
        </div>
      </div>
    </div>
  );
});

TasksPage.displayName = 'TasksPage';

export default TasksPage; 