import { Pin, PinOff, Plus, Save, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AssignmentTask } from '@/pages/tasks/AssignmentTask';
import ColumnDropdownMenu from '@/components/ColumnDropdownMenu';
import { ColumnMenu } from '@/modals/ColumnMenu';
import { parseDateFromString } from '@/utils/dateUtils';

interface AssignmentCardProps {
  id?: string;
  assignment: string;
  tasks: any[];
  pinned: boolean;
  onTogglePin: () => void;
  onAddTask: () => void;
  onTaskToggle: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: any) => void;
  onViewTask?: (task: any) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: any) => void;
  onSortClick: (assignmentId: string, position: { x: number; y: number }) => void;
  columnMenu: any;
  onCloseColumnMenu: () => void;
  onMoveToWorkspace: (assignment: string) => void;
  onDeleteAssignment: () => void;
  onUpdateAssignment: (oldName: string, newName: string) => void;
  completedCount?: number;
}

export const AssignmentCard = ({
  assignment,
  tasks,
  pinned,
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
  completedCount = 0,
}: AssignmentCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(assignment);
  const [isMinimized, setIsMinimized] = useState(false);

  // Ordenar tareas por deadline (atrasadas primero, futuras después)
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Si no tienen deadline, ponerlas al final
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1; // a va al final
      if (!b.deadline) return -1; // b va al final
      
      // Convertir deadlines a Date para comparar
      const dateA = parseDateFromString(a.deadline);
      const dateB = parseDateFromString(b.deadline);
      if (!dateA || !dateB) return 0;

      // Ordenar de más antiguo (atrasado) a más nuevo (futuro)
      return dateA.getTime() - dateB.getTime();
    });
  }, [tasks]);

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSave = () => {
    if (editedName.trim() && editedName !== assignment) {
      onUpdateAssignment(assignment, editedName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedName(assignment);
      setIsEditing(false);
    }
  };

  const handleColumnDoubleClick = (e: React.MouseEvent) => {
    // Prevent opening modal if double-clicking on interactive elements or tasks
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('[role="button"]') ||
      target.closest('[role="listitem"]') || // Avoid task items
      target.closest('[data-testid*="task"]') || // Avoid task-related elements
      target.closest('.cursor-pointer') // Avoid elements with cursor-pointer (tasks)
    ) {
      return;
    }
    onAddTask();
  };

  const totalTasks = tasks.length + completedCount;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div
      onDoubleClick={handleColumnDoubleClick}
      className={`flex flex-col transition-all duration-200 relative cursor-pointer ${isMinimized ? 'h-fit' : ''} ${isMinimized ? 'minimized-column' : ''}`}
      style={{
        minHeight: isMinimized ? 'auto' : '100px',
        padding: '0rem',
        height: 'auto',
      }}
      data-column-id={assignment}
      data-testid={`column-${assignment}`}
    >
      <div className="flex items-center justify-between w-full mt-1 mb-1 sm:mt-2 sm:mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={onTogglePin}
              className="flex items-center justify-center p-1 hover:bg-neutral-700/50 rounded-lg transition-colors flex-shrink-0"
              title={pinned ? "Unpin column" : "Pin column"}
            >
              {pinned ? (
                <Pin size={18} className="text-[var(--accent-primary)] transition-all duration-200 fill-[var(--accent-primary)]" />
              ) : (
                <PinOff size={18} className="text-neutral-400 hover:text-neutral-200 transition-all duration-200" />
              )}
            </button>
            {isEditing ? (
              <div className="flex items-center gap-1 bg-[var(--bg-primary)] rounded-md px-2 py-1">
                <input
                  type="text"
                  className="bg-transparent border-b border-[var(--accent-primary)] text-[var(--text-primary)] focus:outline-none w-full min-w-[100px]"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="text-green-500 hover:text-green-400 p-1"
                  title="Save changes"
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditedName(assignment);
                    setIsEditing(false);
                  }}
                  className="text-red-500 hover:text-red-400 p-1"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <h3 className="font-semibold text-lg text-[var(--text-primary)] truncate">
                {assignment}
              </h3>
            )}
            <span className="text-sm text-[var(--text-secondary)] flex-shrink-0">
              {tasks.length} active{completedCount > 0 && ` · ${completedCount} done`}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              data-tour="add-task"
              onClick={onAddTask}
              className="p-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95"
              title="Add task"
            >
              <Plus size={18} />
            </button>
            <ColumnDropdownMenu
              assignment={assignment}
              tasks={tasks}
              onMoveToWorkspace={onMoveToWorkspace}
              columnMenu={columnMenu}
              onDeleteAssignment={onDeleteAssignment}
              onEditAssignment={() => setIsEditing(true)}
              onSortClick={onSortClick}
              isMinimized={isMinimized}
              onToggleMinimize={handleToggleMinimize}
              isPinned={pinned}
              onTogglePin={onTogglePin}
            />
          </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="h-1.5 flex-1 rounded-full bg-[var(--bg-primary)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-[var(--accent-primary)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-[var(--text-secondary)] flex-shrink-0">
            {progressPct}% completed
          </span>
        </div>
      )}

      <div
        className={`relative space-y-1.5 transition-all duration-200 hide-scrollbar pb-2`}
        style={{
          minHeight: '60px',
          maxHeight: 'none',
          overflowY: 'visible',
          padding: '0 0 0.5rem 0',
          position: 'relative',
          zIndex: 1,
          display: isMinimized ? 'none' : 'block',
        }}
      >
        <div className="flex-1 min-h-0">
          {sortedTasks.length === 0 ? (
            <div
              onClick={onAddTask}
              className="flex flex-col items-center justify-center py-6 rounded-lg border-2 border-dashed border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-primary)]/30 transition-all cursor-pointer group"
            >
              <Plus size={20} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] mb-1 transition-colors" />
              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                No tasks yet — click to add
              </span>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <AssignmentTask
                key={task.id}
                task={task}
                assignment={assignment}
                onToggleCompletion={onTaskToggle}
                onTaskDelete={onTaskDelete}
                onEditTask={onEditTask}
                onViewTask={onViewTask || (() => {})}
                onTaskContextMenu={onTaskContextMenu}
              />
            ))
          )}
        </div>
      </div>

      {/* Column Menu - Mantenemos el menú original para compatibilidad */}
      {columnMenu && (
        <ColumnMenu
          x={columnMenu.x}
          y={columnMenu.y}
          assignment={assignment}
          onAddTask={onAddTask}
          onSortClick={onSortClick}
          onTogglePin={onTogglePin}
          onClose={onCloseColumnMenu}
          pinned={pinned}
          tasks={tasks}
        />
      )}
    </div>
  );
}; 