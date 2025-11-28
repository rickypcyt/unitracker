import "./mobile-calendar.css";

import { CheckCircle2, Clock, MoreVertical } from "lucide-react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { isAfter, isSameDay, parseISO } from 'date-fns';

import BaseModal from "@/modals/BaseModal";
import LoginPromptModal from "@/modals/LoginPromptModal";
import TaskForm from "@/pages/tasks/TaskForm";
import { formatDate } from "@/utils/dateUtils";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "@/hooks/useAuth";

interface TooltipContent {
  date: Date;
  tasks: any[];
}

interface DayInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  tasks: any[];
  studiedHours: string | number;
}

const DayInfoModal = ({ isOpen, onClose, date, tasks, studiedHours }: DayInfoModalProps) => {
  if (!isOpen) return null;

  const completedTasks = tasks?.filter((t: any) => t.completed).length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={formatDate(date.toISOString())}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tasks Card */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--accent-primary)]/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={20} className="text-[var(--accent-primary)]" />
              </div>
              <div>
                <div className="text-sm text-[var(--text-secondary)] font-medium">Tasks</div>
                <div className="text-xl font-bold text-[var(--text-primary)]">
                  {completedTasks}/{totalTasks}
                </div>
              </div>
            </div>
          </div>

          {/* Study Time Card */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--accent-primary)]/20 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-[var(--accent-primary)]" />
              </div>
              <div>
                <div className="text-sm text-[var(--text-secondary)] font-medium">Study Time</div>
                <div className="text-xl font-bold text-[var(--text-primary)]">
                  {studiedHours || 0}h
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task List */}
        {tasks && tasks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <div className="w-1 h-4 bg-[var(--accent-primary)] rounded-full"></div>
              Tasks Overview
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.map((task: any) => (
                <div 
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)]/80 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.completed ? "bg-green-500" : "bg-yellow-500"
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      task.completed 
                        ? "text-[var(--text-secondary)] line-through" 
                        : "text-[var(--text-primary)]"
                    }`}>
                      {task.title}
                    </div>
                    {task.assignment && (
                      <div className="text-xs text-[var(--text-secondary)] truncate">
                        {task.assignment}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    task.completed 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {task.completed ? "Done" : "Pending"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!tasks || tasks.length === 0) && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-[var(--text-secondary)]" />
            </div>
            <p className="text-[var(--text-secondary)] text-sm">No tasks recorded for this day</p>
            <p className="text-[var(--text-secondary)]/60 text-xs mt-2">Take a look at other days for activity</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

const Calendar = () => {
  const { isLoggedIn } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [focusedDate, setFocusedDate] = useState(new Date());
  const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [calendarSize, setCalendarSize] = useState("lg"); // sm, md, lg
  const [lastTap, setLastTap] = useState(0);

  const { tasks } = useAppStore((state) => state.tasks);
  const laps = useAppStore((state) => state.laps.laps);

  // ---------------------
  // Data is managed by Zustand store
  // ---------------------

  // ---------------------
  // Helper Functions
  // ---------------------
  const getPendingTasksForMonth = (date: Date) => {
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    
    return tasks.filter(task => {
      if (task.completed) return false;
      if (!task.deadline) return false;
      
      const taskDate = new Date(task.deadline);
      return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
    }).length;
  };

  const getPendingTasksForNextMonth = (date: Date) => {
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    return tasks.filter(task => {
      if (task.completed) return false;
      if (!task.deadline) return false;
      
      const taskDate = new Date(task.deadline);
      return taskDate.getMonth() === nextMonth && taskDate.getFullYear() === nextYear;
    }).length;
  };

  // ---------------------
  // Keyboard navigation
  // ---------------------
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const newDate = new Date(focusedDate);
      switch (e.key) {
        case "ArrowLeft":
          newDate.setDate(newDate.getDate() - 1);
          break;
        case "ArrowRight":
          newDate.setDate(newDate.getDate() + 1);
          break;
        case "ArrowUp":
          newDate.setDate(newDate.getDate() - 7);
          break;
        case "ArrowDown":
          newDate.setDate(newDate.getDate() + 7);
          break;
        case "Enter":
          handleDateDoubleClick(focusedDate);
          return;
        default:
          return;
      }
      setFocusedDate(newDate);
      setSelectedDate(newDate);
      if (
        newDate.getMonth() !== currentDate.getMonth() ||
        newDate.getFullYear() !== currentDate.getFullYear()
      ) {
        setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [focusedDate, currentDate]);

  // ---------------------
  // Helpers
  // ---------------------
  // Use date-fns isSameDay for consistent timezone handling
  const isToday = (date: Date) => isSameDay(date, new Date());
  const isSelected = (date: Date) => isSameDay(date, selectedDate);

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday start
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setFocusedDate(date);
  };

  const handleDateDoubleClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    setSelectedDate(date);
    if (date < today) return setIsInfoModalOpen(true);
    if (!isLoggedIn) return setIsLoginPromptOpen(true);
    setShowTaskForm(true);
  };

  const handleTouchEnd = (e: React.TouchEvent, date: Date) => {
    e.preventDefault();
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      if (date) {
        handleDateDoubleClick(date);
      }
    }
    
    setLastTap(currentTime);
  };

  const getTasksForDate = useCallback(
    (date: Date) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      // Show tasks with deadline on this date OR tasks completed on this date
      return tasks.filter(task => {
        // Tasks with deadline on this date
        if (task.deadline) {
          const taskDate = new Date(task.deadline);
          taskDate.setHours(0, 0, 0, 0);
          if (isSameDay(parseISO(taskDate.toISOString()), parseISO(targetDate.toISOString()))) {
            return true;
          }
        }
        
        // Tasks completed on this date
        if (task.completed && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          if (isSameDay(parseISO(completedDate.toISOString()), parseISO(targetDate.toISOString()))) {
            return true;
          }
        }
        
        return false;
      });
    },
    [tasks]
  );

  const getStudiedHoursForDate = useCallback(
    (date: Date) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      const totalMinutes = laps.reduce((total, lap) => {
        if (!lap.duration || lap.duration === "00:00:00") return total;
        
        const lapDate = new Date(lap.created_at);
        lapDate.setHours(0, 0, 0, 0);
        
        if (isSameDay(lapDate, targetDate)) {
          const [h, m] = lap.duration.split(":").map(Number);
          return total + h * 60 + m;
        }
        return total;
      }, 0);
      
      return (totalMinutes / 60).toFixed(1);
    },
    [laps]
  );

  const hasTasksWithDeadline = useCallback(
    (date: Date) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      return tasks.some(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return isSameDay(parseISO(taskDate.toISOString()), parseISO(targetDate.toISOString()));
      });
    },
    [tasks]
  );

  const getTasksWithDeadline = useCallback(
    (date: Date) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      return tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return isSameDay(parseISO(taskDate.toISOString()), parseISO(targetDate.toISOString()));
      });
    },
    [tasks]
  );

  // ---------------------
  // Calendar rendering
  // ---------------------
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const days = [];

    // Previous month
    for (let i = firstDay - 1; i >= 0; i--)
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        currentMonth: false,
      });

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        currentMonth: true,
        isToday: isToday(date),
        isSelected: isSelected(date),
      });
    }

    // Next month
    const total = Math.ceil((daysInMonth + firstDay) / 7) * 7;
    for (let i = 1; i <= total - days.length; i++)
      days.push({ date: new Date(year, month + 1, i), currentMonth: false });

    return days;
  }, [currentDate, focusedDate, selectedDate, tasks, laps]);

  // ---------------------
  // Month navigation
  // ---------------------
  const goToPreviousMonth = () =>
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  const goToNextMonth = () =>
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );

  // ---------------------
  // Render
  // ---------------------
  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div
      className={`maincard relative mx-auto w-full transition-all duration-300 calendar-view flex flex-col ${
        calendarSize === "sm"
          ? "max-w-md"
          : calendarSize === "md"
          ? "max-w-2xl"
          : "max-w-2xl"
      }`}
      style={{ aspectRatio: calendarSize === "lg" ? '6/5' : 'auto' }}
    >
      {/* Top bar */}
      <div className="flex justify-center items-center mb-4 relative">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-[var(--text-primary)]">
          <button onClick={goToPreviousMonth}>
            <FaChevronLeft size={16} />
          </button>
          <div
            className={`text-lg font-semibold mx-2 ${
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear()
                ? "text-[var(--accent-primary)]"
                : "text-[var(--text-primary)]"
            }`}
          >
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button onClick={goToNextMonth}>
            <FaChevronRight size={16} />
          </button>
        </div>
        <button
          className="absolute right-0 top-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] p-2"
          onClick={() => setIsOptionsOpen(true)}
          aria-label="Calendar options"
        >
          <MoreVertical size={22} />
        </button>
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg shadow-xl z-[9999] transition-all duration-200 backdrop-blur-sm"
          style={{ top: "5px", minWidth: "200px", maxWidth: "280px" }}
        >
          <div className="px-3 py-2 border-b border-[var(--border-primary)]">
            <div className="text-sm font-semibold text-[var(--accent-primary)] text-center">
              {formatDate(tooltipContent.date.toISOString())}
            </div>
            <div className="text-xs text-[var(--text-secondary)] text-center mt-1">
              {tooltipContent.tasks.length} task{tooltipContent.tasks.length !== 1 ? 's' : ''} due
            </div>
          </div>
          <div className="p-2 max-h-[200px] overflow-y-auto">
            {tooltipContent.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--bg-secondary)] transition-colors group"
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.completed
                      ? "bg-green-500"
                      : "bg-[var(--accent-primary)]"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium break-words ${
                      task.completed
                        ? "line-through text-[var(--text-secondary)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {task.title}
                  </div>
                  {task.assignment && (
                    <div className="text-xs text-[var(--text-secondary)] break-words">
                      {task.assignment}
                    </div>
                  )}
                </div>
                <div className="text-xs text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity">
                  {task.completed ? "✓" : "○"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="w-full mt-2 sm:mt-4 relative flex-1">
        <div className="block border-[var(--border-primary)] p-0 sm:p-1 md:p-2 rounded-lg bg-[var(--bg-primary)]/90 h-full flex flex-col">
          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-0.5 mb-1 sm:mb-2">
            {weekdays.map((day, index) => (
              <div
                key={index}
                className="text-[var(--text-primary)] text-sm sm:text-base font-medium flex items-center justify-center h-8"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5 text-center flex-1">
            {calendarDays.map((dayObj, index) => {
              const tasksWithDeadline =
                dayObj.currentMonth && hasTasksWithDeadline(dayObj.date)
                  ? getTasksWithDeadline(dayObj.date)
                  : [];
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(dayObj.date)}
                  onDoubleClick={() =>
                    dayObj.currentMonth && handleDateDoubleClick(dayObj.date)
                  }
                  onTouchEnd={(e) => 
                    dayObj.currentMonth && handleTouchEnd(e, dayObj.date)
                  }
                  onMouseEnter={() =>
                    tasksWithDeadline.length > 0 &&
                    setTooltipContent({
                      date: dayObj.date,
                      tasks: tasksWithDeadline,
                    })
                  }
                  onMouseLeave={() => setTooltipContent(null)}
                  className={`select-none cursor-pointer text-base w-auto flex-1 relative group ${
                    dayObj.currentMonth
                      ? dayObj.isToday
                        ? "text-[var(--accent-primary)] font-bold"
                        : "text-[var(--text-primary)] font-medium"
                      : "text-[var(--text-secondary)]"
                  } ${
                    dayObj.isToday
                      ? "hover:text-[var(--accent-primary)]"
                      : "hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {tasksWithDeadline.length > 0 && (
                    <div className="absolute top-0.5 right-2 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] opacity-80"></div>
                  )}
                  <div className="flex flex-col items-center justify-center w-full h-full p-1 sm:p-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="text-sm sm:text-base">
                        {dayObj.date.getDate()}
                      </div>
                      {dayObj.currentMonth && (
                        <div className={`text-sm ${
                          isSameDay(dayObj.date, new Date()) || isAfter(dayObj.date, new Date())
                            ? 'text-[var(--accent-green)]'
                            : 'text-[var(--text-secondary)]'
                        }`}>
                          {getStudiedHoursForDate(dayObj.date)}h
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendar Footer */}
      <div className="mt-4 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
        <div className="flex justify-center items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></div>
            <span className="text-[var(--text-primary)]">
              {getPendingTasksForMonth(currentDate)} tasks this month
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)]"></div>
            <span className="text-[var(--text-primary)]">
              {getPendingTasksForNextMonth(currentDate)} tasks next month
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTaskForm && (
        <TaskForm
          initialAssignment=""
          initialDeadline={selectedDate}
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={(newTaskId: string) => {
            if (newTaskId)
              window.dispatchEvent(new CustomEvent("refreshTaskList"));
          }}
        />
      )}
      <DayInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        date={selectedDate}
        tasks={getTasksForDate(selectedDate)}
        studiedHours={getStudiedHoursForDate(selectedDate)}
      />
      <LoginPromptModal
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
      />
      <BaseModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        title="Calendar Options"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col gap-4">
          <label className="block mb-2 text-base font-medium text-[var(--text-primary)]">
            Calendar Size
          </label>
          <select
            className="w-full p-2 rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            value={calendarSize}
            onChange={(e) => setCalendarSize(e.target.value)}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </div>
      </BaseModal>
    </div>
  );
};

export default Calendar;
