import { AlertCircle, Calendar, CheckCircle, ChevronDown, Clock } from "lucide-react";
import { getOccurrenceForDate, isRecurringTask } from "@/utils/recurrenceUtils";
import { useEffect, useRef, useState } from "react";

import { Task } from "@/types/taskStorage";
import { useRecurringTasks } from "./RecurringTasksContext";

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
  const { showRecurring } = useRecurringTasks();

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
  }, [internalSelectedFilter, tasks, showRecurring]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter functions
  const getFilteredTasks = (filter: string, includeCompleted: boolean) => {
    let filtered = [...tasks];

    if (!includeCompleted) {
      filtered = filtered.filter(task => !task.completed);
    }

    // Filter out recurring tasks if showRecurring is false
    if (!showRecurring) {
      filtered = filtered.filter(task => !task.recurrence_type || task.recurrence_type === 'none');
    }

    switch (filter) {
      case "today":
        return filtered.filter(task => {
          // Check if it's a recurring task that occurs today
          if (isRecurringTask(task as any)) {
            return getOccurrenceForDate(task as any, today);
          }
          
          // Check if it's a one-time task with deadline today
          if (!task.deadline) return false;
          const taskDate = new Date(task.deadline);
          return taskDate.toDateString() === today.toDateString();
        });

      case "thisweek":
        return filtered.filter(task => {
          // Check if it's a recurring task that occurs this week
          if (isRecurringTask(task as any)) {
            // Check each day of this week
            for (let i = 0; i < 7; i++) {
              const dayOfWeek = new Date(today);
              dayOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1) + i);
              if (getOccurrenceForDate(task as any, dayOfWeek)) {
                return true;
              }
            }
            return false;
          }
          
          // Check if it's a one-time task with deadline this week
          if (!task.deadline) return false;
          const taskDate = new Date(task.deadline);
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          return taskDate >= startOfWeek && taskDate <= endOfWeek;
        });

      case "thismonth":
        return filtered.filter(task => {
          // Check if it's a recurring task that occurs this month
          if (isRecurringTask(task as any)) {
            // Check if any occurrence falls within this month
            for (let day = 1; day <= 31; day++) {
              const checkDate = new Date(today.getFullYear(), today.getMonth(), day);
              if (checkDate.getMonth() === today.getMonth() && checkDate.getFullYear() === today.getFullYear()) {
                if (getOccurrenceForDate(task as any, checkDate)) {
                  return true;
                }
              }
            }
            return false;
          }
          
          // Check if it's a one-time task with deadline this month
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
          // Check if it's a recurring task that occurs next month
          if (isRecurringTask(task as any)) {
            // Check if any occurrence falls within next month
            for (let day = 1; day <= 31; day++) {
              const checkDate = new Date(nextYear, nextMonth, day);
              if (checkDate.getMonth() === nextMonth && checkDate.getFullYear() === nextYear) {
                if (getOccurrenceForDate(task as any, checkDate)) {
                  return true;
                }
              }
            }
            return false;
          }
          
          // Check if it's a one-time task with deadline next month
          if (!task.deadline) return false;
          const taskDate = new Date(task.deadline);
          return (
            taskDate.getMonth() === nextMonth &&
            taskDate.getFullYear() === nextYear
          );
        });

      case "overdue":
        return filtered.filter(task => {
          // Check if it's a recurring task with past occurrences
          if (isRecurringTask(task as any)) {
            // Check if there are any past occurrences
            for (let day = -30; day <= 0; day++) {
              const checkDate = new Date(today);
              checkDate.setDate(today.getDate() + day);
              checkDate.setHours(0, 0, 0, 0);
              if (getOccurrenceForDate(task as any, checkDate) && checkDate < today) {
                return true;
              }
            }
            return false;
          }
          
          // Check if it's a one-time task with past deadline
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
          className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-[var(--accent-primary)]">
              {currentFilter?.icon}
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Filter: {currentFilter?.label}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    handleFilterChange(option.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-[var(--bg-secondary)] transition-colors text-left ${
                    internalSelectedFilter === option.id ? 'bg-[var(--bg-secondary)]' : ''
                  }`}
                >
                  <div className={`${
                    internalSelectedFilter === option.id
                      ? "text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)]"
                  }`}>
                    {option.icon}
                  </div>
                  <span className="text-sm text-[var(--text-primary)]">{option.label}</span>
                  {internalSelectedFilter === option.id && (
                    <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskFilter;
