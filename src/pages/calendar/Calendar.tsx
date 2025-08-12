import { CheckCircle2, Clock, CalendarDays as LucideCalendar, MoreVertical } from 'lucide-react';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import { formatDate, formatDateForInput } from '@/utils/dateUtils';
import { useDispatch, useSelector } from "react-redux";

import BaseModal from '@/modals/BaseModal';
import LoginPromptModal from "@/modals/LoginPromptModal";
import TaskForm from '@/pages/tasks/TaskForm';
import { fetchLaps } from '@/store/LapActions';
import { useAuth } from "@/hooks/useAuth";
import { useTaskDetails } from "@/hooks/useTaskDetails";
import { useTaskManager } from "@/hooks/useTaskManager";

const DayInfoModal = ({ isOpen, onClose, date, tasks, studiedHours }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const completedTasks = tasks?.filter(task => task.completed) || [];
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
            <span>{completedTasks.length} of {totalTasks} tasks completed</span>
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
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [calendarSize, setCalendarSize] = useState('lg'); // sm, md, lg
  
  const {
    selectedTask,
    editedTask,
    taskDetailsEdit,
    handleOpenTaskDetails,
    handleCloseTaskDetails,
    setTaskEditing,
    setEditedTask,
    handleEditTaskField,
  } = useTaskDetails();

  const { handleUpdateTask } = useTaskManager();

  // Get data from Redux store
  const { tasks } = useSelector((state) => state.tasks);
  const { laps } = useSelector((state) => state.laps);

  // Fetch laps when component mounts
  useEffect(() => {
    dispatch(fetchLaps());
  }, [dispatch]);

  // Replace the keyboard event handler
  useEffect(() => {
    const handleKeyPress = (event) => {
      const newFocusedDate = new Date(focusedDate);
      
      switch (event.key) {
        case 'ArrowLeft':
          newFocusedDate.setDate(newFocusedDate.getDate() - 1);
          break;
        case 'ArrowRight':
          newFocusedDate.setDate(newFocusedDate.getDate() + 1);
          break;
        case 'ArrowUp':
          newFocusedDate.setDate(newFocusedDate.getDate() - 7);
          break;
        case 'ArrowDown':
          newFocusedDate.setDate(newFocusedDate.getDate() + 7);
          break;
        case 'Enter':
          handleDateDoubleClick(focusedDate);
          return;
        default:
          return;
      }

      // Update focused date and ensure it's visible in the calendar
      setFocusedDate(newFocusedDate);
      setSelectedDate(newFocusedDate);
      
      // If the new focused date is in a different month, update the current date
      if (newFocusedDate.getMonth() !== currentDate.getMonth() || 
          newFocusedDate.getFullYear() !== currentDate.getFullYear()) {
        setCurrentDate(new Date(newFocusedDate.getFullYear(), newFocusedDate.getMonth(), 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [focusedDate, currentDate]);

  // Update handleDateClick to also set focused date
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setFocusedDate(date);
  };

  // Days of the week in English
  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

  // Month names in English
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

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday as start of week
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateDoubleClick = (date) => {
    setSelectedDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date < today) {
      setIsInfoModalOpen(true);
    } else {
      if (!isLoggedIn) {
        setIsLoginPromptOpen(true);
        return;
      }
      setShowTaskForm(true);
    }
  };

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStudiedHoursForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayLaps = laps.filter(lap => {
      const lapDate = new Date(lap.created_at).toISOString().split('T')[0];
      return lapDate === dateStr;
    });

    const totalMinutes = dayLaps.reduce((total, lap) => {
      const duration = lap.duration;
      if (!duration || duration === '00:00:00') return total;
      
      const [hours, minutes] = duration.split(':').map(Number);
      return total + (hours * 60 + minutes);
    }, 0);

    return (totalMinutes / 60).toFixed(1);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const daysInPreviousMonth = getDaysInMonth(year, month - 1);
    const days = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPreviousMonth - i;
      const date = new Date(year, month - 1, day);
      days.push({ date, day, currentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        day: i,
        currentMonth: true,
        isToday: isToday(date),
        isSelected: isSelected(date),
      });
    }

    // Next month days
    const totalDaysDisplayed =
      Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;
    const daysFromNextMonth = totalDaysDisplayed - days.length;

    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, day: i, currentMonth: false });
    }

    return days;
  };

  const handleSaveEdit = async () => {
    if (editedTask) {
      await handleUpdateTask(editedTask);
      handleCloseTaskDetails();
    }
  };

  // Add this new function to check for tasks with deadlines
  const hasTasksWithDeadline = (date) => {
    return tasks.some(task => {
      if (!task.deadline) return false;
      const deadlineDate = new Date(task.deadline);
      return (
        deadlineDate.getDate() === date.getDate() &&
        deadlineDate.getMonth() === date.getMonth() &&
        deadlineDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Add this new function to get tasks with deadlines for a specific date
  const getTasksWithDeadline = (date) => {
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const deadlineDate = new Date(task.deadline);
      return (
        deadlineDate.getDate() === date.getDate() &&
        deadlineDate.getMonth() === date.getMonth() &&
        deadlineDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Add state for tooltip content and position
  const [tooltipContent, setTooltipContent] = useState(null);

  // Modify the tooltip hover handler to only store content
  const handleTooltipHover = (date, tasks) => {
    setTooltipContent({
      date,
      tasks
    });
  };

  return (
    <div className={`maincard relative mx-auto transition-all duration-300 ${
      calendarSize === 'sm' ? 'max-w-md' : calendarSize === 'md' ? 'max-w-2xl' : 'max-w-4xl'
    }`}>
      {/* Top bar: Month selector centered, options right */}
      <div className="flex justify-center items-center mb-4 relative">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-[var(--text-primary)] transition-colors duration-200 group bg-transparent">
          <button
            onClick={goToPreviousMonth}
            className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] focus:outline-none"
          >
            <FaChevronLeft size={16} />
          </button>
          <div className={`text-lg font-semibold mx-2 ${currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear() ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button
            onClick={goToNextMonth}
            className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] focus:outline-none"
          >
            <FaChevronRight size={16} />
          </button>
        </div>
        {/* Botón de opciones arriba a la derecha */}
        <button
          className="absolute right-0 top-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] p-2"
          onClick={() => setIsOptionsOpen(true)}
          aria-label="Calendar options"
        >
          <MoreVertical size={22} />
        </button>
      </div>
      
      {/* Add centered tooltip container at the top of the calendar */}
      {tooltipContent && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-base rounded shadow-lg border border-[var(--border-color)] z-[9999] transition-all duration-200"
          style={{
            top: '0',
            minWidth: '180px',
            maxWidth: '250px'
          }}
        >
          <div className="font-medium p-2 border-b border-[var(--border-color)] text-center">
            Tasks due for {formatDate(tooltipContent.date.toISOString())}:
          </div>
          <div className="p-2 max-h-[180px] overflow-y-auto">
            {tooltipContent.tasks.map(task => (
              <div key={task.id} className="flex items-center gap-1 mb-1 last:mb-0">
                <div className={`w-1 h-1 rounded-full flex-shrink-0 ${task.completed ? 'bg-green-500' : 'bg-[var(--accent-primary)]'}`} />
                <span className={`truncate text-base ${task.completed ? 'line-through text-[var(--text-secondary)]' : ''}`}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wrap calendar headers and days in a new container with padding */}
      <div className="w-full mt-6 relative">
        <div className="block border-none p-0 m-0 rounded-lg">
          {/* Weekday headers */}
          <div className="weekday-grid mb-2">
            {weekdays.map((day, index) => (
              <div
                key={index}
                className="text-[var(--text-primary)] text-base font-semibold flex items-center justify-center w-1/7"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 text-center aspect-[4/3]">
            {renderCalendarDays().map((dayObj, index) => {
              const isFocused = dayObj.date.getTime() === focusedDate.getTime();
              const hasDeadlines = dayObj.currentMonth && hasTasksWithDeadline(dayObj.date);
              const tasksWithDeadline = hasDeadlines ? getTasksWithDeadline(dayObj.date) : [];
              
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(dayObj.date)}
                  onDoubleClick={() => dayObj.currentMonth && handleDateDoubleClick(dayObj.date)}
                  onMouseEnter={() => hasDeadlines && handleTooltipHover(dayObj.date, tasksWithDeadline)}
                  onMouseLeave={() => setTooltipContent(null)}
                  style={{
                    ...(dayObj.isToday ? { color: "var(--accent-primary)" } : {}),
                    ...(dayObj.currentMonth ? {} : { color: "var(--text-secondary)" }),
                  }}
                  className={`select-none cursor-pointer text-lg w-1/7 relative group
                    ${dayObj.currentMonth ? "text-[var(--text-primary)] font-bold" : "text-[var(--text-secondary)]"}
                    ${dayObj.isToday ? "hover:text-[var(--accent-primary)]" : "hover:text-[var(--text-secondary)]"}
                  `}
                >
                  <div className="flex flex-col items-center justify-center w-full h-full relative">
                    {tasksWithDeadline.length > 0 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {tasksWithDeadline.map((task, idx) => (
                          <div
                            key={task.id}
                            className="w-1 h-1 rounded-full bg-[var(--accent-primary)]"
                          />
                        ))}
                      </div>
                    )}
                    <span>{dayObj.day}</span>
                    {dayObj.currentMonth && (
                      <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        {getStudiedHoursForDate(dayObj.date)}h
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showTaskForm && (
        <TaskForm
          initialAssignment=""
          initialDeadline={selectedDate}
          onClose={(newTaskId) => {
            setShowTaskForm(false);
            if (newTaskId) {
              // Refresh the task list
              window.dispatchEvent(new CustomEvent('refreshTaskList'));
            }
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

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
      />

      {/* Modal de opciones */}
      <BaseModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        title="Calendar Options"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 text-base font-medium text-[var(--text-primary)]">Calendar Size</label>
            <select
              className="w-full p-2 rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              value={calendarSize}
              onChange={e => setCalendarSize(e.target.value)}
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default Calendar;
