import { ClipboardCheck, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFetchTasks, usePinnedColumns, usePinnedColumnsActions, useTasksLoading, useUpdateTaskSuccess, useWorkspace, useWorkspaceActions } from '@/store/appStore';

// @ts-nocheck - Temporalmente deshabilitado para evitar errores de tipo masivos
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import LoginPromptModal from '@/modals/LoginPromptModal';
import React from 'react';
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

// Hook para detectar tamaño de pantalla
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState('lg');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('sm');
      } else if (width < 1024) {
        setScreenSize('md');
      } else {
        setScreenSize('lg');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
};

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
  const { setCurrentWorkspace } = useWorkspaceActions();
  
  const {
    tasks: realTasks,
    handleToggleCompletion,
    handleUpdateTask,
    handleDeleteTask: originalHandleDeleteTask,
  } = useTaskManager(activeWorkspace);

  // Usar tasks demo si isDemo
  const tasks = isDemo 
    ? demoTasks.filter(task => task.workspace_id === activeWorkspace?.id)
    : realTasks;

  // Remove debug logs to prevent infinite loop
  // console.log('KanbanBoard - activeWorkspace:', activeWorkspace);
  // console.log('KanbanBoard - tasks count:', tasks.length);
  // console.log('KanbanBoard - tasks:', tasks);

  // No need to filter here anymore since useTaskManager already returns filtered tasks
  const filteredTasks = tasks;

  // Remove debug logs to prevent infinite loop
  // console.log('KanbanBoard - filteredTasks count:', filteredTasks.length);
  // console.log('KanbanBoard - filteredTasks:', filteredTasks);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Zustand store hooks
  const pinnedColumns = usePinnedColumns();
  const { togglePin } = usePinnedColumnsActions();
  const screenSize = useScreenSize();
  
  // Get pinned columns for current workspace (con por defecto no pinnado)
  const currentWorkspacePins = useMemo(() => {
    if (!activeWorkspace) return {};
    
    const workspacePins = pinnedColumns[activeWorkspace.id] || {};
    
    // Obtener todas las asignaciones actuales y marcar como no pinnadas por defecto
    const allAssignments = new Set<string>();
    filteredTasks.forEach((task: any) => {
      const assignment = task.assignment || "No assignment";
      allAssignments.add(assignment);
    });
    
    // Crear objeto de pinnings con false por defecto para asignaciones sin registro explícito
    const pinsWithDefaults: Record<string, boolean> = {};
    allAssignments.forEach(assignment => {
      // Si hay un registro explícito, usarlo, si no, asumir false (no pinnado)
      pinsWithDefaults[assignment] = workspacePins[assignment] ?? false;
    });
    
    return pinsWithDefaults;
  }, [pinnedColumns, activeWorkspace, filteredTasks]);
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

  const [sortMenu, setSortMenu] = useState<SortMenuState | null>(null);
  const [columnMenu, setColumnMenu] = useState<ColumnMenuState | null>(null);
  const [assignmentSortConfig, setAssignmentSortConfig] = useState<Record<string, { type: string; direction: string }>>(() => {
    const savedConfig = localStorage.getItem('kanbanAssignmentSortConfig');
    return savedConfig ? JSON.parse(savedConfig) : {};
  });

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [showWorkspaceSelectionModal, setShowWorkspaceSelectionModal] = useState(false);

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

  // Fallback automático al primer workspace disponible si none está seleccionado
  useEffect(() => {
    if (!activeWorkspace && workspaces && workspaces.length > 0 && isReady) {
      console.log('KanbanBoard - No active workspace, auto-selecting first available:', workspaces[0]);
      setCurrentWorkspace(workspaces[0]);
    }
  }, [activeWorkspace, workspaces, isReady, setCurrentWorkspace]);

  // Add a small delay to ensure everything is properly loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const completedTasks = useMemo(() => filteredTasks.filter((task) => task.completed), [filteredTasks]);
  const incompletedTasks = useMemo(() => filteredTasks.filter((task) => !task.completed), [filteredTasks]);

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

    // Sort assignments by task count (highest to lowest)
    const sortedAssignments = allAssignments.sort((a, b) => {
      const aTaskCount = grouped[a]?.length || 0;
      const bTaskCount = grouped[b]?.length || 0;
      return bTaskCount - aTaskCount; // Highest to lowest
    });

    // Respect saved column order if present, but include any new assignments at the end
    if (columnOrder.length > 0) {
      const orderedAssignments = [...columnOrder];
      sortedAssignments.forEach(assignment => {
        if (!orderedAssignments.includes(assignment)) {
          orderedAssignments.push(assignment);
        }
      });
      return orderedAssignments.filter(a => allAssignments.includes(a));
    }

    return sortedAssignments;
  }, [incompletedTasks, assignmentSortConfig, columnOrder, taskOrder, activeWorkspace, currentWorkspacePins]);

  const handleTogglePin = (assignment: string) => {
    if (!activeWorkspace?.id) return;
    togglePin(activeWorkspace.id, assignment);
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


  // Show message when no workspaces are available at all
  if (!activeWorkspace && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[40vh]">
        <div className="text-center">
          <ClipboardCheck className="mx-auto mb-4 w-10 h-10 text-[var(--accent-primary)]" />
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            No Workspaces Available
          </h3>
          <p className="text-base text-[var(--text-secondary)] mb-1">
            Create your first workspace to start organizing your tasks.
          </p>
        </div>
      </div>
    );
  }

  // This should rarely show now due to fallback, but keeping as safety net
  if (!activeWorkspace && workspaces && workspaces.length > 0) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[40vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Selecting workspace...</p>
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
      <div className="flex flex-col h-full kanban-board">
        <div className="flex justify-center w-full mb-4 px-0 sm:px-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: 'minmax(200px, auto)' }}>
          {(() => {
            // Agrupar asignaciones para optimizar espacio vertical
            const assignments = sortedIncompletedAssignments.map(assignment => ({
              name: assignment,
              taskCount: (incompletedByAssignment[assignment] || []).length,
              tasks: incompletedByAssignment[assignment] || []
            }));

            // Crear grupos para optimizar espacio vertical
            interface AssignmentData {
              name: string;
              taskCount: number;
              tasks: any[];
            }
            
            const groups: AssignmentData[][] = [];
            const largeAssignments: AssignmentData[] = [];
            const smallAssignments: AssignmentData[] = [];
            
            // Separar assignments grandes y pequeños
            assignments.forEach((assignment) => {
              if (assignment.taskCount >= 3) {
                largeAssignments.push(assignment);
              } else {
                smallAssignments.push(assignment);
              }
            });
            
            // Agregar assignments grandes como grupos individuales
            largeAssignments.forEach(assignment => {
              groups.push([assignment]);
            });
            
            // Agrupar assignments pequeños eficientemente
            if (smallAssignments.length > 0) {
              // Comportamiento diferente según el tamaño de pantalla
              if (screenSize === 'lg') {
                // En pantallas grandes: grupos de máximo 2 assignments
                const remainingSmall = [...smallAssignments];
                while (remainingSmall.length > 0) {
                  const chunk = remainingSmall.splice(0, Math.min(2, remainingSmall.length));
                  groups.push(chunk);
                }
              } else if (screenSize === 'md') {
                // En tablet: grupos de máximo 4 assignments juntos
                if (smallAssignments.length <= 4) {
                  // Si son 4 o menos, ponerlos todos juntos
                  groups.push(smallAssignments);
                } else {
                  // Si son más de 4, distribuirlos en grupos de máximo 4
                  const remainingSmall = [...smallAssignments];
                  while (remainingSmall.length > 0) {
                    const chunk = remainingSmall.splice(0, Math.min(4, remainingSmall.length));
                    groups.push(chunk);
                  }
                }
              } else {
                // En mobile: grupos de máximo 2 assignments
                const remainingSmall = [...smallAssignments];
                while (remainingSmall.length > 0) {
                  const chunk = remainingSmall.splice(0, Math.min(2, remainingSmall.length));
                  groups.push(chunk);
                }
              }
            }

            return groups.map((group, groupIndex) => {
              // Si solo hay un assignment, mostrarlo ocupando todo el ancho
              if (sortedIncompletedAssignments.length === 1 && groupIndex === 0 && group[0]) {
                const assignment = group[0];
                return (
                  <div key={assignment.name} className="col-span-full bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-4 border-2 border-[var(--border-primary)] shadow-sm">
                    <SortableColumn
                      id={assignment.name}
                      assignment={assignment.name}
                      tasks={assignment.tasks}
                      pinned={activeWorkspace ? currentWorkspacePins[assignment.name] === true : false}
                      onTogglePin={() => handleTogglePin(assignment.name)}
                      onAddTask={() => handleAddTask(assignment.name)}
                      onTaskToggle={handleToggleCompletion}
                      onTaskDelete={handleConfirmDeleteTask}
                      onEditTask={handleEditTask}
                      onTaskContextMenu={handleTaskContextMenu}
                      onSortClick={handleSortClick}
                      columnMenu={columnMenu?.assignmentId === assignment.name ? columnMenu : null}
                      onCloseColumnMenu={handleCloseColumnMenu}
                      onMoveToWorkspace={handleMoveToWorkspace}
                      onDeleteAssignment={() => {
                        setAssignmentToDelete(assignment.name);
                        setShowDeleteAssignmentModal(true);
                      }}
                      onUpdateAssignment={handleUpdateAssignment}
                    />
                  </div>
                );
              }

              if (group.length === 1) {
                // Una sola columna - ocupa su espacio normal
                const assignment = group[0];
                if (!assignment) return null;
                
                return (
                  <div key={assignment.name} className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-4 border-2 border-[var(--border-primary)] shadow-sm">
                    <SortableColumn
                      id={assignment.name}
                      assignment={assignment.name}
                      tasks={assignment.tasks}
                      pinned={activeWorkspace ? currentWorkspacePins[assignment.name] === true : false}
                      onTogglePin={() => handleTogglePin(assignment.name)}
                      onAddTask={() => handleAddTask(assignment.name)}
                      onTaskToggle={handleToggleCompletion}
                      onTaskDelete={handleConfirmDeleteTask}
                      onEditTask={handleEditTask}
                      onTaskContextMenu={handleTaskContextMenu}
                      onSortClick={handleSortClick}
                      columnMenu={columnMenu?.assignmentId === assignment.name ? columnMenu : null}
                      onCloseColumnMenu={handleCloseColumnMenu}
                      onMoveToWorkspace={handleMoveToWorkspace}
                      onDeleteAssignment={() => {
                        setAssignmentToDelete(assignment.name);
                        setShowDeleteAssignmentModal(true);
                      }}
                      onUpdateAssignment={handleUpdateAssignment}
                    />
                  </div>
                );
              } else {
                // Dos columnas apiladas verticalmente
                return (
                  <div key={`stack-${groupIndex}`} className="flex flex-col gap-4">
                    {group.map((assignment) => {
                      if (!assignment) return null;
                      return (
                        <div key={assignment.name} className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-4 border-2 border-[var(--border-primary)] shadow-sm flex-1">
                          <SortableColumn
                            id={assignment.name}
                            assignment={assignment.name}
                            tasks={assignment.tasks}
                            pinned={activeWorkspace ? currentWorkspacePins[assignment.name] === true : false}
                            onTogglePin={() => handleTogglePin(assignment.name)}
                            onAddTask={() => handleAddTask(assignment.name)}
                            onTaskToggle={handleToggleCompletion}
                            onTaskDelete={handleConfirmDeleteTask}
                            onEditTask={handleEditTask}
                            onTaskContextMenu={handleTaskContextMenu}
                            onSortClick={handleSortClick}
                            columnMenu={columnMenu?.assignmentId === assignment.name ? columnMenu : null}
                            onCloseColumnMenu={handleCloseColumnMenu}
                            onMoveToWorkspace={handleMoveToWorkspace}
                            onDeleteAssignment={() => {
                              setAssignmentToDelete(assignment.name);
                              setShowDeleteAssignmentModal(true);
                            }}
                            onUpdateAssignment={handleUpdateAssignment}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              }
            });
          })()}
          </div>
        </div>

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
          onSetTaskStatus={handleUpdateTask}
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
  );
}; 