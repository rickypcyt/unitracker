import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from '@/pages/tasks/TaskItem';
import { useSortable } from '@dnd-kit/sortable';

export const SortableTaskItem = ({
  task,
  onToggleCompletion,
  onDelete,
  onDoubleClick,
  onContextMenu,
  isEditing,
  assignment,
}: {
  task: any;
  onToggleCompletion: (task: any) => void;
  onDelete: (taskId: string) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent, task: any) => void;
  isEditing?: boolean;
  assignment: string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    over,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      taskId: task.id,
      assignment: assignment,
      taskData: {
        id: task.id,
        assignment: assignment,
        title: task.title,
      },
    },
  });
  
  // Check if this task is being dragged over
  const isBeingDraggedOver = isOver && over?.id !== task.id;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 9999 : 0,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-item-draggable relative ${isBeingDraggedOver ? 'ring-2 ring-[var(--accent-primary)] ring-inset rounded-md z-10' : ''}`}
      data-dnd-kit-dragged={isDragging}
    >
      <TaskItem
        task={task}
        onToggleCompletion={onToggleCompletion}
        onDelete={onDelete}
        onEditTask={onDoubleClick}
        onContextMenu={onContextMenu}
        active={!!task.activetask}
      />
    </div>
    
  );
}; 