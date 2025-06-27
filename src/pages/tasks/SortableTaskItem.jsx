import { CSS } from '@dnd-kit/utilities';
import React from 'react';
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
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      assignment,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem
        task={task}
        onToggleCompletion={onToggleCompletion}
        onDelete={onDelete}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        isEditing={isEditing}
      />
    </div>
  );
}; 