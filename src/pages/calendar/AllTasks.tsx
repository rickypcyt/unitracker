import { useEffect, useState } from "react";

import { AssignmentSortMenu } from "@/components/AssignmentSortMenu";
import { CheckCircle2 } from "lucide-react";
import { Task } from "@/types/taskStorage";
import TaskForm from "@/pages/tasks/TaskForm";
import { TaskItem } from "@/pages/tasks/TaskItem";
import { TaskListMenu } from "@/modals/TaskListMenu";
import { useTaskManager } from "@/hooks/useTaskManager";

type SortOption = 'name-asc' | 'name-desc' | 'count-asc' | 'count-desc';

interface ContextMenuState {
  x: number;
  y: number;
  task: Task;
}

interface AllTasksProps {
  filteredTasks?: Task[];
  title?: string;
  showCompleted?: boolean; // Add prop to control whether to show completed tasks
  sortBy?: 'name-asc' | 'name-desc' | 'count-asc' | 'count-desc';
  hideSortMenu?: boolean;
}

const AllTasks: React.FC<AllTasksProps> = ({ filteredTasks, title, sortBy = 'count-desc', hideSortMenu = false }) => {
  const { handleToggleCompletion, handleDeleteTask } = useTaskManager(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  
  const [collapsedAssignments, setCollapsedAssignments] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`collapsedAssignments_${title || 'all'}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Load sort preference from localStorage
  const [localSortBy, setLocalSortBy] = useState<'name-asc' | 'name-desc' | 'count-asc' | 'count-desc'>(() => {
    try {
      const saved = localStorage.getItem(`taskSort_${title || 'all'}`);
      return (saved as any) || sortBy;
    } catch {
      return sortBy;
    }
  });

  // Use local sort if hideSortMenu is true, otherwise use prop
  const effectiveSortBy = hideSortMenu ? localSortBy : sortBy;

  const tasks = filteredTasks || [];

  // Save collapsed assignments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`collapsedAssignments_${title || 'all'}`, JSON.stringify(Array.from(collapsedAssignments)));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [collapsedAssignments, title]);

  // Save sort preference to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(`assignmentSort_${title || 'all'}`, sortBy);
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [sortBy, title]);

  useEffect(() => {
    // Tasks are managed by Zustand store
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group tasks by assignment (only non-completed tasks)
  const tasksByAssignment = tasks
    .filter(task => !task.completed)
    .reduce((groups: { [key: string]: Task[] }, task: Task) => {
      const assignment = task.assignment || 'No Assignment';
      if (!groups[assignment]) {
        groups[assignment] = [];
      }
      groups[assignment].push(task);
      return groups;
    }, {});

  // Sort assignments based on selected option
  const sortedAssignments = Object.keys(tasksByAssignment).sort((a, b) => {
    switch (effectiveSortBy) {
      case 'name-asc':
        return a.localeCompare(b);
      case 'name-desc':
        return b.localeCompare(a);
      case 'count-asc':
        return (tasksByAssignment[a]?.length || 0) - (tasksByAssignment[b]?.length || 0);
      case 'count-desc':
      default:
        return (tasksByAssignment[b]?.length || 0) - (tasksByAssignment[a]?.length || 0);
    }
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  // Wrapper para handleToggleCompletion - firma (id: string) => void
  const handleToggleCompletionWrapper = (id: string) => {
    handleToggleCompletion(id);
  };

  // Wrapper para handleDeleteTask - firma (id: string) => void
  const handleDeleteTaskWrapper = (id: string) => {
    handleDeleteTask(id);
  };

  const handleTaskContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    task: Task
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
    });
  };

  // Wrapper para compatibilidad con TaskItem
  const handleTaskContextMenuWrapper = (e: React.MouseEvent, task: Task) => {
    handleTaskContextMenu(e as React.MouseEvent<HTMLDivElement>, task);
  };

  // Función para colapsar/expandir un assignment
  const toggleAssignmentCollapse = (assignment: string) => {
    setCollapsedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignment)) {
        newSet.delete(assignment);
      } else {
        newSet.add(assignment);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full h-full">
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        {!hideSortMenu && (
          <div className="flex items-center justify-between p-3 border-[var(--border-primary)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {title || "All Tasks"}
            </h3>
            <AssignmentSortMenu 
              currentSort={effectiveSortBy} 
              onSortChange={hideSortMenu ? setLocalSortBy : () => {}} 
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-0 py-2 space-y-2">
          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2
                  size={32}
                  className="text-[var(--text-secondary)]"
                />
              </div>
              <p className="text-[var(--text-secondary)] text-sm font-medium">
                No tasks found
              </p>
              <p className="text-[var(--text-secondary)]/60 text-xs mt-2">
                Try selecting a different filter or create a new task
              </p>
            </div>
          )}

          {/* Tasks grouped by assignment */}
          {sortedAssignments.map((assignment) => {
            const isAssignmentCollapsed = collapsedAssignments.has(assignment);
            return (
            <div key={assignment}>
              {/* Assignment Container */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
                {/* Assignment Header - Clickable */}
                <div 
                  className={`px-4 py-3 border-l-4 cursor-pointer transition-all duration-200 ${
                    isAssignmentCollapsed 
                      ? 'bg-gradient-to-r from-gray-500/10 to-gray-500/5 border-l-4 border-gray-500' 
                      : 'bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 border-l-4 border-[var(--accent-primary)]'
                  }`}
                  onClick={() => toggleAssignmentCollapse(assignment)}
                >
                  <h4 className={`text-base font-bold transition-colors duration-200 ${
                    isAssignmentCollapsed ? 'text-gray-500' : 'text-[var(--accent-primary)]'
                  }`}>
                    {assignment}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {tasksByAssignment[assignment]?.length || 0} task{(tasksByAssignment[assignment]?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {/* Tasks Container - Hidden when collapsed */}
                {!isAssignmentCollapsed && (
                  <div className="bg-[var(--bg-secondary)]/30 p-2 space-y-1 max-h-48 overflow-y-auto">
                    {tasksByAssignment[assignment]?.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleCompletion={handleToggleCompletionWrapper}
                        onDelete={handleDeleteTaskWrapper}
                        onEditTask={() => handleEditTask(task)}
                        onContextMenu={handleTaskContextMenuWrapper}
                        showAssignment={false} // Hide assignment since we're grouping by it
                        assignmentLeftOfDate={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && editingTask && (
        <TaskForm
          initialTask={editingTask}
          onClose={handleCloseTaskForm}
          onTaskCreated={handleCloseTaskForm}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <TaskListMenu
          contextMenu={{
            type: "task",
            x: contextMenu.x,
            y: contextMenu.y,
            task: contextMenu.task,
          }}
          onClose={() => setContextMenu(null)}
          onEditTask={() => {
            handleEditTask(contextMenu.task);
            setContextMenu(null);
          }}
          onDeleteTask={() => {
            handleDeleteTask(contextMenu.task.id);
            setContextMenu(null);
          }}
          onSetTaskStatus={() => {}}
        />
      )}
    </div>
  );
};

export default AllTasks;
