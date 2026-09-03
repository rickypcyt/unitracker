import { ALL_WORKSPACE_ID, useTaskBoard } from '@/hooks/useTaskBoard';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { AssignmentColumns } from '@/pages/tasks/AssignmentColumns';
import type { ColumnCount } from '@/modals/TaskPageSettingsModal';
import type { ViewMode } from '@/modals/TaskPageSettingsModal';
import { CompletedTasksSection } from '@/pages/tasks/CompletedTasksSection';
import { StatusBoard } from '@/pages/tasks/StatusBoard';
// @ts-nocheck - Temporalmente deshabilitado para evitar errores de tipo masivos
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import LoginPromptModal from '@/modals/LoginPromptModal';
import { QuickDatePicker } from '@/modals/QuickDatePicker';
import React from 'react';
import { SortMenu } from '@/pages/tasks/SortMenu';
import TaskFormManager from '@/pages/tasks/TaskFormManager';
import { TaskListMenu } from '@/modals/TaskListMenu';
import TaskViewModal from '@/modals/TaskViewModal';
import WorkspaceSelectionModal from '@/modals/WorkspaceSelectionModal';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { usePinnedColumns } from '@/hooks/usePinnedColumns';

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

interface KanbanBoardProps {
  columnCount?: ColumnCount;
  viewMode?: ViewMode;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ columnCount = 1, viewMode = 'assignment' }) => {
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
    fetchTasksAction,
    handleToggleCompletion,
    handleUpdateTask,
    handleDeleteTask: originalHandleDeleteTask,
    handleDeleteAllCompletedTasks,
    handleDeleteAssignment,
    handleUpdateAssignment,
  } = useTaskBoard();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Supabase pinned columns hook
  const { pinnedColumns, togglePin } = usePinnedColumns(activeWorkspace?.id || null);
  
  const [showCompleted, setShowCompleted] = useState(false);
  // Get pinned columns for current workspace
  const currentWorkspacePins = useMemo(() => {
    // Obtener todas las asignaciones actuales y asegurar que todas tengan un estado de pineo
    const allAssignments = new Set<string>();
    filteredTasks.forEach((task: any) => {
      const assignment = task.assignment || "No assignment";
      allAssignments.add(assignment);
    });

    // Add pinned assignments that might not have tasks
    Object.keys(pinnedColumns).forEach(assignment => {
      if (pinnedColumns[assignment]) {
        allAssignments.add(assignment);
      }
    });

    // Crear objeto de pinnings con el estado de Supabase o false por defecto
    const pinsWithDefaults: Record<string, boolean> = {};
    allAssignments.forEach(assignment => {
      pinsWithDefaults[assignment] = pinnedColumns[assignment] ?? false;
    });

    return pinsWithDefaults;
  }, [pinnedColumns, filteredTasks]);

  // Create a modified incompletedByAssignment for "All" workspace
  const incompletedByAssignmentForAll = useMemo(() => {
    if (activeWorkspace?.id === ALL_WORKSPACE_ID) {
      // When "All" workspace is selected, group all tasks by assignment
      const grouped: Record<string, any[]> = {};
      incompletedTasks.forEach((task: any) => {
        const assignment = task.assignment || "No assignment";
        if (!grouped[assignment]) grouped[assignment] = [];
        grouped[assignment].push(task);
      });
      return grouped;
    }
    return incompletedByAssignment;
  }, [activeWorkspace?.id, incompletedTasks, incompletedByAssignment]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [showDeleteCompletedModal, setShowDeleteCompletedModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);
  const [showDeleteTaskConfirmation, setShowDeleteTaskConfirmation] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [focusOnDate, setFocusOnDate] = useState(false);
  const [quickDateTask, setQuickDateTask] = useState<any>(null);
  const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

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
  const [workspaceChanging] = useState(false);

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

  const handleTogglePin = (assignment: string) => {
    togglePin(assignment);
  };

// ...
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

  const handleSetDate = (task: any, position: { x: number; y: number }) => {
    if (isDemo) {
      showLoginPrompt();
      return;
    }
    setQuickDateTask({ ...task, position });
  };

  const handleQuickDateSave = (updatedTask: any) => {
    // Update the task using the existing handleUpdateTask function
    handleUpdateTask(updatedTask);
    setQuickDateTask(null);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setSelectedAssignment(null);
    setEditingTask(null);
    setFocusOnDate(false);
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

  const handleAssignmentDoubleClick = (assignment: string) => {
    handleAddTask(assignment);
  };

  const confirmDeleteAssignment = useCallback(() => {
    if (assignmentToDelete) {
      handleDeleteAssignment(assignmentToDelete);
      setShowDeleteAssignmentModal(false);
      setAssignmentToDelete(null);
    }
  }, [assignmentToDelete, handleDeleteAssignment]);

  // Compute completed count per assignment for progress bars
  const completedByAssignment = useMemo(() => {
    const grouped: Record<string, number> = {};
    completedTasks.forEach((task: any) => {
      const assignment = task.assignment || "No assignment";
      grouped[assignment] = (grouped[assignment] || 0) + 1;
    });
    return grouped;
  }, [completedTasks]);

  const noTasks = incompletedTasks.length === 0 && completedTasks.length === 0;

  // Don't show anything until workspace is properly loaded and validated


  // Show message when no workspaces are available at all
  if (!activeWorkspace && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[40vh]">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <ClipboardCheck className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            No Workspaces Available
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Create your first workspace to start organizing your tasks.
          </p>
          {isLoggedIn ? (
            <button
              onClick={() => window.dispatchEvent(new Event('openWorkspaceModal'))}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus size={18} />
              Create your first workspace
            </button>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] opacity-70">
              Remember to login first
            </p>
          )}
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
      <div className="px-4 py-6 space-y-4">
        {/* Skeleton columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-[var(--bg-secondary)] rounded-lg border-2 border-[var(--border-primary)] p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-4 rounded bg-[var(--bg-primary)] animate-pulse" />
                <div className="h-4 w-24 rounded bg-[var(--bg-primary)] animate-pulse" />
                <div className="h-3 w-12 rounded bg-[var(--bg-primary)] animate-pulse" />
              </div>
              <div className="h-1 w-full rounded-full bg-[var(--bg-primary)] animate-pulse mb-3" />
              {[0, 1].map(j => (
                <div key={j} className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-primary)] mb-2">
                  <div className="h-4 w-4 rounded-full bg-[var(--bg-primary)] animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-[var(--bg-secondary)] animate-pulse" />
                    <div className="h-2 w-1/2 rounded bg-[var(--bg-secondary)] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (noTasks) {
    return (
      <div data-tour="tasks-board" className="flex items-center justify-center py-12 min-h-[40vh]">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <ClipboardCheck className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {activeWorkspace ? `No tasks in "${activeWorkspace.name}"` : 'No Tasks Yet'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {activeWorkspace ? 'Create your first task in this workspace to get started.' : 'Create your first task to get started.'}
          </p>
          {isLoggedIn ? (
            <button
              onClick={() => handleAddTask(null)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent text-sm font-medium hover:bg-[var(--accent-primary)]/10 active:scale-95 transition-all"
            >
              <Plus size={18} />
              Create your first task
            </button>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] opacity-70">
              Remember to login first
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full min-h-screen kanban-board" data-tour="tasks-board">
        {/* Active Tasks */}
        <div className="flex-1 min-h-0">
          {viewMode === 'status' ? (
            <StatusBoard
              incompletedTasks={incompletedTasks}
              completedTasks={completedTasks}
              onAddTask={handleAddTask}
              onTaskToggle={handleToggleCompletion}
              onTaskDelete={handleConfirmDeleteTask}
              onEditTask={handleEditTask}
              onViewTask={handleViewTask}
              onTaskContextMenu={handleTaskContextMenu}
            />
          ) : (
            <AssignmentColumns
            incompletedByAssignment={incompletedByAssignmentForAll}
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
            onAssignmentDoubleClick={handleAssignmentDoubleClick}
            completedByAssignment={completedByAssignment}
            columnCount={columnCount}
          >
            {completedTasks && completedTasks.length > 0 && (
              <CompletedTasksSection
                showCompleted={showCompleted}
                onToggleShowCompleted={() => setShowCompleted(prev => !prev)}
                completedTasks={completedTasks}
                onDeleteAllCompletedTasks={() => setShowDeleteCompletedModal(true)}
                onTaskToggle={handleToggleCompletion}
                onTaskDelete={handleConfirmDeleteTask}
                onEditTask={handleEditTask}
                onViewTask={handleViewTask}
                onTaskContextMenu={handleTaskContextMenu}
              />
            )}
          </AssignmentColumns>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <TaskListMenu
          contextMenu={contextMenu}
          onClose={handleCloseContextMenu}
          onEditTask={handleEditTask}
          onSetTaskStatus={handleUpdateTask}
          onDeleteTask={handleConfirmDeleteTask}
          onSetDate={handleSetDate}
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
        <TaskFormManager
          onClose={handleCloseTaskForm}
          initialAssignment={selectedAssignment}
          initialTask={editingTask}
          focusOnDate={focusOnDate}
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
              if (tasksInAssignment.length > 0) {
                // Task workspace updated
              }

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

      {/* Quick Date Picker */}
      {quickDateTask && (
        <QuickDatePicker
          task={quickDateTask}
          onClose={() => setQuickDateTask(null)}
          onSave={handleQuickDateSave}
        />
      )}
    </>
  );
};