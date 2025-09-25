// @ts-nocheck
import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, ListOrdered, Plus, Save, Trash2, X } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import ColumnDropdownMenu from '@/components/ColumnDropdownMenu';
import { ColumnMenu } from '@/modals/ColumnMenu';
import { SortableTaskItem } from '@/pages/tasks/SortableTaskItem';
import { TaskItem } from '@/pages/tasks/TaskItem';
import { useDroppable } from '@dnd-kit/core';

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
  onMoveTask,
  columnMenu,
  onCloseColumnMenu,
  onMoveToWorkspace,
  onDeleteAssignment,
  onUpdateAssignment, // New prop for updating assignment
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(assignment);

  const handleSave = () => {
    if (editedName.trim() && editedName !== assignment) {
      onUpdateAssignment(assignment, editedName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedName(assignment);
      setIsEditing(false);
    }
  };
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: assignment,
    data: {
      type: 'column',
      assignment: assignment,
      tasks: tasks.map(task => task.id),
    },
    // Enhanced drop zone configuration for better UX
    disabled: false,
    // Make the entire column area droppable including over task items
  });

  return (
    <div
      ref={setDroppableRef}
      className={`flex flex-col h-full min-h-0 transition-all duration-200 relative ${
        isOver ? 'task-drop-zone-active' : ''
      }`}
      style={{
        minHeight: '500px', // Maximum drop zone - entire column
        padding: '0rem',
        height: '100%', // Take full available height
      }}
    >
      <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center p-1 hover:bg-neutral-700/50 rounded-lg transition-colors flex-shrink-0"
            >
              {collapsed ? (
                <ChevronDown size={20} className="text-neutral-400 hover:text-neutral-200 transition-transform duration-200" />
              ) : (
                <ChevronUp size={20} className="text-neutral-400 hover:text-neutral-200 transition-transform duration-200" />
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
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                title="Edit assignment name"
              >
                <Edit2 size={16} />
              </button>
            )}
            <button
              onClick={onAddTask}
              className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95"
              title="Add task"
            >
              <Plus size={22} />
            </button>
            <button
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                onSortClick(assignment, { x: rect.left, y: rect.bottom });
              }}
              className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95"
              title="Sort tasks"
            >
              <ListOrdered size={22} />
            </button>
            {/* Radix UI Dropdown Menu */}
            <ColumnDropdownMenu
              assignment={assignment}
              tasks={tasks}
              onMoveToWorkspace={onMoveToWorkspace}
              columnMenu={columnMenu}
              onDeleteAssignment={onDeleteAssignment}
            />
          </div>
      </div>

      
      {!collapsed && (
        <div
          className={
            `space-y-2 overflow-y-auto flex-1 min-h-0 custom-scrollbar pr-1 transition-all duration-200 ${
              isOver ? 'bg-accent-primary/20' : ''
            }`
          }
          data-dnd-kit-sortable-context
        >
          <SortableContext 
            items={tasks.map(task => task.id)} 
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onToggleCompletion={onTaskToggle}
                onDelete={onTaskDelete}
                onEditTask={onEditTask}
                onContextMenu={(e) => onTaskContextMenu(e, task)}
                onDoubleClick={() => onEditTask(task)}
                assignment={assignment}
              />
            ))}
          </SortableContext>
        </div>
      )}

      {/* Column Menu - Mantenemos el menú original para compatibilidad */}
      {columnMenu && (
        <ColumnMenu
          x={columnMenu.x}
          y={columnMenu.y}
          assignment={assignment}
          onAddTask={onAddTask}
          onSortClick={onSortClick}
          onToggleCollapse={onToggleCollapse}
          onClose={onCloseColumnMenu}
          collapsed={collapsed}
          tasks={tasks}
        />
      )}
    </div>
  );
}; 