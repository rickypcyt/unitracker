import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import TaskForm from "./TaskForm";
import { CheckCircle2, Clock } from 'lucide-react';
import { fetchLaps } from "../../redux/LapActions";
import { useTaskDetails } from "../../hooks/useTaskDetails";
import { useTaskManager } from "../../hooks/useTaskManager";

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
            {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
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
            <Clock size={20} className="text-blue-500" />
            <span>{studiedHours || 0} hours studied</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Calendar = () => {
  const dispatch = useDispatch();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  
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

  // Agregar manejo de teclas para navegación
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'ArrowLeft') {
        goToPreviousMonth();
      } else if (event.key === 'ArrowRight') {
        goToNextMonth();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleDateDoubleClick = (date) => {
    setSelectedDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date < today) {
      setIsInfoModalOpen(true);
    } else {
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

  return (
    <div className="maincard" >
      <div className="flex justify-between items-center">
        <h2 className="caltitle">
          <FaCalendarAlt size={24} />
          Calendar
        </h2>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-0 hover:bg-neutral-0 text-white transition-colors duration-200 mb-6 group relative">
          <button
            onClick={goToPreviousMonth}
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            <FaChevronLeft size={18} />
          </button>
          <div className="text-lg font-medium mx-4">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button
            onClick={goToNextMonth}
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            <FaChevronRight size={18} />
          </button>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white text-base px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Use ← → to navigate
          </div>
        </div>
      </div>

      <div className="bg-black rounded-lg text-white">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center">
          {weekdays.map((day, index) => (
            <div
              key={index}
              className="text-neutral-500 text-base w-full py-4 flex items-center justify-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 text-center">
          {renderCalendarDays().map((dayObj, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(dayObj.date)}
              onDoubleClick={() => dayObj.currentMonth && handleDateDoubleClick(dayObj.date)}
              style={{
                ...(dayObj.isToday ? { color: "var(--accent-primary)" } : {}),
                ...(dayObj.currentMonth ? {} : { color: "grey" }),
                fontWeight: "bold",
              }}
              className={`text-neutral-500 select-none hover:text-gray-600 cursor-pointer text-base w-full py-4 flex items-center justify-center relative ${
                dayObj.currentMonth ? "text-white font-bold" : "text-black hover:text-[var(--accent-primary)]"
              } ${!dayObj.currentMonth ? "text-black font-bold" : ""} ${
                dayObj.isToday ? "select-none hover:text-gray-600" : ""
              }`}
            >
              <div className="flex flex-col items-center">
                <span>{dayObj.day}</span>
                {dayObj.currentMonth && (
                  <span className="text-base text-neutral-500 mt-1">
                    {getStudiedHoursForDate(dayObj.date)}h
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <TaskForm
                initialAssignment=""
                initialDeadline={selectedDate.toISOString().split('T')[0]}
                onClose={(newTaskId) => {
                  setShowTaskForm(false);
                  if (newTaskId) {
                    // Refresh the task list
                    window.dispatchEvent(new CustomEvent('refreshTaskList'));
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      <DayInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        date={selectedDate}
        tasks={getTasksForDate(selectedDate)}
        studiedHours={getStudiedHoursForDate(selectedDate)}
      />
    </div>
  );
};

export default Calendar;
