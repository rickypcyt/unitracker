import React from 'react';
import StatsChart from './StatsChart';

const YearStatsCard = ({ data, accentColor, isDemo }) => (
  <div className="w-full">
    <div className="maincard p-0.5 mb-1">
      <div className="flex items-center justify-center w-full mb-1 mt-1">
        <span className="font-semibold text-lg text-center select-none transition-colors duration-200 text-[var(--accent-primary)]">This Year</span>
      </div>
      <div className="overflow-x-auto scroll-smooth w-full">
        <div className="min-w-[600px]">
          <StatsChart
            data={data}
            title="This Year"
            accentColor={accentColor}
            customTitle={<></>}
          />
        </div>
      </div>
    </div>
  </div>
);

export default YearStatsCard; 