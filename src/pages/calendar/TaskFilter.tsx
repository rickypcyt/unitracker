import { AlertCircle, Calendar, CheckCircle, Clock } from "lucide-react";

import { Task } from "@/types/taskStorage";
import { useState } from "react";

interface TaskFilterProps {
  tasks: Task[];
  onFilteredTasksChange: (filteredTasks: Task[]) => void;
}

const TaskFilter: React.FC<TaskFilterProps> = ({ tasks, onFilteredTasksChange }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter functions
  const getFilteredTasks = (filter: string, includeCompleted: boolean) => {
    let filtered = [...tasks];

    if (!includeCompleted) {
      filtered = filtered.filter(task => !task.completed);
    }

    switch (filter) {
      case "today":
        return filtered.filter(task => {
          if (!task.deadline) return false;
          const taskDate = new Date(task.deadline);
          return taskDate.toDateString() === today.toDateString();
        });

      case "thisweek":
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return filtered.filter(task => {
          if (!task.deadline) return false;
          const taskDate = new Date(task.deadline);
          return taskDate >= today && taskDate <= weekFromNow;
        });

      case "thismonth":
        return filtered.filter(task => {
          if (!task.deadline) return false;
          const taskDate = new Date(task.deadline);
          return (
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getFullYear() === today.getFullYear()
          );
        });

      case "nextmonth":
        const nextMonth = today.getMonth() === 11 ? 0 : today.getMonth() + 1;
        const nextYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
        return filtered.filter(task => {
          if (!task.deadline) return false;
          const taskDate = new Date(task.deadline);
          return (
            taskDate.getMonth() === nextMonth &&
            taskDate.getFullYear() === nextYear
          );
        });

      case "overdue":
        return filtered.filter(task => {
          if (!task.deadline || task.completed) return false;
          const taskDate = new Date(task.deadline);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate < today;
        });

      case "nodeadline":
        return filtered.filter(task => !task.deadline || task.deadline === "");

      default:
        return filtered;
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    const filtered = getFilteredTasks(filter, false);
    onFilteredTasksChange(filtered);
  };

  // Get count for each filter
  const getFilterCount = (filter: string, includeCompleted: boolean) => {
    return getFilteredTasks(filter, includeCompleted).length;
  };

  const filterOptions = [
    { id: "all", label: "All", icon: <Calendar size={16} /> },
    { id: "today", label: "Today", icon: <Clock size={16} /> },
    { id: "thisweek", label: "This Week", icon: <Calendar size={16} /> },
    { id: "thismonth", label: "This Month", icon: <Calendar size={16} /> },
    { id: "nextmonth", label: "Next Month", icon: <Calendar size={16} /> },
    { id: "overdue", label: "Overdue", icon: <AlertCircle size={16} /> },
    { id: "nodeadline", label: "No Deadline", icon: <CheckCircle size={16} /> },
  ];

  return (
    <div className="w-full h-full mx-auto">
      <div className="lg:min-h-[400px] lg:min-w-[350px] overflow-y-auto">
        {/* Filter Options */}
        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-1">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleFilterChange(option.id)}
            className={`w-full flex items-center justify-between py-2 px-2 sm:min-w-[10rem] rounded-lg border-2 transition-colors whitespace-nowrap ${
              selectedFilter === option.id
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                : "border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`${
                selectedFilter === option.id
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)]"
              }`}>
                {option.icon}
              </div>
              <span className={`truncate ${
                selectedFilter === option.id
                  ? "text-[var(--accent-primary)] font-medium"
                  : "text-[var(--text-primary)]"
              }`}>
                {option.label}
              </span>
            </div>
            <span className={`text-sm shrink-0 ${
              selectedFilter === option.id
                ? "text-[var(--accent-primary)]"
                : "text-[var(--text-secondary)]"
            }`}>
              {getFilterCount(option.id, false)}
            </span>
          </button>
        ))}
      </div>
      </div>
    </div>
  );
};

export default TaskFilter;
