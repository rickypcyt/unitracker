import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { TaskItem } from './TaskItem';

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
      className="flex flex-col w-full md:w-[20rem] md:min-w-[20rem] bg-neutral-800/30 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/30 hover:border-neutral-700/50 transition-all duration-200"
    >
      <div className="flex items-center justify-between w-full mb-4">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 flex-1 cursor-move"
        >
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-between flex-1 group"
          >
            <h3 className="font-medium text-lg text-neutral-200 group-hover:text-neutral-100">
              {assignment}
              <span className="text-sm text-neutral-400 ml-2">
                ({tasks.length})
              </span>
            </h3>
            {collapsed ? (
              <ChevronDown size={20} className="text-neutral-400 group-hover:text-neutral-200 transition-transform duration-200" />
            ) : (
              <ChevronUp size={20} className="text-neutral-400 group-hover:text-neutral-200 transition-transform duration-200" />
            )}
          </button>
        </div>
        <button
          onClick={onAddTask}
          className="p-2 rounded-lg bg-neutral-700/50 hover:bg-neutral-700 transition-all duration-200 text-neutral-300 hover:text-neutral-100 hover:scale-105"
          title="Add task"
        >
          <Plus size={18} />
        </button>
      </div>
      
      {!collapsed && (
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
            />
          ))}
        </div>
      )}
    </div>
  );
}; 