import { ChevronLeft, ChevronRight } from 'lucide-react';

import React from 'react';
import StatsChart from './StatsChart';

const MonthStatsCard = ({ data, accentColor, shownMonthDate, setMonthOffset, monthOffset, isDemo }) => (
  <div className="w-full">
    <div className="maincard p-0.5 mb-1">
      <div className="w-full flex flex-col items-center mt-2 mb-2">
        <div className="flex items-center justify-center gap-2 w-full mb-1 mt-1">
          <button
            onClick={() => setMonthOffset((prev) => prev - 1)}
            className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <span
            className={`font-semibold text-lg text-center select-none transition-colors duration-200 ${monthOffset === 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
          >
            {shownMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setMonthOffset((prev) => prev + 1)}
            className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Mes siguiente"
            disabled={monthOffset >= 0}
          >
            <ChevronRight size={20} className={monthOffset >= 0 ? 'opacity-40 cursor-not-allowed' : ''} />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto scroll-smooth w-full">
        <div className="min-w-[600px]">
          <StatsChart
            data={data}
            title="This Month"
            accentColor={accentColor}
            customTitle={<></>}
          />
        </div>
      </div>
    </div>
  </div>
);

export default MonthStatsCard; 