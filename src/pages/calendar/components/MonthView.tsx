import { isAfter, isSameDay } from 'date-fns';

import React from 'react';

interface MonthViewProps {
  calendarDays: Array<{
    date: Date;
    currentMonth: boolean;
    isToday?: boolean;
    isSelected?: boolean;
  }>;
  hasTasksWithDeadline: (date: Date) => boolean;
  getTasksWithDeadline: (date: Date) => any[];
  getStudiedHoursForDate: (date: Date) => string;
  handleDateClick: (date: Date) => void;
  handleDateDoubleClick: (date: Date) => void;
  handleTouchEnd: (e: React.TouchEvent, date: Date) => void;
}

const MonthView = ({
  calendarDays,
  hasTasksWithDeadline,
  getTasksWithDeadline,
  getStudiedHoursForDate,
  handleDateClick,
  handleDateDoubleClick,
  handleTouchEnd,
}: MonthViewProps) => {
  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  const isWeekend = (index: number) => index % 7 >= 5;

  return (
    <div className="w-full mt-2 sm:mt-4 relative flex-1 min-h-0">
      <div className="block border-[var(--border-primary)] p-0 sm:p-1 md:p-2 rounded-lg bg-[var(--bg-primary)]/90 h-full flex flex-col min-h-[400px] sm:min-h-[500px]">
        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-0.5 mb-2 flex-shrink-0">
          {weekdays.map((day, index) => (
            <div
              key={index}
              className={`text-xs sm:text-sm md:text-base font-medium flex items-center justify-center h-8 sm:h-10 md:h-12 ${
                isWeekend(index)
                  ? 'text-[var(--text-secondary)]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              <span className="hidden xs:inline">{day}</span>
              <span className="xs:hidden">{day[0]}</span>
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
            const studiedHours = dayObj.currentMonth ? getStudiedHoursForDate(dayObj.date) : "0";
            const hasStudied = studiedHours !== "0" && studiedHours !== "0.0";
            const isWeekendDay = isWeekend(index);
            const taskCount = tasksWithDeadline.length;

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
                className={`select-none cursor-pointer text-sm sm:text-base w-auto relative group transition-all duration-200 min-h-[55px] xs:min-h-[60px] sm:min-h-[75px] md:min-h-[85px] flex flex-col touch-manipulation rounded-lg border ${
                  dayObj.isSelected
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 ring-1 ring-[var(--accent-primary)]/20"
                    : dayObj.isToday
                    ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5"
                    : isWeekendDay && dayObj.currentMonth
                    ? "border-transparent bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 hover:border-[var(--border-primary)]/50"
                    : "border-transparent hover:bg-[var(--bg-secondary)]/50 hover:border-[var(--border-primary)]/50"
                } ${
                  dayObj.currentMonth
                    ? dayObj.isToday
                      ? "text-[var(--accent-primary)] font-bold"
                      : "text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-secondary)] opacity-50"
                }`}
              >
                {/* Task count badge */}
                {taskCount > 0 && (
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 sm:px-1.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] z-10">
                    <span className="text-[9px] sm:text-[10px] font-bold leading-none">{taskCount}</span>
                  </div>
                )}

                <div className="flex flex-col items-center justify-start w-full h-full p-1 sm:p-1.5 md:p-2 transition-all duration-200 flex-grow gap-0.5">
                  {/* Date number */}
                  <div className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full text-xs sm:text-sm md:text-base font-semibold ${
                    dayObj.isToday && dayObj.currentMonth
                      ? 'bg-[var(--accent-primary)] text-white'
                      : ''
                  }`}>
                    {dayObj.date.getDate()}
                  </div>

                  {/* Mini task previews (desktop only) */}
                  {dayObj.currentMonth && taskCount > 0 && (
                    <div className={`hidden md:flex flex-col gap-0.5 w-full mt-0.5 overflow-hidden`}>
                      {tasksWithDeadline.slice(0, 2).map((task, i) => (
                        <div
                          key={i}
                          className="text-[10px] leading-tight text-left truncate px-1 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--text-primary)]"
                        >
                          {task.title || 'Sin título'}
                        </div>
                      ))}
                      {taskCount > 2 && (
                        <div className="text-[10px] text-[var(--text-secondary)] px-1 font-medium">
                          +{taskCount - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Studied hours indicator */}
                  {dayObj.currentMonth && hasStudied && (
                    <div className={`text-[10px] sm:text-xs font-medium mt-auto ${
                      isSameDay(dayObj.date, new Date()) || isAfter(dayObj.date, new Date())
                        ? 'text-[var(--accent-green)]'
                        : 'text-[var(--text-secondary)]'
                    }`}>
                      <span className="hidden sm:inline">{studiedHours}h</span>
                      <span className="sm:hidden">{studiedHours}</span>
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

export default MonthView;