import React from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { DraggedTask } from '@/types/kanban';

interface AssignmentDropZoneProps {
  assignment: string;
  onDrop: (taskId: string, newAssignment: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const AssignmentDropZone: React.FC<AssignmentDropZoneProps> = ({
  assignment,
  onDrop,
  children,
  className = ''
}) => {
  const [{ isOver }, drop] = useDrop<DraggedTask, void, { isOver: boolean }>({
    accept: 'TASK',
    drop: (item) => {
      if (item.task.assignment !== assignment) {
        onDrop(item.task.id, assignment);
      }
      return undefined;
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const dropZoneClasses = `h-full transition-colors duration-200 ${
    isOver ? 'bg-[var(--accent-primary)]/10 rounded-lg' : ''
  } ${className}`;

  return (
    <div ref={drop} className={dropZoneClasses}>
      {children}
    </div>
  );
};
