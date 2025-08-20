import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import TaskForm from '@/pages/tasks/TaskForm';
import { TaskItem } from '@/pages/tasks/TaskItem';
import { TaskListMenu } from '@/modals/TaskListMenu';
import { fetchTasks } from '@/store/TaskActions';
import useDemoMode from '@/utils/useDemoMode';
import { useTaskManager } from '@/hooks/useTaskManager';

const UpcomingTasks = () => {
  const { handleToggleCompletion, handleDeleteTask, handleUpdateTask } = useTaskManager();
  const realTasks = useSelector((state) => state.tasks.tasks);
  const { isDemo, demoTasks } = useDemoMode();
  const tasks = isDemo ? demoTasks : realTasks;
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    today: false,
    thisWeek: false,
  });
  const dispatch = useDispatch();
  const [contextMenu, setContextMenu] = useState(null);

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

  // Past tasks moved to separate component

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
    }
    groups[monthKey].tasks.push(task);
    return groups;
  }, {});

  // Sort months chronologically
  const sortedMonths = Object.values(tasksByMonth).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Ensure all static groups are initialized in expandedGroups
  useEffect(() => {
    setExpandedGroups(prev => {
      const newState = { ...prev };
      ['noDeadline', 'today', 'thisWeek'].forEach(key => {
        if (!(key in newState)) {
          newState[key] = false;
        }
      });
      return newState;
    });
  }, []);

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

  // Removed unused getDifficultyColor

  // Add No Deadline group
  const noDeadlineTasks = tasks.filter(task => (!task.deadline || task.deadline === '' || task.deadline === null) && !task.completed);

  const handleTaskContextMenu = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type: 'task',
      x: e.clientX,
      y: e.clientY,
      task,
    });
  };
  const handleCloseContextMenu = () => setContextMenu(null);

  const hasUpcoming = upcomingTasks.length > 0;

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
                onContextMenu={handleTaskContextMenu}
                showAssignment={true}
                assignmentLeftOfDate={true}
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
        {/* No Deadline Tasks */}
        <TaskGroup title="No Deadline" tasks={noDeadlineTasks} groupKey="noDeadline" />
        {/* Upcoming Tasks */}
        {hasUpcoming ? (
          <>
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
          </>
        ) : (
          <p className="text-[var(--text-secondary)]">No upcoming tasks</p>
        )}

        {/* Past Tasks moved to separate component/card */}
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
      {/* Context Menu */}
      {contextMenu && (
        <TaskListMenu
          contextMenu={contextMenu}
          onClose={handleCloseContextMenu}
          onEditTask={handleEditTask}
          onSetActiveTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default UpcomingTasks; 