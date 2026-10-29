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
  onDayContextMenu: (e: React.MouseEvent, date: Date) => void;
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
  onDayContextMenu,
}: MonthViewProps) => {
  return (
    <div className="w-full mt-1 sm:mt-2 relative flex-1 min-h-0 overflow-y-auto">
      <div className="h-full w-full max-w-4xl mx-auto flex flex-col min-h-[200px] sm:min-h-[240px]">
        {/* Weekdays */}
        <div className="mb-1 grid w-full flex-shrink-0 grid-cols-7 justify-items-center">
          {weekdays.map((day, index) => (
            <div
              key={index}
              className="flex h-7 w-full items-center justify-center text-center text-xs font-medium uppercase text-[var(--text-secondary)] sm:h-8 sm:text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid w-full grid-cols-7 gap-2 sm:gap-3">
          {calendarDays.map((dayObj, index) => {
            const dayTasks =
              dayObj.currentMonth && hasTasksWithDeadline(dayObj.date)
                ? getTasksWithDeadline(dayObj.date)
                : [];
            const taskCount = dayTasks.length;

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
                onContextMenu={(e) =>
                  dayObj.currentMonth && onDayContextMenu(e, dayObj.date)
                }
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  handleDateClick(dayObj.date);
                }}
                className={`
                  relative select-none cursor-pointer
                  flex flex-col items-center self-start
                  w-full aspect-square min-h-0 rounded-xl p-1.5 sm:p-2
                  border-2 shadow-sm transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/40
                  ${
                    isSelected
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-md'
                      : isToday
                      ? 'border-[var(--accent-primary)]/60 bg-[var(--bg-primary)]'
                      : dayObj.currentMonth
                      ? 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--accent-primary)]/50 hover:shadow-md hover:-translate-y-0.5'
                      : 'border-[var(--border-primary)]/30 bg-transparent opacity-40 shadow-none'
                  }
                `}
              >
                {/* Studied time pinned to the top of the cell */}
                {dayObj.currentMonth && hasStudied && (
                  <span className="text-[10px] sm:text-xs font-medium text-[var(--text-secondary)] tracking-tight leading-none whitespace-nowrap pt-0.5">
                    <span className="hidden sm:inline">Time Studied: </span>{studiedHours}h
                  </span>
                )}

                {/* iOS-style task badge, top-right corner */}
                {taskCount > 0 && (
                  <div className="group/badge absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10">
                    <span className="flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] sm:text-[11px] font-bold leading-none tabular-nums shadow-sm">
                      {taskCount > 9 ? '9+' : taskCount}
                    </span>

                    {/* Task titles tooltip on hover */}
                    <div className="pointer-events-none absolute top-full right-0 z-50 mt-1.5 hidden w-40 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-2 shadow-lg group-hover/badge:block">
                      <div className="space-y-1">
                        {dayTasks.slice(0, 5).map((task: any, i: number) => (
                          <div
                            key={task.id ?? i}
                            className="flex items-center gap-1.5 text-left text-xs text-[var(--text-primary)]"
                          >
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent-primary)]" />
                            <span className="truncate">{task.title || 'Untitled task'}</span>
                          </div>
                        ))}
                        {taskCount > 5 && (
                          <div className="text-left text-xs text-[var(--text-secondary)]">
                            +{taskCount - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col items-center justify-center gap-1">
                  {/* Day number */}
                  <span
                    className={`text-lg sm:text-xl font-medium leading-none
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