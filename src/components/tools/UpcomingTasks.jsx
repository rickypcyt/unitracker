import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Clock } from 'lucide-react';
import TaskDetailsModal from '../modals/TaskDetailsModal';
import { useTaskManager } from '../../hooks/useTaskManager';

const UpcomingTasks = () => {
  const { user, handleToggleCompletion, handleDeleteTask, handleUpdateTask } = useTaskManager();
  const tasks = useSelector((state) => state.tasks.tasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editedTask, setEditedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get end of week (Sunday)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  // Filter and sort upcoming tasks
  const upcomingTasks = tasks
    .filter(task => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate >= today && !task.completed;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // Separate tasks into this week and later
  const thisWeekTasks = upcomingTasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate <= endOfWeek;
  });

  const laterTasks = upcomingTasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate > endOfWeek;
  });

  const handleOpenTaskDetails = (task) => {
    setSelectedTask(task);
    setEditedTask(task);
    setIsEditing(false);
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    setEditedTask(null);
    setIsEditing(false);
  };

  const handleEditChange = (field, value) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = () => {
    if (editedTask) {
      handleUpdateTask(editedTask);
      handleCloseTaskDetails();
    }
  };

  if (upcomingTasks.length === 0) {
    return (
      <div className="maincard border border-neutral-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Upcoming Tasks</h3>
        <p className="text-neutral-400">No upcoming tasks</p>
      </div>
    );
  }

  const TaskGroup = ({ title, tasks }) => (
    <div className="mb-4">
      <h4 className="text-md font-medium text-neutral-300 mb-2">{title}</h4>
      <div className="space-y-2">
        {tasks.map((task) => {
          const taskDate = new Date(task.deadline);
          const isToday = taskDate.toDateString() === today.toDateString();
          const isTomorrow = new Date(today.getTime() + 86400000).toDateString() === taskDate.toDateString();
          
          return (
            <div 
              key={task.id} 
              className="flex maincard items-center justify-between p-2 rounded-md hover:bg-neutral-700 transition-colors cursor-pointer"
              onClick={() => handleOpenTaskDetails(task)}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                <span className="text-white">{task.title}</span>
              </div>
              <span className="text-base text-neutral-400">
                {task.assignment && <span className="mr-2">{task.assignment}</span>}
                {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : taskDate.toLocaleDateString(undefined, { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="maincard">
      <h3 className="text-lg font-semibold text-white mb-3">Upcoming Tasks</h3>
      <div className="space-y-3">
        {thisWeekTasks.length > 0 && <TaskGroup title="This Week" tasks={thisWeekTasks} />}
        {laterTasks.length > 0 && <TaskGroup title="Later" tasks={laterTasks} />}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          isOpen={!!selectedTask}
          onClose={handleCloseTaskDetails}
          task={selectedTask}
          onSave={handleSaveEdit}
          onEditChange={handleEditChange}
          editedTask={editedTask}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      )}
    </div>
  );
};

export default UpcomingTasks; 