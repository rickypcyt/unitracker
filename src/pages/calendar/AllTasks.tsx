import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Task } from "@/types/taskStorage";
import TaskForm from "@/pages/tasks/TaskForm";
import { TaskItem } from "@/pages/tasks/TaskItem";
import { TaskListMenu } from "@/modals/TaskListMenu";
import { useAppStore } from "@/store/appStore";
import useDemoMode from "@/utils/useDemoMode";
import { useTaskManager } from "@/hooks/useTaskManager";

type ExpandedGroups = {
  today: boolean;
  thisMonth: boolean;
  nextMonth: boolean;
  future: boolean;
  past: boolean;
  noDeadline: boolean;
};

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  groupKey: keyof ExpandedGroups;
  icon?: React.ReactNode;
}

interface ContextMenuState {
  x: number;
  y: number;
  task: Task;
}

interface AllTasksProps {
  calendarSize?: string;
}

const AllTasks: React.FC<AllTasksProps> = ({ calendarSize = "lg" }) => {
  const { handleToggleCompletion, handleDeleteTask } = useTaskManager();
  const realTasks = useAppStore((state) => state.tasks.tasks);
  const { isDemo, demoTasks } = useDemoMode();
  const tasks = isDemo ? demoTasks : realTasks;
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<ExpandedGroups>({
    today: true,
    thisMonth: true,
    nextMonth: true,
    future: false,
    past: false, // Past tasks collapsed by default
    noDeadline: true,
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

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
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === today.toDateString();
  });

  // This month tasks (excluding today)
  const thisMonthTasks = upcomingTasks.filter((task) => {
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
    const taskDate = new Date(task.deadline);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return (
      taskDate.getMonth() === nextMonth &&
      taskDate.getFullYear() === nextYear
    );
  });

  // Future tasks (beyond next month)
  const futureTasks = upcomingTasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return (
      (taskDate.getFullYear() > nextYear) ||
      (taskDate.getFullYear() === nextYear && taskDate.getMonth() > nextMonth)
    );
  });

  // Tasks without deadlines
  const noDeadlineTasks = allTasks.filter(
    (task) => !task.deadline || task.deadline === "" || task.deadline === null
  );

  const toggleGroup = (group: keyof ExpandedGroups) => {
    setExpandedGroups(
      (prev) =>
        ({
          ...prev,
          [group]: !prev[group],
        } as ExpandedGroups)
    );
  };

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

  const TaskGroup = ({
    title,
    tasks,
    groupKey,
    icon = null,
  }: TaskGroupProps) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-4">
        <button
          className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-lg p-3 hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-between"
          onClick={() => toggleGroup(groupKey)}
          aria-expanded={expandedGroups[groupKey]}
        >
          <div className="flex items-center gap-2">
            {icon || (
              <Calendar size={18} className="text-[var(--accent-primary)]" />
            )}
            <span className="text-[var(--text-primary)] font-medium">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] text-sm">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </span>
            {expandedGroups[groupKey] ? (
              <ChevronUp size={20} className="text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown size={20} className="text-[var(--text-secondary)]" />
            )}
          </div>
        </button>

        {expandedGroups[groupKey] && (
          <div className="mt-3 space-y-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleDeleteTask}
                onEditTask={() => handleEditTask(task)}
                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => handleTaskContextMenu(e, task)}
                showAssignment={true}
                assignmentLeftOfDate={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      <div 
        className={`maincard relative mx-auto w-full transition-all duration-300 calendar-view flex flex-col ${
          calendarSize === "xs"
            ? "max-w-xs"
            : calendarSize === "sm"
            ? "max-w-sm"
            : calendarSize === "md"
            ? "max-w-lg"
            : calendarSize === "lg"
            ? "max-w-2xl"
            : "max-w-4xl"
        }`}
        style={{ aspectRatio: '6/5' }}
      >
        <div className="w-full text-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
            Pending Tasks
          </h2>
        </div>

        <div className="p-2 space-y-4">
          {/* Today's Tasks */}
          <TaskGroup title="Today" tasks={todayTasks} groupKey="today" />

          {/* This Month */}
          <TaskGroup 
            title="This Month" 
            tasks={thisMonthTasks} 
            groupKey="thisMonth"
            icon={<Calendar size={18} className="text-blue-500" />}
          />

          {/* Next Month */}
          <TaskGroup 
            title="Next Month" 
            tasks={nextMonthTasks} 
            groupKey="nextMonth"
            icon={<Calendar size={18} className="text-purple-500" />}
          />

          {/* Future */}
          {futureTasks.length > 0 && (
            <TaskGroup 
              title="Future" 
              tasks={futureTasks} 
              groupKey="future"
              icon={<Calendar size={18} className="text-gray-500" />}
            />
          )}

          {/* Past Due Section */}
          {pastTasks.length > 0 && (
            <TaskGroup
              title="Past Due"
              tasks={pastTasks}
              groupKey="past"
              icon={<Calendar size={18} className="text-red-500" />}
            />
          )}

          {/* No Deadline */}
          {noDeadlineTasks.filter((task) => !task.completed).length > 0 && (
            <TaskGroup
              title="No Deadline"
              tasks={noDeadlineTasks.filter((task) => !task.completed)}
              groupKey="noDeadline"
              icon={<Calendar size={18} className="text-gray-500" />}
            />
          )}
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
          onSetActiveTask={() => {}}
        />
      )}
    </div>
  );
};

export default AllTasks;
