import React, { useMemo } from 'react';

import { AssignmentTask } from './AssignmentTask';
import { Task } from '@/types/taskStorage';

interface TaskListProps {
  tasks: Task[];
  assignment?: string;
  onTaskToggle: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onViewTask?: (task: Task) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  assignment = "General",
  onTaskToggle,
  onTaskDelete,
  onEditTask,
  onViewTask,
  onTaskContextMenu,
}) => {
  // Remove duplicate tasks by ID
  const uniqueTasks = useMemo(() => {
    const seen = new Set<string>();
    return tasks.filter((task: Task) => {
      if (seen.has(task.id)) return false;
      seen.add(task.id);
      return true;
    });
  }, [tasks]);

  return (
    <div className="relative space-y-1.5 transition-all duration-200 hide-scrollbar pb-2">
      {uniqueTasks.map((task) => (
        <AssignmentTask
          key={task.id}
          task={task}
          assignment={assignment}
          onToggleCompletion={onTaskToggle}
          onTaskDelete={onTaskDelete}
          onEditTask={onEditTask}
          {...(onViewTask && { onViewTask })}
          onTaskContextMenu={onTaskContextMenu}
        />
      ))}
    </div>
  );
};