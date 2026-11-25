import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

import { AssignmentCard } from './AssignmentCard';
import type { ColumnCount } from '@/modals/tasks/TaskPageSettingsModal';
import { getWorkspaceIconComponent } from '@/utils/workspaceIcons';
import React from 'react';

export interface WorkspaceSection {
  id: string;
  name: string;
  icon?: string | undefined;
  byAssignment: Record<string, any[]>;
}

const COLLAPSED_KEY = 'tasks.collapsedWorkspaceSections';

interface AssignmentColumnsProps {
  /** "All" view: render one section per workspace, each with its own assignment columns */
  workspaceSections?: WorkspaceSection[];
  incompletedByAssignment: Record<string, any[]>;
  currentWorkspacePins: Record<string, boolean>;
  onTogglePin: (assignment: string) => void;
  onAddTask: (assignment: string | null) => void;
  /** "+" on a workspace header (All view): add a task with that workspace preselected */
  onAddTaskToWorkspace?: (workspaceId: string) => void;
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
  onAssignmentDoubleClick?: (assignment: string) => void;
  completedByAssignment?: Record<string, number>;
  columnCount?: ColumnCount;
}

export const AssignmentColumns: React.FC<AssignmentColumnsProps & { children?: React.ReactNode }> = ({
  incompletedByAssignment,
  currentWorkspacePins,
  onTogglePin,
  onAddTask,
  onAddTaskToWorkspace,
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
  onAssignmentDoubleClick,
  completedByAssignment = {},
  columnCount = 1,
  workspaceSections,
  children,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const toggleSection = (id: string) => {
    setCollapsedSections(previous => {
      const next = previous.includes(id) ? previous.filter(x => x !== id) : [...previous, id];
      try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  };

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

  // Masonry: cards keep their natural height and flow into columns (no more square cards)
  const columnsClass = {
    1: 'columns-1',
    2: 'columns-1 md:columns-2',
    3: 'columns-1 md:columns-2 xl:columns-3',
    4: 'columns-1 md:columns-2 xl:columns-3 2xl:columns-4',
  }[columnCount];

  // Sort one workspace's assignments the same way as the flat view (pinned first, then by task count)
  const buildColumns = (byAssignment: Record<string, any[]>, keyPrefix: string) =>
    Object.keys(byAssignment)
      .sort((a, b) => {
        const pinDiff = Number(!!currentWorkspacePins[b]) - Number(!!currentWorkspacePins[a]);
        if (pinDiff !== 0) return pinDiff;
        return (byAssignment[b]?.length || 0) - (byAssignment[a]?.length || 0);
      })
      .map((assignment, index) => ({
        id: `${keyPrefix}column${index + 1}`,
        title: assignment,
        tasks: byAssignment[assignment] || [],
        assignmentName: assignment,
      }));

  const renderColumn = (column: { id: string; title: string; tasks: any[]; assignmentName: string }) => (
          <div
            key={column.id}
            className="mb-3 w-full break-inside-avoid rounded-2xl border border-(--border-primary) bg-(--bg-secondary)/40 p-2.5"
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
  );

  if (workspaceSections && workspaceSections.length > 0) {
    return (
      <div className="flex flex-col justify-center w-full gap-6">
        {workspaceSections.map(section => {
          const open = !collapsedSections.includes(section.id);
          const columns = buildColumns(section.byAssignment, `${section.id}-`);
          const total = columns.reduce((sum, column) => sum + column.tasks.length, 0);
          const WorkspaceIcon = getWorkspaceIconComponent(section.icon);
          // The "No workspace" / "Other" groups have no real workspace to add to
          const canAdd = !!onAddTaskToWorkspace && section.id !== 'none' && section.icon !== undefined;
          return (
            <section key={section.id} aria-label={section.name} className="flex flex-col gap-3">
              <div className="flex h-9 w-full items-center gap-2 border-b border-(--border-primary)">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={open}
                  className="flex h-full min-w-0 flex-1 items-center gap-2 px-1 text-left"
                >
                  {open
                    ? <ChevronDown size={16} className="shrink-0 text-(--text-secondary)" />
                    : <ChevronRight size={16} className="shrink-0 text-(--text-secondary)" />}
                  <WorkspaceIcon size={16} className="shrink-0 text-(--accent-primary)" />
                  <h2 className="truncate text-(length:--t-title,16px) font-bold tracking-tight text-(--text-primary)">{section.name}</h2>
                  <span className="shrink-0 rounded-full bg-(--accent-primary)/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-(--accent-primary)">{total}</span>
                </button>
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => onAddTaskToWorkspace?.(section.id)}
                    className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-(--text-secondary) hover:text-(--accent-primary) active:scale-95"
                    title={`Add task to ${section.name}`}
                    aria-label={`Add task to ${section.name}`}
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
              {open && (
                <div className={`${columnsClass} gap-3 w-full`}>
                  {columns.map(column => renderColumn(column))}
                </div>
              )}
            </section>
          );
        })}
        {children && <div className="mt-2 w-full">{children}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center w-full">
      <div className={`${columnsClass} gap-3 w-full`}>
        {fixedColumns.map(column => renderColumn(column))}
      </div>
      {children && (
        <div className="mt-4 w-full">
          {children}
        </div>
      )}
    </div>
  );
};