import { Pin, PinOff, Plus, Save, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AssignmentTask } from '@/pages/tasks/AssignmentTask';
import ColumnDropdownMenu from '@/pages/tasks/components/ColumnDropdownMenu';
import { ColumnMenu } from '@/modals/tasks/ColumnMenu';
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
  onTaskContextMenu,
  onSortClick,
  columnMenu,
  onCloseColumnMenu,
  onMoveToWorkspace,
  onDeleteAssignment,
  onUpdateAssignment,
}: AssignmentCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(assignment);
  const [isMinimized, setIsMinimized] = useState(false);

  // Show at most 4 tasks, then scroll. Task heights vary (description, deadline, ...),
  // so the limit is measured from the real 4th item instead of using a fixed number.
  const VISIBLE_TASKS = 4;
  const MIN_LIST_HEIGHT = '15rem';
  const listRef = useRef<HTMLDivElement | null>(null);
  const [listMaxHeight, setListMaxHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const items = Array.from(list.children) as HTMLElement[];
      if (items.length <= VISIBLE_TASKS) {
        setListMaxHeight(undefined);
        return;
      }
      const first = items[0];
      const last = items[VISIBLE_TASKS - 1];
      if (!first || !last) return;
      // +8: the bottom margin (mb-2) of the last visible task
      setListMaxHeight(last.offsetTop + last.offsetHeight - first.offsetTop + 8);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    Array.from(list.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [tasks, isMinimized]);

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

  return (
    <div
      onDoubleClick={handleColumnDoubleClick}
      className={`flex flex-col transition-all duration-200 relative cursor-pointer ${isMinimized ? 'h-fit minimized-column' : 'h-full'}`}
      style={{
        minHeight: isMinimized ? 'auto' : '100px',
        padding: '0rem',
      }}
      data-column-id={assignment}
      data-testid={`column-${assignment}`}
    >
      <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={onTogglePin}
              className="flex items-center justify-center p-0.5 rounded-md shrink-0"
              title={pinned ? "Unpin column" : "Pin column"}
            >
              {pinned ? (
                <Pin size={14} className="text-(--accent-primary) fill-(--accent-primary)" />
              ) : (
                <PinOff size={14} className="text-(--text-secondary)" />
              )}
            </button>
            {isEditing ? (
              <div className="flex items-center gap-1 bg-(--bg-primary) rounded-md px-2 py-1">
                <input
                  type="text"
                  className="bg-transparent border-b border-(--accent-primary) text-(--text-primary) focus:outline-none w-full min-w-[100px]"
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
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-bold text-(length:--t-head,13px) uppercase tracking-wider text-(--text-primary) truncate">
                  {assignment}
                </h3>
                <span className="shrink-0 px-1.5 py-0.5 rounded-full text-(length:--t-meta,12px) font-semibold leading-none tabular-nums bg-(--accent-primary)/15 text-(--accent-primary)" title={`${tasks.length} pending`}>
                  {tasks.length}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={onAddTask}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 bg-(--bg-secondary) hover:bg-(--bg-primary) text-(--text-secondary) hover:text-(--text-primary)"
              title="Add task"
              aria-label="Add task"
            >
              <Plus size={22} strokeWidth={2} />
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

      <div
        className={`relative flex-1 min-h-0 space-y-1.5 transition-all duration-200 hide-scrollbar pb-2 ${isMinimized ? 'hidden' : ''}`}
        style={{
          overflowY: 'auto',
          maxHeight: listMaxHeight,
          // Room for ~4 tasks even when there are fewer, so all cards look uniform
          minHeight: isMinimized ? undefined : MIN_LIST_HEIGHT,
          padding: '0 0 0.5rem 0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div ref={listRef} className="task-list flex-1 min-h-0 h-full flex flex-col">
          {sortedTasks.length === 0 ? (
            <div
              onClick={onAddTask}
              className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-(--border-primary) hover:border-(--accent-primary) hover:bg-(--bg-primary)/30 transition-all cursor-pointer group"
            >
              <Plus size={20} className="text-(--text-secondary) group-hover:text-(--accent-primary) mb-1 transition-colors" />
              <span className="text-sm text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">
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