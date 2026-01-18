import React from 'react';
import { SortableColumn } from './SortableColumn';

interface AssignmentColumnsProps {
  assignments: string[];
  incompletedByAssignment: Record<string, any[]>;
  currentWorkspacePins: Record<string, boolean>;
  onTogglePin: (assignment: string) => void;
  onAddTask: (assignment: string | null) => void;
  onTaskToggle: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: any) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: any) => void;
  onSortClick: (assignmentId: string, position: { x: number; y: number }) => void;
  columnMenu: any;
  onCloseColumnMenu: () => void;
  onMoveToWorkspace: (assignment: string) => void;
  onDeleteAssignment: (assignment: string) => void;
  onUpdateAssignment: (oldName: string, newName: string) => void;
}

export const AssignmentColumns: React.FC<AssignmentColumnsProps> = ({
  assignments,
  incompletedByAssignment,
  currentWorkspacePins,
  onTogglePin,
  onAddTask,
  onTaskToggle,
  onTaskDelete,
  onEditTask,
  onTaskContextMenu,
  onSortClick,
  columnMenu,
  onCloseColumnMenu,
  onMoveToWorkspace,
  onDeleteAssignment,
  onUpdateAssignment,
}) => {
  return (
    <div className="flex justify-center w-full mb-4 px-2 sm:px-8 lg:px-24">
      <div className="w-full space-y-6">
        {assignments.map((assignment) => (
          <div
            key={assignment}
            className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] p-4 shadow-sm"
          >
            <SortableColumn
              id={assignment}
              assignment={assignment}
              tasks={incompletedByAssignment[assignment] || []}
              pinned={currentWorkspacePins[assignment] === true}
              onTogglePin={() => onTogglePin(assignment)}
              onAddTask={() => onAddTask(assignment)}
              onTaskToggle={onTaskToggle}
              onTaskDelete={onTaskDelete}
              onEditTask={onEditTask}
              onTaskContextMenu={onTaskContextMenu}
              onSortClick={onSortClick}
              columnMenu={columnMenu?.assignmentId === assignment ? columnMenu : null}
              onCloseColumnMenu={onCloseColumnMenu}
              onMoveToWorkspace={onMoveToWorkspace}
              onDeleteAssignment={() => onDeleteAssignment(assignment)}
              onUpdateAssignment={onUpdateAssignment}
            />
          </div>
        ))}
      </div>
    </div>
  );
};