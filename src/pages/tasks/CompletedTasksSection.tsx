import { CheckCircle2, ChevronDown, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { format } from 'date-fns';

import { TaskList } from './TaskList';

interface CompletedTasksSectionProps {
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
  completedTasks: any[];
  onDeleteAllCompletedTasks: () => void;
  onTaskToggle: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: any) => void;
  onViewTask?: (task: any) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: any) => void;
}

export const CompletedTasksSection: React.FC<CompletedTasksSectionProps> = ({
  showCompleted,
  onToggleShowCompleted,
  completedTasks,
  onDeleteAllCompletedTasks,
  onTaskToggle,
  onTaskDelete,
  onEditTask,
  onViewTask,
  onTaskContextMenu,
}) => {
  const tasksByMonth = useMemo(() => {
    const getTime = (task: any): number => {
      const raw = task.completed_at ?? task.updated_at ?? task.created_at ?? task.date;
      const time = raw ? new Date(raw).getTime() : NaN;
      return Number.isNaN(time) ? 0 : time;
    };
    const sorted = [...completedTasks].sort((a, b) => getTime(b) - getTime(a));
    // Already sorted desc — group consecutive tasks sharing a month
    const groups: { label: string; tasks: any[] }[] = [];
    for (const task of sorted) {
      const raw = task.completed_at ?? task.updated_at ?? task.created_at ?? task.date;
      const d = raw ? new Date(raw) : null;
      const label = d && !Number.isNaN(d.getTime()) ? format(d, 'MMMM yyyy') : 'Unknown';
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.tasks.push(task);
      } else {
        groups.push({ label, tasks: [task] });
      }
    }
    return groups;
  }, [completedTasks]);

  if (completedTasks.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[var(--bg-secondary)] rounded-xl border-2 border-[var(--border-primary)] p-3 shadow-md">
      {/* Accent top bar */}
      <div className="h-1 w-full rounded-full bg-emerald-500 opacity-80" />

      {/* Header */}
      <div
        className="flex items-center justify-between w-full mt-1 mb-1 sm:mt-2 sm:mb-2 cursor-pointer select-none"
        onClick={onToggleShowCompleted}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <h3 className="font-semibold text-lg text-emerald-400 truncate">
            Completed Tasks
          </h3>
          <span className="text-sm text-[var(--text-secondary)] flex-shrink-0">
            {completedTasks.length} done
          </span>
          <ChevronDown
            size={18}
            className={`text-[var(--text-secondary)] transition-transform duration-200 flex-shrink-0 ${showCompleted ? 'rotate-180' : ''}`}
          />
        </div>
        {showCompleted && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteAllCompletedTasks(); }}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 flex-shrink-0 ml-2"
          >
            <Trash2 size={14} />
            Clear all
          </button>
        )}
      </div>

      {/* Collapsible task list sorted most recent first */}
      <div
        className={`relative transition-all duration-200 hide-scrollbar pb-2 mb-4`}
        style={{
          display: showCompleted ? 'block' : 'none',
        }}
      >
        {tasksByMonth.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 px-1 pt-2 pb-1 select-none">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {group.label}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {group.tasks.length} task{group.tasks.length === 1 ? '' : 's'}
              </span>
            </div>
            <TaskList
              tasks={group.tasks}
              onTaskToggle={onTaskToggle}
              onTaskDelete={onTaskDelete}
              onEditTask={onEditTask}
              onViewTask={onViewTask}
              onTaskContextMenu={onTaskContextMenu}
            />
          </div>
        ))}
      </div>
    </div>
  );
};