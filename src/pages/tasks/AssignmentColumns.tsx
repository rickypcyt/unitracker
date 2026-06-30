import { AssignmentCard } from './AssignmentCard';
import type { ColumnCount } from '@/modals/TaskPageSettingsModal';
import React from 'react';

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
  completedByAssignment?: Record<string, number>;
  columnCount?: ColumnCount;
}

export const AssignmentColumns: React.FC<AssignmentColumnsProps & { children?: React.ReactNode }> = ({
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
  completedByAssignment = {},
  columnCount = 1,
  children,
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

  const gridColsClass = {
    1: 'lg:grid-cols-1 max-w-2xl',
    2: 'lg:grid-cols-2 max-w-4xl',
    3: 'lg:grid-cols-3 max-w-6xl',
    4: 'lg:grid-cols-4 max-w-7xl',
  }[columnCount];

  return (
    <div className="flex justify-center w-full">
      <div className={`grid ${gridColsClass} mx-auto gap-4 w-full`}>
        {fixedColumns.map((column) => (
          <div
            key={column.id}
            className="w-full bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-3 shadow-md"
            onDoubleClick={() => onAssignmentDoubleClick?.(column.assignmentName)}
          >
            <AssignmentCard
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
              completedCount={completedByAssignment[column.assignmentName] || 0}
            />
          </div>
        ))}
        {children}
      </div>
    </div>
  );
};