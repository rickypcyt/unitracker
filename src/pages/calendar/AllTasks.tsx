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
  next7Days: boolean;
  sevenDaysPlus: boolean;
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
    next7Days: true,
    sevenDaysPlus: true,
    past: false, // Past tasks collapsed by default
    noDeadline: true,
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    // Tasks are managed by Zustand store
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get end of week (Sunday)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  // Get next 7 days from today
  const next7DaysEnd = new Date(today);
  next7DaysEnd.setDate(today.getDate() + 7);

  // Get 7+ days start (8 days from today)
  const sevenDaysPlusStart = new Date(today);
  sevenDaysPlusStart.setDate(today.getDate() + 8);

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

  const next7DaysTasks = upcomingTasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    return taskDate > today && taskDate <= next7DaysEnd;
  });

  const sevenDaysPlusTasks = upcomingTasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    return taskDate >= sevenDaysPlusStart;
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

          {/* Next 7 Days */}
          <TaskGroup 
            title="Next 7 Days" 
            tasks={next7DaysTasks} 
            groupKey="next7Days"
            icon={<Calendar size={18} className="text-blue-500" />}
          />

          {/* 7 Days + */}
          <TaskGroup 
            title="7 Days +" 
            tasks={sevenDaysPlusTasks} 
            groupKey="sevenDaysPlus"
            icon={<Calendar size={18} className="text-purple-500" />}
          />

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
