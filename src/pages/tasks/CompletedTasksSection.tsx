import { Trash2 } from 'lucide-react';
import React from 'react';
import { TaskList } from './TaskList';

interface CompletedTasksSectionProps {
  showCompleted: boolean;
  completedTasks: any[];
  onDeleteAllCompletedTasks: () => void;
  onTaskToggle: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: any) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: any) => void;
}

export const CompletedTasksSection: React.FC<CompletedTasksSectionProps> = ({
  showCompleted,
  completedTasks,
  onDeleteAllCompletedTasks,
  onTaskToggle,
  onTaskDelete,
  onEditTask,
  onTaskContextMenu,
}) => {
  if (!showCompleted || completedTasks.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-neutral-200">
          Completed Tasks
          <span className="text-base text-neutral-400 ml-2">
            ({completedTasks.length})
          </span>
        </h2>
        <button
          onClick={onDeleteAllCompletedTasks}
          className="text-red-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <TaskList
          tasks={completedTasks}
          assignment="Completed"
          onTaskToggle={onTaskToggle}
          onTaskDelete={onTaskDelete}
          onEditTask={onEditTask}
          onTaskContextMenu={onTaskContextMenu}
        />
      </div>
    </div>
  );
};