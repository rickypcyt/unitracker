import { ChevronLeft, ChevronRight } from 'lucide-react';

import React from 'react';
import StatsChart from './StatsChart';

const weekDayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const WeekStatsCard = ({ data, accentColor, shownWeekNumber, weekOffset, setWeekOffset, isDemo }) => {
  // Asegura que siempre haya 7 elementos, uno por cada día de la semana
  const weekData = weekDayInitials.map((label, idx) => {
    const d = data && data[idx] ? data[idx] : { minutes: 0, hoursLabel: '0:00', date: '', dayName: label };
    return {
      ...d,
      dayName: label,
    };
  });

  return (
    <div className="w-full">
      <div className="maincard p-0.5 mb-1">
        <div className="flex items-center justify-center gap-2 w-full mb-1 mt-1">
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-lg text-center select-none transition-colors duration-200 text-[var(--accent-primary)]">
            {`Week ${shownWeekNumber}`}
          </span>
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Next week"
            disabled={weekOffset === 0}
          >
            <ChevronRight size={20} className={weekOffset === 0 ? 'opacity-40 cursor-not-allowed' : ''} />
          </button>
        </div>
        <div className="overflow-x-auto scroll-smooth w-full">
          <div className="min-w-[600px]">
            <StatsChart
              data={weekData}
              title={`Week ${shownWeekNumber}`}
              accentColor={accentColor}
              small
              customTitle={<></>}
              xAxisTicks={weekDayInitials}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekStatsCard; 