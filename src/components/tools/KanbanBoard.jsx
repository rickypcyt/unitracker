import { Archive, ChevronDown, ChevronUp, ClipboardCheck, Filter, Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import React, { useEffect, useMemo, useState } from 'react';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import DeleteCompletedModal from '../modals/DeleteTasksPop';
import LoginPromptModal from '../modals/LoginPromptModal';
import { SortMenu } from './SortMenu';
import { SortableColumn } from './SortableColumn';
import TaskDetailsModal from '../modals/TaskDetailsModal';
import TaskForm from './TaskForm';
import { TaskItem } from './TaskItem';
import { TaskListMenu } from '../modals/TaskListMenu';
import { fetchTasks } from '../../store/actions/TaskActions';
import { supabase } from '../../config/supabaseClient';
import { updateTaskSuccess } from '../../store/slices/TaskSlice';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { useTaskDetails } from '../../hooks/useTaskDetails';
import { useTaskManager } from '../../hooks/useTaskManager';

export const KanbanBoard = () => {
  const {
    user,
    tasks,
    handleToggleCompletion,
    handleUpdateTask,
    handleDeleteTask: originalHandleDeleteTask,
  } = useTaskManager();
  const { isLoggedIn } = useAuth();

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
    selectedTaskId,
  } = useTaskDetails();

  const [contextMenu, setContextMenu] = useState(null);
  const [collapsedColumns, setCollapsedColumns] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteCompletedModal, setShowDeleteCompletedModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteTaskConfirmation, setShowDeleteTaskConfirmation] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [columnOrder, setColumnOrder] = useState(() => {
    const savedOrder = localStorage.getItem('kanbanColumnOrder');
    return savedOrder ? JSON.parse(savedOrder) : [];
  });

  const [taskOrder, setTaskOrder] = useState(() => {
    const savedTaskOrder = localStorage.getItem('kanbanTaskOrder');
    return savedTaskOrder ? JSON.parse(savedTaskOrder) : {};
  });

  const [activeId, setActiveId] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [sortMenu, setSortMenu] = useState(null);
  const [assignmentSortConfig, setAssignmentSortConfig] = useState(() => {
    const savedConfig = localStorage.getItem('kanbanAssignmentSortConfig');
    return savedConfig ? JSON.parse(savedConfig) : {};
  });

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  const dispatch = useDispatch();

  const handleSortClick = (assignmentId, position) => {
    // console.log('Sort button clicked for assignment:', assignmentId);
    // console.log('Position received:', position);
    setSortMenu({
      assignmentId,
      x: position.x,
      y: position.y,
    });
  };

  const handleCloseSortMenu = () => {
    setSortMenu(null);
  };

  const handleSelectSort = (assignmentId, sortType, sortDirection = 'asc') => {
    const direction = sortDirection || 'asc';

    const newAssignmentSortConfig = {
        ...assignmentSortConfig,
        [assignmentId]: { type: sortType, direction: direction }
    };
    setAssignmentSortConfig(newAssignmentSortConfig);
    localStorage.setItem('kanbanAssignmentSortConfig', JSON.stringify(newAssignmentSortConfig));

    const tasksInAssignment = incompletedByAssignment[assignmentId] || [];
    let sortedTasks = [...tasksInAssignment];

    switch (sortType) {
      case 'alphabetical':
        sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'deadline':
        sortedTasks.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
        break;
      case 'difficulty':
        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        sortedTasks.sort((a, b) => {
          const aDifficulty = difficultyOrder[a.difficulty?.toLowerCase()] || 4;
          const bDifficulty = difficultyOrder[b.difficulty?.toLowerCase()] || 4;
          return aDifficulty - bDifficulty;
        });
        break;
      case 'dateAdded':
        sortedTasks.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateA - dateB;
        });
        break;
      default:
        break;
    }

    if (direction === 'desc') {
        sortedTasks.reverse();
    }

    setTaskOrder(prevOrder => ({
      ...prevOrder,
      [assignmentId]: sortedTasks.map(task => task.id)
    }));
    localStorage.setItem('kanbanTaskOrder', JSON.stringify({
      ...taskOrder,
      [assignmentId]: sortedTasks.map(task => task.id)
    }));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize sort configuration from localStorage
  useEffect(() => {
    const savedSortConfig = localStorage.getItem('kanbanAssignmentSortConfig');
    if (savedSortConfig) {
      try {
        const parsedConfig = JSON.parse(savedSortConfig);
        setAssignmentSortConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved sort configuration:', error);
      }
    }
  }, []);

  const completedTasks = tasks.filter((task) => task.completed);
  const incompletedTasks = tasks.filter((task) => !task.completed);

  const allAssignments = useMemo(() => 
    [...new Set(tasks.map(task => task.assignment || "No assignment"))].sort(),
    [tasks]
  );

  const groupTasksByAssignment = (tasksToGroup) => {
    const grouped = tasksToGroup.reduce((acc, task) => {
      const assignment = task.assignment || "No assignment";
      if (!acc[assignment]) acc[assignment] = [];
      // Check if task is already in another assignment
      const isTaskInOtherAssignment = Object.values(acc).some(tasks => 
        tasks.some(t => t.id === task.id)
      );
      if (!isTaskInOtherAssignment) {
        acc[assignment].push(task);
      }
      return acc;
    }, {});

    Object.keys(grouped).forEach(assignment => {
      // First sort by position
      grouped[assignment] = sortTasksByPosition(grouped[assignment], assignment);
      
      // Then apply the saved sort configuration if it exists
      const sortConfig = assignmentSortConfig[assignment];
      if (sortConfig) {
        let sortedTasks = [...grouped[assignment]];
        
        switch (sortConfig.type) {
          case 'alphabetical':
            sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case 'deadline':
            sortedTasks.sort((a, b) => {
              if (!a.deadline && !b.deadline) return 0;
              if (!a.deadline) return 1;
              if (!b.deadline) return -1;
              return new Date(a.deadline) - new Date(b.deadline);
            });
            break;
          case 'difficulty':
            const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
            sortedTasks.sort((a, b) => {
              const aDifficulty = difficultyOrder[a.difficulty?.toLowerCase()] || 4;
              const bDifficulty = difficultyOrder[b.difficulty?.toLowerCase()] || 4;
              return aDifficulty - bDifficulty;
            });
            break;
          case 'dateAdded':
            sortedTasks.sort((a, b) => {
              const dateA = new Date(a.created_at);
              const dateB = new Date(b.created_at);
              return dateA - dateB;
            });
            break;
          default:
            break;
        }

        if (sortConfig.direction === 'desc') {
          sortedTasks.reverse();
        }

        grouped[assignment] = sortedTasks;
      }
    });

    return grouped;
  };

  const sortTasksByPosition = (tasksToSort, assignment) => {
    const savedOrder = taskOrder[assignment] || [];
    const taskMap = new Map(tasksToSort.map(task => [task.id, task]));
    
    const filteredSavedOrder = savedOrder.filter(taskId => taskMap.has(taskId));

    const newTasks = tasksToSort.filter(task => !filteredSavedOrder.includes(task.id));

    const finalOrder = [...filteredSavedOrder, ...newTasks.map(task => task.id)];

    return finalOrder.map(taskId => taskMap.get(taskId)).filter(Boolean);
  };

  const incompletedByAssignment = groupTasksByAssignment(incompletedTasks);
  const completedByAssignment = groupTasksByAssignment(completedTasks);

  const assignmentsWithIncompleteTasks = useMemo(() => 
    allAssignments.filter(assignment => 
      incompletedByAssignment[assignment]?.length > 0
    ),
    [allAssignments, incompletedByAssignment]
  );

  useEffect(() => {
    const sortedAssignments = [...assignmentsWithIncompleteTasks].sort((a, b) => {
      const countA = incompletedByAssignment[a]?.length || 0;
      const countB = incompletedByAssignment[b]?.length || 0;
      return countB - countA;
    });

    if (JSON.stringify(sortedAssignments) !== JSON.stringify(columnOrder)) {
      setColumnOrder(sortedAssignments);
      localStorage.setItem('kanbanColumnOrder', JSON.stringify(sortedAssignments));
    }

    const initialTaskOrder = { ...taskOrder };
    assignmentsWithIncompleteTasks.forEach(assignment => {
      if (!initialTaskOrder[assignment]) {
        initialTaskOrder[assignment] = incompletedByAssignment[assignment]?.map(task => task.id) || [];
      }
    });
    Object.keys(initialTaskOrder).forEach(assignment => {
      if (!assignmentsWithIncompleteTasks.includes(assignment)) {
        delete initialTaskOrder[assignment];
      }
    });

    if (JSON.stringify(initialTaskOrder) !== JSON.stringify(taskOrder)) {
        setTaskOrder(initialTaskOrder);
        localStorage.setItem('kanbanTaskOrder', JSON.stringify(initialTaskOrder));
    }

  }, [assignmentsWithIncompleteTasks, incompletedByAssignment, taskOrder]);

  const findTask = (id) => tasks.find((task) => task.id === id);
  const findAssignment = (id) => assignmentsWithIncompleteTasks.find((assignment) => assignment === id);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (active.data.current?.type === 'column') {
         if (activeId !== overId) {
           const oldIndex = columnOrder.indexOf(activeId);
           const newIndex = columnOrder.indexOf(overId);
           const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
           setColumnOrder(newOrder);
           localStorage.setItem('kanbanColumnOrder', JSON.stringify(newOrder));
         }
         return;
    }

    const sourceAssignment = active.data.current?.assignment;
    let targetAssignment = null;

    if (over.data.current?.type === 'task') {
        targetAssignment = over.data.current.assignment;
    } else if (findAssignment(overId)) {
        targetAssignment = overId;
    } else {
        return;
    }

    if (sourceAssignment === targetAssignment) {
        const taskIdsInTargetColumn = incompletedByAssignment[targetAssignment]?.map(task => task.id) || [];
        const oldIndex = taskIdsInTargetColumn.indexOf(activeId);
        const newIndex = taskIdsInTargetColumn.indexOf(overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const newOrderArray = arrayMove(taskIdsInTargetColumn, oldIndex, newIndex);
            
            setTaskOrder(prevOrder => ({
                ...prevOrder,
                [targetAssignment]: newOrderArray
            }));
            localStorage.setItem('kanbanTaskOrder', JSON.stringify({
                ...taskOrder,
                [targetAssignment]: newOrderArray
            }));
        }
    } else if (sourceAssignment && targetAssignment) {
        const currentTaskOrder = { ...taskOrder };

        // Remove task from source assignment
        if (currentTaskOrder[sourceAssignment]) {
            currentTaskOrder[sourceAssignment] = currentTaskOrder[sourceAssignment].filter(id => id !== activeId);
        }

        // Add task to target assignment
        const taskIdsInTargetColumn = incompletedByAssignment[targetAssignment]?.map(task => task.id) || [];
        const overIndex = taskIdsInTargetColumn.indexOf(overId);
        
        let newIndex = taskIdsInTargetColumn.length;
        if (overIndex !== -1) {
            newIndex = overIndex;
        }
        
        if (!currentTaskOrder[targetAssignment]) {
            currentTaskOrder[targetAssignment] = [];
        }
        
        // Only add if not already in target assignment
        if (!currentTaskOrder[targetAssignment].includes(activeId)) {
            currentTaskOrder[targetAssignment].splice(newIndex, 0, activeId);

            setTaskOrder(currentTaskOrder);
            localStorage.setItem('kanbanTaskOrder', JSON.stringify(currentTaskOrder));

            const taskToMove = tasks.find(task => task.id === activeId);
            if (taskToMove) {
                const updatedTask = {
                    ...taskToMove,
                    assignment: targetAssignment
                };
                
                // Actualizar el estado local inmediatamente
                dispatch(updateTaskSuccess(updatedTask));
                
                // Actualizar en la base de datos
                handleUpdateTask(updatedTask);
            }
        }
    }
  };

   const handleDragOver = (event) => {
        const { active, over } = event;
        const activeId = active.id;
        const overId = over?.id;

        if (!overId) return; // Nothing to drop over

        const activeData = active.data.current;
        const overData = over.data.current;

        // Only handle if dragging a task
        if (activeData?.type !== 'task') return;

        const sourceAssignment = activeData.assignment;
        const targetAssignment = overData?.assignment || (findAssignment(overId) ? overId : null);

        if (!targetAssignment || sourceAssignment === targetAssignment) return; // Not moving to a different valid assignment or same assignment

        // Logic to visually move task between columns during drag
        // This part is complex and often involves managing a temporary state
        // or relying on Dnd-kit's built-in capabilities with proper setup.
        // For now, the handleDragEnd will handle the final state update.
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
      );

   // Find the active task for the DragOverlay
   const activeTask = activeId ? findTask(activeId) : null;

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
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true);
      return;
    }
    setSelectedAssignment(assignment);
    setShowTaskForm(true);
  };

  const handleDeleteAllCompletedTasks = () => {
    completedTasks.forEach((task) => originalHandleDeleteTask(task.id));
    setShowDeleteCompletedModal(false);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = (newTaskId) => {
    setShowTaskForm(false);
    setSelectedAssignment(null);
    setEditingTask(null);
  };

  const handleConfirmDeleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        setTaskToDelete(task);
        setShowDeleteTaskConfirmation(true);
    } else {
        console.error(`Task with ID ${taskId} not found.`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
      >
        <SortableContext
          items={columnOrder}
          strategy={isMobile ? verticalListSortingStrategy : horizontalListSortingStrategy}
        >
          <div className="flex flex-col md:flex-row items-start gap-6 overflow-x-auto pb-4 custom-scrollbar min-h-[calc(100vh-16rem)] mt-2">
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
                onTaskDelete={handleConfirmDeleteTask}
                onTaskDoubleClick={handleOpenTaskDetails}
                onTaskContextMenu={handleTaskContextMenu}
                isEditing={taskDetailsEdit}
                onSortClick={handleSortClick}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
            {activeTask ? (
                <TaskItem
                    task={activeTask}
                    onToggleCompletion={handleToggleCompletion}
                    onDelete={handleConfirmDeleteTask}
                    onDoubleClick={handleOpenTaskDetails}
                    onContextMenu={() => {}} // Disable context menu on overlay
                    isEditing={taskDetailsEdit}
                    isSelected={activeTask.id === selectedTaskId}
                />
            ) : null}
        </DragOverlay>

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
                onDelete={handleConfirmDeleteTask}
                onDoubleClick={handleOpenTaskDetails}
                onContextMenu={(e) => handleTaskContextMenu(e, task)}
                isEditing={taskDetailsEdit}
                isSelected={task.id === selectedTaskId}
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
          onDeleteTask={handleConfirmDeleteTask}
          onEditTask={handleEditTask}
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
        <TaskForm
          onClose={handleCloseTaskForm}
          initialAssignment={selectedAssignment}
          initialTask={editingTask}
          onTaskCreated={(newTaskId) => {
            dispatch(fetchTasks());
            handleCloseTaskForm();
          }}
        />
      )}

      {/* Delete Completed Modal */}
      {showDeleteCompletedModal && (
        <DeleteCompletedModal
          isOpen={showDeleteCompletedModal}
          onClose={() => setShowDeleteCompletedModal(false)}
          onConfirm={handleDeleteAllCompletedTasks}
        />
      )}

      {/* Sort Menu */}
      {sortMenu && (
        <SortMenu
          x={sortMenu.x}
          y={sortMenu.y}
          assignmentId={sortMenu.assignmentId}
          onSelectSort={handleSelectSort}
          onClose={handleCloseSortMenu}
          currentSortType={assignmentSortConfig[sortMenu.assignmentId]?.type || 'alphabetical'}
          currentSortDirection={assignmentSortConfig[sortMenu.assignmentId]?.direction || 'asc'}
        />
      )}

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
      />

      {/* Add the new Delete Task Confirmation Modal here later */}
      {/* Example placeholder: */}
      {showDeleteTaskConfirmation && taskToDelete && (
        <DeleteCompletedModal
          isOpen={showDeleteTaskConfirmation}
          onClose={() => setShowDeleteTaskConfirmation(false)}
          onConfirm={() => {
            originalHandleDeleteTask(taskToDelete.id);
            setShowDeleteTaskConfirmation(false);
            setTaskToDelete(null);
          }}
        />
      )}
    </div>
  );
}; 