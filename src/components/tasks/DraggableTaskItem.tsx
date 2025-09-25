import { useDrag } from 'react-dnd';
import { Task } from '@/types/taskStorage';
import { TaskItem } from '@/pages/tasks/TaskItem';

interface DraggableTaskItemProps {
  task: Task;
  onToggleCompletion: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onContextMenu: (e: React.MouseEvent, task: Task) => void;
  showAssignment?: boolean;
  assignmentLeftOfDate?: boolean;
  active?: boolean;
}

export const DraggableTaskItem: React.FC<DraggableTaskItemProps> = ({
  task,
  onToggleCompletion,
  onDelete,
  onEditTask,
  onContextMenu,
  showAssignment = false,
  assignmentLeftOfDate = false,
  active = false
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { task },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={(node) => drag(node)}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
      onContextMenu={(e) => onContextMenu(e, task)}
    >
      <TaskItem
        task={task}
        onToggleCompletion={() => onToggleCompletion(task.id)}
        onDelete={() => onDelete(task.id)}
        onEditTask={() => onEditTask(task)}
        showAssignment={showAssignment}
        assignmentLeftOfDate={assignmentLeftOfDate}
        active={active}
      />
    </div>
  );
};
