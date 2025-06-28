import { Calendar, CheckCircle2, ChevronDown, ChevronUp, Circle, Clock, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import TaskForm from '@/pages/tasks/TaskForm';
import { TaskItem } from '@/pages/tasks/TaskItem';
import { fetchTasks } from '@/store/TaskActions';
import { useTaskManager } from '@/hooks/useTaskManager';

const UpcomingTasks = () => {
  const { user, handleToggleCompletion, handleDeleteTask, handleUpdateTask } = useTaskManager();
  const tasks = useSelector((state) => state.tasks.tasks);
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    today: false,
    thisWeek: false,
    pastTasks: false,
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

  // Filtrar tareas pasadas (no completadas y deadline < hoy)
  const pastTasks = tasks
    .filter(task => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today && !task.completed;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

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
    // Solo limpiar claves de meses, nunca 'today', 'thisWeek' ni 'pastTasks'
    const allMonthKeys = Object.keys(expandedGroups).filter(key => !['today', 'thisWeek', 'pastTasks'].includes(key));
    
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

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  // Agregar función para color de dificultad
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-[#00FF41]'; // Matrix green
      case 'medium':
        return 'text-[#1E90FF]'; // Electric neon blue
      case 'hard':
        return 'text-[#FF003C]'; // Neon red
      default:
        return 'text-[var(--text-secondary)]';
    }
  };

  if (upcomingTasks.length === 0) {
    return (
      <div className="maincard">
        <div className="flex justify-center items-center">
          <div className="section-title">
            <Calendar size={22} className="icon" />
            <span>Upcoming Tasks</span>
          </div>
        </div>
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
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleDeleteTask}
                onEditTask={handleEditTask}
                showAssignment={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="maincard">
      <div className="flex justify-center items-center">
        <div className="section-title">
          <Calendar size={22} className="icon" />
          <span>Upcoming Tasks</span>
        </div>
      </div>
      <div className="space-y-3">
        {/* Past Tasks */}
        <TaskGroup title="Past Tasks" tasks={pastTasks} groupKey="pastTasks" />
        {/* Upcoming Tasks */}
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

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleCloseTaskForm}
          initialTask={editingTask}
          onTaskCreated={() => {
            dispatch(fetchTasks());
            handleCloseTaskForm();
          }}
        />
      )}
    </div>
  );
};

export default UpcomingTasks; 