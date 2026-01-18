import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLaps } from '@/store/appStore';

import { SYNC_EVENTS } from '@/utils/constants';
import { motion } from 'framer-motion';

interface Lap {
  id: string;
  created_at: string;
  started_at?: string;
  ended_at?: string | null;
  duration?: number; // seconds stored when completed
  name?: string;
  session_number?: number;
}

const TodaysSession = () => {
  // Get laps from Zustand store
  const { laps } = useLaps();
  
  // Function to refresh data
  const refreshData = useCallback(async () => {
    try {
      // TODO: Implement refresh with Zustand actions
      console.log('Refreshing data...');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);
  
  // Listen for session completion events to refresh data
  useEffect(() => {
    const handleSessionCompleted = () => {
      // Force a refresh of the data when a session is completed
      refreshData();
    };

    // Listen for both the general finish event and the specific sessionCompleted event
    window.addEventListener('sessionCompleted', handleSessionCompleted);
    window.addEventListener(SYNC_EVENTS.FINISH_SESSION, handleSessionCompleted);
    
    return () => {
      window.removeEventListener('sessionCompleted', handleSessionCompleted);
      window.removeEventListener(SYNC_EVENTS.FINISH_SESSION, handleSessionCompleted);
    };
  }, [refreshData]);
  
  
  // Format duration from HH:MM:SS to a human-readable format
  const formatDuration = (duration?: string | null): string => {
    if (!duration) return '0m';
    
    // If it's already a number string (seconds), convert to minutes
    if (/^\d+$/.test(duration)) {
      const seconds = parseInt(duration, 10);
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    // Handle HH:MM:SS format
    const parts = duration?.split(':') || [];
    if (parts.length !== 3) return '0m';
    
    const hh = parseInt(parts[0] || '0', 10) || 0;
    const mm = parseInt(parts[1] || '0', 10) || 0;
    const ss = parseInt(parts[2] || '0', 10) || 0;
    
    if (isNaN(hh) || isNaN(mm) || isNaN(ss)) return '0m';
    
    const totalMinutes = hh * 60 + mm + Math.round(ss / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };
  
  // Convert HH:MM:SS to seconds
  const durationToSeconds = (duration?: string | null): number => {
    if (!duration) return 0;
    
    // If it's already a number string, return it as number
    if (/^\d+$/.test(duration)) {
      return parseInt(duration, 10);
    }
    
    // Parse HH:MM:SS format
    const parts = duration?.split(':') || [];
    if (parts.length !== 3) return 0;
    
    const [hh = 0, mm = 0, ss = 0] = parts.map(Number);
    if (isNaN(hh) || isNaN(mm) || isNaN(ss)) return 0;
    
    return hh * 3600 + mm * 60 + ss;
  };

  // Memoize all derived state to prevent unnecessary recalculations
  const TODAY_CACHE_KEY = 'today_stats_cache_v1';

  const [stableMetrics, setStableMetrics] = useState({
    todaysPomodoros: 0,
    totalStudyTimeFormatted: '0m',
  });

  // Initialize from cache on mount to avoid 0 flicker after hard refresh
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TODAY_CACHE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayKey = startOfDay.toISOString().slice(0,10);
      if (cached?.date === todayKey && cached?.metrics) {
        setStableMetrics(cached.metrics);
      }
    } catch {}
  }, []);

  const {
    todaysPomodoros,
    totalStudyTimeFormatted
  } = useMemo(() => {
    // Obtener la fecha de hoy en la zona horaria local
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowLocal = new Date(todayLocal);
    tomorrowLocal.setDate(todayLocal.getDate() + 1);

    const withinToday = (d?: string | null) => {
      if (!d) return false;
      
      // Convertir la fecha de la base de datos a la zona horaria local
      const date = new Date(d);
      
      // Verificar si la fecha está dentro del día local actual
      return date >= todayLocal && date < tomorrowLocal;
    };

    // Calculate today's pomodoros and total study time based on created_at (fallback started_at)
    let totalStudyTime = 0;
    const todaysLaps = (laps as Lap[]).filter((lap) => {
      const created = lap.created_at || lap.started_at || null;
      return withinToday(created);
    });

    // Calculate total study time and pomodoros from today's laps
    let todaysPomodoros = 0;
    todaysLaps.forEach((lap) => {
      // Sum up study time from duration field
      if (typeof lap.duration === 'string') {
        totalStudyTime += durationToSeconds(lap.duration);
      }
      // Sum up completed pomodoros (if the field exists)
      if ('pomodoros_completed' in lap && typeof lap.pomodoros_completed === 'number' && lap.pomodoros_completed > 0) {
        todaysPomodoros += lap.pomodoros_completed;
      }
    });
    // Format the total study time in seconds to a human-readable format
    const totalStudyTimeFormatted = formatDuration(totalStudyTime.toString());

    return {
      todaysPomodoros,
      totalStudyTime,
      totalStudyTimeFormatted
    };
  }, [laps]); // Only recalculate when laps arrays change

  // Preserve last valid metrics to avoid overwriting with zero-only data when partially loaded
  useEffect(() => {
    const lapsLen = laps?.length ?? 0;
    const arraysEmpty = lapsLen === 0;
    if (arraysEmpty) return; // keep previous stable metrics

    const isZeroOnly = (todaysPomodoros === 0) && (totalStudyTimeFormatted === '0m');
    const prevIsZeroOnly = (stableMetrics.todaysPomodoros === 0) && (stableMetrics.totalStudyTimeFormatted === '0m');
    // If current calc is zero-only but previous had non-zero values, do not overwrite
    if (isZeroOnly && !prevIsZeroOnly) return;

    setStableMetrics({
      todaysPomodoros,
      totalStudyTimeFormatted,
    });
  }, [laps, todaysPomodoros, totalStudyTimeFormatted]); // Only depend on raw data, not derived values

  // Cache today's metrics locally whenever we compute valid non-zero data for the day
  useEffect(() => {
    const lapsLen = laps?.length ?? 0;
    const arraysEmpty = lapsLen === 0;
    if (arraysEmpty) return;
    const isZeroOnly = (todaysPomodoros === 0) && (totalStudyTimeFormatted === '0m');
    // Only cache zero-only if there was no previous cache (first load of the day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayKey = startOfDay.toISOString().slice(0,10);
    const raw = localStorage.getItem(TODAY_CACHE_KEY);
    const cached = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;
    const hasPrevCacheForToday = cached?.date === todayKey && cached?.metrics;
    if (isZeroOnly && hasPrevCacheForToday) return;
    try {
      const payload = {
        date: todayKey,
        metrics: {
          todaysPomodoros,
          totalStudyTimeFormatted,
        },
      };
      localStorage.setItem(TODAY_CACHE_KEY, JSON.stringify(payload));
    } catch {}
  }, [laps, todaysPomodoros, totalStudyTimeFormatted]); // Remove derived values from dependencies

  
  
  
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // UI-safe values to prevent flicker during transient fetch states
  const displayStudyTime =
    (totalStudyTimeFormatted && totalStudyTimeFormatted !== '0m')
      ? totalStudyTimeFormatted
      : stableMetrics.totalStudyTimeFormatted;
  const displayPomodoros =
    (typeof todaysPomodoros === 'number' && todaysPomodoros > 0)
      ? todaysPomodoros
      : stableMetrics.todaysPomodoros;

  return (
    <div className="w-full space-y-4 md:space-y-5 relative">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center pb-2 border-b border-[var(--border-primary)]"
      >
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <span className="text-sm sm:text-base md:text-lg">Today's Session</span>
        </h3>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4"
      >
        {/* Total Study Time */}
        <motion.div 
          variants={item}
          className="relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-2 sm:p-3 md:p-4 rounded-lg border-[var(--border-primary)] hover:shadow-md transition-all duration-300 w-full flex flex-col items-center text-center"
        >
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-xl xl:text-3xl font-bold text-blue-500 mb-0.5 sm:mb-1">
            {displayStudyTime}
          </div>
          <div className="text-sm sm:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
            Study Time
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        </motion.div>

        {/* Pomodoros Completed */}
        <motion.div 
          variants={item}
          className="relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-2 sm:p-3 md:p-4 rounded-lg border-[var(--border-primary)] hover:shadow-md transition-all duration-300 w-full flex flex-col items-center text-center"
        >
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-500 mb-0.5 sm:mb-1">
            {displayPomodoros}
          </div>
          <div className="text-sm sm:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
            Pomodoros
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        </motion.div>

      </motion.div>

          </div>
  );
}

export default TodaysSession;
