import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

type ViewType = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  view: ViewType;
  currentDate: Date;
  selectedDate: Date;
  onViewChange: (view: ViewType) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
}

const CalendarHeader = ({
  view,
  currentDate,
  selectedDate,
  onViewChange,
  goToPreviousMonth,
  goToNextMonth,
  goToPreviousWeek,
  goToNextWeek,
  goToPreviousDay,
  goToNextDay,
  goToToday,
}: CalendarHeaderProps) => {
  const renderDayHeader = () => {
    const isCurrentDay = new Date().toDateString() === selectedDate.toDateString();

    return (
      <div className={`text-lg font-semibold mx-2 ${
        isCurrentDay ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
      }`}>
        {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
    );
  };

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
    <div className="flex justify-between items-center mb-3 sm:mb-4 relative px-2 flex-shrink-0">
      <div className="flex items-center justify-center gap-4 px-2 py-1 rounded-lg text-[var(--text-primary)]">
        {view === 'day' ? (
          <>
            <button onClick={goToPreviousDay}>
              <FaChevronLeft size={16} />
            </button>
            {renderDayHeader()}
            <button onClick={goToNextDay}>
              <FaChevronRight size={16} />
            </button>
            <button
              onClick={goToToday}
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
          onClick={() => onViewChange('month')}
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
          onClick={() => onViewChange('week')}
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
          onClick={() => onViewChange('day')}
        >
          Day
          {view === 'day' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"></div>
          )}
        </button>
      </div>
    </div>
  );
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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

export default CalendarHeader;