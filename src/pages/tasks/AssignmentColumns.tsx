import React from 'react';
import { SortableColumn } from './SortableColumn';

interface AssignmentColumnsProps {
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
  onAssignmentDoubleClick?: (assignment: string) => void;
}

export const AssignmentColumns: React.FC<AssignmentColumnsProps> = ({
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
  onAssignmentDoubleClick,
}) => {
  // Create a column for each assignment (show all assignments)
  const assignmentList = Object.keys(incompletedByAssignment);
  
  // Add pinned assignments that might not have tasks
  const pinnedAssignments = Object.keys(currentWorkspacePins).filter(
    assignment => currentWorkspacePins[assignment] === true && !assignmentList.includes(assignment)
  );
  
  // Combine all assignments
  const allAssignments = [...new Set([...assignmentList, ...pinnedAssignments])];
  
  // Sort assignments: pinned assignments first, then by number of tasks (most tasks first)
  const sortedAssignments = allAssignments.sort((a, b) => {
    // Both pinned, sort by task count
    if (currentWorkspacePins[a] && currentWorkspacePins[b]) {
      const tasksA = incompletedByAssignment[a]?.length || 0;
      const tasksB = incompletedByAssignment[b]?.length || 0;
      return tasksB - tasksA;
    }
    // A is pinned, B is not - A comes first
    if (currentWorkspacePins[a] && !currentWorkspacePins[b]) {
      return -1;
    }
    // B is pinned, A is not - B comes first
    if (!currentWorkspacePins[a] && currentWorkspacePins[b]) {
      return 1;
    }
    // Neither pinned, sort by task count
    const tasksA = incompletedByAssignment[a]?.length || 0;
    const tasksB = incompletedByAssignment[b]?.length || 0;
    return tasksB - tasksA;
  });
  
  const fixedColumns = sortedAssignments.map((assignment, index) => ({
    id: `column${index + 1}`,
    title: assignment,
    tasks: incompletedByAssignment[assignment] || [],
    assignmentName: assignment // Keep the original assignment name for pin functionality
  }));

  return (
    <div className="flex justify-center w-full mb-4">
      <div className={`w-full gap-4 ${
        fixedColumns.length <= 2 ? 'grid grid-cols-1 lg:grid-cols-2' : 
        fixedColumns.length <= 4 ? 'grid grid-cols-1 lg:grid-cols-2' : 
        'grid grid-cols-1 lg:grid-cols-2'
      }`}>
        {fixedColumns.map((column) => (
          <div
            key={column.id}
            className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] p-2 shadow-sm"
            onDoubleClick={() => onAssignmentDoubleClick?.(column.assignmentName)}
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