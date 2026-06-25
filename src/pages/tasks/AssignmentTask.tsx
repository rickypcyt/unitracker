import React from 'react';
import { TaskItem } from './TaskItem';

interface AssignmentTaskProps {
  task: any;
  assignment: string;
  onToggleCompletion: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: any) => void;
  onViewTask?: (task: any) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: any) => void;
}

export const AssignmentTask: React.FC<AssignmentTaskProps> = ({
  task,
  assignment: _assignment,
  onToggleCompletion,
  onTaskDelete,
  onEditTask,
  onViewTask,
  onTaskContextMenu,
}) => {
  return (
    <div className="mb-2">
      <TaskItem
        key={task.id}
        task={task}
        onToggleCompletion={onToggleCompletion}
        onDelete={onTaskDelete}
        onEditTask={onEditTask}
        onViewTask={onViewTask}
        onContextMenu={(e) => onTaskContextMenu(e, task)}
        active={!!task.activetask}
      />
    </div>
  );
};