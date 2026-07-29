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

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const MonthView = ({
  calendarDays,
  hasTasksWithDeadline,
  getTasksWithDeadline,
  getStudiedHoursForDate,
  handleDateClick,
  handleDateDoubleClick,
  handleTouchEnd,
}: MonthViewProps) => {
  return (
    <div className="w-full mt-1 sm:mt-2 relative flex-1 min-h-0 overflow-hidden">
      <div className="h-full flex flex-col min-h-[200px] sm:min-h-[240px] overflow-hidden">
        {/* Weekdays */}
        <div className="grid grid-cols-7 mb-1 flex-shrink-0">
          {weekdays.map((day, index) => (
            <div
              key={index}
              className="text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-[var(--text-secondary)] flex items-center justify-center h-6 sm:h-7"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {calendarDays.map((dayObj, index) => {
            const taskCount =
              dayObj.currentMonth && hasTasksWithDeadline(dayObj.date)
                ? getTasksWithDeadline(dayObj.date).length
                : 0;

            const studiedHours = dayObj.currentMonth
              ? getStudiedHoursForDate(dayObj.date)
              : '0';
            const hasStudied = studiedHours !== '0' && studiedHours !== '0.0';

            const isToday = !!dayObj.isToday && dayObj.currentMonth;
            const isSelected = !!dayObj.isSelected;

            return (
              <div
                key={index}
                role="button"
                tabIndex={dayObj.currentMonth ? 0 : -1}
                aria-label={`${dayObj.date.toLocaleDateString()}${
                  hasStudied ? `, ${studiedHours}h estudiadas` : ''
                }${taskCount > 0 ? `, ${taskCount} tarea${taskCount > 1 ? 's' : ''}` : ''}`}
                aria-current={dayObj.isToday ? 'date' : undefined}
                onClick={() => handleDateClick(dayObj.date)}
                onDoubleClick={() =>
                  dayObj.currentMonth && handleDateDoubleClick(dayObj.date)
                }
                onTouchEnd={(e) =>
                  dayObj.currentMonth && handleTouchEnd(e, dayObj.date)
                }
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  handleDateClick(dayObj.date);
                }}
                className={`
                  select-none cursor-pointer
                  flex flex-col items-center justify-center
                  rounded-md p-0.5 sm:p-1
                  border transition-all duration-150
                  h-8 sm:h-10
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/40
                  ${
                    isSelected
                      ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/8'
                      : isToday
                      ? 'border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5'
                      : dayObj.currentMonth
                      ? 'border-[var(--border-primary)]/40 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]/50 hover:border-[var(--border-primary)]/70'
                      : 'border-transparent bg-transparent opacity-40'
                  }
                `}
              >
                <div className="flex items-center gap-1">
                  {/* Day number */}
                  <span
                    className={`text-[11px] sm:text-xs font-medium leading-none
                      ${
                        isToday
                          ? 'text-[var(--accent-primary)] font-bold'
                          : isSelected
                          ? 'text-[var(--text-primary)] font-semibold'
                          : dayObj.currentMonth
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)]'
                      }`}
                  >
                    {dayObj.date.getDate()}
                  </span>

                  {/* Task dots inline */}
                  {taskCount > 0 && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(taskCount, 3) }).map((_, i) => (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full bg-[var(--accent-primary)]"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Studied hours */}
                {dayObj.currentMonth && hasStudied && (
                  <div className="text-[8px] sm:text-[9px] font-medium text-[var(--text-secondary)] tracking-tight leading-none mt-0.5">
                    {studiedHours}h
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthView;