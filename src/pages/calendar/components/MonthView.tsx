import React from 'react';
import { isAfter, isSameDay } from 'date-fns';

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
  setTooltipContent: (content: { date: Date; tasks: any[] } | null) => void;
}

const MonthView = ({
  calendarDays,
  hasTasksWithDeadline,
  getTasksWithDeadline,
  getStudiedHoursForDate,
  handleDateClick,
  handleDateDoubleClick,
  handleTouchEnd,
  setTooltipContent,
}: MonthViewProps) => {
  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
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
  );
};

export default MonthView;