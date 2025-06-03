import { ChevronDown, ChevronUp, ListOrdered, Plus } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { TaskItem } from './TaskItem';
import { useSortable } from '@dnd-kit/sortable';

export const SortableColumn = ({
  id,
  assignment,
  tasks,
  collapsed,
  onToggleCollapse,
  onAddTask,
  onTaskToggle,
  onTaskDelete,
  onTaskDoubleClick,
  onTaskContextMenu,
  isEditing,
  onSortClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col w-full md:w-[20rem] md:min-w-[20rem] maincard p-4"
    >
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
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              onSortClick(assignment, { x: rect.left, y: rect.bottom });
            }}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]  mr-2"
            title="Sort tasks"
          >
            <ListOrdered size={18} />
          </button>
          <button
            onClick={onAddTask}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] "
            title="Add task"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
      
      {!collapsed && (
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-20rem)] custom-scrollbar">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompletion={onTaskToggle}
                onDelete={onTaskDelete}
                onDoubleClick={onTaskDoubleClick}
                onContextMenu={(e) => onTaskContextMenu(e, task)}
                isEditing={isEditing}
                assignmentId={id}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}; 