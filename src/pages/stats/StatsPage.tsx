import { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Statistics from '@/pages/stats/Stats';
import StatsChartsPanel from '@/pages/stats/StatsChartsPanel';
import StudySessions from '@/pages/stats/StudySessions';
import { fetchLaps } from '@/store/LapActions';
import { fetchTasks } from '@/store/TaskActions';
import { useLapRealtimeSubscription } from '@/hooks/useLapRealtimeSubscription';
import { useLocation } from 'react-router-dom';

const StatsPage = memo(() => {
  const location = useLocation();
  const dispatch = useDispatch();
  const isVisible = location.pathname === '/stats';
  const user = useSelector((state) => state.auth.user);

  // Use the real-time subscription hook
  useLapRealtimeSubscription();

  // Refresca tasks y laps solo cuando el usuario esté listo
  useEffect(() => {
    if (user && isVisible) {
      dispatch(fetchLaps());
      dispatch(fetchTasks());
    }
  }, [user, isVisible, dispatch]);

  // Escuchar eventos de actualización
  useEffect(() => {
    if (!user) return;
    const handleRefresh = () => {
      dispatch(fetchLaps());
      dispatch(fetchTasks());
    };

    window.addEventListener('refreshStats', handleRefresh);
    window.addEventListener('studyTimerStateChanged', handleRefresh);
    window.addEventListener('resetPomodoro', handleRefresh);

    return () => {
      window.removeEventListener('refreshStats', handleRefresh);
      window.removeEventListener('studyTimerStateChanged', handleRefresh);
      window.removeEventListener('resetPomodoro', handleRefresh);
    };
  }, [user, dispatch]);

  return (
    <div className="w-full px-2 pt-4 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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