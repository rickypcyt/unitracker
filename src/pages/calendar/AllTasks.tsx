import type { AppDispatch, RootState } from '@/store';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { Task } from '@/types/taskStorage';
import TaskForm from '@/pages/tasks/TaskForm';
import { TaskItem } from '@/pages/tasks/TaskItem';
import { TaskListMenu } from '@/modals/TaskListMenu';
import { fetchTasks } from '@/store/TaskActions';
import useDemoMode from '@/utils/useDemoMode';
import { useTaskManager } from '@/hooks/useTaskManager';

type ExpandedGroups = {
  today: boolean;
  thisWeek: boolean;
  past: boolean;
  noDeadline: boolean;
};

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  groupKey: keyof ExpandedGroups;
  icon?: React.ReactNode;
}

interface ContextMenuState {
  x: number;
  y: number;
  task: Task;
}

const AllTasks = () => {
  const { handleToggleCompletion, handleDeleteTask } = useTaskManager();
  const realTasks = useSelector((state: RootState) => state.tasks.tasks);
  const { isDemo, demoTasks } = useDemoMode();
  const tasks = isDemo ? demoTasks : realTasks;
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<ExpandedGroups>({
    today: true,
    thisWeek: true,
    past: false, // Past tasks collapsed by default
    noDeadline: true,
  });
  const dispatch = useDispatch<AppDispatch>();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
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

  // Filter and sort all tasks
  const allTasks = [...tasks].sort((a, b) => {
    const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
    const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
    return dateA - dateB;
  });

  // Past tasks: deadline < today and not completed (only if deadline exists)
  const pastTasks = allTasks.filter(task => {
    if (!task.deadline || task.deadline === '' || task.deadline === null) return false;
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today && !task.completed;
  });

  // Upcoming tasks
  const upcomingTasks = allTasks.filter(task => {
    if (!task.deadline || task.deadline === '' || task.deadline === null) return false;
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate >= today && !task.completed;
  });

  // Group upcoming tasks by time periods
  const todayTasks = upcomingTasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === today.toDateString();
  });

  const thisWeekTasks = upcomingTasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate > today && taskDate <= endOfWeek;
  });

  // Tasks without deadlines
  const noDeadlineTasks = allTasks.filter(task => 
    !task.deadline || task.deadline === '' || task.deadline === null
  );

  const toggleGroup = (group: keyof ExpandedGroups) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    } as ExpandedGroups));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleTaskContextMenu = (e: React.MouseEvent<HTMLDivElement>, task: Task) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
    });
  };

  const TaskGroup = ({ title, tasks, groupKey, icon = null }: TaskGroupProps) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-4">
        <button
          className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-lg p-3 hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-between"
          onClick={() => toggleGroup(groupKey)}
          aria-expanded={expandedGroups[groupKey]}
        >
          <div className="flex items-center gap-2">
            {icon || <Calendar size={18} className="text-[var(--accent-primary)]" />}
            <span className="text-[var(--text-primary)] font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] text-sm">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
            {expandedGroups[groupKey] ? (
              <ChevronUp size={20} className="text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown size={20} className="text-[var(--text-secondary)]" />
            )}
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
                onEditTask={() => handleEditTask(task)}
                onContextMenu={(e) => handleTaskContextMenu(e, task)}
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
    <div className="maincard w-full px-2 pt-4 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full text-center mb-4">
  <h2 className="text-xl font-semibold text-[var(--text-primary)]">
    Pending Tasks
  </h2>
</div>

      <div className="space-y-4">
        {/* Past Due Section */}
        {pastTasks.length > 0 && (
          <TaskGroup 
            title="Past Due" 
            tasks={pastTasks} 
            groupKey="past"
            icon={<Calendar size={18} className="text-red-500" />}
          />
        )}

        {/* Today's Tasks */}
        <TaskGroup 
          title="Today" 
          tasks={todayTasks} 
          groupKey="today"
        />

        {/* This Week */}
        <TaskGroup 
          title="This Week" 
          tasks={thisWeekTasks} 
          groupKey="thisWeek"
        />

        {/* No Deadline */}
        {noDeadlineTasks.filter(task => !task.completed).length > 0 && (
          <TaskGroup 
            title="No Deadline" 
            tasks={noDeadlineTasks.filter(task => !task.completed)} 
            groupKey="noDeadline"
            icon={<Calendar size={18} className="text-gray-500" />}
          />
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && editingTask && (
        <TaskForm
          initialTask={editingTask}
          onClose={handleCloseTaskForm}
          onTaskCreated={handleCloseTaskForm}
          onTaskUpdated={handleCloseTaskForm}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <TaskListMenu
          contextMenu={{
            x: contextMenu.x,
            y: contextMenu.y,
            task: contextMenu.task,
          }}
          onClose={() => setContextMenu(null)}
          onEditTask={() => {
            handleEditTask(contextMenu.task);
            setContextMenu(null);
          }}
          onDeleteTask={() => {
            handleDeleteTask(contextMenu.task.id);
            setContextMenu(null);
          }}
          onSetActiveTask={() => {}}
        />
      )}
    </div>
  );
};

export default AllTasks;
