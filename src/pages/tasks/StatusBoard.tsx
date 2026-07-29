import { CheckCircle2, Circle, Loader, Plus } from 'lucide-react';
import { useMemo } from 'react';

import { AssignmentTask } from '@/pages/tasks/AssignmentTask';
import React from 'react';
import { normalizeTaskStatus, TODO_STATUSES, ACTIVE_STATUSES } from '@/constants/taskStatus';

interface StatusBoardProps {
  incompletedTasks: any[];
  completedTasks: any[];
  onAddTask: (assignment: string | null) => void;
  onTaskToggle: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: any) => void;
  onViewTask?: (task: any) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: any) => void;
}

interface StatusColumn {
  id: string;
  title: string;
  icon: typeof Circle;
  color: string;
  dotClass: string;
  tasks: any[];
}

export const StatusBoard: React.FC<StatusBoardProps> = ({
  incompletedTasks,
  completedTasks,
  onAddTask,
  onTaskToggle,
  onTaskDelete,
  onEditTask,
  onViewTask,
  onTaskContextMenu,
}) => {
  const columns = useMemo<StatusColumn[]>(() => {
    const todo = incompletedTasks.filter(
      (t) => TODO_STATUSES.includes(normalizeTaskStatus(t.status))
    );
    const inProgress = incompletedTasks.filter(
      (t) => ACTIVE_STATUSES.includes(normalizeTaskStatus(t.status))
    );

    return [
      {
        id: 'todo',
        title: 'To Do',
        icon: Circle,
        color: 'text-[var(--text-secondary)]',
        dotClass: 'bg-[var(--text-secondary)]',
        tasks: todo,
      },
      {
        id: 'in-progress',
        title: 'In Progress',
        icon: Loader,
        color: 'text-yellow-500',
        dotClass: 'bg-yellow-500',
        tasks: inProgress,
      },
      {
        id: 'done',
        title: 'Done',
        icon: CheckCircle2,
        color: 'text-[#4FD1AE]',
        dotClass: 'bg-[#4FD1AE]',
        tasks: completedTasks,
      },
    ];
  }, [incompletedTasks, completedTasks]);

  return (
    <div className="flex justify-center w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto gap-4 w-full">
        {columns.map((col) => {
          const Icon = col.icon;
          return (
            <div
              key={col.id}
              className="w-full bg-[var(--bg-secondary)] rounded-xl border-2 border-[var(--border-primary)] p-3 shadow-md flex flex-col"
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {col.title}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]/50 font-medium">
                    {col.tasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTask(null)}
                  className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                  aria-label="Add task"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Tasks */}
              <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto hide-scrollbar pb-2">
                {col.tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Icon size={20} className={`mb-2 opacity-30 ${col.color}`} />
                    <p className="text-xs text-[var(--text-secondary)]/50">
                      No tasks
                    </p>
                  </div>
                ) : (
                  col.tasks.map((task) => (
                    <AssignmentTask
                      key={task.id}
                      task={task}
                      assignment={task.assignment || 'General'}
                      onToggleCompletion={onTaskToggle}
                      onTaskDelete={onTaskDelete}
                      onEditTask={onEditTask}
                      {...(onViewTask && { onViewTask })}
                      onTaskContextMenu={onTaskContextMenu}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
