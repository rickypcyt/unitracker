import React, { useState, useEffect, useMemo } from 'react';
import { TaskItem } from './TaskItem';
import { useTaskManager } from '../../hooks/useTaskManager';
import { ClipboardCheck, ChevronDown, ChevronUp, Archive, Plus, Filter, Trash2 } from 'lucide-react';
import TaskDetailsModal from '../modals/TaskDetailsModal';
import DeleteCompletedModal from '../modals/DeleteTasksPop';
import { useTaskDetails } from '../../hooks/useTaskDetails';
import { TaskListMenu } from '../modals/TaskListMenu';
import TaskForm from './TaskForm';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableColumn } from './SortableColumn';

export const KanbanBoard = () => {
  const {
    user,
    tasks,
    handleToggleCompletion,
    handleDeleteTask,
    handleUpdateTask,
  } = useTaskManager();

  const {
    selectedTask,
    editedTask,
    taskDetailsEdit,
    handleOpenTaskDetails,
    handleCloseTaskDetails,
    setTaskEditing,
    setEditedTask,
    handleSaveEdit,
    handleEditChange,
  } = useTaskDetails();

  const [contextMenu, setContextMenu] = useState(null);
  const [collapsedColumns, setCollapsedColumns] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteCompletedModal, setShowDeleteCompletedModal] = useState(false);
  const [columnOrder, setColumnOrder] = useState(() => {
    const savedOrder = localStorage.getItem('kanbanColumnOrder');
    return savedOrder ? JSON.parse(savedOrder) : [];
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const completedTasks = tasks.filter((task) => task.completed);
  const incompletedTasks = tasks.filter((task) => !task.completed);

  // Group tasks by assignment
  const groupTasksByAssignment = (tasks) => {
    return tasks.reduce((acc, task) => {
      const assignment = task.assignment || "No assignment";
      if (!acc[assignment]) acc[assignment] = [];
      acc[assignment].push(task);
      return acc;
    }, {});
  };

  const incompletedByAssignment = groupTasksByAssignment(incompletedTasks);
  const completedByAssignment = groupTasksByAssignment(completedTasks);

  // Get all unique assignments
  const allAssignments = useMemo(() => 
    [...new Set(tasks.map(task => task.assignment || "No assignment"))].sort(),
    [tasks]
  );

  // Initialize column order when assignments change or on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('kanbanColumnOrder');
    const initialOrder = savedOrder ? JSON.parse(savedOrder) : allAssignments;

    // Ensure all current assignments are in the column order
    const currentAssignmentsSet = new Set(allAssignments);
    const filteredOrder = initialOrder.filter(assignment => currentAssignmentsSet.has(assignment));
    const newAssignments = allAssignments.filter(assignment => !filteredOrder.includes(assignment));

    const finalOrder = [...filteredOrder, ...newAssignments];
    setColumnOrder(finalOrder);
    localStorage.setItem('kanbanColumnOrder', JSON.stringify(finalOrder));
  }, [allAssignments]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id);
      const newIndex = columnOrder.indexOf(over.id);
      
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
      setColumnOrder(newOrder);
      localStorage.setItem('kanbanColumnOrder', JSON.stringify(newOrder));
    }
  };

  const toggleColumn = (assignment) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [assignment]: !prev[assignment]
    }));
  };

  const handleTaskContextMenu = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type: "task",
      x: e.clientX,
      y: e.clientY,
      task,
    });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleAddTask = (assignment = null) => {
    setSelectedAssignment(assignment);
    setShowTaskForm(true);
  };

  const handleDeleteAllCompletedTasks = () => {
    completedTasks.forEach((task) => handleDeleteTask(task.id));
    setShowDeleteCompletedModal(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add Task Button */}
      <button
        onClick={() => handleAddTask(null)}
        className="text-lg mb-4 px-4 py-2 border-2 border-dashed border-accent-primary text-accent-primary rounded-lg hover:bg-accent-primary/10 transition-colors"
      >
        + Add Task
      </button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columnOrder}
          strategy={isMobile ? verticalListSortingStrategy : horizontalListSortingStrategy}
        >
          <div className="flex flex-col md:flex-row items-start gap-6 overflow-x-auto pb-4 custom-scrollbar min-h-[calc(100vh-16rem)]">
            {columnOrder.map((assignment) => (
              <SortableColumn
                key={assignment}
                id={assignment}
                assignment={assignment}
                tasks={incompletedByAssignment[assignment] || []}
                collapsed={collapsedColumns[assignment]}
                onToggleCollapse={() => toggleColumn(assignment)}
                onAddTask={() => handleAddTask(assignment)}
                onTaskToggle={handleToggleCompletion}
                onTaskDelete={handleDeleteTask}
                onTaskDoubleClick={handleOpenTaskDetails}
                onTaskContextMenu={handleTaskContextMenu}
                isEditing={taskDetailsEdit}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Completed Tasks Section */}
      {showCompleted && completedTasks.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-neutral-200">
              Completed Tasks
              <span className="text-base text-neutral-400 ml-2">
                ({completedTasks.length})
              </span>
            </h2>
            <button
              onClick={() => setShowDeleteCompletedModal(true)}
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleDeleteTask}
                onDoubleClick={handleOpenTaskDetails}
                onContextMenu={(e) => handleTaskContextMenu(e, task)}
                isEditing={taskDetailsEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <TaskListMenu
          contextMenu={contextMenu}
          onClose={handleCloseContextMenu}
          onDoubleClick={handleOpenTaskDetails}
          onSetActiveTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          isOpen={!!selectedTask}
          onClose={handleCloseTaskDetails}
          task={selectedTask}
          onSave={handleSaveEdit}
          onEditChange={handleEditChange}
          editedTask={editedTask}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <TaskForm
                initialAssignment={selectedAssignment}
                onClose={(newTaskId) => {
                  setShowTaskForm(false);
                  setSelectedAssignment(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Completed Modal */}
      {showDeleteCompletedModal && (
        <DeleteCompletedModal
          isOpen={showDeleteCompletedModal}
          onClose={() => setShowDeleteCompletedModal(false)}
          onConfirm={handleDeleteAllCompletedTasks}
        />
      )}
    </div>
  );
}; 