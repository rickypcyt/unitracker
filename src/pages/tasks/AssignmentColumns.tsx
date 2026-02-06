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
  onViewTask?: (task: any) => void;
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
  onViewTask,
  onTaskContextMenu,
  onSortClick,
  columnMenu,
  onCloseColumnMenu,
  onMoveToWorkspace,
  onDeleteAssignment,
  onUpdateAssignment,
}) => {
  // Create a column for each assignment (show all assignments)
  const assignmentList = Object.keys(incompletedByAssignment);
  
  // Sort assignments by number of tasks (most tasks first)
  const sortedAssignments = assignmentList.sort((a, b) => {
    const tasksA = incompletedByAssignment[a]?.length || 0;
    const tasksB = incompletedByAssignment[b]?.length || 0;
    return tasksB - tasksA; // Descending order (most tasks first)
  });
  
  const fixedColumns = sortedAssignments.map((assignment, index) => ({
    id: `column${index + 1}`,
    title: assignment,
    tasks: incompletedByAssignment[assignment] || [],
    assignmentName: assignment // Keep the original assignment name for pin functionality
  }));

  return (
    <div className="flex justify-center w-full mb-4 px-2 sm:px-8 lg:px-24">
      <div className={`w-full gap-4 ${
        fixedColumns.length <= 2 ? 'grid grid-cols-2' : 
        fixedColumns.length <= 4 ? 'grid grid-cols-2' : 
        'grid grid-cols-3'
      }`}>
        {fixedColumns.map((column) => (
          <div
            key={column.id}
            className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] p-4 shadow-sm"
          >
            <SortableColumn
              id={column.id}
              assignment={column.title}
              tasks={column.tasks}
              pinned={currentWorkspacePins[column.assignmentName] === true}
              onTogglePin={() => onTogglePin(column.assignmentName)}
              onAddTask={() => onAddTask(column.assignmentName)}
              onTaskToggle={onTaskToggle}
              onTaskDelete={onTaskDelete}
              onEditTask={onEditTask}
              onViewTask={onViewTask || (() => {})}
              onTaskContextMenu={onTaskContextMenu}
              onSortClick={onSortClick}
              columnMenu={columnMenu?.assignmentId === column.assignmentName ? columnMenu : null}
              onCloseColumnMenu={onCloseColumnMenu}
              onMoveToWorkspace={() => onMoveToWorkspace(column.assignmentName)}
              onDeleteAssignment={() => onDeleteAssignment(column.assignmentName)}
              onUpdateAssignment={onUpdateAssignment}
            />
          </div>
        ))}
      </div>
    </div>
  );
};