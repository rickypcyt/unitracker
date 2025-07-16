import { ChevronDown, ChevronUp, ListOrdered, MoreVertical, Plus } from 'lucide-react';
import React, { useRef, useState } from 'react';

import BaseMenu from '@/modals/BaseMenu';
import { TaskItem } from '@/pages/tasks/TaskItem';

export const SortableColumn = ({
  id,
  assignment,
  tasks,
  collapsed,
  onToggleCollapse,
  onAddTask,
  onTaskToggle,
  onTaskDelete,
  onEditTask,
  onTaskContextMenu,
  onSortClick,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const moreBtnRef = useRef(null);

  const handleMoreClick = (e) => {
    e.stopPropagation();
    const rect = moreBtnRef.current.getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom });
    setMenuOpen(true);
  };

  return (
    <div className="flex flex-col flex-1 min-w-[16rem] p-1 border-none">
      <div className="flex items-center justify-between w-full mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center p-1 hover:bg-neutral-700/50 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronDown size={20} className="text-neutral-400 hover:text-neutral-200 transition-transform duration-200" />
            ) : (
              <ChevronUp size={20} className="text-neutral-400 hover:text-neutral-200 transition-transform duration-200" />
            )}
          </button>
          <h3 className="font-medium text-lg text-[var(--text-primary)] group-hover:text-[var(--text-primary)]">
            {assignment}
          </h3>
          <span className="text-base text-[var(--text-secondary)]">
            ({tasks.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddTask}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] "
            title="Add task"
          >
            <Plus size={22} />
          </button>
          <button
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              onSortClick(assignment, { x: rect.left, y: rect.bottom });
            }}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]  mr-2"
            title="Sort tasks"
          >
            <ListOrdered size={22} />
          </button>
          <button
            ref={moreBtnRef}
            onClick={handleMoreClick}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Más opciones"
          >
            <MoreVertical size={22} />
          </button>
        </div>
      </div>
      {menuOpen && (
        <BaseMenu
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setMenuOpen(false)}
          zIndex="z-[9999]"
        >
          <button
            className="block w-full text-left px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
            onClick={() => {
              setMenuOpen(false);
              // Aquí irá la lógica para mover tasks de assignment
              alert('Mover todos los tasks de este assignment a otro workspace');
            }}
          >
            Mover todos los tasks de este assignment a otro workspace
          </button>
        </BaseMenu>
      )}
      
      {!collapsed && (
        <div
          className={
            `space-y-2 overflow-y-auto max-h-[calc(100vh-14rem)] min-h-[6rem] custom-scrollbar pr-1`
          }
        >
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleCompletion={onTaskToggle}
              onDelete={onTaskDelete}
              onEditTask={onEditTask}
              onContextMenu={(e) => onTaskContextMenu(e, task)}
              assignmentId={id}
              active={!!task.activetask}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 