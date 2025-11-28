import { Bell, BellOff, MoreVertical, Pause, Play, RefreshCw, RefreshCwOff, RotateCcw } from 'lucide-react';
// Pomodoro.tsx - Refactored
import React, { useCallback, useEffect, useState } from 'react';
import { useAppStore, usePomodoroModes, useUiActions } from '@/store/appStore';

// import { POMODORO_CONFIG, POMODORO_SOUNDS } from '../../constants/pomodoro';
import { POMODORO_SOUNDS } from '../../constants/pomodoro';
import type { PomodoroModeType } from '../../types/pomodoro';
import PomodoroSettingsModal from '@/modals/PomodoroSettingsModal';
// import { SYNC_EVENTS } from '@/hooks/study-timer/useStudySync'; // Not used
import SectionTitle from '@/components/SectionTitle';
import { getLocalDateString } from '@/utils/dateUtils';
// import { supabase } from '@/utils/supabaseClient'; // No longer used
import { toast } from 'sonner';
// import { useAuth } from '@/hooks/useAuth'; // Not used
import useEventListener from '@/hooks/useEventListener';

// import usePomodorosToday from '@/hooks/usePomodorosToday'; // Not used

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

// const { STORAGE_KEYS } = POMODORO_CONFIG; // Not used

const DEFAULT_STATE = {
  modeIndex: 1, // Extended Focus as default (50min work, 10min break)
  currentMode: 'work' as PomodoroModeType,
  timeLeft: 3000, // Default 50 minutes (Extended Focus work duration)
  isRunning: false,
  pomodoroToday: 0,
  workSessionsBeforeLongBreak: 4,
  workSessionsCompleted: 0,
  timeAtStart: 0, // Accumulated elapsed time like StudyTimer
  lastStart: null, // Timestamp of last start like StudyTimer
  lastManualAdjustment: 0,
  pomodorosThisSession: 0,
  longBreakDuration: 900,
};

interface PomoState {
  modeIndex: number;
  currentMode: PomodoroModeType;
  timeLeft: number;
  isRunning: boolean;
  pomodoroToday: number;
  workSessionsBeforeLongBreak: number;
  workSessionsCompleted: number;
  timeAtStart: number; // Accumulated elapsed time like StudyTimer
  lastStart: number | null; // Timestamp of last start like StudyTimer
  lastManualAdjustment: number;
  pomodorosThisSession: number;
  longBreakDuration?: number;
  manuallyPaused?: boolean; // Track if this was a manual pause
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const safeNumber = (v: unknown, def: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : def;

const formatPomoTime = (seconds: number): string => {
  const roundedSeconds = Math.round(seconds);
  const mins = Math.floor(roundedSeconds / 60);
  const secs = roundedSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const loadSounds = () => {
  const sounds = {
    work: new Audio(POMODORO_SOUNDS.WORK),
    break: new Audio(POMODORO_SOUNDS.BREAK),
    longBreak: new Audio(POMODORO_SOUNDS.LONG_BREAK),
  };
  Object.values(sounds).forEach((s) => { s.load(); s.volume = 0.5; });
  return sounds;
};

const sounds = loadSounds();

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const loadPomoState = (): PomoState => {
  const today = getLocalDateString();
  
  // Always get the authoritative daily count from localStorage first
  const authoritativeDailyCount = parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10);
  const authoritativeSessionCount = parseInt(localStorage.getItem('pomodorosThisSession') || '0', 10);
  
  const savedState = localStorage.getItem('pomodoroState');
  
  if (!savedState) {
    // No saved state - use DEFAULT_STATE but ensure count matches authoritative values
    const defaultState = { ...DEFAULT_STATE };
    
    // Limpiar modos antiguos del localStorage si existen
    try {
      const modesFromStore = localStorage.getItem('pomodoroModes');
      if (modesFromStore) {
        const modes = JSON.parse(modesFromStore);
        const hasOldModes = modes.some((mode: any) => 
          mode.label === 'Quick Sprints' || mode.label === 'Student'
        );
        
        if (hasOldModes) {
          console.log('[Pomodoro] Clearing old modes from localStorage');
          localStorage.removeItem('pomodoroModes');
        } else {
          const defaultModeConfig = modes[DEFAULT_STATE.modeIndex];
          if (defaultModeConfig && defaultModeConfig[DEFAULT_STATE.currentMode]) {
            defaultState.timeLeft = defaultModeConfig[DEFAULT_STATE.currentMode];
          }
        }
      }
    } catch (e) {
      console.warn('Could not load modes for default state, using fallback time');
    }
    
    return { 
      ...defaultState, 
      pomodoroToday: authoritativeDailyCount,
      pomodorosThisSession: authoritativeSessionCount,
      workSessionsCompleted: authoritativeSessionCount,
    };
  }

  try {
    const parsed = JSON.parse(savedState);
    const state: PomoState = {
      modeIndex: safeNumber(parsed.modeIndex, DEFAULT_STATE.modeIndex),
      currentMode: ['work', 'break', 'longBreak'].includes(parsed.currentMode) ? parsed.currentMode : 'work',
      timeLeft: safeNumber(parsed.timeLeft, DEFAULT_STATE.timeLeft),
      isRunning: false,
      pomodoroToday: authoritativeDailyCount, // Always use the authoritative value
      pomodorosThisSession: authoritativeSessionCount, // Always use the authoritative value
      workSessionsBeforeLongBreak: safeNumber(parsed.workSessionsBeforeLongBreak, 4),
      workSessionsCompleted: authoritativeSessionCount, // Always use the authoritative value
      timeAtStart: safeNumber(parsed.timeAtStart ?? parsed.startTime, 0), // Migrate from startTime
      lastStart: parsed.lastStart ?? null, // Keep existing lastStart or null
      lastManualAdjustment: 0,
      manuallyPaused: parsed.manuallyPaused || false, // Load manual pause state
    };

    const hasInvalidValues = Object.values(state).some(
      (v) => v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v))
    );
    if (hasInvalidValues) {
      localStorage.removeItem('pomodoroIsRunning');
      localStorage.removeItem('pomodorosThisSession');
      return { 
        ...DEFAULT_STATE, 
        pomodoroToday: authoritativeDailyCount,
        pomodorosThisSession: authoritativeSessionCount,
        workSessionsCompleted: authoritativeSessionCount,
      };
    }

    console.log('[Pomodoro] ✅ Loaded state with authoritative counts:', { 
      authoritativeDailyCount, 
      authoritativeSessionCount,
      statePomodoroToday: state.pomodoroToday,
      statePomodorosThisSession: state.pomodorosThisSession,
      stateWorkSessionsCompleted: state.workSessionsCompleted
    });
    return state;
  } catch (error) {
    console.error('Error parsing saved pomodoro state:', error);
    return { 
      ...DEFAULT_STATE, 
      pomodoroToday: authoritativeDailyCount,
      pomodorosThisSession: authoritativeSessionCount,
      workSessionsCompleted: authoritativeSessionCount,
    };
  }
};

const savePomoState = (state: PomoState) => {
  const toSave = {
    modeIndex: safeNumber(state.modeIndex, DEFAULT_STATE.modeIndex),
    currentMode: state.currentMode || 'work',
    timeLeft: safeNumber(state.timeLeft, DEFAULT_STATE.timeLeft),
    timeAtStart: safeNumber(state.timeAtStart, 0),
    lastStart: state.lastStart,
    workSessionsBeforeLongBreak: safeNumber(state.workSessionsBeforeLongBreak, 4),
    workSessionsCompleted: safeNumber(state.workSessionsCompleted, 0),
    // Don't save pomodoroToday here - localStorage is the authoritative source
    manuallyPaused: state.manuallyPaused || false, // Save manual pause state
  };

  const hasInvalid = Object.values(toSave).some(
    (v) => typeof v === 'number' && !Number.isFinite(v)
  );

  if (hasInvalid) {
    localStorage.removeItem('pomodoroState');
  } else {
    localStorage.setItem('pomodoroState', JSON.stringify(toSave));
  }

  localStorage.setItem('pomodoroIsRunning', state.isRunning.toString());
  // pomodoroDailyCount is managed separately in handlePomodoroComplete
};

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

const showNotification = (title: string, options: NotificationOptions) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('[Pomodoro] Notifications not supported');
    return;
  }

  console.log('[Pomodoro] Attempting to show notification:', title, options);

  const opts = {
    ...options,
    icon: '/assets/apple-touch-icon-removebg-preview.png',
    silent: false,
    vibrate: [200, 100, 200],
  };

  const createNotification = () => {
    try {
      const n = new Notification(title, opts);
      console.log('[Pomodoro] ✅ Notification created successfully:', title);
      setTimeout(() => n.close(), 5000);
      n.onclick = () => { window.focus(); n.close(); };
    } catch (error) {
      console.error('[Pomodoro] ❌ Error creating notification:', error);
    }
  };

  if (Notification.permission === 'granted') {
    createNotification();
  } else {
    console.log('[Pomodoro] ⚠️ Notification permission not granted:', Notification.permission);
  }
};

const showToast = (message: string, emoji = '') => {
  toast.success(`${message} ${emoji}`.trim(), {
    duration: 3000,
    position: 'top-right',
    style: { backgroundColor: '#000', color: '#fff', border: '2px solid var(--border-primary)' },
  });
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useAlarmEnabled = () => {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('pomodoroAlarmEnabled');
    return saved === null ? true : saved === 'true';
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      localStorage.setItem('pomodoroAlarmEnabled', String(!prev));
      return !prev;
    });
  }, []);

  return [enabled, toggle] as const;
};

const useMidnightReset = (onReset: () => void) => {
  useEffect(() => {
    const check = () => {
      const today = getLocalDateString();
      const lastReset = localStorage.getItem('lastPomodoroReset');
      if (lastReset !== today) {
        localStorage.setItem('lastPomodoroReset', today);
        localStorage.setItem(`pomodoroDailyCount_${today}`, '0');
        onReset();
      }
    };

    check();

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      check();
      setInterval(check, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [onReset]);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Pomodoro: React.FC = () => {
  // const { user }: { user: import('@supabase/supabase-js').User | null } = useAuth(); // Not used
  const { syncSettings, updatePomodoroMode } = useAppStore() as any;
  const { setSyncPomodoroWithTimer } = useUiActions();
  const syncPomodoroWithTimer = syncSettings.syncPomodoroWithTimer;
  // const isStudyRunning = ui.isStudyRunning; // Not used
  
  // Use Zustand store for modes
  const modes = usePomodoroModes();
  const [pomoState, setPomoState] = useState<PomoState>(loadPomoState);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const [localResetKey, setLocalResetKey] = useState(0);
  const [isCounting, setIsCounting] = useState(false); // Prevent double counting
  // const [pomodorosTodayLocal, setPomodorosTodayLocal] = useState(() =>
  //   parseInt(localStorage.getItem(`pomodoroDailyCount_${getLocalDateString()}`) || '0', 10)
  // ); // Not used

  const [alarmEnabled, toggleAlarm] = useAlarmEnabled();
  // const { total: pomodorosToday, fetchPomodoros } = usePomodorosToday(user?.id || ''); // Not used

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  // Remove database dependency - Pomodoro is now independent
  // Store pomodoro stats separately from study sessions
  const updatePomodoroStats = useCallback(async (increment = 1) => {
    try {
      // Get current pomodoro count to save to database
      const today = getLocalDateString();
      const currentPomodoroCount = parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10);
      
      console.log('🔧 DEBUG: Saving pomodoro stats to database:', { 
        increment, 
        currentPomodoroCount,
        today 
      });
      
      // TODO: Implement database save here
      // await savePomodoroStatsToDatabase({
      //   date: today,
      //   pomodoroCount: currentPomodoroCount,
      //   sessionId: getCurrentSessionId()
      // });
      
    } catch (e) {
      console.error('Error updating pomodoro stats:', e);
    }
  }, []);

  // ============================================================================
// POMODORO COUNT MANAGEMENT (inside component)
  // ============================================================================

  // Single source of truth for pomodoro count
  const getPomodoroCount = useCallback(() => {
    const today = getLocalDateString();
    return parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10);
  }, []);

  const incrementPomodoroCount = useCallback(async () => {
    // Prevent double counting
    if (isCounting) {
      console.log('[Pomodoro] ⚠️ Already counting, skipping duplicate call');
      return;
    }
    
    setIsCounting(true);
    const currentCount = getPomodoroCount();
    console.log('[Pomodoro] 🍅 Incrementing pomodoro count:', {
      currentCount,
      stateCount: pomoState.pomodoroToday,
      stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });
    
    try {
      // Get current count from single source of truth
      const newCount = currentCount + 1;
      const today = getLocalDateString();
      
      // Update localStorage (single source of truth)
      localStorage.setItem(`pomodoroDailyCount_${today}`, String(newCount));
      localStorage.setItem('pomodorosThisSession', String(newCount));
      
      // Update state to match localStorage
      setPomoState(prev => ({
        ...prev,
        pomodoroToday: newCount,
        pomodorosThisSession: newCount,
        workSessionsCompleted: prev.workSessionsCompleted + 1,
      }));
      
      // Dispatch event and update stats
      window.dispatchEvent(new CustomEvent('pomodoroCompleted'));
      await updatePomodoroStats(1);
      
      console.log('[Pomodoro] ✅ Pomodoro count updated:', { 
        newCount,
        previousCount: currentCount
      });
      
      return newCount;
    } finally {
      // Always reset the flag after a short delay
      setTimeout(() => setIsCounting(false), 100);
    }
  }, [getPomodoroCount, updatePomodoroStats, isCounting, pomoState.pomodoroToday]);

  // Reset pomodoro count to 0
  const resetPomodoroCount = useCallback(() => {
    console.log('[Pomodoro] 🔄 Resetting pomodoro count to 0');
    const today = getLocalDateString();
    
    // Reset localStorage (single source of truth)
    localStorage.setItem(`pomodoroDailyCount_${today}`, '0');
    localStorage.setItem('pomodorosThisSession', '0');
    
    // Update state to match localStorage
    setPomoState(prev => ({
      ...prev,
      pomodoroToday: 0,
      pomodorosThisSession: 0,
      workSessionsCompleted: 0,
    }));
  }, []);

  // Force display update when modes change
  useEffect(() => {
    // Don't update time if timer is running or manually paused - let the timer logic handle it
    if (pomoState.isRunning || pomoState.manuallyPaused) {
      return;
    }

    // Don't update time if synced and timer is stopped (to respect sync time)
    if (syncPomodoroWithTimer && !pomoState.isRunning) {
      return;
    }
    
    // Check if we should be on custom mode (last mode in array)
    const customModeIndex = modes.length - 1;
    
    // If we just saved a custom mode, we should be on it
    if (pomoState.modeIndex === customModeIndex) {
      // We're on the custom mode, ensure time is correct
      const customMode = modes[customModeIndex];
      if (!customMode) {
        console.error('Custom mode is undefined');
        return;
      }
      const correctTime = customMode[pomoState.currentMode];
      
      if (pomoState.timeLeft !== correctTime) {
        setPomoState(prev => ({ ...prev, timeLeft: correctTime }));
      }
    } else {
      // Check if the current mode's time doesn't match the expected time
      const currentModeTime = modes[pomoState.modeIndex]?.[pomoState.currentMode];
      
      if (currentModeTime && pomoState.timeLeft !== currentModeTime) {
        setPomoState(prev => ({ ...prev, timeLeft: currentModeTime }));
      }
    }
  }, [modes, pomoState.modeIndex, pomoState.currentMode, pomoState.timeLeft, pomoState.isRunning, pomoState.manuallyPaused, syncPomodoroWithTimer]);

  // Remove session dependencies - Pomodoro is now independent
  // const activeSessionId = localStorage.getItem('activeSessionId');
  const isPomodoroRunning = pomoState.isRunning; // Remove sync dependency
  
  // Ensure we always have a valid mode configuration - use Extended Focus as sensible default
  const getDefaultModeConfig = () => ({
    work: 3000, // 50min - Extended Focus default
    break: 600, // 10min - Extended Focus default  
    longBreak: 1800, // 30min - Extended Focus default
  });
  
  const currentModeConfig = modes[pomoState.modeIndex] || getDefaultModeConfig();

  // ============================================================================
  // POMODORO ACTIONS
  // ============================================================================

  const handlePomodoroComplete = useCallback(async () => {
    console.log('[Pomodoro] 🍅 Session completed - current mode:', pomoState.currentMode);
    
    const isWork = pomoState.currentMode === 'work';
    const willTakeLongBreak = isWork &&
      (pomoState.workSessionsCompleted + 1) % pomoState.workSessionsBeforeLongBreak === 0;

    const nextMode: PomodoroModeType = isWork
      ? (willTakeLongBreak ? 'longBreak' : 'break')
      : 'work';

    console.log('[Pomodoro] 🔄 Mode transition:', {
      from: pomoState.currentMode,
      to: nextMode,
      isWork,
      willTakeLongBreak,
      workSessionsCompleted: pomoState.workSessionsCompleted,
      workSessionsBeforeLongBreak: pomoState.workSessionsBeforeLongBreak
    });

    // Play sound
    if (alarmEnabled) {
      console.log('[Pomodoro] 🔊 Playing completion sound');
      const soundKey = isWork ? 'work' : (pomoState.currentMode === 'longBreak' ? 'longBreak' : 'break');
      sounds[soundKey].currentTime = 0;
      sounds[soundKey].play().catch(console.error);
    }

    // Update database and stats for work sessions ONLY
    if (isWork) {
      console.log('[Pomodoro] 📊 Updating work session stats');
      
      // Use centralized count increment
      await incrementPomodoroCount();
    }

    // Update state - use the localStorage value as single source of truth
    setPomoState((prev) => {
      const today = getLocalDateString();
      const updatedDailyCount = isWork 
        ? parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10)
        : prev.pomodoroToday;

      const nextModeTime = currentModeConfig?.[nextMode] || (nextMode === 'break' ? 600 : nextMode === 'longBreak' ? 1800 : 3000);
      
      console.log('[Pomodoro] ⏰ Setting next mode time:', {
        nextMode,
        nextModeTime,
        nextModeMinutes: nextModeTime / 60,
        updatedDailyCount
      });
      
      return {
        ...prev,
        currentMode: nextMode,
        timeLeft: nextModeTime,
        pomodoroToday: updatedDailyCount, // Use the authoritative value from localStorage
        workSessionsCompleted: isWork ? prev.workSessionsCompleted + 1 : prev.workSessionsCompleted,
        pomodorosThisSession: isWork ? prev.pomodorosThisSession + 1 : prev.pomodorosThisSession,
      };
    });

    // Notifications
    const notifTitle = isWork
      ? (willTakeLongBreak ? 'Work Session Complete! Time for a Long Break! 🎉' : 'Work Session Complete! 🎉')
      : 'Break Complete! ⏰';
    const notifBody = isWork
      ? (willTakeLongBreak ? 'Great job! Time to take a well-deserved long break.' : 'Great job! Time to take a short break.')
      : 'Break is over! Time to get back to work.';

    console.log('[Pomodoro] 📱 Showing notification:', { notifTitle, notifBody });

    showToast(
      isWork
        ? (willTakeLongBreak ? 'Work session complete! Time for a long break.' : 'Work session complete! Time for a break.')
        : "Break is over! Let's get back to work!",
      isWork ? '🎉' : '💪'
    );

    showNotification(notifTitle, {
      body: notifBody,
      icon: isWork ? '🍅' : '💪',
      badge: isWork ? '🍅' : '💪',
      tag: 'pomodoro-notification',
      requireInteraction: true,
    });
  }, [pomoState, currentModeConfig, alarmEnabled, incrementPomodoroCount]);

  const handleStart = useCallback((baseTimestamp?: number, fromSync?: boolean) => {
    const now = baseTimestamp || Date.now();
    const modeDuration = currentModeConfig?.[pomoState.currentMode] || 1500;

    setPomoState((prev) => {
      // If we have some accumulated time and we're resuming, keep it
      // Otherwise start fresh for this session
      const newTimeAtStart = prev.timeLeft > 0 && prev.timeLeft < modeDuration 
        ? prev.timeAtStart // Keep accumulated time if we're in the middle of a session
        : 0; // Start fresh if this is a new session
      
      return {
        ...prev,
        isRunning: true,
        timeAtStart: newTimeAtStart,
        lastStart: now, // Set last start timestamp
        timeLeft: prev.timeLeft > 0 ? prev.timeLeft : modeDuration,
        lastManualAdjustment: now,
        manuallyPaused: false, // Clear manual pause flag when starting
      };
    });

    // Zustand action would go here - currently using local state

    if (!fromSync && syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent('playPomodoroSync', { detail: { baseTimestamp: now } }));
      window.dispatchEvent(new CustomEvent('playCountdownSync', { detail: { baseTimestamp: now } }));
    }
  }, [currentModeConfig, pomoState.currentMode, pomoState.timeLeft, syncPomodoroWithTimer]);

  const handleStop = useCallback((fromSync?: boolean) => {
    setPomoState((prev) => {
      // Calculate elapsed time like StudyTimer: timeAtStart + ((now - lastStart) / 1000)
      const elapsed = prev.lastStart 
        ? prev.timeAtStart + ((Date.now() - prev.lastStart) / 1000)
        : prev.timeAtStart;
      
      // Calculate the remaining time based on elapsed time
      const currentModeDuration = currentModeConfig?.[prev.currentMode] || 1500;
      const remainingTime = Math.max(0, currentModeDuration - elapsed);
      
      return {
        ...prev,
        isRunning: false,
        timeAtStart: elapsed, // Accumulate elapsed time
        timeLeft: remainingTime, // Update display to show current remaining time
        lastStart: null, // Clear last start
        lastManualAdjustment: Date.now(),
        manuallyPaused: !fromSync, // Mark as manually paused if not from sync
      };
    });

    // Zustand action would go here - currently using local state

    if (!fromSync && syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent('pauseTimerSync', { detail: { baseTimestamp: Date.now() } }));
    }
  }, [syncPomodoroWithTimer, currentModeConfig]);

  const handleReset = useCallback((fromSync?: boolean) => {
    const now = Date.now();
    const modeDuration = currentModeConfig?.work || 1500;

    // Reset pomodoro count to 0 when manually resetting
    if (!fromSync) {
      resetPomodoroCount();
    }

    setPomoState((prev) => ({
      ...prev,
      isRunning: false,
      currentMode: 'work',
      timeLeft: modeDuration,
      timeAtStart: 0, // Reset accumulated time
      lastStart: null, // Reset last start
      lastManualAdjustment: now,
      manuallyPaused: false, // Clear manual pause flag on reset
      // Don't reset count here - resetPomodoroCount handles it
    }));

    // Zustand action would go here - currently using local state

    if (!fromSync) {
      localStorage.removeItem('pomodoroState');
      localStorage.removeItem('pomodoroIsRunning');
    }

    if (!fromSync) {
      window.dispatchEvent(new CustomEvent('resetTimerSync', { detail: { baseTimestamp: now } }));
      // Always emit resetCountdownSync when Pomodoro is synced to ensure all timers reset together
      if (syncPomodoroWithTimer) {
        window.dispatchEvent(new CustomEvent('resetCountdownSync', { detail: { baseTimestamp: now } }));
      }
    }
  }, [currentModeConfig, syncPomodoroWithTimer, resetPomodoroCount]);

  const handleModeChange = useCallback((index: number) => {
    const safeIndex = Math.min(index, modes.length - 1);
    
    setPomoState((prev) => {
      const modeTime = modes[safeIndex]?.[prev.currentMode] || DEFAULT_STATE.timeLeft;
      const newState = {
        ...prev,
        modeIndex: safeIndex,
        timeLeft: modeTime,
        isRunning: false,
      };
      
      // Save to localStorage
      try {
        localStorage.setItem('pomodoroState', JSON.stringify(newState));
      } catch (error) {
        console.error('Error saving pomodoro state on mode change:', error);
      }
      
      return newState;
    });
  }, [modes]);

  const handleSaveCustomMode = useCallback((customMode: { work: number; break: number; longBreak: number }) => {
    // Find the custom mode index (last mode in array)
    const customModeIndex = modes.length - 1;
    
    // Update the custom mode in Zustand store
    updatePomodoroMode(customModeIndex, {
      label: 'Custom',
      work: customMode.work,
      break: customMode.break,
      longBreak: customMode.longBreak,
      description: 'Your personalized settings'
    });
    
    // Update state to use the new custom mode
    setPomoState((prev) => {
      const newState = {
        ...prev,
        modeIndex: customModeIndex,
        timeLeft: customMode[prev.currentMode], // Update time left for current mode
        isRunning: false, // Stop timer when switching modes
      };
      
      // Save state to localStorage
      try {
        localStorage.setItem('pomodoroState', JSON.stringify(newState));
      } catch (error) {
        console.error('Failed to save pomodoro state to localStorage:', error);
      }
      
      return newState;
    });
    
    setIsSettingsModalOpen(false);
    toast.success('Custom mode saved and activated!');
  }, [modes, updatePomodoroMode]);

  const handleTimeAdjustment = useCallback(async (adjustment: number) => {
    const now = Date.now();
    const maxTime = currentModeConfig?.[pomoState.currentMode] || 1500;
    const newTimeLeft = Math.max(0, Math.min(pomoState.timeLeft + adjustment, maxTime));

    // Check if we're completing a work session by manual adjustment
    const isWork = pomoState.currentMode === 'work';
    const wasWorkSessionCompleted = isWork && newTimeLeft === 0 && pomoState.timeLeft > 0;

    if (wasWorkSessionCompleted) {
      console.log('[Pomodoro] 🍅 Work session completed by manual adjustment');
      
      // Use centralized count increment - notification will be handled by mode transition
      await incrementPomodoroCount();

      // Transition to break mode
      const willTakeLongBreak = (pomoState.workSessionsCompleted + 1) % pomoState.workSessionsBeforeLongBreak === 0;
      const nextMode: PomodoroModeType = willTakeLongBreak ? 'longBreak' : 'break';
      const nextModeTime = currentModeConfig?.[nextMode] || (nextMode === 'break' ? 600 : 1800);
      
      setTimeout(() => {
        setPomoState(prev => ({
          ...prev,
          currentMode: nextMode,
          timeLeft: nextModeTime,
          isRunning: false,
        }));
      }, 1000);

      return;
    }

    setPomoState((prev) => {
      // If running, update timeAtStart to reflect the adjustment
      const newTimeAtStart = prev.isRunning && prev.lastStart
        ? prev.timeAtStart - adjustment // Subtract adjustment from accumulated time
        : prev.timeAtStart;
      
      return {
        ...prev,
        timeLeft: newTimeLeft,
        timeAtStart: newTimeAtStart,
        lastStart: prev.isRunning ? prev.lastStart : prev.lastStart,
        lastManualAdjustment: now,
        manuallyPaused: false, // Clear manual pause flag when adjusting time
      };
    });

    if (newTimeLeft === 0) handlePomodoroComplete();

    if (syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent('adjustStudyTimerTime', {
        detail: { adjustment: -adjustment, forceSync: true },
      }));
    }
  }, [pomoState, currentModeConfig, syncPomodoroWithTimer, incrementPomodoroCount]);

  // ============================================================================
  // SYNC EVENT HANDLERS
  // ============================================================================

  const createSyncHandler = useCallback(
    (action: 'start' | 'stop' | 'reset') =>
      (event: CustomEvent) => {
        if (!syncPomodoroWithTimer) return;
        const ts = event?.detail?.baseTimestamp || Date.now();
        if (lastSyncTimestamp === ts) return;
        setLastSyncTimestamp(ts);

        if (action === 'start' && !pomoState.isRunning) handleStart(ts, true);
        else if (action === 'stop' && pomoState.isRunning) handleStop(true);
        else if (action === 'reset') handleReset(true);
      },
    [syncPomodoroWithTimer, lastSyncTimestamp, pomoState.isRunning, handleStart, handleStop, handleReset]
  );

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  useEventListener('startPomodoro', handleStart);
  useEventListener('stopPomodoro', handleStop);
  useEventListener('resetPomodoro', handleReset);

  useEventListener('pauseTimerSync', () => {
    if (pomoState.isRunning && syncPomodoroWithTimer) handleStop(true);
  });

  useEventListener('playTimerSync', createSyncHandler('start'));
  useEventListener('playPomodoroSync', createSyncHandler('start'));
  useEventListener('pausePomodoroSync', createSyncHandler('stop'));
  useEventListener('resetTimerSync', createSyncHandler('reset'));
  useEventListener('resetPomodoroSync', createSyncHandler('reset'));
  useEventListener('resetCountdownSync', createSyncHandler('reset'));

  // Event listener for loading session pomodoros
  useEventListener('loadSessionPomodoros', useCallback((event: CustomEvent) => {
    console.log('[Pomodoro] 📡 loadSessionPomodoros event received:', event.detail);
    const { pomodoros, sessionId } = event.detail || {};
    
    if (typeof pomodoros === 'number' && pomodoros > 0) {
      console.log('[Pomodoro] 🍅 Loading session pomodoros:', { pomodoros, sessionId });
      
      // Update pomodoro count to match the session
      const today = getLocalDateString();
      localStorage.setItem(`pomodoroDailyCount_${today}`, String(pomodoros));
      localStorage.setItem('pomodorosThisSession', String(pomodoros));
      
      console.log('[Pomodoro] 💾 Updated localStorage with pomodoro count');
      
      // Update state to match localStorage
      setPomoState(prev => {
        const newState = {
          ...prev,
          pomodoroToday: pomodoros,
          pomodorosThisSession: pomodoros,
          workSessionsCompleted: pomodoros,
        };
        
        console.log('[Pomodoro] ✅ Updated pomodoro state:', newState);
        return newState;
      });
      
      console.log('[Pomodoro] ✅ Pomodoro count loaded from session:', { 
        newCount: pomodoros,
        sessionId
      });
    } else {
      console.log('[Pomodoro] ❌ Invalid pomodoros or pomodoros is 0:', { pomodoros, sessionId });
    }
  }, []));

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Save pomoState to localStorage
  useEffect(() => {
    savePomoState(pomoState);
    // Emit event for SessionPage to detect changes
    window.dispatchEvent(new CustomEvent('pomodoroStateUpdate', { detail: pomoState }));
  }, [pomoState]);

  // Sync pomodoroToday with localStorage (authoritative source) - only on mount
  useEffect(() => {
    const authoritativeCount = getPomodoroCount();
    
    if (pomoState.pomodoroToday !== authoritativeCount) {
      console.log('[Pomodoro] 🔄 Initial sync with localStorage:', {
        stateCount: pomoState.pomodoroToday,
        authoritativeCount,
        difference: authoritativeCount - pomoState.pomodoroToday
      });
      
      setPomoState(prev => ({ 
        ...prev, 
        pomodoroToday: authoritativeCount,
        pomodorosThisSession: authoritativeCount,
        workSessionsCompleted: authoritativeCount,
      }));
    }
  }, []); // Run only on mount - remove getPomodoroCount dependency to prevent re-runs

  // Save session pomodoros
  useEffect(() => {
    localStorage.setItem('pomodorosThisSession', pomoState.pomodorosThisSession.toString());
  }, [pomoState.pomodorosThisSession]);

  // Midnight reset
  useMidnightReset(useCallback(() => {
    setPomoState((prev) => ({ ...prev, pomodoroToday: 0 }));
  }, []));

  // Listen to studyTimerTimeUpdate for continuous sync (like Pomodoro does)
  useEventListener('studyTimerTimeUpdate', async (event: CustomEvent<{ time: number; isRunning: boolean }>) => {
    if (!syncPomodoroWithTimer) return;

    // If manually paused, don't do anything - just stay paused at the current value
    if (pomoState.manuallyPaused) {
      return;
    }

    const studyTime = Math.floor(event.detail.time); // Time elapsed in StudyTimer (seconds)
    
    // If StudyTimer resets to 0, reset Pomodoro to work mode and reset count
    if (studyTime === 0 && !event.detail.isRunning && !pomoState.manuallyPaused) {
      console.log('[Pomodoro] ✅ StudyTimer reset detected - resetting to work mode and count');
      
      // Use centralized reset function
      resetPomodoroCount();
      
      setPomoState(prev => ({
        ...prev,
        isRunning: false,
        currentMode: 'work',
        timeLeft: currentModeConfig?.work || 3000,
        timeAtStart: 0,
        lastStart: null,
        lastManualAdjustment: Date.now(),
        manuallyPaused: false,
        // Count is already reset by resetPomodoroCount
      }));
      return;
    }

    // Calculate how many complete cycles have passed based on studyTime
    const workDuration = currentModeConfig?.work || 3000;
    const breakDuration = currentModeConfig?.break || 600;
    const totalCycle = workDuration + breakDuration;
    
    const expectedCompletedCycles = Math.floor(studyTime / totalCycle);
    const currentCompletedCycles = pomoState.workSessionsCompleted;
    
    // Check if we need to adjust the count (user went back in time)
    if (expectedCompletedCycles < currentCompletedCycles && studyTime > 0) {
      console.log('[Pomodoro] ⏪ Time went backwards - adjusting pomodoro count:', {
        expectedCompletedCycles,
        currentCompletedCycles,
        studyTime,
        difference: currentCompletedCycles - expectedCompletedCycles
      });
      
      // Update localStorage to match the actual elapsed time
      const today = getLocalDateString();
      localStorage.setItem(`pomodoroDailyCount_${today}`, String(expectedCompletedCycles));
      localStorage.setItem('pomodorosThisSession', String(expectedCompletedCycles));
      
      // Update state to match localStorage
      setPomoState(prev => ({
        ...prev,
        pomodoroToday: expectedCompletedCycles,
        pomodorosThisSession: expectedCompletedCycles,
        workSessionsCompleted: expectedCompletedCycles,
      }));
    }

    // Calculate which mode we should be in based on studyTime
    let targetMode: PomodoroModeType = 'work';
    let timeInCurrentMode = studyTime;
    
    const longBreakDuration = currentModeConfig?.longBreak || 1800;

    // Calculate how many complete cycles have passed
    const timeInCurrentCycle = studyTime % totalCycle;
    
    // Determine current mode based on time in cycle
    if (timeInCurrentCycle < workDuration) {
      targetMode = 'work';
      timeInCurrentMode = timeInCurrentCycle;
    } else {
      targetMode = 'break';
      timeInCurrentMode = timeInCurrentCycle - workDuration;
    }

    // Get the duration for the target mode
    const targetModeDuration = targetMode === 'work' ? workDuration : 
                              targetMode === 'break' ? breakDuration : longBreakDuration;

    // Calculate remaining time in current mode
    const remainingTime = Math.max(0, targetModeDuration - timeInCurrentMode);

    // Check if we need to transition to a new mode
    if (targetMode !== pomoState.currentMode) {
      console.log('[Pomodoro] 🔄 Mode transition needed:', {
        from: pomoState.currentMode,
        to: targetMode,
        studyTime,
        timeInCurrentMode,
        remainingTime
      });

      // Check if we're transitioning from work to break (work session completed)
      // This means we completed a work session, so count the pomodoro
      const isWorkSessionCompleted = pomoState.currentMode === 'work' && targetMode === 'break';

      if (isWorkSessionCompleted) {
        console.log('[Pomodoro] 🍅 Work session completed - counting pomodoro');
        
        // Calculate break type BEFORE incrementing to ensure consistency
        const willTakeLongBreak = (pomoState.workSessionsCompleted + 1) % pomoState.workSessionsBeforeLongBreak === 0;
        const notifTitle = willTakeLongBreak ? 'Work Session Complete! Time for a Long Break! 🎉' : 'Work Session Complete! 🎉';
        const notifBody = willTakeLongBreak ? 'Great job! Time to take a well-deserved long break.' : 'Great job! Time to take a short break.';

        // Use centralized count increment
        await incrementPomodoroCount();

        // Show completion notifications (using pre-calculated values)
        showToast(
          willTakeLongBreak ? 'Work session complete! Time for a long break.' : 'Work session complete! Time for a break.',
          '🎉'
        );

        showNotification(notifTitle, {
          body: notifBody,
          icon: '🍅',
          badge: '🍅',
          tag: 'pomodoro-notification',
          requireInteraction: true,
        });

        // Play sound if enabled
        if (alarmEnabled) {
          console.log('[Pomodoro] 🔊 Playing completion sound for sync transition');
          sounds.work.currentTime = 0;
          sounds.work.play().catch(console.error);
        }
      } else {
        // Regular mode transition (not work completion)
        setPomoState(prev => ({
          ...prev,
          currentMode: targetMode,
          timeLeft: remainingTime,
          timeAtStart: timeInCurrentMode,
          isRunning: event.detail.isRunning,
        }));
      }
    } else if (Math.abs(remainingTime - pomoState.timeLeft) >= 0.1) {
      // Just update the time if we're in the same mode
      setPomoState(prev => ({ 
        ...prev, 
        timeLeft: remainingTime,
        timeAtStart: timeInCurrentMode,
      }));
    }

    // Sync running state with StudyTimer
    const studyIsRunning = event.detail.isRunning;
    if (studyIsRunning !== pomoState.isRunning && !pomoState.manuallyPaused) {
      if (studyIsRunning) {
        handleStart(Date.now(), true);
      } else {
        handleStop(true);
      }
    }
  });

  // Check for work session completion based on elapsed time
  const checkWorkSessionCompletion = useCallback(async () => {
    if (pomoState.currentMode !== 'work' || !pomoState.lastStart) return;
    
    const workDuration = currentModeConfig?.work || 3000;
    const elapsed = pomoState.timeAtStart + ((Date.now() - pomoState.lastStart) / 1000);
    
    // Check if we've completed the work session based on elapsed time
    if (elapsed >= workDuration && !pomoState.manuallyPaused) {
      // Only increment if we haven't already counted this session
      const expectedCount = Math.floor(elapsed / workDuration);
      if (expectedCount > pomoState.pomodoroToday) {
        console.log('[Pomodoro] 🍅 Work session completed by elapsed time detection');
        
        // Use centralized count increment - notification will be handled by mode transition
        await incrementPomodoroCount();
      }
    }
  }, [pomoState, currentModeConfig, incrementPomodoroCount, pomoState.pomodoroToday]);

  // Check for completion when timer is running
  useEffect(() => {
    if (!pomoState.isRunning || pomoState.currentMode !== 'work') return;
    
    const interval = setInterval(checkWorkSessionCompletion, 1000); // Check every second
    return () => clearInterval(interval);
  }, [pomoState.isRunning, pomoState.currentMode, checkWorkSessionCompletion]);

  // Internal timer for when NOT synced - using 100ms intervals and StudyTimer's elapsed time pattern
  useEffect(() => {
    if (syncPomodoroWithTimer) return; // Don't run internal timer when synced
    
    if (!pomoState.isRunning || !pomoState.lastStart || pomoState.timeLeft <= 0) return;

    // Use StudyTimer's exact elapsed time calculation: timeAtStart + ((now - lastStart) / 1000)
    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = pomoState.timeAtStart + ((now - pomoState.lastStart!) / 1000);
      const currentModeDuration = currentModeConfig?.[pomoState.currentMode] || 
        (pomoState.currentMode === 'break' ? 600 : pomoState.currentMode === 'longBreak' ? 1800 : 3000);
      const newTimeLeft = Math.max(0, currentModeDuration - elapsed);

      if (newTimeLeft <= 0) {
        if (alarmEnabled) {
          try { new Audio('/sounds/pomo-end.mp3').play(); } catch {}
        }
        handlePomodoroComplete();
        return;
      }

      // Only update if the time actually changed to prevent unnecessary re-renders
      if (Math.abs(newTimeLeft - pomoState.timeLeft) >= 0.1) {
        setPomoState((prev) => ({ ...prev, timeLeft: newTimeLeft }));
      }
    }, 100); // Update every 100ms for smooth display like StudyTimer

    return () => clearInterval(interval);
  }, [syncPomodoroWithTimer, pomoState.isRunning, pomoState.lastStart, pomoState.timeAtStart, pomoState.timeLeft, currentModeConfig, pomoState.currentMode, alarmEnabled, handlePomodoroComplete]);

  // Global sync handler
  useEffect(() => {
    if (!syncPomodoroWithTimer) return;

    const handleGlobalSync = (e: CustomEvent) => {
      const { isRunning: globalRunning } = e.detail;
      if (globalRunning !== pomoState.isRunning) {
        globalRunning ? handleStart(Date.now(), true) : handleStop(true);
      }
    };

    const handleGlobalReset = (e: CustomEvent) => {
      const { resetKey } = e.detail;
      if (resetKey !== localResetKey) {
        setLocalResetKey(resetKey);
        handleReset(true);
      }
    };

    window.addEventListener('globalTimerSync', handleGlobalSync as EventListener);
    window.addEventListener('globalResetSync', handleGlobalReset as EventListener);
    return () => {
      window.removeEventListener('globalTimerSync', handleGlobalSync as EventListener);
      window.removeEventListener('globalResetSync', handleGlobalReset as EventListener);
    };
  }, [syncPomodoroWithTimer, pomoState.isRunning, localResetKey, handleStart, handleStop, handleReset]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col items-center h-full">
      {/* Header */}
      <div className="section-title justify-center relative w-full px-4 py-3">
        <button
          type="button"
          onClick={() => setSyncPomodoroWithTimer(!syncPomodoroWithTimer)}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
          aria-label={syncPomodoroWithTimer ? 'Disable Pomodoro sync' : 'Enable Pomodoro sync'}
          title={syncPomodoroWithTimer ? 'Sync ON (click to turn OFF)' : 'Sync OFF (click to turn ON)'}
        >
          {syncPomodoroWithTimer ? (
            <RefreshCw size={20} className="icon" style={{ color: 'var(--accent-primary)' }} />
          ) : (
            <RefreshCwOff size={20} className="icon" style={{ color: 'var(--accent-primary)' }} />
          )}
        </button>

        <SectionTitle
          title="Pomodoro"
          tooltip="The Pomodoro Technique is a time management method that uses focused work sessions (typically 25 minutes) followed by short breaks."
          size="md"
        />

        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Configure pomodoro"
        >
          <MoreVertical size={20} />
        </button>

        <button
          onClick={toggleAlarm}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title={alarmEnabled ? 'Disable alarm sound' : 'Enable alarm sound'}
          aria-label="Toggle alarm sound"
        >
          {alarmEnabled ? <Bell size={20} className="text-[var(--text-secondary)]" /> : <BellOff size={20} className="text-[var(--text-secondary)]" />}
        </button>
      </div>

      {/* Timer Display */}
      <div
        className="relative group text-3xl md:text-4xl xl:text-5xl font-mono mb-6 lg:mb-4 text-center text-[var(--text-primary)]"
        role="timer"
        aria-label="Current pomodoro time"
      >
        <span>{formatPomoTime(pomoState.timeLeft)}</span>
        
        {/* Hover tooltip showing current mode */}
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 hidden group-hover:block bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] shadow-xl min-w-[200px] text-center">
          <div className="flex items-center justify-center gap-2">
            {pomoState.currentMode === 'work' && (
              <>
                <span className="text-lg">🍅</span>
                <span>Work Session</span>
              </>
            )}
            {pomoState.currentMode === 'break' && (
              <>
                <span className="text-lg">☕</span>
                <span>Short Break</span>
              </>
            )}
            {pomoState.currentMode === 'longBreak' && (
              <>
                <span className="text-lg">🎉</span>
                <span>Long Break</span>
              </>
            )}
          </div>
          
          {/* Additional mode info */}
          <div className="mt-2 text-xs text-[var(--text-secondary)]">
            {pomoState.currentMode === 'work' && (
              <div>Focus time: {Math.floor((currentModeConfig?.work || 3000) / 60)}min</div>
            )}
            {pomoState.currentMode === 'break' && (
              <div>Break time: {Math.floor((currentModeConfig?.break || 600) / 60)}min</div>
            )}
            {pomoState.currentMode === 'longBreak' && (
              <div>Long break: {Math.floor((currentModeConfig?.longBreak || 1800) / 60)}min</div>
            )}
          </div>
          
          {/* Pomodoro count */}
          <div className="mt-2 text-xs text-[var(--text-secondary)]">
            Completed today: {pomoState.pomodoroToday}
          </div>
        </div>
      </div>

      {/* Time adjustment buttons - only show when not synced */}
      {!syncPomodoroWithTimer && (
        <div className="flex gap-2 mb-6 md:mb-6 lg:mb-6">
          {[-600, -300, 300, 600].map((adj) => (
            <button
              key={adj}
              onClick={() => handleTimeAdjustment(adj)}
              className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label={`${adj > 0 ? 'Add' : 'Subtract'} ${Math.abs(adj / 60)} minutes`}
            >
              {adj > 0 ? '+' : ''}{adj / 60}
            </button>
          ))}
        </div>
      )}

      {/* Timer Controls */}
      <div className="timer-controls flex justify-center items-center gap-3 xl:mb-0 mb-4">
        {!syncPomodoroWithTimer && (
          <>
            <button
              onClick={() => handleReset()}
              className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Reset timer"
            >
              <RotateCcw size={20} style={{ color: 'var(--accent-primary)' }} />
            </button>
            {!isPomodoroRunning ? (
              <button
                onClick={() => handleStart()}
                className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Start timer"
              >
                <Play size={20} style={{ color: 'var(--accent-primary)' }} />
              </button>
            ) : (
              <button
                onClick={() => handleStop()}
                className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Pause timer"
              >
                <Pause size={20} style={{ color: 'var(--accent-primary)' }} />
              </button>
            )}
          </>
        )}
      </div>

      
      {/* Settings Modal */}
      <PomodoroSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentModeIndex={pomoState.modeIndex}
        onModeChange={handleModeChange}
        onSaveCustomMode={handleSaveCustomMode}
      />
    </div>
  );
};

export default Pomodoro;