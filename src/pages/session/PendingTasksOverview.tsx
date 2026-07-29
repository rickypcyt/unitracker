import { ChevronRight, CircleDot, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTasksOnly, useTasksLoading, useWorkspace } from '@/store/appStore';
import { ALL_WORKSPACE_ID } from '@/hooks/useTaskBoard';
import { useNavigation } from '@/navbar/NavigationContext';

const PendingTasksOverview = ({ limit = 6 }: { limit?: number }) => {
  const tasks = useTasksOnly();
  const tasksLoading = useTasksLoading();
  const { currentWorkspace: activeWorkspace } = useWorkspace();
  const { navigateTo } = useNavigation();

  const { pendingTasks, totalCount } = useMemo(() => {
    const filtered = activeWorkspace && activeWorkspace.id !== ALL_WORKSPACE_ID
      ? tasks.filter(t => t.workspace_id === activeWorkspace.id && !t.completed)
      : tasks.filter(t => !t.completed);
    return { pendingTasks: filtered.slice(0, limit), totalCount: filtered.length };
  }, [tasks, activeWorkspace, limit]);

  const handleClick = () => {
    navigateTo('tasks');
  };

  return (
    <div
      className="w-full dashboard-noise-card"
      style={{ padding: 'clamp(0.75rem, 0.6rem + 0.6vw, 1.25rem)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <CircleDot size={18} className="text-[var(--accent-primary)]" />
        <h2 className="font-semibold text-[var(--text-primary)] text-base sm:text-lg">
          Pending Tasks
        </h2>
        <span className="text-sm text-[var(--text-secondary)]">
          {totalCount}
        </span>
      </div>

      {tasksLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={14} className="text-[var(--accent-primary)] animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">
            Loading tasks...
          </p>
        </div>
      ) : pendingTasks.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] py-2">
          None — you're all caught up!
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {pendingTasks.map(task => (
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
  );
};

export default PendingTasksOverview;
