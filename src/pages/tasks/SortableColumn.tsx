import { ChevronDown, ChevronUp, Edit2, ListOrdered, Plus, Save, Trash2, X } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import ColumnDropdownMenu from '@/components/ColumnDropdownMenu';
import { ColumnMenu } from '@/modals/ColumnMenu';
import { SortableTaskItem } from '@/pages/tasks/SortableTaskItem';
import { TaskItem } from '@/pages/tasks/TaskItem';
import { useDroppable } from '@dnd-kit/core';
import { useRef } from 'react';
// @ts-nocheck
import { useState } from 'react';

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
  // Set up the droppable area for the column
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${assignment}`, // This ID must match what we check in handleDragEnd
    data: {
      type: 'column',
      assignment: assignment,
      // Add more context to help with debugging
      columnId: assignment,
      isColumn: true
    },
  });

  // Handle drops in the empty space of the column
  const handleDropInEmptySpace = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drag over for the empty space
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full min-h-0 transition-all duration-200 relative ${
        isOver ? 'task-drop-zone-active' : ''
      }`}
      style={{
        minHeight: '500px', // Maximum drop zone - entire column
        padding: '0rem',
        height: '100%', // Take full available height
      }}
      data-column-id={assignment} // Add data attribute for easier debugging
      data-testid={`column-${assignment}`}
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
        ref={setNodeRef}
        onDrop={handleDropInEmptySpace}
        onDragOver={handleDragOver}
        className={`relative space-y-1.5 flex-1 min-h-0 transition-all duration-200 hide-scrollbar ${
          isOver ? 'bg-accent-primary/5' : ''
        }`}
        style={{
          minHeight: '100px',
          maxHeight: '800px',
          overflowY: 'auto',
          padding: '0.5rem',
          position: 'relative',
          zIndex: 1,
        }}
        data-dnd-kit-sortable-context
      >
        {/* Empty state drop zone */}
        {tasks.length === 0 && (
          <div 
            className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
              isOver ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-200`}
          >
            <div className="text-center p-4 rounded-lg bg-accent-primary/10 border-2 border-dashed border-accent-primary/50 w-full mx-4">
              <p className="text-accent-primary font-medium">Drop task here</p>
            </div>
          </div>
        )}
        
        {/* Drop indicator that appears when dragging over the column */}
        {isOver && tasks.length > 0 && (
          <div className="absolute inset-0 border-2 border-dashed border-[var(--accent-primary)] rounded-lg pointer-events-none z-10" />
        )}  
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