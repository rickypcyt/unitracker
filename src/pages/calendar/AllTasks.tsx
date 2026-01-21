import { CheckCircle2, ChevronFirst, ChevronLast } from "lucide-react";
import { useEffect, useState } from "react";

import { Task } from "@/types/taskStorage";
import TaskForm from "@/pages/tasks/TaskForm";
import { TaskItem } from "@/pages/tasks/TaskItem";
import { TaskListMenu } from "@/modals/TaskListMenu";
import { useTaskManager } from "@/hooks/useTaskManager";

interface ContextMenuState {
  x: number;
  y: number;
  task: Task;
}

interface AllTasksProps {
  filteredTasks?: Task[];
  title?: string;
}

const AllTasks: React.FC<AllTasksProps> = ({ filteredTasks, title }) => {
  const { handleToggleCompletion, handleDeleteTask } = useTaskManager(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tasks = filteredTasks || [];

  useEffect(() => {
    // Tasks are managed by Zustand store
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter and sort all tasks
  const allTasks = [...tasks].sort((a, b) => {
    const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
    const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
    return dateA - dateB;
  });

  // Past tasks: deadline < today and not completed (only if deadline exists)
  const pastTasks = allTasks.filter((task) => {
    if (!task.deadline || task.deadline === "" || task.deadline === null)
      return false;
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today && !task.completed;
  });

  // Upcoming tasks
  const upcomingTasks = allTasks.filter((task) => {
    if (!task.deadline || task.deadline === "" || task.deadline === null)
      return false;
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate >= today && !task.completed;
  });

  // Group upcoming tasks by time periods
  const todayTasks = upcomingTasks.filter((task) => {
    if (!task.deadline) return false;
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === today.toDateString();
  });

  // This month tasks (excluding today)
  const thisMonthTasks = upcomingTasks.filter((task) => {
    if (!task.deadline) return false;
    const taskDate = new Date(task.deadline);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return (
      taskDate.getMonth() === currentMonth &&
      taskDate.getFullYear() === currentYear &&
      taskDate.toDateString() !== today.toDateString()
    );
  });

  // Next month tasks
  const nextMonthTasks = upcomingTasks.filter((task) => {
    if (!task.deadline) return false;
    const taskDate = new Date(task.deadline);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return (
      taskDate.getMonth() === nextMonth && taskDate.getFullYear() === nextYear
    );
  });

  // Future tasks (beyond next month)
  const futureTasks = upcomingTasks.filter((task) => {
    if (!task.deadline) return false;
    const taskDate = new Date(task.deadline);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return (
      taskDate.getFullYear() > nextYear ||
      (taskDate.getFullYear() === nextYear && taskDate.getMonth() > nextMonth)
    );
  });

  // Tasks without deadlines
  const noDeadlineTasks = allTasks.filter(
    (task) => !task.deadline || task.deadline === "" || task.deadline === null
  );

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
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
  const handleTaskContextMenuWrapper = (e: any, task: Task) => {
    handleTaskContextMenu(e, task);
  };

  return (
    <div
      className={`w-full h-full transition-all duration-300 ${
        isCollapsed ? "w-12" : "w-full"
      }`}
    >
      <div
        className={`relative w-full h-full calendar-view flex flex-col border-0 lg:min-h-[400px] ${
          isCollapsed ? "lg:min-w-[48px]" : "lg:mr-4 lg:min-w-[300px] lg:ml-4"
        } overflow-y-auto ${
          isCollapsed ? "border-r border-[var(--border-primary)]" : ""
        }`}
      >
        {/* Collapsible Header */}
        <div
          className="flex items-center justify-between p-3 border-[var(--border-primary)] cursor-pointer hover:bg-[var(--bg-secondary)]/30 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {!isCollapsed && (
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {title || "All Tasks"}
            </h3>
          )}
          {isCollapsed ? (
            <div className="w-full flex justify-center">
              <ChevronLast size={24} className="text-[var(--accent-primary)]" />
            </div>
          ) : (
            <ChevronFirst size={24} className="text-[var(--accent-primary)]" />
          )}
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="p-0 space-y-2 md:space-y-0 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-x-4">
            {/* Empty State */}
            {allTasks.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
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

            {/* Today's Tasks */}
            {todayTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleDeleteTask}
                onEditTask={() => handleEditTask(task)}
                onContextMenu={handleTaskContextMenuWrapper}
                showAssignment={true}
                assignmentLeftOfDate={true}
              />
            ))}

            {/* This Month */}
            {thisMonthTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleDeleteTask}
                onEditTask={() => handleEditTask(task)}
                onContextMenu={handleTaskContextMenuWrapper}
                showAssignment={true}
                assignmentLeftOfDate={true}
              />
            ))}

            {/* Next Month */}
            {nextMonthTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleDeleteTask}
                onEditTask={() => handleEditTask(task)}
                onContextMenu={handleTaskContextMenuWrapper}
                showAssignment={true}
                assignmentLeftOfDate={true}
              />
            ))}

            {/* Future */}
            {futureTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleDeleteTask}
                onEditTask={() => handleEditTask(task)}
                onContextMenu={handleTaskContextMenuWrapper}
                showAssignment={true}
                assignmentLeftOfDate={true}
              />
            ))}

            {/* Past Due */}
            {pastTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleDeleteTask}
                onEditTask={() => handleEditTask(task)}
                onContextMenu={handleTaskContextMenuWrapper}
                showAssignment={true}
                assignmentLeftOfDate={true}
              />
            ))}

            {/* No Deadline */}
            {noDeadlineTasks
              .filter((task) => !task.completed)
              .map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleCompletion={handleToggleCompletion}
                  onDelete={handleDeleteTask}
                  onEditTask={() => handleEditTask(task)}
                  onContextMenu={handleTaskContextMenuWrapper}
                  showAssignment={true}
                  assignmentLeftOfDate={true}
                />
              ))}
          </div>
        )}
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
