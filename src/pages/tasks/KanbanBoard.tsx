import { useCallback, useEffect, useMemo, useState } from 'react';

import { AssignmentColumns } from '@/pages/tasks/AssignmentColumns';
import { ClipboardCheck } from 'lucide-react';
import { CompletedTasksSection } from '@/pages/tasks/CompletedTasksSection';
// @ts-nocheck - Temporalmente deshabilitado para evitar errores de tipo masivos
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import LoginPromptModal from '@/modals/LoginPromptModal';
import React from 'react';
import { SortMenu } from '@/pages/tasks/SortMenu';
import TaskForm from '@/pages/tasks/TaskForm';
import { TaskListMenu } from '@/modals/TaskListMenu';
import TaskViewModal from '@/modals/TaskViewModal';
import WorkspaceSelectionModal from '@/modals/WorkspaceSelectionModal';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { usePinnedColumns } from '@/hooks/usePinnedColumns';
import { usePinnedColumnsActions } from '@/store/appStore';
import { useTaskBoard } from '@/hooks/useTaskBoard';

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
  const {
    isDemo,
    loginPromptOpen,
    showLoginPrompt,
    closeLoginPrompt,
  } = useDemoMode();

  // Use the custom hook for task board logic
  const {
    tasksLoading,
    activeWorkspace,
    workspaces,
    tasks,
    filteredTasks,
    completedTasks,
    incompletedTasks,
    incompletedByAssignment,
    setCurrentWorkspace,
    fetchTasksAction,
    updateTaskSuccess,
    handleToggleCompletion,
    handleUpdateTask,
    handleDeleteTask: originalHandleDeleteTask,
    handleDeleteAllCompletedTasks,
    handleDeleteAssignment,
    handleUpdateAssignment,
  } = useTaskBoard();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Supabase pinned columns hook
  const { pinnedColumns, togglePin, loading: pinsLoading } = usePinnedColumns(activeWorkspace?.id || null);
  
  const [showCompleted] = useState(false);
  // Get pinned columns for current workspace
  const currentWorkspacePins = useMemo(() => {
    // Obtener todas las asignaciones actuales y asegurar que todas tengan un estado de pineo
    const allAssignments = new Set<string>();
    filteredTasks.forEach((task: any) => {
      const assignment = task.assignment || "No assignment";
      allAssignments.add(assignment);
    });

    // Crear objeto de pinnings con el estado de Supabase o false por defecto
    const pinsWithDefaults: Record<string, boolean> = {};
    allAssignments.forEach(assignment => {
      pinsWithDefaults[assignment] = pinnedColumns[assignment] ?? false;
    });

    return pinsWithDefaults;
  }, [pinnedColumns, filteredTasks]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [showDeleteCompletedModal, setShowDeleteCompletedModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);
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
  const [workspaceChanging, setWorkspaceChanging] = useState(false);

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
      console.log('KanbanBoard - workspace changed:', activeWorkspace.id);
    }
  }, [activeWorkspace?.id]);

  // Add a small delay to ensure everything is properly loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);


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
    togglePin(assignment);
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


  const handleViewTask = (task: any) => {
    if (isDemo) {
      showLoginPrompt();
      return;
    }
    setViewingTask(task);
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

  const confirmDeleteAssignment = useCallback(() => {
    if (assignmentToDelete) {
      handleDeleteAssignment(assignmentToDelete);
      setShowDeleteAssignmentModal(false);
      setAssignmentToDelete(null);
    }
  }, [assignmentToDelete, handleDeleteAssignment]);

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

  // Show loading when tasks are loading or workspace is changing
  if (tasksLoading || workspaceChanging) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[40vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading tasks...</p>
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
        <AssignmentColumns
          assignments={sortedIncompletedAssignments}
          incompletedByAssignment={incompletedByAssignment}
          currentWorkspacePins={currentWorkspacePins}
          onTogglePin={handleTogglePin}
          onAddTask={handleAddTask}
          onTaskToggle={handleToggleCompletion}
          onTaskDelete={handleConfirmDeleteTask}
          onEditTask={handleEditTask}
          onViewTask={handleViewTask}
          onTaskContextMenu={handleTaskContextMenu}
          onSortClick={handleSortClick}
          columnMenu={columnMenu}
          onCloseColumnMenu={handleCloseColumnMenu}
          onMoveToWorkspace={handleMoveToWorkspace}
          onDeleteAssignment={(assignment) => {
            setAssignmentToDelete(assignment);
            setShowDeleteAssignmentModal(true);
          }}
          onUpdateAssignment={handleUpdateAssignment}
        />

        <CompletedTasksSection
          showCompleted={showCompleted}
          completedTasks={completedTasks}
          onDeleteAllCompletedTasks={() => setShowDeleteCompletedModal(true)}
          onTaskToggle={handleToggleCompletion}
          onTaskDelete={handleConfirmDeleteTask}
          onEditTask={handleEditTask}
          onViewTask={handleViewTask}
          onTaskContextMenu={handleTaskContextMenu}
        />

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

      {/* Task View Modal */}
      {viewingTask && (
        <TaskViewModal
          isOpen={!!viewingTask}
          onClose={() => setViewingTask(null)}
          task={viewingTask}
          onEdit={(task) => {
            setViewingTask(null);
            handleEditTask(task);
          }}
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