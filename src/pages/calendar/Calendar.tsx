import "./mobile-calendar.css";

import { CheckCircle2, Clock } from "lucide-react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { isAfter, isSameDay, parseISO } from 'date-fns';

import BaseModal from "@/modals/BaseModal";
import LoginPromptModal from "@/modals/LoginPromptModal";
import TaskForm from "@/pages/tasks/TaskForm";
import { formatDate } from "@/utils/dateUtils";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "@/hooks/useAuth";

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

export interface TooltipContent {
  date: Date;
  tasks: any[];
}

interface CalendarProps {
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  onTooltipShow?: (content: TooltipContent | null) => void;
}

type ViewType = 'month' | 'week' | 'day';

const Calendar = ({ view = 'month' as ViewType, onViewChange, onTooltipShow }: CalendarProps) => {
  const { isLoggedIn } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [focusedDate, setFocusedDate] = useState(new Date());
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const setTooltipContent = (content: TooltipContent | null) => {
    onTooltipShow?.(content);
  };
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToPreviousWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };
  
  // Format 12-hour time
  const format12Hour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    return `${displayHour}:00 ${period}`;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setFocusedDate(date);
  };

  const { tasks } = useAppStore((state) => state.tasks);
  const laps = useAppStore((state) => state.laps.laps);

  // ---------------------
  // Data is managed by Zustand store
  // ---------------------

  
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
  
  const isCurrentWeek = (date: Date) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return date >= weekStart && date <= weekEnd;
  };

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday start
  };

  const handleAddTask = (e: React.MouseEvent, day: Date, hour: number) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true);
      return;
    }
    
    // Create new date with the clicked day and hour
    const newDate = new Date(day);
    newDate.setHours(hour, 0, 0, 0);
    
    setSelectedDate(newDate);
    setFocusedDate(newDate);
    setShowTaskForm(true);
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
    (deadlineDate: Date) => {
      const targetDate = new Date(deadlineDate);
      targetDate.setHours(0, 0, 0, 0);
      
      return tasks.some(task => {
        if (!task.deadline) return false;
        const taskDeadline = new Date(task.deadline);
        taskDeadline.setHours(0, 0, 0, 0);
        return isSameDay(parseISO(taskDeadline.toISOString()), parseISO(targetDate.toISOString()));
      });
    },
    [tasks]
  );

  const getTasksWithDeadline = useCallback(
    (date: Date) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      return tasks.filter(task => {
        if (!task.deadline || task.completed) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return isSameDay(parseISO(taskDate.toISOString()), parseISO(targetDate.toISOString()));
      });
    },
    [tasks]
  );

  const getTasksForDayAndHour = useCallback(
    (day: Date, hour: number) => {
      const targetDate = new Date(day);
      targetDate.setHours(0, 0, 0, 0);
      
      return tasks.filter(task => {
        if (!task.deadline || task.completed) return false;
        const taskDate = new Date(task.deadline);
        const taskHour = taskDate.getHours();
        const taskDay = new Date(taskDate);
        taskDay.setHours(0, 0, 0, 0);
        
        // Match day first
        if (!isSameDay(parseISO(taskDay.toISOString()), parseISO(targetDate.toISOString()))) {
          return false;
        }
        
        // Match hour: tasks show in the hour they're scheduled for
        if (taskHour === hour) {
          return true;
        }
        
        // If task is at midnight (00:00) or 9 AM (default), show it at 9 AM
        if ((taskHour === 0 || taskHour === 9) && hour === 9) {
          return true;
        }
        
        return false;
      }).sort((a, b) => {
        // Sort by deadline time
        const timeA = new Date(a.deadline || 0).getTime();
        const timeB = new Date(b.deadline || 0).getTime();
        return timeA - timeB;
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
  // Render
  // ---------------------
  const renderDayHeader = () => {
    const isCurrentDay = isToday(selectedDate);
    
    return (
      <div className={`text-lg font-semibold mx-2 ${
        isCurrentDay ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
      }`}>
        {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
    );
  };

  const CurrentTimeIndicator = ({ isWeekView = false }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const position = ((currentHour * 60 + currentMinute) / (24 * 60)) * 100;

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000); // Update every minute
      return () => clearInterval(timer);
    }, []);

    if (isWeekView) {
      if (!isToday(currentDate)) return null;
      
      // For week view, we'll handle the time indicator in the grid cells
      return null;
    } else {
      // For day view, show the time indicator (matching week view style)
      if (!isToday(selectedDate)) return null;
      
      return (
        <div 
          className="absolute left-0 right-0 h-0.5 border-t-2 border-[var(--accent-primary)] z-10 flex items-center"
          style={{
            top: `${position}%`,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="absolute left-0 text-xs text-[var(--accent-primary)] font-medium bg-[var(--bg-primary)] px-1">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      );
    }
  };

  const renderDayView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isCurrentDay = isToday(selectedDate);

    return (
      <div className="flex-1 flex flex-col bg-[var(--bg-primary)]/90 border-[var(--border-primary)] rounded-lg relative min-h-0 h-full">
        <CurrentTimeIndicator isWeekView={true} />
        {/* Header with day - Sticky header */}
        <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-sm pb-1 border-b border-[var(--border-primary)]/30 flex-shrink-0">
          <div className="text-center text-lg font-medium p-2">
            {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-auto min-h-0">
          <div className="relative">
            {hours.map((hour) => {
              const isCurrentHour = isCurrentDay && hour === currentHour;
              const dayTasks = getTasksForDayAndHour(selectedDate, hour);
              
              return (
                <div key={hour} className="grid grid-cols-5 gap-1 border-t border-[var(--border-primary)]/30 relative">
                  <div className="text-sm text-[var(--text-secondary)] p-1 text-left">
                    {format12Hour(hour)}
                  </div>
                  <div 
                    className="col-span-4 border-l border-[var(--border-primary)]/20 hover:bg-[var(--bg-secondary)]/30 cursor-pointer p-1 min-h-[60px] transition-colors relative overflow-visible"
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setHours(hour, 0, 0, 0);
                      setSelectedDate(newDate);
                      if (!isLoggedIn) return setIsLoginPromptOpen(true);
                      setShowTaskForm(true);
                    }}
                  >
                    {isCurrentHour && (
                      <div 
                        className="absolute left-0 right-0 h-0.5 border-t-2 border-[var(--accent-primary)] z-10 flex items-center"
                        style={{
                          top: `${(currentMinute / 60) * 60}px`,
                        }}
                      >
                        <div className="absolute left-0 text-xs text-[var(--accent-primary)] font-medium bg-[var(--bg-primary)] px-1">
                          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                    {dayTasks.length > 0 && (
                      <div className="absolute inset-0 flex flex-col gap-1 p-1 overflow-visible z-5 pointer-events-none">
                        {dayTasks.map((task, taskIndex) => {
                          const taskDate = new Date(task.deadline || '');
                          const taskMinute = taskDate.getMinutes();
                          const topPosition = taskMinute > 0 ? (taskMinute / 60) * 60 : (taskIndex * 25);
                          
                          return (
                            <div
                              key={task.id}
                              className="bg-[var(--accent-primary)]/85 text-white text-xs sm:text-sm px-1.5 py-1 rounded shadow-sm truncate pointer-events-auto cursor-pointer transition-all hover:shadow-md border border-[var(--accent-primary)]/30"
                              style={{ 
                                top: `${topPosition}px`,
                                maxHeight: '28px'
                              }}
                              onClick={() => {
                                const taskDeadline = new Date(task.deadline || selectedDate);
                                setSelectedDate(taskDeadline);
                                setFocusedDate(taskDeadline);
                                setShowTaskForm(true);
                              }}
                              title={`${task.title}${task.assignment ? ` - ${task.assignment}` : ''} - ${taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            >
                              <div className="font-medium truncate">{task.title}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Calculate current time position
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Only show time indicator for current day in current week
    const showTimeIndicator = isToday(currentDate);
    const todayIndex = new Date().getDay() - 1; // 0-6 (Monday-Sunday)
    const isCurrentWeek = weekDays.some(day => isToday(day));

    return (
      <div className="flex-1 flex flex-col bg-[var(--bg-primary)]/90 border-[var(--border-primary)] rounded-lg relative min-h-0 h-full">
        <CurrentTimeIndicator isWeekView={true} />
        {/* Header with days - Sticky header */}
        <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-sm pb-1 border-b border-[var(--border-primary)]/30 flex-shrink-0">
          <div className="grid grid-cols-8 gap-1">
            <div className="text-sm text-[var(--text-secondary)] font-medium p-1"></div>
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`text-center text-sm font-medium p-1 rounded ${
                  isSameDay(day, new Date())
                    ? 'text-[var(--accent-primary)] font-semibold'
                    : 'text-[var(--text-primary)]'
                }`}
              >
                <div className="text-sm sm:text-base font-medium opacity-90">{day.toLocaleDateString('en', { weekday: 'short' })}</div>
                <div className="text-base">{day.getDate()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-auto min-h-0">
          <div className="relative">
          {hours.map((hour) => {
            const isCurrentHour = showTimeIndicator && hour === currentHour;
            
            return (
              <div key={hour} className="grid grid-cols-8 gap-1 border-t border-[var(--border-primary)]/30 relative">
                <div className="text-sm text-[var(--text-secondary)] p-1 text-left">
                  {format12Hour(hour)}
                </div>
                {weekDays.map((day, i) => {
                  const isCurrentDay = isToday(day);
                  const isTodayColumn = isCurrentWeek && i === todayIndex;
                  const dayTasks = getTasksForDayAndHour(day, hour);
                  // Get all tasks for this day for the tooltip (not just this hour)
                  const allDayTasks = getTasksWithDeadline(day);
                  
                  return (
                    <div
                      key={i}
                      className={`border-l border-[var(--border-primary)]/20 hover:bg-[var(--bg-secondary)]/30 cursor-pointer p-1 min-h-[60px] transition-colors relative overflow-visible ${
                        isCurrentDay ? 'bg-[var(--accent-primary)]/5' : ''
                      }`}
                      onClick={(e) => handleAddTask(e, day, hour)}
                      onMouseEnter={() =>
                        allDayTasks.length > 0 &&
                        setTooltipContent({
                          date: day,
                          tasks: allDayTasks,
                        })
                      }
                      onMouseLeave={() => setTooltipContent(null)}
                    >
                      {isTodayColumn && isCurrentHour && (
                        <div 
                          className="absolute left-0 right-0 h-0.5 border-t-2 border-[var(--accent-primary)] z-10 flex items-center"
                          style={{
                            top: `${(currentMinute / 60) * 40}px`,
                          }}
                        >
                          <div className="absolute right-0 text-xs text-[var(--accent-primary)] font-medium bg-[var(--bg-primary)] px-1">
                            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}
                      {dayTasks.length > 0 && (
                        <div className="absolute inset-0 flex flex-col gap-1 p-1 overflow-visible z-5 pointer-events-none">
                          {dayTasks.slice(0, 2).map((task, taskIndex) => {
                            const taskDate = new Date(task.deadline || '');
                            const taskMinute = taskDate.getMinutes();
                            // Position tasks within the hour based on minutes, or stack them if same time
                            const topPosition = taskMinute > 0 ? (taskMinute / 60) * 60 : (taskIndex * 25);
                            
                            return (
                              <div
                                key={task.id}
                                className="bg-[var(--accent-primary)]/85 text-white text-xs sm:text-sm px-1.5 py-1 rounded shadow-sm truncate pointer-events-auto cursor-pointer transition-all hover:shadow-md border border-[var(--accent-primary)]/30"
                                style={{ 
                                  top: `${topPosition}px`,
                                  maxHeight: '28px'
                                }}
                                onClick={() => {
                                  const taskDeadline = new Date(task.deadline || day);
                                  setSelectedDate(taskDeadline);
                                  setFocusedDate(taskDeadline);
                                  setShowTaskForm(true);
                                }}
                                title={`${task.title}${task.assignment ? ` - ${task.assignment}` : ''} - ${taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              >
                                <div className="font-medium truncate">{task.title}</div>
                              </div>
                            );
                          })}
                          {dayTasks.length > 2 && (
                            <div className="bg-[var(--bg-secondary)]/95 border border-[var(--border-primary)] text-[var(--text-secondary)] text-xs sm:text-sm px-1.5 py-1 rounded text-center pointer-events-auto cursor-pointer transition-colors mt-auto"
                              onClick={() => {
                                setSelectedDate(day);
                                setFocusedDate(day);
                                setIsInfoModalOpen(true);
                              }}
                            >
                              +{dayTasks.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          </div>
        </div>
      </div>
    );
  };

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

  const renderWeekHeader = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Get ISO week number
    const oneJan = new Date(startOfWeek.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((startOfWeek.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((startOfWeek.getDay() + 1 + numberOfDays) / 7);
    
    const isCurrentWeekVisible = isCurrentWeek(startOfWeek);

    return (
      <div className={`text-lg font-semibold mx-2 ${
        isCurrentWeekVisible ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
      }`}>
        Week {weekNumber}
      </div>
    );
  };

  const renderMonthHeader = () => (
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
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div 
        className={`maincard p-0 pt-4 relative w-full transition-all duration-300 calendar-view flex flex-col ${
          view === 'month' ? 'min-h-[600px] lg:min-h-[650px] overflow-hidden' : 'flex-1 min-h-0 lg:min-h-[500px]'
        }`}
      >
      {/* Top bar with navigation and view switcher */}
      <div className="flex justify-between items-center mb-3 sm:mb-4 relative px-2 flex-shrink-0">
        <div className="flex items-center justify-center gap-4 px-2 py-1 rounded-lg text-[var(--text-primary)]">
          {view === 'day' ? (
            <>
              <button onClick={() => {
                const prevDay = new Date(selectedDate);
                prevDay.setDate(prevDay.getDate() - 1);
                setSelectedDate(prevDay);
              }}>
                <FaChevronLeft size={16} />
              </button>
              {renderDayHeader()}
              <button onClick={() => {
                const nextDay = new Date(selectedDate);
                nextDay.setDate(nextDay.getDate() + 1);
                setSelectedDate(nextDay);
              }}>
                <FaChevronRight size={16} />
              </button>
              <button 
                onClick={() => setSelectedDate(new Date())}
                className="text-sm px-2 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 rounded-md transition-colors"
              >
                Today
              </button>
            </>
          ) : (
            <>
              <button onClick={view === 'week' ? goToPreviousWeek : goToPreviousMonth}>
                <FaChevronLeft size={16} />
              </button>
              {view === 'week' ? renderWeekHeader() : renderMonthHeader()}
              <button onClick={view === 'week' ? goToNextWeek : goToNextMonth}>
                <FaChevronRight size={16} />
              </button>
            </>
          )}
        </div>
        <div className="inline-flex rounded-md overflow-hidden border border-[var(--border-primary)]">
          <button
            className={`flex-1 px-4 py-1.5 text-base font-medium transition-colors relative ${
              view === 'month'
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-primary)] hover:text-[var(--accent-primary)]'
            }`}
            onClick={() => onViewChange?.('month')}
          >
            Month
            {view === 'month' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"></div>
            )}
          </button>
          <button
            className={`flex-1 px-4 py-1.5 text-base font-medium border-l border-[var(--border-primary)] transition-colors relative ${
              view === 'week'
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-primary)] hover:text-[var(--accent-primary)]'
            }`}
            onClick={() => onViewChange?.('week')}
          >
            Week
            {view === 'week' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"></div>
            )}
          </button>
          <button
            className={`flex-1 px-4 py-1.5 text-base font-medium border-l border-[var(--border-primary)] transition-colors relative ${
              view === 'day'
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-primary)] hover:text-[var(--accent-primary)]'
            }`}
            onClick={() => onViewChange?.('day')}
          >
            Day
            {view === 'day' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"></div>
            )}
          </button>
        </div>
      </div>

      {/* View selector */}
      <div className={`flex-1 min-h-0 relative ${view === 'month' ? 'overflow-hidden' : ''}`}>
        {/* Tooltip is now rendered in CalendarPage below TaskFilter */}

        {view === 'week' ? renderWeekView() : view === 'day' ? renderDayView() : (
        <>
          {/* Calendar Grid */}
          <div className="w-full mt-2 sm:mt-4 relative flex-1 min-h-0">
            <div className="block border-[var(--border-primary)] p-0 sm:p-1 md:p-2 rounded-lg bg-[var(--bg-primary)]/90 h-full flex flex-col min-h-[500px]">
              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-0.5 mb-2 flex-shrink-0">
                {weekdays.map((day, index) => (
                  <div
                    key={index}
                    className="text-[var(--text-primary)] text-sm sm:text-base font-medium flex items-center justify-center h-10 sm:h-12"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-0.5 text-center flex-1 auto-rows-fr">
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
                      className={`select-none cursor-pointer text-base w-auto relative group transition-all duration-200 min-h-[60px] sm:min-h-[70px] flex flex-col ${
                        dayObj.currentMonth
                          ? dayObj.isToday
                            ? "text-[var(--accent-primary)] font-bold bg-[var(--accent-primary)]/5"
                            : "text-[var(--text-primary)] font-medium"
                          : "text-[var(--text-secondary)] opacity-60"
                      } ${
                        dayObj.isToday
                          ? "hover:bg-[var(--accent-primary)]/15 hover:rounded-md hover:shadow-sm"
                          : "hover:bg-[var(--bg-secondary)]/50 hover:rounded-md hover:shadow-sm"
                      } rounded-md border border-transparent hover:border-[var(--border-primary)]/50`}
                    >
                      {tasksWithDeadline.length > 0 && (
                        <div className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[var(--accent-primary)] opacity-90 z-10"></div>
                      )}
                      <div className="flex flex-col items-center justify-center w-full h-full p-2 sm:p-3 transition-all duration-200 flex-grow">
                        <div className="flex flex-col items-center justify-center gap-1 w-full">
                          <div className="text-base sm:text-lg font-semibold">
                            {dayObj.date.getDate()}
                          </div>
                          {dayObj.currentMonth && (
                            <div className={`text-xs sm:text-sm font-medium ${
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
        </>
      )}
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
      </div>
    </div>
  );
};

export default Calendar;
