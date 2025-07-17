import { Archive, ChevronDown, ChevronUp, ClipboardCheck, Filter, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
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
import { setActiveWorkspace } from '@/store/slices/workspaceSlice';
import { supabase } from '@/utils/supabaseClient';
import { updateTaskSuccess } from '@/store/slices/TaskSlice';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { useTaskManager } from '@/hooks/useTaskManager';

export const KanbanBoard = () => {
  const {
    user,
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

  // Debug: ver qué está pasando
  console.log('Debug KanbanBoard:', {
    totalTasks: tasks.length,
    activeWorkspace: activeWorkspace?.name,
    activeWorkspaceId: activeWorkspace?.id,
    filteredTasks: filteredTasks.length,
    tasksWithWorkspace: tasks.filter(t => t.workspace_id).length,
    tasksWithoutWorkspace: tasks.filter(t => !t.workspace_id).length
  });

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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [sortMenu, setSortMenu] = useState(null);
  const [columnMenu, setColumnMenu] = useState(null);
  const [assignmentSortConfig, setAssignmentSortConfig] = useState(() => {
    const savedConfig = localStorage.getItem('kanbanAssignmentSortConfig');
    return savedConfig ? JSON.parse(savedConfig) : {};
  });

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [showWorkspaceSelectionModal, setShowWorkspaceSelectionModal] = useState(false);

  const dispatch = useDispatch();

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

  useEffect(() => {
    if (activeWorkspace) {
      dispatch(fetchTasks());
    }
  }, [activeWorkspace, dispatch]);

  const completedTasks = filteredTasks.filter((task) => task.completed);
  const incompletedTasks = filteredTasks.filter((task) => !task.completed);

  const allAssignments = useMemo(() =>
    [...new Set(filteredTasks.map(task => task.assignment || "No assignment"))].sort(),
    [filteredTasks]
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
    return grouped;
  };

  const sortTasksByPosition = (tasksToSort, assignment) => {
    const savedOrder = taskOrder[assignment];
    if (savedOrder && savedOrder.length > 0) {
      // Create a map for quick lookup
      const taskMap = new Map(tasksToSort.map(task => [task.id, task]));

      // Sort based on saved order
      const sortedTasks = [];
      savedOrder.forEach(taskId => {
        const task = taskMap.get(taskId);
        if (task) {
          sortedTasks.push(task);
          taskMap.delete(taskId);
        }
      });

      // Add any remaining tasks that weren't in the saved order
      taskMap.forEach(task => sortedTasks.push(task));

      return sortedTasks;
    }
    return tasksToSort;
  };

  const incompletedByAssignment = useMemo(() => {
    const grouped = groupTasksByAssignment(incompletedTasks);

    // Apply sorting to each assignment
    Object.keys(grouped).forEach(assignment => {
      const sortConfig = assignmentSortConfig[assignment];
      if (sortConfig) {
        const sortedTasks = sortTasksByPosition(grouped[assignment], assignment);
        grouped[assignment] = sortedTasks;
      }
    });

    return grouped;
  }, [incompletedTasks, assignmentSortConfig, taskOrder]);

  const assignmentsWithIncompleteTasks = useMemo(() => {
    const assignments = Object.keys(incompletedByAssignment).filter(
      (assignment) => (incompletedByAssignment[assignment] && incompletedByAssignment[assignment].length > 0)
    );
    // Si tenemos un orden guardado de columnas, usarlo y agregar nuevos assignments al final
    if (columnOrder.length > 0) {
      const orderedAssignments = [...columnOrder];
      assignments.forEach(assignment => {
        if (!orderedAssignments.includes(assignment)) {
          orderedAssignments.push(assignment);
        }
      });
      // Solo devolver los assignments que tienen tareas incompletas
      return orderedAssignments.filter(a => assignments.includes(a));
    }
    return assignments;
  }, [incompletedByAssignment, columnOrder]);

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

  const handleCloseTaskForm = (newTaskId) => {
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

  const noTasks = incompletedTasks.length === 0 && completedTasks.length === 0;

  if (noTasks) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[40vh]">
        <div className="text-center">
          <ClipboardCheck className="mx-auto mb-4 w-10 h-10 text-[var(--accent-primary)]" />
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            No Tasks Yet
          </h3>
          <p className="text-base text-[var(--text-secondary)] mb-1">
            Create your first task to get started
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
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-2 h-full">
        {assignmentsWithIncompleteTasks.map((assignment, idx) => (
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
            />
          </div>
        ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              const tasksInAssignment = incompletedByAssignment[selectedAssignment] || [];

              // Actualización optimista: actualiza el estado de Redux localmente
              tasksInAssignment.forEach(task => {
                dispatch(updateTaskSuccess({ ...task, workspace_id: workspace.id }));
              });

              if (tasksInAssignment.length > 0) {
                // Actualizar el workspace_id de todas las tareas del assignment en la base de datos
                const { data, error } = await supabase
                  .from('tasks')
                  .update({ workspace_id: workspace.id })
                  .in('id', tasksInAssignment.map(task => task.id));

                if (error) {
                  console.error('Error moving tasks to workspace:', error);
                  return;
                }

                console.log(`Successfully moved ${tasksInAssignment.length} tasks from assignment "${selectedAssignment}" to workspace "${workspace.name}"`);
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
    </div>
  );
}; 