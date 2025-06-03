import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import TaskDetailsModal from '../modals/TaskDetailsModal';
import { fetchTasks } from '../../store/actions/TaskActions';
import { useTaskManager } from '../../hooks/useTaskManager';

const UpcomingTasks = () => {
  const { user, handleToggleCompletion, handleDeleteTask, handleUpdateTask } = useTaskManager();
  const tasks = useSelector((state) => state.tasks.tasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editedTask, setEditedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    today: false,
    thisWeek: false
  });
  const dispatch = useDispatch();

  useEffect(() => {
    // Listen for the refreshTaskList event
    const handleRefresh = () => {
      dispatch(fetchTasks());
    };

    window.addEventListener('refreshTaskList', handleRefresh);

    return () => {
      window.removeEventListener('refreshTaskList', handleRefresh);
    };
  }, [dispatch]);

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

  // Group tasks by time periods
  const todayTasks = upcomingTasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === today.toDateString();
  });

  const thisWeekTasks = upcomingTasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate > today && taskDate <= endOfWeek;
  });

  // Group remaining tasks by month
  const tasksByMonth = upcomingTasks.reduce((groups, task) => {
    const taskDate = new Date(task.deadline);
    if (taskDate <= today || taskDate <= endOfWeek) return groups;

    const monthKey = `${taskDate.getFullYear()}-${taskDate.getMonth()}`;
    if (!groups[monthKey]) {
      groups[monthKey] = {
        month: taskDate.getMonth(),
        year: taskDate.getFullYear(),
        tasks: []
      };
      // Initialize expanded state for new month groups only if they don't exist
      if (!(monthKey in expandedGroups)) {
        setExpandedGroups(prev => ({
          ...prev,
          [monthKey]: false
        }));
      }
    }
    groups[monthKey].tasks.push(task);
    return groups;
  }, {});

  // Sort months chronologically
  const sortedMonths = Object.values(tasksByMonth).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Clean up expanded state for months that no longer have tasks
  useEffect(() => {
    const currentMonthKeys = sortedMonths.map(({ month, year }) => `${year}-${month}`);
    const allMonthKeys = Object.keys(expandedGroups).filter(key => key !== 'today' && key !== 'thisWeek');
    
    const monthsToRemove = allMonthKeys.filter(key => !currentMonthKeys.includes(key));
    if (monthsToRemove.length > 0) {
      setExpandedGroups(prev => {
        const newState = { ...prev };
        monthsToRemove.forEach(key => delete newState[key]);
        return newState;
      });
    }
  }, [sortedMonths]);

  const toggleGroup = (group) => {
    setExpandedGroups(prev => {
      const newState = { ...prev };
      newState[group] = !prev[group];
      return newState;
    });
  };

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
      <div className="maincard">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Upcoming Tasks</h3>
        <p className="text-[var(--text-secondary)]">No upcoming tasks</p>
      </div>
    );
  }

  const TaskGroup = ({ title, tasks, groupKey }) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-4">
        <button
          className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-lg p-3 hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-between"
          onClick={() => toggleGroup(groupKey)}
          aria-expanded={expandedGroups[groupKey]}
        >
          <div className="flex items-center justify-between w-full ">
            <span className={`text-base transition-colors ${expandedGroups[groupKey] ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
              {title}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-[var(--text-secondary)] text-base">
                {tasks.length} tasks
              </span>
              {expandedGroups[groupKey] ? (
                <ChevronUp size={22} className="text-[var(--accent-primary)]" />
              ) : (
                <ChevronDown size={22} className="text-[var(--text-secondary)]" />
              )}
            </div>
          </div>
        </button>
        
        {expandedGroups[groupKey] && (
          <div className="space-y-2 mt-3">
            {tasks.map(task => {
              const taskDate = new Date(task.deadline);
              const isToday = taskDate.toDateString() === today.toDateString();
              const isTomorrow = new Date(today.getTime() + 86400000).toDateString() === taskDate.toDateString();
              
              return (
                <div 
                  key={task.id} 
                  className="flex flex-col ml-2 text-base p-3 rounded-lg bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] hover:border-[var(--border-primary)]/70 transition-colors cursor-pointer"
                  onClick={() => handleOpenTaskDetails(task)}
                >
                  {/* Top row: Deadline/Priority (Left) and Assignment (Right) */}
                  <div className="flex justify-between items-center w-full mb-1">
                      {/* Deadline or Priority */}
                      <div className="text-xs text-[var(--text-secondary)]">
                          {task.deadline && (
                              <span>
                                  {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : taskDate.toLocaleDateString(undefined, { 
                                      weekday: 'short',
                                      month: 'short', 
                                      day: 'numeric' 
                                  })}
                              </span>
                          )}
                          {task.priority && !task.deadline && (
                              <span className={`capitalize ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                              </span>
                          )}
                      </div>

                      {/* Assignment Name */}
                      {task.assignment && (
                          <div className="text-[var(--accent-primary)] text-xs font-semibold capitalize text-right">
                              {task.assignment}
                          </div>
                      )}
                  </div>

                  {/* Title and Description */}
                  <div className="flex flex-col">
                    <span className="text-[var(--text-primary)] text-base font-medium">{task.title}</span>
                    {task.description && (
                        <span className="text-[var(--text-secondary)] text-sm mt-0.5">
                            {task.description}
                        </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="maincard">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Upcoming Tasks</h3>
      <div className="space-y-3">
        <TaskGroup title="Today" tasks={todayTasks} groupKey="today" />
        <TaskGroup title="This Week" tasks={thisWeekTasks} groupKey="thisWeek" />
        {sortedMonths.map(({ month, year, tasks }) => (
          <TaskGroup
            key={`${year}-${month}`}
            title={new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
            tasks={tasks}
            groupKey={`${year}-${month}`}
          />
        ))}
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