import React, { memo, useCallback, useEffect } from 'react';

import Statistics from '@/pages/stats/Stats';
import StatsChartsPanel from '@/pages/stats/StatsChartsPanel';
import StudySessions from '@/pages/stats/StudySessions';
import { fetchLaps } from '@/store/LapActions';
import { useDispatch } from 'react-redux';
import { useLapRealtimeSubscription } from '@/hooks/useLapRealtimeSubscription';
import { useLocation } from 'react-router-dom';

const StatsPage = memo(() => {
  const location = useLocation();
  const dispatch = useDispatch();
  const isVisible = location.pathname === '/stats';

  // Use the real-time subscription hook
  useLapRealtimeSubscription();

  // Función para refrescar los datos
  const refreshData = useCallback(() => {
    dispatch(fetchLaps());
  }, [dispatch]);

  // Escuchar eventos de actualización
  useEffect(() => {
    const handleRefresh = () => {
      refreshData();
    };

    window.addEventListener('refreshStats', handleRefresh);
    window.addEventListener('studyTimerStateChanged', handleRefresh);
    window.addEventListener('resetPomodoro', handleRefresh);

    return () => {
      window.removeEventListener('refreshStats', handleRefresh);
      window.removeEventListener('studyTimerStateChanged', handleRefresh);
      window.removeEventListener('resetPomodoro', handleRefresh);
    };
  }, [refreshData]);

  // Actualizar cuando la página se hace visible
  useEffect(() => {
    if (isVisible) {
      refreshData();
    }
  }, [isVisible, refreshData]);

  return (
    <div className="w-full px-6 pt-10 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <StatsChartsPanel />
        </div>
        <div>
          <Statistics />
          <StudySessions />
        </div>
      </div>
    </div>
  );
});

StatsPage.displayName = 'StatsPage';

export default StatsPage; 