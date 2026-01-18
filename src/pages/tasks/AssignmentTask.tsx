import React from 'react';
import { TaskItem } from './TaskItem';

interface AssignmentTaskProps {
  task: any;
  assignment: string;
  onToggleCompletion: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: any) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: any) => void;
}

export const AssignmentTask: React.FC<AssignmentTaskProps> = ({
  task,
  assignment: _assignment,
  onToggleCompletion,
  onTaskDelete,
  onEditTask,
  onTaskContextMenu,
}) => {
  return (
    <TaskItem
      key={task.id}
      task={task}
      onToggleCompletion={onToggleCompletion}
      onDelete={onTaskDelete}
      onEditTask={onEditTask}
      onContextMenu={(e) => onTaskContextMenu(e, task)}
      active={!!task.activetask}
    />
  );
};