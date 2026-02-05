import React from 'react';
import { handleAddTask } from '../utils/calendarUtils';
import { isSameDay } from 'date-fns';

interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  isLoggedIn: boolean;
  getTasksForDayAndHour: (day: Date, hour: number) => any[];
  getTasksWithDeadline: (date: Date) => any[];
  setSelectedDate: (date: Date) => void;
  setFocusedDate: (date: Date) => void;
  setShowTaskForm: (show: boolean) => void;
  setIsLoginPromptOpen: (open: boolean) => void;
  setIsInfoModalOpen: (open: boolean) => void;
  setTooltipContent: (content: { date: Date; tasks: any[] } | null) => void;
  setSelectedTask: (task: any) => void;
  setViewingTask: (task: any) => void;
}

const WeekView = ({
  currentDate,
  selectedDate,
  isLoggedIn,
  getTasksForDayAndHour,
  getTasksWithDeadline,
  setSelectedDate,
  setFocusedDate,
  setShowTaskForm,
  setIsLoginPromptOpen,
  setIsInfoModalOpen,
  setTooltipContent,
  setSelectedTask,
  setViewingTask,
}: WeekViewProps) => {
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

  // Calculate current time position for today column
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)]/90 border-[var(--border-primary)] rounded-lg relative min-h-0 h-full">
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
          return (
            <div key={hour} className="grid grid-cols-8 gap-1 border-t border-[var(--border-primary)]/30 relative">
              <div className="text-sm text-[var(--text-secondary)] p-1 text-left">
                {format12Hour(hour)}
              </div>
              {weekDays.map((day, i) => {
                const isCurrentDay = isSameDay(day, new Date());
                const dayTasks = getTasksForDayAndHour(day, hour);
                // Get all tasks for this day for the tooltip (not just this hour)
                const allDayTasks = getTasksWithDeadline(day);

                return (
                  <div
                    key={i}
                    className={`border-l border-[var(--border-primary)]/20 hover:bg-[var(--bg-secondary)]/30 cursor-pointer p-1 min-h-[60px] transition-colors relative overflow-hidden ${
                      isCurrentDay ? 'bg-[var(--accent-primary)]/5' : ''
                    }`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('[data-calendar-task]')) return;
                      handleAddTask(e, day, hour, isLoggedIn, setSelectedDate, setFocusedDate, setShowTaskForm, setIsLoginPromptOpen, setSelectedTask);
                    }}
                    onMouseEnter={() =>
                      allDayTasks.length > 0 &&
                      setTooltipContent({
                        date: day,
                        tasks: allDayTasks,
                      })
                    }
                    onMouseLeave={() => setTooltipContent(null)}
                  >
                    {isCurrentDay && hour === currentHour && (
                      <div
                        className="absolute left-0 right-0 h-0.5 border-t-2 border-[var(--accent-primary)] z-10 flex items-center"
                        style={{
                          top: `${(currentMinute / 60) * 60}px`,
                        }}
                      >
                        <div className="absolute right-0 text-xs text-[var(--accent-primary)] font-medium bg-[var(--bg-primary)] px-1">
                          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                    {dayTasks.length > 0 && (
                      <div className="absolute inset-0 flex flex-col gap-1 p-1 overflow-hidden z-5 pointer-events-none">
                        {dayTasks.slice(0, 2).map((task, taskIndex) => {
                          console.log('Rendering task:', task);
                          const occurrenceStart = task.occurrenceStart ? new Date(task.occurrenceStart) : new Date(task.deadline || day);
                          const occurrenceEnd = task.occurrenceEnd ? new Date(task.occurrenceEnd) : new Date(occurrenceStart.getTime() + 60 * 60 * 1000);
                          const taskMinute = occurrenceStart.getMinutes();
                          const topPosition = taskMinute > 0 ? (taskMinute / 60) * 60 : (taskIndex * 25);
                          const durationHours = (occurrenceEnd.getTime() - occurrenceStart.getTime()) / (60 * 60 * 1000);
                          const blockHeight = Math.max(28, Math.round(durationHours * 60) - 2);

                          return (
                            <div
                              data-calendar-task
                              key={`${task.id}-${i}-${hour}`}
                              className="bg-[var(--accent-primary)]/85 text-white text-xs sm:text-sm px-1.5 pt-1 pb-0.5 rounded shadow-sm truncate pointer-events-auto cursor-pointer transition-all hover:shadow-md border border-[var(--accent-primary)]/30"
                              style={{
                                top: `${topPosition}px`,
                                minHeight: `${blockHeight}px`,
                                maxHeight: `${blockHeight}px`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingTask(task);
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setViewingTask(task);
                              }}
                              title={`${task.title}${task.assignment ? ` - ${task.assignment}` : ''} ${occurrenceStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${occurrenceEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            >
                              <div className="font-medium truncate">{task.title || 'Sin título'}</div>
                            </div>
                          );
                        })}
                        {dayTasks.length > 2 && (
                          <div
                            data-calendar-task
                            className="bg-[var(--bg-secondary)]/95 border border-[var(--border-primary)] text-[var(--text-secondary)] text-xs sm:text-sm px-1.5 py-1 rounded text-center pointer-events-auto cursor-pointer transition-colors mt-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(day);
                              setFocusedDate(day);
                              setIsInfoModalOpen(true);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
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

// Helper function for 12-hour formatting
const format12Hour = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  return `${displayHour}:00 ${period}`;
};

export default WeekView;