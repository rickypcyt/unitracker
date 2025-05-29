import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, Plus, ListOrdered } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

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
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2 flex-1">
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
          <div
            {...attributes}
            {...listeners}
            className="flex items-center gap-2 flex-1 cursor-move"
          >
            <h3 className="font-medium text-lg text-white group-hover:text-neutral-100">
              {assignment}
              <span className="text-base text-neutral-400 ml-2">
                ({tasks.length})
              </span>
            </h3>
          </div>
        </div>
        <button
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            onSortClick(assignment, { x: rect.left, y: rect.bottom });
          }}
          className="p-2 rounded-lg bg-neutral-700/50 hover:bg-neutral-700 transition-all duration-200 text-neutral-300 hover:text-neutral-100 hover:scale-105 mr-2"
          title="Sort tasks"
        >
          <ListOrdered size={18} />
        </button>
        <button
          onClick={onAddTask}
          className="p-2 rounded-lg bg-neutral-700/50 hover:bg-neutral-700 transition-all duration-200 text-neutral-300 hover:text-neutral-100 hover:scale-105"
          title="Add task"
        >
          <Plus size={18} />
        </button>
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