import React from 'react';
import { isSameDay } from 'date-fns';
import { handleAddTask } from '../utils/calendarUtils';

interface DayViewProps {
  selectedDate: Date;
  isLoggedIn: boolean;
  getTasksForDayAndHour: (day: Date, hour: number) => any[];
  setSelectedDate: (date: Date) => void;
  setShowTaskForm: (show: boolean) => void;
  setIsLoginPromptOpen: (open: boolean) => void;
}

const DayView = ({
  selectedDate,
  isLoggedIn,
  getTasksForDayAndHour,
  setSelectedDate,
  setShowTaskForm,
  setIsLoginPromptOpen,
}: DayViewProps) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isCurrentDay = isSameDay(selectedDate, new Date());


  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)]/90 border-[var(--border-primary)] rounded-lg relative min-h-0 h-full">
      {/* Header with day - Sticky header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-sm pb-1 border-b border-[var(--border-primary)]/30 flex-shrink-0">
        <div className="flex items-center justify-between p-2">
          <div className="text-lg font-medium">
            {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          {/* Time selector */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={(() => {
                const hours = selectedDate.getHours();
                const minutes = selectedDate.getMinutes();
                const period = hours >= 12 ? 'PM' : 'AM';
                const displayHour = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
                return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
              })()}
              onChange={(e) => {
                const timeValue = e.target.value;
                // Parse time in format "H:MM AM/PM" or "HH:MM AM/PM"
                const match = timeValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                if (match) {
                  let [, hoursStr, minutesStr, period] = match;
                  let hours = parseInt(hoursStr);
                  const minutes = parseInt(minutesStr);

                  // Convert 12-hour to 24-hour format
                  if (period) {
                    if (period.toUpperCase() === 'PM' && hours !== 12) {
                      hours += 12;
                    } else if (period.toUpperCase() === 'AM' && hours === 12) {
                      hours = 0;
                    }
                  }

                  if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                    const newDate = new Date(selectedDate);
                    newDate.setHours(hours, minutes, 0, 0);
                    setSelectedDate(newDate);
                  }
                }
              }}
              className="w-24 px-2 py-1 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              placeholder="H:MM AM"
            />
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                const minutes = newDate.getMinutes();
                newDate.setMinutes(minutes + 15);
                setSelectedDate(newDate);
              }}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Add 15 minutes"
            >
              ▲
            </button>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                const minutes = newDate.getMinutes();
                newDate.setMinutes(Math.max(0, minutes - 15));
                setSelectedDate(newDate);
              }}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Subtract 15 minutes"
            >
              ▼
            </button>
          </div>
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
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const height = rect.height;
                    // Calculate minutes based on click position (0-59 minutes)
                    const minutes = Math.round((y / height) * 59);
                    const newDate = new Date(selectedDate);
                    newDate.setHours(hour, minutes, 0, 0);
                    setSelectedDate(newDate);
                    if (!isLoggedIn) return setIsLoginPromptOpen(true);
                    setShowTaskForm(true);
                  }}
                  title={`Click to set time at ${format12Hour(hour)}`}
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

// Helper function for 12-hour formatting
const format12Hour = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  return `${displayHour}:00 ${period}`;
};

export default DayView;