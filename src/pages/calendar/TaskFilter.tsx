import { AlertCircle, Calendar, CheckCircle, ChevronRight, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Task } from "@/types/taskStorage";

interface TaskFilterProps {
  tasks: Task[];
  onFilteredTasksChange: (filteredTasks: Task[]) => void;
  selectedFilter?: string;
  onFilterChange?: (filter: string) => void;
}

const TaskFilter: React.FC<TaskFilterProps> = ({ tasks, onFilteredTasksChange, selectedFilter: externalSelectedFilter, onFilterChange }) => {
  const [internalSelectedFilter, setInternalSelectedFilter] = useState<string>(externalSelectedFilter || "all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external selectedFilter
  useEffect(() => {
    if (externalSelectedFilter && externalSelectedFilter !== internalSelectedFilter) {
      setInternalSelectedFilter(externalSelectedFilter);
    }
  }, [externalSelectedFilter, internalSelectedFilter]);

  // Apply filter when internal state changes
  useEffect(() => {
    const filtered = getFilteredTasks(internalSelectedFilter, false);
    onFilteredTasksChange(filtered);
  }, [internalSelectedFilter, tasks]);

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
    setInternalSelectedFilter(filter);
    onFilterChange?.(filter);
    // Filter application is now handled by useEffect above
  };

  // Get count for each filter
  const getFilterCount = (filter: string, includeCompleted: boolean) => {
    return getFilteredTasks(filter, includeCompleted).length;
  };

  const filterOptions = [
    { id: "all", label: "All Tasks", icon: <Calendar size={16} /> },
    { id: "today", label: "Today", icon: <Clock size={16} /> },
    { id: "thisweek", label: "This Week", icon: <Calendar size={16} /> },
    { id: "thismonth", label: "This Month", icon: <Calendar size={16} /> },
    { id: "nextmonth", label: "Next Month", icon: <Calendar size={16} /> },
    { id: "overdue", label: "Overdue", icon: <AlertCircle size={16} /> },
    { id: "nodeadline", label: "No Deadline", icon: <CheckCircle size={16} /> },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFilter = filterOptions.find(option => option.id === internalSelectedFilter);

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between py-3 px-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
        >
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-[var(--accent-primary)]">
                  {currentFilter?.icon}
                </div>
                <span className="text-[var(--text-primary)] font-medium truncate">
                  {currentFilter?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">
                  {getFilterCount(internalSelectedFilter, false)}
                </span>
                <ChevronRight 
                  size={16} 
                  className={`text-[var(--text-secondary)] transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-[9999] overflow-hidden sm:absolute sm:left-full sm:top-0 sm:mt-0 sm:ml-2 sm:right-auto sm:min-w-[200px]">
            <div className="py-2 max-h-80 overflow-y-auto">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    handleFilterChange(option.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between py-2 px-4 hover:bg-[var(--bg-tertiary)] transition-colors ${
                    internalSelectedFilter === option.id
                      ? "bg-[var(--accent-primary)]/10 border-l-4 border-[var(--accent-primary)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`${
                      internalSelectedFilter === option.id
                        ? "text-[var(--accent-primary)]"
                        : "text-[var(--text-secondary)]"
                    }`}>
                      {option.icon}
                    </div>
                    <span className={`truncate ${
                      internalSelectedFilter === option.id
                        ? "text-[var(--accent-primary)] font-medium"
                        : "text-[var(--text-primary)]"
                    }`}>
                      {option.label}
                    </span>
                  </div>
                  <span className={`text-sm shrink-0 ${
                    internalSelectedFilter === option.id
                      ? "text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)]"
                  }`}>
                    {getFilterCount(option.id, false)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskFilter;
