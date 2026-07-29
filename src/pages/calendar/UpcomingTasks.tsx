import { CalendarClock, ChevronRight, Loader2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTasksOnly, useTasksLoading, useWorkspace } from '@/store/appStore';
import { ALL_WORKSPACE_ID } from '@/hooks/useTaskBoard';
import { useNavigation } from '@/navbar/NavigationContext';
import { useAuth } from '@/hooks/useAuth';
import TaskForm from '@/pages/tasks/TaskForm';

const UpcomingTasks = ({ limit = 8 }: { limit?: number }) => {
  const tasks = useTasksOnly();
  const tasksLoading = useTasksLoading();
  const { currentWorkspace: activeWorkspace } = useWorkspace();
  const { navigateTo } = useNavigation();
  const { isLoggedIn } = useAuth();
  const [showTaskForm, setShowTaskForm] = useState(false);

  const { upcomingTasks, totalCount } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const filtered = (activeWorkspace && activeWorkspace.id !== ALL_WORKSPACE_ID
      ? tasks.filter(t => t.workspace_id === activeWorkspace.id && !t.completed)
      : tasks.filter(t => !t.completed)
    ).filter(t => {
      if (!t.deadline) return true;
      const deadline = new Date(t.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline >= now;
    }).sort((a, b) => {
      const aDate = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bDate = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return aDate - bDate;
    });

    return { upcomingTasks: filtered.slice(0, limit), totalCount: filtered.length };
  }, [tasks, activeWorkspace, limit]);

  const handleClick = () => {
    navigateTo('tasks');
  };

  const handleAddTask = () => {
    if (!isLoggedIn) return;
    setShowTaskForm(true);
  };

  const formatDate = (deadline: string) => {
    const date = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div
        className="w-full dashboard-noise-card"
        style={{ padding: 'clamp(0.75rem, 0.6rem + 0.6vw, 1.25rem)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-[var(--accent-primary)]" />
            <h2 className="font-semibold text-[var(--text-primary)] text-base sm:text-lg">
              Upcoming Tasks
            </h2>
            <span className="text-sm text-[var(--text-secondary)]">
              {totalCount}
            </span>
          </div>
          {isLoggedIn && (
            <button
              onClick={handleAddTask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          )}
        </div>

        {tasksLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={14} className="text-[var(--accent-primary)] animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">
              Loading tasks...
            </p>
          </div>
        ) : upcomingTasks.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-2">
            No upcoming tasks — you're all caught up!
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {upcomingTasks.map(task => (
              <div
                key={task.id}
                onClick={handleClick}
                className="group cursor-pointer flex items-center gap-2.5 bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-lg px-3 py-2 hover:border-[var(--accent-primary)] transition-all duration-200"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] flex-shrink-0" />
                <span
                  className="text-sm text-[var(--text-primary)] truncate flex-1"
                  title={task.title}
                >
                  {task.title}
                </span>
                {task.deadline && (
                  <span className="text-xs text-[var(--text-secondary)] flex-shrink-0 px-2 py-0.5 rounded bg-[var(--bg-primary)]">
                    {formatDate(task.deadline)}
                  </span>
                )}
                {task.assignment && (
                  <span
                    className="text-xs text-[var(--text-secondary)] flex-shrink-0 px-2 py-0.5 rounded bg-[var(--bg-primary)]"
                  >
                    {task.assignment}
                  </span>
                )}
                <ChevronRight
                  size={14}
                  className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors flex-shrink-0"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showTaskForm && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={() => {
            setShowTaskForm(false);
            window.dispatchEvent(new CustomEvent('refreshTaskList'));
          }}
        />
      )}
    </>
  );
};

export default UpcomingTasks;
