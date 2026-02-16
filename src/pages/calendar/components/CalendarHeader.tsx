import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import CalendarExport from '@/components/CalendarExport';
import type { Task } from '@/types/taskStorage';

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
  tasks?: Task[] | undefined;
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
  tasks,
}: CalendarHeaderProps) => {
  const renderDayHeader = () => {
    const isCurrentDay = new Date().toDateString() === selectedDate.toDateString();

    return (
      <div className={`text-sm sm:text-lg font-semibold mx-2 ${
        isCurrentDay ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
      }`}>
        <span className="sm:hidden">
          {selectedDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </span>
        <span className="hidden sm:inline">
          {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
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
      <div className={`text-sm sm:text-lg font-semibold mx-2 ${
        isCurrentWeekVisible ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
      }`}>
        <span className="sm:hidden">W{weekNumber}</span>
        <span className="hidden sm:inline">Week {weekNumber}</span>
      </div>
    );
  };

  const renderMonthHeader = () => {
  const monthIndex = currentDate.getMonth();
  const monthName = monthNames[monthIndex] || '';
  
  return (
    <div
      className={`text-sm sm:text-lg font-semibold mx-2 ${
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear()
          ? "text-[var(--accent-primary)]"
          : "text-[var(--text-primary)]"
      }`}
    >
      <span className="sm:hidden">
        {monthName.slice(0, 3)} {currentDate.getFullYear().toString().slice(2)}
      </span>
      <span className="hidden sm:inline">
        {monthName} {currentDate.getFullYear()}
      </span>
    </div>
  );
};

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:py-4 px-2 sm:px-12 gap-2 sm:gap-0">
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={view === 'day' ? goToPreviousDay : (view === 'week' ? goToPreviousWeek : goToPreviousMonth)}
          className="p-2 sm:p-0 hover:bg-[var(--bg-secondary)]/30 rounded-md sm:rounded-none transition-colors touch-manipulation"
          aria-label="Previous"
        >
          <FaChevronLeft size={16} className="sm:size-base" />
        </button>
        <div className="text-center sm:text-left px-2 sm:px-0">
          {view === 'day' && renderDayHeader()}
          {view === 'week' && renderWeekHeader()}
          {view === 'month' && renderMonthHeader()}
        </div>
        <button 
          onClick={view === 'day' ? goToNextDay : (view === 'week' ? goToNextWeek : goToNextMonth)}
          className="p-2 sm:p-0 hover:bg-[var(--bg-secondary)]/30 rounded-md sm:rounded-none transition-colors touch-manipulation"
          aria-label="Next"
        >
          <FaChevronRight size={16} className="sm:size-base" />
        </button>
      </div>
      
      {/* Center - Calendar Export Button */}
      <div className="flex items-center justify-center">
        {tasks && <CalendarExport tasks={tasks} className="hidden sm:block" />}
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        {/* View Switcher */}
        <div className="flex rounded-md overflow-hidden border border-[var(--border-primary)] text-xs sm:text-base">
          <button
            className={`flex-1 px-2 sm:px-4 py-1.5 text-sm sm:text-base font-medium transition-colors relative whitespace-nowrap touch-manipulation ${
              view === 'month'
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-primary)] hover:text-[var(--accent-primary)]'
            }`}
            onClick={() => onViewChange('month')}
          >
            <span className="hidden sm:inline">Month</span>
            <span className="sm:hidden">M</span>
            {view === 'month' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"></div>
            )}
          </button>
          <button
            className={`flex-1 px-2 sm:px-4 py-1.5 text-sm sm:text-base font-medium border-l border-[var(--border-primary)] transition-colors relative whitespace-nowrap touch-manipulation ${
              view === 'week'
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-primary)] hover:text-[var(--accent-primary)]'
            }`}
            onClick={() => onViewChange('week')}
          >
            <span className="hidden sm:inline">Week</span>
            <span className="sm:hidden">W</span>
            {view === 'week' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"></div>
            )}
          </button>
          <button
            className={`flex-1 px-2 sm:px-4 py-1.5 text-sm sm:text-base font-medium border-l border-[var(--border-primary)] transition-colors relative whitespace-nowrap touch-manipulation ${
              view === 'day'
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-primary)] hover:text-[var(--accent-primary)]'
            }`}
            onClick={() => onViewChange('day')}
          >
            <span className="hidden sm:inline">Day</span>
            <span className="sm:hidden">D</span>
            {view === 'day' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"></div>
            )}
          </button>
        </div>
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