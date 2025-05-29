import React, { memo, useEffect } from 'react';
import Statistics from '../components/tools/Stats';
import MonthLogs from '../components/statistics/MonthLogs';
import { useLocation } from 'react-router-dom';
import { useLapRealtimeSubscription } from '../hooks/useLapRealtimeSubscription';

const StatsPage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/stats';

  // Use the new hook for real-time updates
  useLapRealtimeSubscription();

  // Actualizar estadísticas cuando la página se hace visible
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshStats'));
    }
  }, [isVisible]);

  return (
    <div className="w-full px-6 pt-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Statistics />
        </div>
        <div>
          <MonthLogs />
        </div>
      </div>
    </div>
  );
});

StatsPage.displayName = 'StatsPage';

export default StatsPage; 