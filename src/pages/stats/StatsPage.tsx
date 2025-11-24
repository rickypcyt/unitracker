import { memo, useEffect } from 'react';
import { useAuth, useFetchTasks, useWorkspace } from '@/store/appStore';

import Statistics from '@/pages/stats/Stats';
import StatsChartsPanel from '@/pages/stats/StatsChartsPanel';
import { fetchLaps } from '@/store/LapActions';
import { useLapRealtimeSubscription } from '@/hooks/useLapRealtimeSubscription';
import { useLocation } from 'react-router-dom';

const StatsPage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/stats';
  const fetchTasks = useFetchTasks();
  const { user } = useAuth();
  const { currentWorkspace: activeWorkspace } = useWorkspace();

  // Use the real-time subscription hook
  useLapRealtimeSubscription();

  // Refresca tasks y laps solo cuando el usuario esté listo
  useEffect(() => {
    if (user && isVisible) {
      fetchLaps();
      fetchTasks(activeWorkspace?.id);
    }
  }, [user, isVisible]); // Remove fetchTasks from dependencies

  // Escuchar eventos de actualización
  useEffect(() => {
    if (!user) return;
    const handleRefresh = () => {
      fetchLaps();
      fetchTasks(activeWorkspace?.id);
    };

    window.addEventListener('refreshStats', handleRefresh);
    window.addEventListener('studyTimerStateChanged', handleRefresh);
    window.addEventListener('resetPomodoro', handleRefresh);

    return () => {
      window.removeEventListener('refreshStats', handleRefresh);
      window.removeEventListener('studyTimerStateChanged', handleRefresh);
      window.removeEventListener('resetPomodoro', handleRefresh);
    };
  }, [user]); // Remove fetchTasks from dependencies

  return (
    <div className="w-full px-0 overflow-hidden">
      <div className="space-y-3 mb-4 mx-2 sm:mx-2 md:mx-2 lg:mx-6">
        {/* Stats Banner at the top */}
        
        {/* Charts and other content below */}
        <div className="space-y-3">
        <Statistics />
          <StatsChartsPanel />
        </div>
      </div>
    </div>
  );
});

StatsPage.displayName = 'StatsPage';

export default StatsPage; 