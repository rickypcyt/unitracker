import { useEffect, useState } from "react";
import { AssignmentSortMenu } from "@/components/AssignmentSortMenu";
import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { QuickDatePicker } from "@/modals/QuickDatePicker";
import RecurringTasksToggle from "@/pages/calendar/RecurringTasksToggle";
import { Task } from "@/types/taskStorage";
import TaskFilter from "@/pages/calendar/TaskFilter";
import TaskForm from "@/pages/tasks/TaskForm";
import { TaskItem } from "@/pages/tasks/TaskItem";
import { TaskListMenu } from "@/modals/TaskListMenu";
import WorkspaceSelector from "@/pages/calendar/WorkspaceSelector";
import { useTaskManager } from "@/hooks/useTaskManager";

interface ContextMenuState {
  x: number;
  y: number;
  task: Task;
}

interface AllTasksProps {
  filteredTasks?: Task[];
  title?: string;
  showCompleted?: boolean;
  sortBy?: "name-asc" | "name-desc" | "count-asc" | "count-desc";
  hideSortMenu?: boolean;
  allTasks?: Task[];
  onFilteredTasksChange?: (tasks: Task[]) => void;
  selectedFilter?: string;
  onFilterChange?: (filter: string) => void;
  onSortChange?: (
    sort: "name-asc" | "name-desc" | "count-asc" | "count-desc"
  ) => void;
  sidebarRight?: boolean;
  onToggleSidebar?: () => void;
}

const AllTasks: React.FC<AllTasksProps> = ({
  filteredTasks,
  title,
  sortBy = "count-desc",
  hideSortMenu = false,
  allTasks,
  onFilteredTasksChange,
  selectedFilter,
  onFilterChange,
  onSortChange,
  sidebarRight,
  onToggleSidebar,
}) => {
  const { handleToggleCompletion, handleDeleteTask, handleUpdateTask } =
    useTaskManager(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [quickDateTask, setQuickDateTask] = useState<Task | null>(null);

  const [collapsedAssignments, setCollapsedAssignments] = useState<Set<string>>(
    () => {
      try {
        const saved = localStorage.getItem(
          `collapsedAssignments_${title || "all"}`
        );
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch {
        return new Set();
      }
    }
  );

  const [localSortBy, setLocalSortBy] = useState<
    "name-asc" | "name-desc" | "count-asc" | "count-desc"
  >(() => {
    try {
      const saved = localStorage.getItem(`taskSort_${title || "all"}`);
      return (saved as any) || sortBy;
    } catch {
      return sortBy;
    }
  });

  const effectiveSortBy = hideSortMenu ? localSortBy : sortBy;
  const tasks = filteredTasks || [];

  useEffect(() => {
    try {
      localStorage.setItem(
        `collapsedAssignments_${title || "all"}`,
        JSON.stringify(Array.from(collapsedAssignments))
      );
    } catch {
      // Silently fail
    }
  }, [collapsedAssignments, title]);

  useEffect(() => {
    try {
      localStorage.setItem(`taskSort_${title || "all"}`, effectiveSortBy);
    } catch {
      // Silently fail
    }
  }, [effectiveSortBy, title]);

  // Group tasks by assignment (only non-completed), sorted by deadline
  const tasksByAssignment = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => {
      const aDate = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bDate = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return aDate - bDate;
    })
    .reduce((groups: { [key: string]: Task[] }, task: Task) => {
      const assignment = task.assignment || "No Assignment";
      if (!groups[assignment]) groups[assignment] = [];
      groups[assignment].push(task);
      return groups;
    }, {});

  const sortedAssignments = Object.keys(tasksByAssignment).sort((a, b) => {
    switch (effectiveSortBy) {
      case "name-asc":
        return a.localeCompare(b);
      case "name-desc":
        return b.localeCompare(a);
      case "count-asc":
        return (
          (tasksByAssignment[a]?.length || 0) -
          (tasksByAssignment[b]?.length || 0)
        );
      case "count-desc":
      default:
        return (
          (tasksByAssignment[b]?.length || 0) -
          (tasksByAssignment[a]?.length || 0)
        );
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

  const handleSetDate = (task: Task, position: { x: number; y: number }) => {
    setQuickDateTask({ ...task, position } as any);
  };

  const handleQuickDateSave = (updatedTask: Task) => {
    handleUpdateTask(updatedTask);
    setQuickDateTask(null);
  };

  const handleToggleCompletionWrapper = (id: string) => {
    handleToggleCompletion(id);
  };

  const handleDeleteTaskWrapper = (id: string) => {
    handleDeleteTask(id);
  };

  const handleTaskContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    task: Task
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, task });
  };

  const handleTaskContextMenuWrapper = (
    e: React.MouseEvent,
    task: Task
  ) => {
    handleTaskContextMenu(e as React.MouseEvent<HTMLDivElement>, task);
  };

  const toggleAssignmentCollapse = (assignment: string) => {
    setCollapsedAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(assignment)) next.delete(assignment);
      else next.add(assignment);
      return next;
    });
  };

  return (
    <div className="w-full h-full">
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        {!hideSortMenu && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]/50 bg-[var(--bg-primary)]">
            <h3 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
              {title || "All Tasks"}
            </h3>
            <div className="flex items-center gap-2">
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-secondary)]/60"
                  title={
                    sidebarRight ? "Move panel to left" : "Move panel to right"
                  }
                >
                  {sidebarRight ? "← Left" : "Right →"}
                </button>
              )}
              <AssignmentSortMenu
                currentSort={effectiveSortBy}
                onSortChange={
                  onSortChange || (hideSortMenu ? setLocalSortBy : () => {})
                }
              />
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="px-3 pt-3 space-y-2">
          {allTasks && (
            <div className="w-full">
              <WorkspaceSelector />
            </div>
          )}

          {allTasks && onFilteredTasksChange && selectedFilter && (
            <div className="w-full">
              <TaskFilter
                tasks={allTasks}
                onFilteredTasksChange={onFilteredTasksChange}
                selectedFilter={selectedFilter}
                onFilterChange={onFilterChange || (() => {})}
              />
            </div>
          )}

          <div className="w-full">
            <RecurringTasksToggle />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)]/80 flex items-center justify-center mb-4">
                <CheckCircle2
                  size={28}
                  className="text-[var(--text-secondary)]/70"
                />
              </div>
              <p className="text-[var(--text-primary)] text-sm font-medium">
                No tasks found
              </p>
              <p className="text-[var(--text-secondary)] text-xs mt-1.5 max-w-[220px]">
                Try a different filter or create a new task
              </p>
            </div>
          )}

          {/* Groups */}
          {sortedAssignments.map((assignment) => {
            const isCollapsed = collapsedAssignments.has(assignment);
            const count = tasksByAssignment[assignment]?.length || 0;

            return (
              <div
                key={assignment}
                className="rounded-xl border-2 border-[var(--border-primary)]/50 bg-[var(--bg-primary)] overflow-hidden"
              >
                {/* Assignment header */}
                <button
                  type="button"
                  onClick={() => toggleAssignmentCollapse(assignment)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-[var(--bg-secondary)]/40 transition-colors duration-150"
                >
                  <span className="text-[var(--text-secondary)] shrink-0">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isCollapsed
                            ? "text-[var(--text-secondary)]"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {assignment}
                      </h4>
                      <span className="shrink-0 text-[11px] font-medium tabular-nums text-[var(--text-secondary)] bg-[var(--bg-secondary)]/80 px-1.5 py-0.5 rounded-md">
                        {count}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Tasks */}
                {!isCollapsed && (
                  <div className="border-t border-[var(--border-primary)]/40 px-2 py-1.5 space-y-0.5">
                    {tasksByAssignment[assignment]?.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleCompletion={handleToggleCompletionWrapper}
                        onDelete={handleDeleteTaskWrapper}
                        onEditTask={() => handleEditTask(task)}
                        onContextMenu={handleTaskContextMenuWrapper}
                        showAssignment={false}
                        assignmentLeftOfDate={false}
                      />
                    ))}
                  </div>
                )}
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
          onSetDate={handleSetDate}
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
    </div>
  );
};

export default AllTasks;