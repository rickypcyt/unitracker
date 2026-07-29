import { CheckCircle2, ChevronDown, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';

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
  const groupedByAssignment = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    completedTasks.forEach((task: any) => {
      const assignment = task.assignment || "No assignment";
      if (!grouped[assignment]) grouped[assignment] = [];
      grouped[assignment].push(task);
    });
    return grouped;
  }, [completedTasks]);

  const assignmentNames = Object.keys(groupedByAssignment).sort((a, b) =>
    a.localeCompare(b)
  );

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

      {/* Collapsible task list grouped by assignment */}
      <div
        className={`relative transition-all duration-200 hide-scrollbar pb-2 mb-4`}
        style={{
          display: showCompleted ? 'block' : 'none',
        }}
      >
        <div className="flex-1 min-h-0 space-y-3">
          {assignmentNames.map((assignment) => {
            const group = groupedByAssignment[assignment] || [];
            return (
              <div key={assignment}>
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {assignment}
                    <span className="text-[var(--text-secondary)] opacity-60 ml-1.5">
                      ({group.length})
                    </span>
                  </span>
                </div>
                <TaskList
                  tasks={group}
                  assignment={assignment}
                  onTaskToggle={onTaskToggle}
                  onTaskDelete={onTaskDelete}
                  onEditTask={onEditTask}
                  onViewTask={onViewTask}
                  onTaskContextMenu={onTaskContextMenu}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};