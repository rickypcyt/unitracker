import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import type { Task } from '@/pages/tasks/task';
import TaskForm from '@/pages/tasks/TaskForm';
import { TaskItem } from '@/pages/tasks/TaskItem';
import { TaskListMenu } from '@/modals/TaskListMenu';
import type { UnknownAction } from '@reduxjs/toolkit';
import { fetchTasks } from '@/store/TaskActions';
import useDemoMode from '@/utils/useDemoMode';
import { useTaskManager } from '@/hooks/useTaskManager';

interface RootState {
  tasks: {
    tasks: Task[];
  };
}

interface ExpandedGroups {
  [key: string]: boolean;
}

interface ContextMenuState {
  type: string;
  x: number;
  y: number;
  task: Task;
}

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  groupKey: string;
}

interface MonthGroup {
  month: number;
  year: number;
  tasks: Task[];
}

const UpcomingTasks = () => {
  const { handleToggleCompletion, handleDeleteTask, handleUpdateTask } = useTaskManager();
  const realTasks = useSelector((state: RootState) => state.tasks.tasks);
  const { isDemo, demoTasks } = useDemoMode();
  const tasks = isDemo ? demoTasks : realTasks;
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<ExpandedGroups>({
    today: true,
    thisWeek: true,
    noDeadline: true,
  });
  const dispatch = useDispatch();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    // Listen for the refreshTaskList event
    const handleRefresh = async () => {
      await dispatch(fetchTasks() as unknown as UnknownAction);
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
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate >= today && !task.completed;
    })
    .sort((a: Task, b: Task) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  // Group tasks by time periods
  const todayTasks = upcomingTasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    return taskDate.toDateString() === today.toDateString();
  });

  const thisWeekTasks = upcomingTasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    return taskDate > today && taskDate <= endOfWeek;
  });

  // Group remaining tasks by month
  const tasksByMonth = upcomingTasks.reduce((groups: Record<string, MonthGroup>, task: Task) => {
    if (!task.due_date) return groups;
    const taskDate = new Date(task.due_date);
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
  const sortedMonths = Object.values(tasksByMonth).sort((a: MonthGroup, b: MonthGroup) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Ensure all static groups are initialized in expandedGroups
  useEffect(() => {
    setExpandedGroups(prev => {
      const newState = { ...prev };
      ['today', 'thisWeek', 'noDeadline'].forEach(key => {
        if (!(key in newState)) {
          newState[key] = true;
        } else {
          newState[key] = true; // Set all to true by default
        }
      });
      return newState;
    });
  }, []);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newState = { ...prev };
      newState[group] = !prev[group];
      return newState;
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  // Removed unused getDifficultyColor

  // Add No Deadline group
  const noDeadlineTasks = tasks.filter(task => (!task.due_date || task.due_date === '' || task.due_date === null) && !task.completed);

  const handleTaskContextMenu = (e: React.MouseEvent, task: Task) => {
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

  const TaskGroup = ({ title, tasks, groupKey }: TaskGroupProps) => {
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
            {tasks.map((task: Task) => (
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
        {/* Time-based Tasks First */}
        {hasUpcoming ? (
          <>
            <TaskGroup title="Today" tasks={todayTasks} groupKey="today" />
            <TaskGroup title="This Week" tasks={thisWeekTasks} groupKey="thisWeek" />
            {sortedMonths.map(({ month, year, tasks }: MonthGroup) => (
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

        {/* No Deadline Tasks at the bottom */}
        <TaskGroup title="No Deadline" tasks={noDeadlineTasks} groupKey="noDeadline" />

        {/* Past Tasks moved to separate component/card */}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleCloseTaskForm}
          initialTask={editingTask}
          onTaskCreated={async () => {
            await dispatch(fetchTasks() as unknown as UnknownAction);
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