import { ClipboardCheck, Trash2 } from 'lucide-react';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFetchTasks, useTasksLoading, useUpdateTaskSuccess, useWorkspace } from '@/store/appStore';

import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import LoginPromptModal from '@/modals/LoginPromptModal';
import { SortMenu } from '@/pages/tasks/SortMenu';
import { SortableColumn } from '@/pages/tasks/SortableColumn';
import TaskForm from '@/pages/tasks/TaskForm';
import { TaskItem } from '@/pages/tasks/TaskItem';
import { TaskListMenu } from '@/modals/TaskListMenu';
import WorkspaceSelectionModal from '@/modals/WorkspaceSelectionModal';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { useTaskManager } from '@/hooks/useTaskManager';

interface ColumnMenuState {
  assignmentId: string;
  x: number;
  y: number;
}

interface SortMenuState {
  assignmentId: string;
  x: number;
  y: number;
}

interface ContextMenuState {
  type: "task";
  x: number;
  y: number;
  task: any;
}

export const KanbanBoard = () => {
  const { isLoggedIn } = useAuth();
  const tasksLoading = useTasksLoading();
  const {
    isDemo,
    demoTasks,
    loginPromptOpen,
    showLoginPrompt,
    closeLoginPrompt,
  } = useDemoMode();
  const updateTaskSuccess = useUpdateTaskSuccess();
  const fetchTasksAction = useFetchTasks();
  const { currentWorkspace: activeWorkspace, workspaces } = useWorkspace();
  
  const {
    tasks: realTasks,
    handleToggleCompletion,
    handleUpdateTask,
    handleDeleteTask: originalHandleDeleteTask,
  } = useTaskManager(activeWorkspace);

  // Usar tasks demo si isDemo
  const tasks = isDemo ? demoTasks : realTasks;

  // Debug: log para verificar las tareas
  console.log('KanbanBoard - activeWorkspace:', activeWorkspace);
  console.log('KanbanBoard - tasks count:', tasks.length);
  console.log('KanbanBoard - tasks:', tasks);

  // No need to filter here anymore since useTaskManager already returns filtered tasks
  const filteredTasks = tasks;

  // Debug: log para verificar el filtrado
  console.log('KanbanBoard - filteredTasks count:', filteredTasks.length);
  console.log('KanbanBoard - filteredTasks:', filteredTasks);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [pinnedColumns, setPinnedColumns] = useState<Record<string, Record<string, boolean>>>(() => {
    const saved = localStorage.getItem('kanbanPinnedColumns');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Get pinned columns for current workspace
  const currentWorkspacePins = useMemo(() => {
    if (!activeWorkspace) return {};
    return pinnedColumns[activeWorkspace.id] || {};
  }, [pinnedColumns, activeWorkspace]);
  const [showCompleted] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [showDeleteCompletedModal, setShowDeleteCompletedModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showDeleteTaskConfirmation, setShowDeleteTaskConfirmation] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [columnOrder] = useState<string[]>(() => {
    const savedOrder = localStorage.getItem('kanbanColumnOrder');
    return savedOrder ? JSON.parse(savedOrder) : [];
  });

  const [taskOrder, setTaskOrder] = useState<Record<string, string[]>>(() => {
    const savedTaskOrder = localStorage.getItem('kanbanTaskOrder');
    return savedTaskOrder ? JSON.parse(savedTaskOrder) : {};
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [sortMenu, setSortMenu] = useState<SortMenuState | null>(null);
  const [columnMenu, setColumnMenu] = useState<ColumnMenuState | null>(null);
  const [assignmentSortConfig, setAssignmentSortConfig] = useState<Record<string, { type: string; direction: string }>>(() => {
    const savedConfig = localStorage.getItem('kanbanAssignmentSortConfig');
    return savedConfig ? JSON.parse(savedConfig) : {};
  });

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [showWorkspaceSelectionModal, setShowWorkspaceSelectionModal] = useState(false);


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

  const handleSortClick = (assignmentId: string, position: { x: number; y: number }) => {
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

  const handleCloseColumnMenu = () => {
    setColumnMenu(null);
  };

  useEffect(() => {
    if (activeWorkspace) {
      console.log('KanbanBoard - workspace changed, ensuring tasks are loaded for:', activeWorkspace.id);
      // No need to fetch here since useTaskManager already handles workspace-specific fetching
      // This prevents duplicate requests and race conditions
    }
  }, [activeWorkspace?.id]); // Log workspace changes

  // Add a small delay to ensure everything is properly loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const completedTasks = filteredTasks.filter((task) => task.completed);
  const incompletedTasks = filteredTasks.filter((task) => !task.completed);

  // Memoize incompletedByAssignment before it's used in handleSelectSort
  const incompletedByAssignment = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    incompletedTasks.forEach((task: any) => {
      const assignment = task.assignment || "No assignment";
      if (!grouped[assignment]) grouped[assignment] = [];
      grouped[assignment].push(task);
    });
    
    // Apply sort position for each assignment
    Object.keys(grouped).forEach((assignment: string) => {
      const sortConfig = assignmentSortConfig[assignment];
      if (sortConfig && grouped[assignment]) {
        const savedOrder = taskOrder[assignment];
        if (savedOrder && savedOrder.length > 0) {
          const taskMap = new Map(grouped[assignment].map((task: any) => [task.id, task]));
          const sortedTasks: any[] = [];
          savedOrder.forEach((taskId: string) => {
            const task = taskMap.get(taskId);
            if (task) {
              sortedTasks.push(task);
              taskMap.delete(taskId);
            }
          });
          taskMap.forEach((task: any) => sortedTasks.push(task));
          grouped[assignment] = sortedTasks;
        }
      }
    });
    
    return grouped;
  }, [incompletedTasks, assignmentSortConfig, taskOrder]);

  const handleSelectSort = useCallback((assignmentId: string, sortType: string, sortDirection: string = 'asc') => {
    const currentConfig = assignmentSortConfig[assignmentId];
    let direction = sortDirection;

    // If same sort type is selected, toggle direction
    if (currentConfig?.type === sortType) {
      direction = currentConfig.direction === 'asc' ? 'desc' : 'asc';
    }

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
        sortedTasks.sort((a: any, b: any) => a.title.localeCompare(b.title));
        if (direction === 'desc') {
          sortedTasks.reverse();
        }
        break;
      }
      case 'deadline': {
        sortedTasks.sort((a: any, b: any) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        if (direction === 'desc') {
          sortedTasks.reverse();
        }
        break;
      }
      case 'difficulty': {
        const difficultyOrder: Record<string, number> = { 'easy': 1, 'medium': 2, 'hard': 3 };
        sortedTasks.sort((a: any, b: any) => {
          const aDifficulty = difficultyOrder[a.difficulty?.toLowerCase()] || 4;
          const bDifficulty = difficultyOrder[b.difficulty?.toLowerCase()] || 4;
          return aDifficulty - bDifficulty;
        });
        if (direction === 'desc') {
          sortedTasks.reverse();
        }
        break;
      }
      case 'dateAdded': {
        sortedTasks.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateA - dateB;
        });
        if (direction === 'desc') {
          sortedTasks.reverse();
        }
        break;
      }
      default:
        break;
    }

    setTaskOrder(prevOrder => ({
      ...prevOrder,
      [assignmentId]: sortedTasks.map((task: any) => task.id)
    }));
    localStorage.setItem('kanbanTaskOrder', JSON.stringify({
      ...taskOrder,
      [assignmentId]: sortedTasks.map((task: any) => task.id)
    }));
  }, [assignmentSortConfig, incompletedByAssignment, taskOrder]);

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
        updateTaskSuccess(updatedTask);

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
          fetchTasksAction(activeWorkspace?.id);
        }, 0);

        console.log('Task moved successfully - UI updated immediately');

      } catch (error) {
        console.error('Error moving task:', error);
      }
    } else {
      // This is a same-assignment reorder
      const assignmentTasks = [...(incompletedByAssignment[sourceAssignmentId] || [])];
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
  }, [incompletedByAssignment, taskOrder]);

  const sortedIncompletedAssignments = useMemo(() => {
    // Group tasks and apply per-assignment task sort if configured
    const grouped: Record<string, any[]> = {};
    incompletedTasks.forEach((task: any) => {
      const assignment = task.assignment || "No assignment";
      if (!grouped[assignment]) grouped[assignment] = [];
      grouped[assignment].push(task);
    });
    
    Object.keys(grouped).forEach((assignment: string) => {
      const sortConfig = assignmentSortConfig[assignment];
      if (sortConfig && grouped[assignment]) {
        const savedOrder = taskOrder[assignment];
        if (savedOrder && savedOrder.length > 0) {
          const taskMap = new Map(grouped[assignment].map((task: any) => [task.id, task]));
          const sortedTasks: any[] = [];
          savedOrder.forEach((taskId: string) => {
            const task = taskMap.get(taskId);
            if (task) {
              sortedTasks.push(task);
              taskMap.delete(taskId);
            }
          });
          taskMap.forEach((task: any) => sortedTasks.push(task));
          grouped[assignment] = sortedTasks;
        }
      }
    });

    // Build list of assignments that have tasks OR are pinned
    const assignmentsWithTasks = Object.keys(grouped).filter(
      (assignment) => grouped[assignment] && grouped[assignment].length > 0
    );
    
    // Get pinned assignments for current workspace that might not have tasks
    const pinnedAssignments = activeWorkspace 
      ? Object.keys(currentWorkspacePins).filter(
          (assignment) => currentWorkspacePins[assignment] === true
        )
      : [];
    
    // Combine both: assignments with tasks + pinned assignments (deduplicate)
    const allAssignments = [...new Set([...assignmentsWithTasks, ...pinnedAssignments])];

    // Respect saved column order if present, but include any new assignments at the end
    if (columnOrder.length > 0) {
      const orderedAssignments = [...columnOrder];
      allAssignments.forEach(assignment => {
        if (!orderedAssignments.includes(assignment)) {
          orderedAssignments.push(assignment);
        }
      });
      return orderedAssignments.filter(a => allAssignments.includes(a));
    }

    return allAssignments;
  }, [incompletedTasks, assignmentSortConfig, columnOrder, taskOrder, activeWorkspace, currentWorkspacePins]);

  const togglePin = (assignment: string) => {
    if (!activeWorkspace?.id) return;
    
    setPinnedColumns(prev => {
      const workspacePins = { ...(prev[activeWorkspace.id] || {}) };
      const newWorkspacePins = {
        ...workspacePins,
        [assignment]: !workspacePins[assignment]
      };
      
      const newState = {
        ...prev,
        [activeWorkspace.id]: newWorkspacePins
      };
      
      // Persist to localStorage
      localStorage.setItem('kanbanPinnedColumns', JSON.stringify(newState));
      return newState;
    });
  };

  const handleTaskContextMenu = (e: React.MouseEvent, task: any) => {
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

  const handleAddTask = (assignment: string | null = null) => {
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
    completedTasks.forEach((task: any) => originalHandleDeleteTask(task.id));
    setShowDeleteCompletedModal(false);
  };

  const handleEditTask = (task: any) => {
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

  const handleConfirmDeleteTask = (taskId: string) => {
    if (isDemo) {
      showLoginPrompt();
      return;
    }
    const task = tasks.find((t: any) => t.id === taskId);
    if (task) {
        setTaskToDelete(task);
        setShowDeleteTaskConfirmation(true);
    } else {
        console.error(`Task with ID ${taskId} not found.`);
    }
  };

  const handleMoveToWorkspace = (assignment: string) => {
    setSelectedAssignment(assignment);
    setShowWorkspaceSelectionModal(true);
  };

  const handleDeleteAssignment = useCallback((assignment: string) => {
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

  const confirmDeleteAssignment = useCallback(() => {
    if (assignmentToDelete) {
      handleDeleteAssignment(assignmentToDelete);
      setShowDeleteAssignmentModal(false);
      setAssignmentToDelete(null);
    }
  }, [assignmentToDelete, handleDeleteAssignment]);

  const handleUpdateAssignment = useCallback((oldName: string, newName: string) => {
    if (isDemo) {
      showLoginPrompt();
      return;
    }

    // Find all tasks with the old assignment name
    const tasksToUpdate = filteredTasks.filter(task => task.assignment === oldName);
    
    // Update each task with the new assignment name
    tasksToUpdate.forEach((task: any) => {
      handleUpdateTask({
        ...task,
        assignment: newName
      });
    });
  }, [filteredTasks, handleUpdateTask, isDemo, showLoginPrompt]);

  const noTasks = incompletedTasks.length === 0 && completedTasks.length === 0;

  // Don't show anything until workspace is properly loaded and validated
  if (!isReady || !activeWorkspace || tasksLoading) {
    return (
      <div className="flex items-center justify-center pt-16 sm:pt-20 pb-12 min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show message when no workspace is selected (this should rarely show now)
  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[40vh]">
        <div className="text-center">
          <ClipboardCheck className="mx-auto mb-4 w-10 h-10 text-[var(--accent-primary)]" />
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            No Workspace Selected
          </h3>
          <p className="text-base text-[var(--text-secondary)] mb-1">
            Please select a workspace from the dropdown to view your tasks.
          </p>
        </div>
      </div>
    );
  }

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
        setActiveId(active.id as string);
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
                pinned={activeWorkspace ? currentWorkspacePins[assignment] === true : false}
                onTogglePin={() => togglePin(assignment)}
                onAddTask={() => handleAddTask(assignment)}
                onTaskToggle={handleToggleCompletion}
                onTaskDelete={handleConfirmDeleteTask}
                onEditTask={handleEditTask}
                onTaskContextMenu={handleTaskContextMenu}
                onSortClick={handleSortClick}
                onMoveTask={handleDragEnd}
                columnMenu={columnMenu?.assignmentId === assignment ? columnMenu : null}
                onCloseColumnMenu={handleCloseColumnMenu}
                onMoveToWorkspace={handleMoveToWorkspace}
                onDeleteAssignment={() => {
                  setAssignmentToDelete(assignment);
                  setShowDeleteAssignmentModal(true);
                }}
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
                onContextMenu={(e: React.MouseEvent) => handleTaskContextMenu(e, task)}
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
            fetchTasksAction(activeWorkspace?.id);
            handleCloseTaskForm();
          }}
        />
      )}

      {/* Delete Completed Modal */}
      {showDeleteCompletedModal && (
        <DeleteCompletedModal
          onClose={() => {
            setShowDeleteCompletedModal(false);
          }}
          onConfirm={handleDeleteAllCompletedTasks}
          message="Are you sure you want to delete all completed tasks?"
          confirmButtonText="Delete All"
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
                updateTaskSuccess({ ...task, workspace_id: workspace.id });
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
              await fetchTasksAction(activeWorkspace?.id);
              setSelectedAssignment(null);

              // Cerrar el modal después de que se actualicen los datos
              setShowWorkspaceSelectionModal(false);
            } catch (error) {
              console.error('Error moving tasks to workspace:', error);
            }
          }}
          assignment={selectedAssignment || ""}
          tasks={tasks}
        />
      )}

      {/* Delete Task Confirmation Modal */}
      {showDeleteTaskConfirmation && (
        <DeleteCompletedModal
          onClose={() => {
            setShowDeleteTaskConfirmation(false);
            setTaskToDelete(null);
          }}
          onConfirm={() => {
            if (taskToDelete) {
              originalHandleDeleteTask(taskToDelete.id);
              setShowDeleteTaskConfirmation(false);
              setTaskToDelete(null);
            }
          }}
          message={`Are you sure you want to delete task "${taskToDelete?.title}"?`}
          confirmButtonText="Delete Task"
        />
      )}

      {/* Delete Assignment Modal */}
      {showDeleteAssignmentModal && (
        <DeleteCompletedModal
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