import { AssignmentTask } from './AssignmentTask';
import React from 'react';

interface TaskListProps {
  tasks: any[];
  assignment?: string;
  onTaskToggle: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: any) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: any) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  assignment = "General",
  onTaskToggle,
  onTaskDelete,
  onEditTask,
  onTaskContextMenu,
}) => {
  return (
    <div className="relative space-y-1.5 transition-all duration-200 hide-scrollbar pb-2">
      {tasks.map((task) => (
        <AssignmentTask
          key={task.id}
          task={task}
          assignment={assignment}
          onToggleCompletion={onTaskToggle}
          onTaskDelete={onTaskDelete}
          onEditTask={onEditTask}
          onTaskContextMenu={onTaskContextMenu}
        />
      ))}
    </div>
  );
};