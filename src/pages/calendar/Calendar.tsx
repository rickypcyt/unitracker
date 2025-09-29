import { CheckCircle2, Clock, MoreVertical } from "lucide-react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isSameDay, isAfter } from 'date-fns';

import BaseModal from "@/modals/BaseModal";
import LoginPromptModal from "@/modals/LoginPromptModal";
import TaskForm from "@/pages/tasks/TaskForm";
import { fetchLaps } from "@/store/LapActions";
import { formatDate } from "@/utils/dateUtils";
import { useAuth } from "@/hooks/useAuth";
import { useTaskDetails } from "@/hooks/useTaskDetails";
import { useTaskManager } from "@/hooks/useTaskManager";

const DayInfoModal = ({ isOpen, onClose, date, tasks, studiedHours }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const completedTasks = tasks?.filter((t) => t.completed).length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">
            {formatDate(date.toISOString())}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-300">
            <CheckCircle2 size={20} className="text-green-500" />
            <span>
              {completedTasks} of {totalTasks} tasks completed
            </span>
          </div>
          <div className="flex items-center gap-3 text-neutral-300">
            <Clock size={20} className="text-[var(--accent-primary)]" />
            <span>{studiedHours || 0} hours studied</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Calendar = () => {
  const dispatch = useDispatch();
  const { isLoggedIn } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [focusedDate, setFocusedDate] = useState(new Date());
  const [tooltipContent, setTooltipContent] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [calendarSize, setCalendarSize] = useState("lg"); // sm, md, lg

  const { selectedTask, editedTask, handleCloseTaskDetails } = useTaskDetails();
  const { handleUpdateTask } = useTaskManager();

  const { tasks } = useSelector((state) => state.tasks);
  const { laps } = useSelector((state) => state.laps);

  // ---------------------
  // Fetch laps
  // ---------------------
  useEffect(() => {
    dispatch(fetchLaps());
  }, [dispatch]);

  // ---------------------
  // Keyboard navigation
  // ---------------------
  useEffect(() => {
    const handleKeyPress = (e) => {
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
  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();
  const isToday = (date) => isSameDay(date, new Date());
  const isSelected = (date) => isSameDay(date, selectedDate);

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday start
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setFocusedDate(date);
  };

  const handleDateDoubleClick = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    setSelectedDate(date);
    if (date < today) return setIsInfoModalOpen(true);
    if (!isLoggedIn) return setIsLoginPromptOpen(true);
    setShowTaskForm(true);
  };

  const getTasksForDate = useCallback(
    (date) =>
      tasks.filter((task) => isSameDay(new Date(task.created_at), date)),
    [tasks]
  );

  const getStudiedHoursForDate = useCallback(
    (date) => {
      const dayStr = date.toISOString().split("T")[0];
      const totalMinutes = laps.reduce((total, lap) => {
        if (!lap.duration || lap.duration === "00:00:00") return total;
        const lapDateStr = new Date(lap.created_at).toISOString().split("T")[0];
        if (lapDateStr !== dayStr) return total;
        const [h, m] = lap.duration.split(":").map(Number);
        return total + h * 60 + m;
      }, 0);
      return (totalMinutes / 60).toFixed(1);
    },
    [laps]
  );

  const hasTasksWithDeadline = useCallback(
    (date) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      return tasks.some(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return isSameDay(taskDate, targetDate);
      });
    },
    [tasks]
  );

  const getTasksWithDeadline = useCallback(
    (date) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      return tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return isSameDay(taskDate, targetDate);
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
      className={`maincard relative mx-auto w-full transition-all duration-300 calendar-view ${
        calendarSize === "sm"
          ? "max-w-md"
          : calendarSize === "md"
          ? "max-w-2xl"
          : "max-w-4xl"
      }`}
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
          className="absolute left-1/2 -translate-x-1/2 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-base rounded shadow-lg border border-[var(--border-color)] z-[9999] transition-all duration-200"
          style={{ top: "0", minWidth: "180px", maxWidth: "250px" }}
        >
          <div className="font-medium p-2 border-b border-[var(--border-color)] text-center">
            Tasks due for {formatDate(tooltipContent.date.toISOString())}:
          </div>
          <div className="p-2 max-h-[180px] overflow-y-auto">
            {tooltipContent.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-1 mb-1 last:mb-0"
              >
                <div
                  className={`w-1 h-1 rounded-full flex-shrink-0 ${
                    task.completed
                      ? "bg-green-500"
                      : "bg-[var(--accent-primary)]"
                  }`}
                />
                <span
                  className={`truncate text-base ${
                    task.completed
                      ? "line-through text-[var(--text-secondary)]"
                      : ""
                  }`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="w-full mt-2 sm:mt-4 relative">
        <div className="block border-[var(--border-primary)] p-0 sm:p-1 md:p-2 rounded-lg bg-[var(--bg-primary)]/90">
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
          <div className="grid grid-cols-7 gap-0.5 text-center">
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
                  <div className="flex flex-col items-center w-full aspect-square p-1 sm:p-2">
                    <div className="text-sm sm:text-base">
                      {dayObj.date.getDate()}
                    </div>
                    {dayObj.currentMonth && (
                      <div className={`text-xs ${
                        isSameDay(dayObj.date, new Date()) || isAfter(dayObj.date, new Date())
                          ? 'text-[var(--accent-green)]'
                          : 'text-[var(--text-secondary)]'
                      }`}>
                        {getStudiedHoursForDate(dayObj.date)}h
                      </div>
                    )}
                    {tasksWithDeadline.length > 0 && (
                      <div className="flex justify-center gap-0.5 mt-1">
                        {tasksWithDeadline.map((task) => (
                          <div
                            key={task.id}
                            className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"
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
      </div>

      {/* Modals */}
      {showTaskForm && (
        <TaskForm
          initialAssignment=""
          initialDeadline={selectedDate}
          onClose={(newTaskId) => {
            setShowTaskForm(false);
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
