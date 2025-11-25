import { Pin, PinOff, Plus, Save, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import ColumnDropdownMenu from '@/components/ColumnDropdownMenu';
import { ColumnMenu } from '@/modals/ColumnMenu';
import { TaskItem } from '@/pages/tasks/TaskItem';

interface SortableColumnProps {
  id?: string;
  assignment: string;
  tasks: any[];
  pinned: boolean;
  onTogglePin: () => void;
  onAddTask: () => void;
  onTaskToggle: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: any) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: any) => void;
  onSortClick: (assignmentId: string, position: { x: number; y: number }) => void;
  columnMenu: any;
  onCloseColumnMenu: () => void;
  onMoveToWorkspace: (assignment: string) => void;
  onDeleteAssignment: () => void;
  onUpdateAssignment: (oldName: string, newName: string) => void;
}

export const SortableColumn = ({
  assignment,
  tasks,
  pinned,
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
}: SortableColumnProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(assignment);

  // Ordenar tareas por deadline (atrasadas primero, futuras después)
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Si no tienen deadline, ponerlas al final
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1; // a va al final
      if (!b.deadline) return -1; // b va al final
      
      // Convertir deadlines a Date para comparar
      const dateA = new Date(a.deadline);
      const dateB = new Date(b.deadline);
      
      // Ordenar de más antiguo (atrasado) a más nuevo (futuro)
      return dateA.getTime() - dateB.getTime();
    });
  }, [tasks]);

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
    // Prevent opening modal if double-clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('[role="button"]')
    ) {
      return;
    }
    onAddTask();
  };

  return (
    <div
      onDoubleClick={handleColumnDoubleClick}
      className={`flex flex-col transition-all duration-200 relative cursor-pointer`}
      style={{
        minHeight: '200px',
        padding: '0rem',
        height: 'auto',
      }}
      data-column-id={assignment}
      data-testid={`column-${assignment}`}
    >
      <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={onTogglePin}
              className="flex items-center justify-center p-1 hover:bg-neutral-700/50 rounded-lg transition-colors flex-shrink-0"
              title={pinned ? "Unpin column" : "Pin column"}
            >
              {pinned ? (
                <Pin size={20} className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-200 fill-[var(--accent-primary)]" />
              ) : (
                <PinOff size={20} className="text-neutral-400 hover:text-neutral-200 transition-all duration-200" />
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
              <h3 className="font-medium text-lg text-[var(--text-primary)] group-hover:text-[var(--text-primary)] truncate">
                {assignment}
              </h3>
            )}
            <span className="text-base text-[var(--text-secondary)] flex-shrink-0">
              ({tasks.length})
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
              onClick={onAddTask}
              className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95"
              title="Add task"
            >
              <Plus size={22} />
            </button>
            {/* Radix UI Dropdown Menu */}
            <ColumnDropdownMenu
              assignment={assignment}
              tasks={tasks}
              onMoveToWorkspace={onMoveToWorkspace}
              columnMenu={columnMenu}
              onDeleteAssignment={onDeleteAssignment}
              onEditAssignment={() => setIsEditing(true)}
              onSortClick={onSortClick}
            />
          </div>
      </div>

      
      <div
        className={`relative space-y-1.5 transition-all duration-200 hide-scrollbar`}
        style={{
          minHeight: '100px',
          maxHeight: 'none',
          overflowY: 'visible',
          padding: '0.5rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {sortedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggleCompletion={onTaskToggle}
            onDelete={onTaskDelete}
            onEditTask={onEditTask}
            onContextMenu={(e) => onTaskContextMenu(e, task)}
            active={!!task.activetask}
          />
        ))}
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