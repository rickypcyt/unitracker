import { ClipboardCheck, GripVertical, Trash2 } from 'lucide-react';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import LoginPromptModal from '@/modals/LoginPromptModal';
import { SortMenu } from '@/pages/tasks/SortMenu';
import { SortableColumn } from '@/pages/tasks/SortableColumn';
import TaskForm from '@/pages/tasks/TaskForm';
import { TaskItem } from '@/pages/tasks/TaskItem';
import { TaskListMenu } from '@/modals/TaskListMenu';
import WorkspaceSelectionModal from '@/modals/WorkspaceSelectionModal';
import { fetchTasks } from '@/store/TaskActions';
import { supabase } from '@/utils/supabaseClient';
import { updateTaskSuccess } from '@/store/slices/TaskSlice';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { useTaskManager } from '@/hooks/useTaskManager';

export const KanbanBoard = () => {
  const {
    tasks: realTasks,
    handleToggleCompletion,
    handleUpdateTask,
    handleDeleteTask: originalHandleDeleteTask,
  } = useTaskManager();
  const { isLoggedIn } = useAuth();
  const {
    isDemo,
    demoTasks,
    loginPromptOpen,
    showLoginPrompt,
    closeLoginPrompt,
  } = useDemoMode();
  const activeWorkspace = useSelector(state => state.workspace.activeWorkspace);
  const workspaces = useSelector(state => state.workspace.workspaces);

  // Usar tasks demo si isDemo
  const tasks = isDemo ? demoTasks : realTasks;

  // Filtrar tareas por workspace activo
  const filteredTasks = activeWorkspace
    ? tasks.filter(task => task.workspace_id === activeWorkspace.id)
    : tasks;

  const [contextMenu, setContextMenu] = useState(null);
  const [collapsedColumns, setCollapsedColumns] = useState({});
  const [showCompleted] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDeleteCompletedModal, setShowDeleteCompletedModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteTaskConfirmation, setShowDeleteTaskConfirmation] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null as string | null);
  const [columnOrder] = useState(() => {
    const savedOrder = localStorage.getItem('kanbanColumnOrder');
    return savedOrder ? JSON.parse(savedOrder) : [];
  });

  const [taskOrder, setTaskOrder] = useState<Record<string, string[]>>(() => {
    const savedTaskOrder = localStorage.getItem('kanbanTaskOrder');
    return savedTaskOrder ? JSON.parse(savedTaskOrder) : {};
  });

  const [activeId, setActiveId] = useState(null);
  const [sortMenu, setSortMenu] = useState(null);
  const [columnMenu, setColumnMenu] = useState(null);
  const [assignmentSortConfig, setAssignmentSortConfig] = useState(() => {
    const savedConfig = localStorage.getItem('kanbanAssignmentSortConfig');
    return savedConfig ? JSON.parse(savedConfig) : {};
  });

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [showWorkspaceSelectionModal, setShowWorkspaceSelectionModal] = useState(false);

  const dispatch = useDispatch();

  // Set up sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSortClick = (assignmentId, position) => {
    // Calcular el ancho estimado del menú (aproximadamente 220px)
    const menuWidth = 220;
    const windowWidth = window.innerWidth;
    
    // Si el menú se saldría por la derecha, moverlo hacia la izquierda
    let x = position.x;
    if (position.x + menuWidth > windowWidth) {
      x = Math.max(10, windowWidth - menuWidth - 10); // 10px de margen del borde
    }
    
    setSortMenu({
      assignmentId,
      x: x,
      y: position.y,
    });
  };

  const handleCloseSortMenu = () => {
    setSortMenu(null);
  };

  const handleColumnMenuClick = (assignmentId, position) => {
    // Calcular el ancho estimado del menú (aproximadamente 220px)
    const menuWidth = 220;
    const windowWidth = window.innerWidth;
    
    // Si el menú se saldría por la derecha, moverlo hacia la izquierda
    let x = position.x;
    if (position.x + menuWidth > windowWidth) {
      x = Math.max(10, windowWidth - menuWidth - 10); // 10px de margen del borde
    }
    
    setColumnMenu({
      assignmentId,
      x: x,
      y: position.y,
    });
  };

  const handleCloseColumnMenu = () => {
    setColumnMenu(null);
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
      case 'alphabetical': {
        const currentDirection = newAssignmentSortConfig[assignmentId].direction;
        const updatedConfig = { ...newAssignmentSortConfig };
        updatedConfig.direction = currentDirection === 'asc' ? 'desc' : 'asc';
        setAssignmentSortConfig(updatedConfig);
        localStorage.setItem('kanbanAssignmentSortConfig', JSON.stringify(updatedConfig));
        sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
        if (currentDirection === 'desc') {
          sortedTasks.reverse();
        }
        break;
      }
      case 'deadline': {
        const currentDirection = newAssignmentSortConfig[assignmentId].direction;
        const updatedConfig = { ...newAssignmentSortConfig };
        updatedConfig.direction = currentDirection === 'asc' ? 'desc' : 'asc';
        setAssignmentSortConfig(updatedConfig);
        localStorage.setItem('kanbanAssignmentSortConfig', JSON.stringify(updatedConfig));
        sortedTasks.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
        if (currentDirection === 'desc') {
          sortedTasks.reverse();
        }
        break;
      }
      case 'difficulty': {
        const currentDirection = newAssignmentSortConfig[assignmentId].direction;
        const updatedConfig = { ...newAssignmentSortConfig };
        updatedConfig.direction = currentDirection === 'asc' ? 'desc' : 'asc';
        setAssignmentSortConfig(updatedConfig);
        localStorage.setItem('kanbanAssignmentSortConfig', JSON.stringify(updatedConfig));
        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        sortedTasks.sort((a, b) => {
          const aDifficulty = difficultyOrder[a.difficulty?.toLowerCase()] || 4;
          const bDifficulty = difficultyOrder[b.difficulty?.toLowerCase()] || 4;
          return aDifficulty - bDifficulty;
        });
        if (currentDirection === 'desc') {
          sortedTasks.reverse();
        }
        break;
      }
      case 'dateAdded': {
        const currentDirection = newAssignmentSortConfig[assignmentId].direction;
        const updatedConfig = { ...newAssignmentSortConfig };
        updatedConfig.direction = currentDirection === 'asc' ? 'desc' : 'asc';
        setAssignmentSortConfig(updatedConfig);
        localStorage.setItem('kanbanAssignmentSortConfig', JSON.stringify(updatedConfig));
        sortedTasks.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateA - dateB;
        });
        if (currentDirection === 'desc') {
          sortedTasks.reverse();
        }
        break;
      }
      default:
        break;
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
    if (activeWorkspace) {
      dispatch(fetchTasks());
    }
  }, [activeWorkspace, dispatch]);

  const completedTasks = filteredTasks.filter((task) => task.completed);
  const incompletedTasks = filteredTasks.filter((task) => !task.completed);

  

  const groupTasksByAssignment = useCallback((tasksToGroup) => {
    const grouped = tasksToGroup.reduce((acc, task) => {
      const assignment = task.assignment || "No assignment";
      if (!acc[assignment]) acc[assignment] = [];
      acc[assignment].push(task);
      return acc;
    }, {});
    return grouped;
  }, []);

  const sortTasksByPosition = useCallback((tasksToSort, assignment) => {
    const savedOrder = taskOrder[assignment];
    if (savedOrder && savedOrder.length > 0) {
      const taskMap = new Map(tasksToSort.map(task => [task.id, task]));
      const sortedTasks = [];
      savedOrder.forEach(taskId => {
        const task = taskMap.get(taskId);
        if (task) {
          sortedTasks.push(task);
          taskMap.delete(taskId);
        }
      });
      taskMap.forEach(task => sortedTasks.push(task));
      return sortedTasks;
    }
    return tasksToSort;
  }, [taskOrder]);

  const incompletedByAssignment = useMemo(() => {
    const grouped = groupTasksByAssignment(incompletedTasks);
    Object.keys(grouped).forEach(assignment => {
      const sortConfig = assignmentSortConfig[assignment];
      if (sortConfig) {
        const sortedTasks = sortTasksByPosition(grouped[assignment], assignment);
        grouped[assignment] = sortedTasks;
      }
    });
    return grouped;
  }, [incompletedTasks, assignmentSortConfig, sortTasksByPosition, groupTasksByAssignment]);

  // Handle drag end event
  const handleDragEnd = useCallback(async (event: any) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    console.log('Drag ended:', { activeId: active.id, overId: over.id, overData: over.data });

    // Find the source assignment (where the task is coming from)
    const sourceAssignmentId = Object.keys(incompletedByAssignment).find((assignmentId: string) =>
      (incompletedByAssignment[assignmentId] as any[]).some((task: any) => task.id === active.id)
    ) || 'No assignment';

    // Get the task being moved
    const taskToMove = sourceAssignmentId && 
      (incompletedByAssignment[sourceAssignmentId] || []).find((task: any) => task.id === active.id);
    
    if (!taskToMove) {
      console.log('Task not found in any assignment');
      return;
    }

    // Determine target assignment
    let targetAssignmentId: string = 'No assignment';
    
    // Debug log to help identify the issue
    console.log('Over data:', over.data);
    console.log('Over ID:', over.id);
    
    // Check if we're dropping on a task first
    if ((over.data as any)?.type === 'task') {
      // First try to get assignment from the task data in the drag event
      const taskData = (over.data as any)?.current?.taskData || (over.data as any)?.current;
      if (taskData?.assignment) {
        targetAssignmentId = taskData.assignment;
        console.log('Dropping on task, assignment from taskData:', targetAssignmentId);
      } 
      // Fallback to finding the task in the filtered tasks
      else {
        const targetTask = filteredTasks.find((t: any) => t.id === over.id);
        if (targetTask?.assignment) {
          targetAssignmentId = targetTask.assignment;
          console.log('Dropping on task, assignment from filtered tasks:', targetAssignmentId);
        }
      }
      
      if (targetAssignmentId === 'No assignment') {
        console.warn('Could not determine target assignment from task data:', over.data);
      }
    } 
    // If not dropping on a task, check if we're dropping on a column
    else if (over.id.toString().startsWith('column-') || (over.data as any)?.type === 'column') {
      // Extract the assignment ID from the column ID
      const columnId = over.id.toString();
      targetAssignmentId = columnId.replace(/^column-/, '');
      console.log('Dropping on column, assignment ID:', targetAssignmentId);
    }
    // If we couldn't determine the target, use the source assignment
    if (targetAssignmentId === 'No assignment' && sourceAssignmentId) {
      targetAssignmentId = sourceAssignmentId;
    }

    console.log('Moving task:', taskToMove.title, 'from', sourceAssignmentId, 'to', targetAssignmentId);

    // Only proceed if we're actually moving to a different assignment
    if (targetAssignmentId !== sourceAssignmentId) {

      console.log('Moving task:', taskToMove.title, 'from', sourceAssignmentId, 'to', targetAssignmentId);

      // Update the task's assignment in the database
      try {
        console.log('Attempting to update task in database...');
        console.log('Task ID:', taskToMove.id);
        console.log('Current assignment:', taskToMove.assignment);
        console.log('New assignment:', targetAssignmentId);

        const { data, error } = await supabase
          .from('tasks')
          .update({ assignment: targetAssignmentId })
          .eq('id', taskToMove.id)
          .select();

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Error moving task to different assignment:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            taskId: taskToMove.id,
            oldAssignment: sourceAssignmentId,
            newAssignment: targetAssignmentId
          });
          return;
        }

        // Create the updated task with the new assignment
        const updatedTask = { 
          ...taskToMove, 
          assignment: targetAssignmentId,
          // Ensure we have all required fields to avoid type errors
          created_at: taskToMove.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          workspace_id: taskToMove.workspace_id || null,
          completed: taskToMove.completed || false,
          completed_at: taskToMove.completed_at || null,
          priority: taskToMove.priority || 'medium',
          deadline: taskToMove.deadline || null,
          description: taskToMove.description || '',
          subtasks: taskToMove.subtasks || [],
          tags: taskToMove.tags || []
        };

        // Update Redux state with the updated task
        dispatch(updateTaskSuccess(updatedTask));

        // Update task order state
        setTaskOrder(prev => {
          const newOrder = { ...prev };

          // Remove from source assignment
          if (sourceAssignmentId && newOrder[sourceAssignmentId]) {
            newOrder[sourceAssignmentId] = newOrder[sourceAssignmentId]
              .filter((id: string) => id !== taskToMove.id);
          }

          // Add to target assignment
          if (!newOrder[targetAssignmentId]) {
            newOrder[targetAssignmentId] = [];
          }
          
          // Add to the end of the target column
          if (!newOrder[targetAssignmentId]?.includes(taskToMove.id)) {
            newOrder[targetAssignmentId] = [...(newOrder[targetAssignmentId] || []), taskToMove.id];
          }

          // Update localStorage
          localStorage.setItem('kanbanTaskOrder', JSON.stringify(newOrder));
          
          return newOrder;
        });

        // Force a re-fetch of tasks to ensure UI is in sync
        // Wrap in a setTimeout to avoid potential race conditions
        setTimeout(() => {
          dispatch(fetchTasks() as any);
        }, 0);

        console.log('Task moved successfully - UI updated immediately');

      } catch (error) {
        console.error('Error moving task:', error);
      }
    } else {
      // This is a same-assignment reorder
      const assignmentTasks = [...incompletedByAssignment[sourceAssignmentId]];
      const oldIndex = assignmentTasks.findIndex((task: any) => task.id === active.id);
      const newIndex = assignmentTasks.findIndex((task: any) => task.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Update the task order in the state
      const newTasks = arrayMove(assignmentTasks, oldIndex, newIndex);

      // Update the task order in localStorage
      const newTaskOrder = {
        ...taskOrder,
        [sourceAssignmentId]: newTasks.map((task: any) => task.id)
      };

      localStorage.setItem('kanbanTaskOrder', JSON.stringify(newTaskOrder));
      setTaskOrder(newTaskOrder);
    }
  }, [incompletedByAssignment, taskOrder, dispatch]);

  const sortedIncompletedAssignments = useMemo(() => {
    // Group tasks and apply per-assignment task sort if configured
    const grouped = groupTasksByAssignment(incompletedTasks);
    Object.keys(grouped).forEach(assignment => {
      const sortConfig = assignmentSortConfig[assignment];
      if (sortConfig) {
        const sortedTasks = sortTasksByPosition(grouped[assignment], assignment);
        grouped[assignment] = sortedTasks;
      }
    });

    // Build list of assignments that actually have tasks
    const assignments = Object.keys(grouped).filter(
      (assignment) => grouped[assignment] && grouped[assignment].length > 0
    );

    // Respect saved column order if present, but include any new assignments at the end
    if (columnOrder.length > 0) {
      const orderedAssignments = [...columnOrder];
      assignments.forEach(assignment => {
        if (!orderedAssignments.includes(assignment)) {
          orderedAssignments.push(assignment);
        }
      });
      return orderedAssignments.filter(a => assignments.includes(a));
    }

    return assignments;
  }, [incompletedTasks, assignmentSortConfig, columnOrder, groupTasksByAssignment, sortTasksByPosition]);

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

  // Bloquear acciones en modo demo
  const handleAddTask = (assignment = null) => {
    if (isDemo) {
      showLoginPrompt();
      return;
    }
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
    if (isDemo) {
      showLoginPrompt();
      return;
    }
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setSelectedAssignment(null);
    setEditingTask(null);
  };

  const handleConfirmDeleteTask = (taskId) => {
    if (isDemo) {
      showLoginPrompt();
      return;
    }
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        setTaskToDelete(task);
        setShowDeleteTaskConfirmation(true);
    } else {
        console.error(`Task with ID ${taskId} not found.`);
    }
  };

  const handleMoveToWorkspace = (assignment) => {
    setSelectedAssignment(assignment);
    setShowWorkspaceSelectionModal(true);
  };

  const handleDeleteAssignment = useCallback((assignment) => {
    if (isDemo) {
      showLoginPrompt();
      return;
    }

    // Find all tasks with this assignment
    const tasksToDelete = filteredTasks.filter(task => task.assignment === assignment);
    
    if (tasksToDelete.length > 0) {
      // Delete each task with this assignment
      tasksToDelete.forEach(task => {
        originalHandleDeleteTask(task.id);
      });
    }
  }, [filteredTasks, originalHandleDeleteTask, isDemo, showLoginPrompt]);

  const handleUpdateAssignment = useCallback((oldName, newName) => {
    if (isDemo) {
      showLoginPrompt();
      return;
    }

    // Find all tasks with the old assignment name
    const tasksToUpdate = filteredTasks.filter(task => task.assignment === oldName);
    
    // Update each task with the new assignment name
    tasksToUpdate.forEach(task => {
      handleUpdateTask({
        ...task,
        assignment: newName
      });
    });
  }, [filteredTasks, handleUpdateTask, isDemo, showLoginPrompt]);

  const noTasks = incompletedTasks.length === 0 && completedTasks.length === 0;

  if (noTasks) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[40vh]">
        <div className="text-center">
          <ClipboardCheck className="mx-auto mb-4 w-10 h-10 text-[var(--accent-primary)]" />
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {activeWorkspace ? `No tasks in "${activeWorkspace.name}"` : 'No Tasks Yet'}
          </h3>
          <p className="text-base text-[var(--text-secondary)] mb-1">
            {activeWorkspace ? 'Create your first task in this workspace to get started.' : 'Create your first task to get started.'}
          </p>
          {!isLoggedIn && (
            <p className="text-sm text-[var(--text-secondary)] opacity-70 mt-2">
              Remember to login first
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => {
        setActiveId(active.id);
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
    <div className="flex flex-col h-full kanban-board">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full h-full mb-4">
        {sortedIncompletedAssignments.map((assignment) => (
          <div key={assignment} className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-primary)] shadow-sm">
            <SortableColumn
              id={assignment}
              assignment={assignment}
              tasks={incompletedByAssignment[assignment] || []}
              collapsed={collapsedColumns[assignment]}
              onToggleCollapse={() => toggleColumn(assignment)}
              onAddTask={() => handleAddTask(assignment)}
              onTaskToggle={handleToggleCompletion}
              onTaskDelete={handleConfirmDeleteTask}
              onEditTask={handleEditTask}
              onTaskContextMenu={handleTaskContextMenu}
              onSortClick={handleSortClick}
              onColumnMenuClick={handleColumnMenuClick}
              columnMenu={columnMenu?.assignmentId === assignment ? columnMenu : null}
              onCloseColumnMenu={handleCloseColumnMenu}
              onMoveToWorkspace={handleMoveToWorkspace}
              onDeleteAssignment={handleDeleteAssignment}
              onUpdateAssignment={handleUpdateAssignment}
            />
          </div>
        ))}
      </div>

      {/* Drag Overlay para mostrar el elemento arrastrado */}
      <DragOverlay>
        {activeId ? (
          <div className="rotate-3 opacity-90">
            {(() => {
              // Encontrar la tarea activa en todas las assignments
              for (const assignment of sortedIncompletedAssignments) {
                const task = incompletedByAssignment[assignment]?.find((t: any) => t.id === activeId);
                if (task) {
                  return (
                    <TaskItem
                      task={task}
                      onToggleCompletion={() => {}}
                      onDelete={() => {}}
                      onEditTask={() => {}}
                      onContextMenu={() => {}}
                      active={!!task.activetask}
                    />
                  );
                }
              }
              return null;
            })()}
          </div>
        ) : null}
      </DragOverlay>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleConfirmDeleteTask}
                onEditTask={handleEditTask}
                onContextMenu={(e) => handleTaskContextMenu(e, task)}
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
          onEditTask={handleEditTask}
          onSetActiveTask={handleUpdateTask}
          onDeleteTask={handleConfirmDeleteTask}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleCloseTaskForm}
          initialAssignment={selectedAssignment}
          initialTask={editingTask}
          onTaskCreated={() => {
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
          currentSortType={assignmentSortConfig[sortMenu.assignmentId]?.type || 'deadline'}
          currentSortDirection={assignmentSortConfig[sortMenu.assignmentId]?.direction || 'asc'}
        />
      )}

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={isLoginPromptOpen || loginPromptOpen}
        onClose={() => {
          setIsLoginPromptOpen(false);
          closeLoginPrompt();
        }}
      />

      {/* Workspace Selection Modal */}
      {showWorkspaceSelectionModal && (
        <WorkspaceSelectionModal
          isOpen={showWorkspaceSelectionModal}
          onClose={() => setShowWorkspaceSelectionModal(false)}
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onSelectWorkspace={async (workspace) => {
            try {
              // Obtener todas las tareas del assignment actual
              const tasksInAssignment = selectedAssignment ? (incompletedByAssignment[selectedAssignment] || []) : [];

              // Actualización optimista: actualiza el estado de Redux localmente
              tasksInAssignment.forEach(task => {
                dispatch(updateTaskSuccess({ ...task, workspace_id: workspace.id }));
              });

              if (tasksInAssignment.length > 0) {
                // Actualizar el workspace_id de todas las tareas del assignment en la base de datos
                const { error } = await supabase
                  .from('tasks')
                  .update({ workspace_id: workspace.id })
                  .in('id', tasksInAssignment.map(task => task.id));

                if (error) {
                  console.error('Error moving tasks to workspace:', error);
                  return;
                }

                console.warn(`Successfully moved ${tasksInAssignment.length} tasks from assignment "${selectedAssignment}" to workspace "${workspace.name}"`);
              }

              // Refrescar las tareas inmediatamente para sincronizar con el backend
              await dispatch(fetchTasks());
              setSelectedAssignment(null);

              // Cerrar el modal después de que se actualicen los datos
              setShowWorkspaceSelectionModal(false);
            } catch (error) {
              console.error('Error moving tasks to workspace:', error);
            }
          }}
          assignment={selectedAssignment}
          tasks={tasks}
        />
      )}

      {/* Delete Task Confirmation Modal */}
      {showDeleteTaskConfirmation && taskToDelete && (
        <DeleteCompletedModal
          isOpen={showDeleteTaskConfirmation}
          onClose={() => setShowDeleteTaskConfirmation(false)}
          onConfirm={() => {
            originalHandleDeleteTask(taskToDelete.id);
            setShowDeleteTaskConfirmation(false);
            setTaskToDelete(null);
          }}
          message={`Are you sure you want to delete the task "${taskToDelete.title}"? This action cannot be undone.`}
          confirmButtonText="Delete Task"
        />
      )}

      {/* Delete Assignment Confirmation Modal */}
      {showDeleteAssignmentModal && assignmentToDelete && (
        <DeleteCompletedModal
          isOpen={showDeleteAssignmentModal}
          onClose={() => {
            setShowDeleteAssignmentModal(false);
            setAssignmentToDelete(null);
          }}
          onConfirm={confirmDeleteAssignment}
          message={`Are you sure you want to delete the assignment "${assignmentToDelete}"? All tasks associated with this assignment will be deleted.`}
          confirmButtonText="Delete Assignment"
        />
      )}
    </div>
    </DndContext>
  );
}; 