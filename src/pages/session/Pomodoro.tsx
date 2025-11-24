import { Bell, BellOff, MoreVertical, Pause, Play, RefreshCw, RefreshCwOff, RotateCcw } from 'lucide-react';
// Pomodoro.tsx - Refactored
import React, { useCallback, useEffect, useState } from 'react';
import { useAppStore, usePomodoroModes, useUiActions } from '@/store/appStore';

// import { POMODORO_CONFIG, POMODORO_SOUNDS } from '../../constants/pomodoro';
import { POMODORO_SOUNDS } from '../../constants/pomodoro';
import type { PomodoroModeType } from '../../types/pomodoro';
import PomodoroSettingsModal from '@/modals/PomodoroSettingsModal';
import { SYNC_EVENTS } from '@/hooks/study-timer/useStudySync';
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
  modeIndex: 0,
  currentMode: 'work' as PomodoroModeType,
  timeLeft: 1500, // Default 25 minutes
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
  const savedState = localStorage.getItem('pomodoroState');
  console.log('🔧 DEBUG: loadPomoState - saved state from localStorage:', savedState);
  
  if (!savedState) {
    console.log('🔧 DEBUG: loadPomoState - no saved state, using default');
    return { ...DEFAULT_STATE, pomodoroToday: parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10) };
  }

  try {
    const parsed = JSON.parse(savedState);
    console.log('🔧 DEBUG: loadPomoState - parsed state:', parsed);
    const state: PomoState = {
      modeIndex: safeNumber(parsed.modeIndex, 0),
      currentMode: ['work', 'break', 'longBreak'].includes(parsed.currentMode) ? parsed.currentMode : 'work',
      timeLeft: safeNumber(parsed.timeLeft, DEFAULT_STATE.timeLeft),
      isRunning: false,
      pomodoroToday: parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10),
      workSessionsBeforeLongBreak: safeNumber(parsed.workSessionsBeforeLongBreak, 4),
      workSessionsCompleted: safeNumber(parsed.workSessionsCompleted, 0),
      timeAtStart: safeNumber(parsed.timeAtStart ?? parsed.startTime, 0), // Migrate from startTime
      lastStart: parsed.lastStart ?? null, // Keep existing lastStart or null
      lastManualAdjustment: 0,
      pomodorosThisSession: parseInt(localStorage.getItem('pomodorosThisSession') || '0', 10),
      longBreakDuration: safeNumber(parsed.longBreakDuration, 900),
      manuallyPaused: parsed.manuallyPaused || false, // Load manual pause state
    };
    console.log('🔧 DEBUG: loadPomoState - final state:', state);

    const hasInvalidValues = Object.values(state).some(
      (v) => v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v))
    );
    if (hasInvalidValues) {
      console.log('🔧 DEBUG: loadPomoState - invalid values found, using default');
      localStorage.removeItem('pomodoroIsRunning');
      localStorage.removeItem('pomodorosThisSession');
      return DEFAULT_STATE;
    }

    return state;
  } catch (error) {
    console.error('🔧 DEBUG: loadPomoState - error parsing saved state:', error);
    return DEFAULT_STATE;
  }
};

const savePomoState = (state: PomoState) => {
  const toSave = {
    modeIndex: safeNumber(state.modeIndex, 0),
    currentMode: state.currentMode || 'work',
    timeLeft: safeNumber(state.timeLeft, 1500),
    timeAtStart: safeNumber(state.timeAtStart, 0),
    lastStart: state.lastStart,
    workSessionsBeforeLongBreak: safeNumber(state.workSessionsBeforeLongBreak, 4),
    workSessionsCompleted: safeNumber(state.workSessionsCompleted, 0),
    pomodoroToday: safeNumber(state.pomodoroToday, 0),
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
  localStorage.setItem(`pomodoroDailyCount_${getLocalDateString()}`, safeNumber(state.pomodoroToday, 0).toString());
};

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

const showNotification = (title: string, options: NotificationOptions) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  const opts = {
    ...options,
    icon: '/assets/apple-touch-icon-removebg-preview.png',
    silent: false,
    vibrate: [200, 100, 200],
  };

  const createNotification = () => {
    const n = new Notification(title, opts);
    setTimeout(() => n.close(), 5000);
    n.onclick = () => { window.focus(); n.close(); };
  };

  try {
    if (Notification.permission === 'granted') {
      createNotification();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((p) => p === 'granted' && createNotification());
    }
  } catch (e) {
    console.error('Notification error:', e);
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
  // const [pomodorosTodayLocal, setPomodorosTodayLocal] = useState(() =>
  //   parseInt(localStorage.getItem(`pomodoroDailyCount_${getLocalDateString()}`) || '0', 10)
  // ); // Not used

  const [alarmEnabled, toggleAlarm] = useAlarmEnabled();
  // const { total: pomodorosToday, fetchPomodoros } = usePomodorosToday(user?.id || ''); // Not used

  // Force display update when modes change
  useEffect(() => {
    console.log('🔧 DEBUG: useEffect for modes change triggered');
    console.log('🔧 DEBUG: modes.length:', modes.length);
    console.log('🔧 DEBUG: pomoState.modeIndex:', pomoState.modeIndex);
    console.log('🔧 DEBUG: pomoState.currentMode:', pomoState.currentMode);
    console.log('🔧 DEBUG: pomoState.timeLeft:', pomoState.timeLeft);
    
    // Don't update time if timer is running or manually paused - let the timer logic handle it
    if (pomoState.isRunning || pomoState.manuallyPaused) {
      console.log('🔧 DEBUG: Timer is running or manually paused, skipping mode change time update');
      return;
    }

    // Don't update time if synced and timer is stopped (to respect sync time)
    if (syncPomodoroWithTimer && !pomoState.isRunning) {
      console.log('🔧 DEBUG: Timer is synced and stopped, respecting sync time, skipping mode change time update');
      return;
    }
    
    // Check if we should be on custom mode (last mode in array)
    const customModeIndex = modes.length - 1;
    console.log('🔧 DEBUG: Checking if we should be on custom mode. Current index:', pomoState.modeIndex, 'custom index:', customModeIndex);
    
    // If we just saved a custom mode, we should be on it
    if (pomoState.modeIndex === customModeIndex) {
      // We're on the custom mode, ensure time is correct
      const customMode = modes[customModeIndex];
      if (!customMode) {
        console.error('🔧 DEBUG: Custom mode is undefined');
        return;
      }
      const correctTime = customMode[pomoState.currentMode];
      console.log('🔧 DEBUG: On custom mode - Correct time should be:', correctTime);
      console.log('🔧 DEBUG: On custom mode - Current timeLeft:', pomoState.timeLeft);
      
      if (pomoState.timeLeft !== correctTime) {
        console.log('🔧 DEBUG: Time mismatch! Updating timeLeft from', pomoState.timeLeft, 'to', correctTime);
        setPomoState(prev => {
          console.log('🔧 DEBUG: In useEffect - updating pomoState timeLeft');
          return { ...prev, timeLeft: correctTime };
        });
      } else {
        console.log('🔧 DEBUG: Time is already correct, no update needed');
      }
    } else {
      console.log('🔧 DEBUG: Not on custom mode, but checking if we should switch to it');
      // Check if the current mode's time doesn't match the expected time
      const currentModeTime = modes[pomoState.modeIndex]?.[pomoState.currentMode];
      console.log('🔧 DEBUG: Current mode time should be:', currentModeTime);
      
      if (currentModeTime && pomoState.timeLeft !== currentModeTime) {
        console.log('🔧 DEBUG: Current mode time mismatch! Updating from', pomoState.timeLeft, 'to', currentModeTime);
        setPomoState(prev => ({ ...prev, timeLeft: currentModeTime }));
      }
    }
  }, [modes, pomoState.modeIndex, pomoState.currentMode, pomoState.timeLeft, pomoState.isRunning, pomoState.manuallyPaused, syncPomodoroWithTimer]);

  // Remove session dependencies - Pomodoro is now independent
  // const activeSessionId = localStorage.getItem('activeSessionId');
  const isPomodoroRunning = pomoState.isRunning; // Remove sync dependency
  const currentModeConfig = modes[pomoState.modeIndex] || {
    work: 1500,
    break: 300,
    longBreak: 900
  };

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  // Remove database dependency - Pomodoro is now independent
  // Store pomodoro stats separately from study sessions
  const updatePomodoroStats = useCallback(async (increment = 1) => {
    try {
      // Store pomodoro stats in a separate table or localStorage
      const today = getLocalDateString();
      const currentStats = parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10);
      const newStats = currentStats + increment;
      localStorage.setItem(`pomodoroDailyCount_${today}`, String(newStats));
      
      // Update the state - removed setPomodorosTodayLocal as it's not used
      // setPomodorosTodayLocal(newStats);
      
      console.log('🔧 DEBUG: Updated pomodoro stats:', { today, currentStats, newStats });
    } catch (e) {
      console.error('Error updating pomodoro stats:', e);
    }
  }, []);

  // ============================================================================
  // POMODORO ACTIONS
  // ============================================================================

  const handlePomodoroComplete = useCallback(async () => {
    const isWork = pomoState.currentMode === 'work';
    const willTakeLongBreak = isWork &&
      (pomoState.workSessionsCompleted + 1) % pomoState.workSessionsBeforeLongBreak === 0;

    const nextMode: PomodoroModeType = isWork
      ? (willTakeLongBreak ? 'longBreak' : 'break')
      : 'work';

    // Play sound
    if (alarmEnabled) {
      const soundKey = isWork ? 'work' : (pomoState.currentMode === 'longBreak' ? 'longBreak' : 'break');
      sounds[soundKey].currentTime = 0;
      sounds[soundKey].play().catch(console.error);
    }

    // Update database for work sessions
    if (isWork) {
      window.dispatchEvent(new CustomEvent('pomodoroCompleted'));
      const current = parseInt(localStorage.getItem('pomodorosThisSession') || '0', 10);
      localStorage.setItem('pomodorosThisSession', String(current + 1));

      try {
        await updatePomodoroStats(1); // Update independent pomodoro stats
      } catch (e) {
        console.error('Error updating pomodoro count:', e);
      }
    }

    // Update state
    setPomoState((prev) => {
      if (isWork) {
        const today = getLocalDateString();
        const newCount = prev.pomodoroToday + 1;
        localStorage.setItem(`pomodoroDailyCount_${today}`, String(newCount));
        // setPomodorosTodayLocal(newCount); // Not used
      }

      const nextModeTime = currentModeConfig?.[nextMode] || 1500;
      return {
        ...prev,
        currentMode: nextMode,
        timeLeft: nextModeTime,
        pomodoroToday: isWork ? prev.pomodoroToday + 1 : prev.pomodoroToday,
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
  }, [pomoState, currentModeConfig, alarmEnabled, updatePomodoroStats]);

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

    setPomoState((prev) => ({
      ...prev,
      isRunning: false,
      currentMode: 'work',
      timeLeft: modeDuration,
      timeAtStart: 0, // Reset accumulated time
      lastStart: null, // Reset last start
      lastManualAdjustment: now,
      manuallyPaused: false, // Clear manual pause flag on reset
    }));

    // Zustand action would go here - currently using local state

    localStorage.removeItem('pomodoroState');
    localStorage.removeItem('pomodoroIsRunning');
    localStorage.removeItem('pomodorosThisSession');

    if (!fromSync) {
      window.dispatchEvent(new CustomEvent('resetTimerSync', { detail: { baseTimestamp: now } }));
      // Always emit resetCountdownSync when Pomodoro is synced to ensure all timers reset together
      if (syncPomodoroWithTimer) {
        window.dispatchEvent(new CustomEvent('resetCountdownSync', { detail: { baseTimestamp: now } }));
      }
    }
  }, [currentModeConfig, syncPomodoroWithTimer]);

  const handleModeChange = useCallback((index: number) => {
    console.log('🔧 DEBUG: handleModeChange called with index:', index);
    console.log('🔧 DEBUG: handleModeChange - current modes:', modes);
    console.log('🔧 DEBUG: handleModeChange - current pomoState:', pomoState);
    
    const safeIndex = Math.min(index, modes.length - 1);
    console.log('🔧 DEBUG: handleModeChange - safeIndex:', safeIndex);
    
    setPomoState((prev) => {
      const modeTime = modes[safeIndex]?.[prev.currentMode] || 1500;
      const newState = {
        ...prev,
        modeIndex: safeIndex,
        timeLeft: modeTime,
        isRunning: false,
      };
      console.log('🔧 DEBUG: handleModeChange - new pomoState:', newState);
      console.log('🔧 DEBUG: handleModeChange - timeLeft set to:', modeTime);
      
      // Save to localStorage
      try {
        localStorage.setItem('pomodoroState', JSON.stringify(newState));
        console.log('🔧 DEBUG: handleModeChange - saved state to localStorage');
      } catch (error) {
        console.error('🔧 DEBUG: handleModeChange - error saving state:', error);
      }
      
      return newState;
    });
  }, [modes]);

  const handleSaveCustomMode = useCallback((customMode: { work: number; break: number; longBreak: number }) => {
    console.log('🔧 DEBUG: handleSaveCustomMode called with:', customMode);
    console.log('🔧 DEBUG: Current modes before:', modes);
    console.log('🔧 DEBUG: Current pomoState before:', pomoState);
    
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
    
    console.log('🔧 DEBUG: Updated custom mode in Zustand store at index:', customModeIndex);
    
    // Update state to use the new custom mode
    setPomoState((prev) => {
      const newState = {
        ...prev,
        modeIndex: customModeIndex,
        timeLeft: customMode[prev.currentMode], // Update time left for current mode
        isRunning: false, // Stop timer when switching modes
      };
      
      console.log('🔧 DEBUG: New pomoState to be set:', newState);
      console.log('🔧 DEBUG: Time for current mode (', prev.currentMode, '):', customMode[prev.currentMode]);
      
      // Save state to localStorage
      try {
        localStorage.setItem('pomodoroState', JSON.stringify(newState));
        console.log('🔧 DEBUG: Saved pomoState to localStorage successfully');
      } catch (error) {
        console.error('Failed to save pomodoro state to localStorage:', error);
      }
      
      return newState;
    });
    
    setIsSettingsModalOpen(false);
    toast.success('Custom mode saved and activated!');
  }, [modes, updatePomodoroMode]);

  const handleTimeAdjustment = useCallback((adjustment: number) => {
    const now = Date.now();
    const maxTime = currentModeConfig?.[pomoState.currentMode] || 1500;
    const newTimeLeft = Math.max(0, Math.min(pomoState.timeLeft + adjustment, maxTime));

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
  }, [pomoState, currentModeConfig, syncPomodoroWithTimer, handlePomodoroComplete]);

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

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Save pomoState to localStorage
  useEffect(() => {
    savePomoState(pomoState);
    // Emit event for SessionPage to detect changes
    window.dispatchEvent(new CustomEvent('pomodoroStateUpdate', { detail: pomoState }));
  }, [pomoState]);

  // Save session pomodoros
  useEffect(() => {
    localStorage.setItem('pomodorosThisSession', pomoState.pomodorosThisSession.toString());
  }, [pomoState.pomodorosThisSession]);

  // Midnight reset
  useMidnightReset(useCallback(() => {
    setPomoState((prev) => ({ ...prev, pomodoroToday: 0 }));
  }, []));

  // Remove fetchPomodoros dependency - not used
  // useEffect(() => {
  //   fetchPomodoros();
  //   const handler = () => fetchPomodoros();
  //   window.addEventListener('refreshStats', handler);
  //   return () => window.removeEventListener('refreshStats', handler);
  // }, [fetchPomodoros]);

  // Study timer sync - Listen for time updates from Study Timer (same logic as Countdown)
  useEventListener(SYNC_EVENTS.STUDY_TIMER_TIME_UPDATE, (event: CustomEvent<{ time: number; isRunning: boolean }>) => {
    if (!syncPomodoroWithTimer) return;

    // IMPORTANT: If manually paused, ignore ALL sync events to prevent interference
    if (pomoState.manuallyPaused) {
      console.log('[Pomodoro] 🚫 Ignoring sync event - timer is manually paused');
      return;
    }

    const studyTime = Math.floor(event.detail.time); // Time elapsed in StudyTimer (seconds)
    const currentModeDuration = currentModeConfig?.work || 1500; // Current mode duration in seconds
    
    console.log('[Pomodoro] 📊 studyTimerTimeUpdate sync', { 
      studyTime, 
      currentModeDuration,
      pomoStateIsRunning: pomoState.isRunning,
      studyIsRunning: event.detail.isRunning,
      manuallyPaused: pomoState.manuallyPaused,
      willUpdate: studyTime >= 0 && currentModeDuration > 0
    });

    // If StudyTimer resets to 0, reset Pomodoro to current mode duration
    // But only if Pomodoro is also supposed to reset (don't interfere with manual pause)
    if (studyTime === 0 && currentModeDuration > 0 && !event.detail.isRunning && !pomoState.manuallyPaused) {
      console.log('[Pomodoro] ✅ StudyTimer reset detected - resetting to current mode duration');
      setPomoState(prev => ({
        ...prev,
        isRunning: false,
        currentMode: 'work',
        timeLeft: currentModeDuration,
        timeAtStart: 0, // Reset accumulated time
        lastStart: null, // Reset last start
        lastManualAdjustment: Date.now(),
        manuallyPaused: false, // Clear manual pause flag on reset
      }));
      return;
    }

    // Calculate remaining Pomodoro time based on StudyTimer elapsed time
    const remainingTime = Math.max(0, currentModeDuration - studyTime);
    
    // Only update if the time actually changed to prevent unnecessary re-renders
    // AND if not manually paused (don't override manual pause)
    // AND if the running states match (don't override manual pause)
    if (Math.abs(remainingTime - pomoState.timeLeft) >= 0.1 && 
        !pomoState.manuallyPaused && 
        pomoState.isRunning === event.detail.isRunning) {
      // Update Pomodoro display to show remaining time
      setPomoState(prev => ({ ...prev, timeLeft: remainingTime }));
    }
    
    // Sync running state with StudyTimer, but don't interfere with manual pause
    const studyIsRunning = event.detail.isRunning;
    if (studyIsRunning !== pomoState.isRunning && !pomoState.manuallyPaused) {
      if (studyIsRunning) {
        handleStart(Date.now(), true);
      } else {
        handleStop(true);
      }
    }
  });

  // Internal timer for when NOT synced - using 100ms intervals and StudyTimer's elapsed time pattern
  useEffect(() => {
    if (syncPomodoroWithTimer) return; // Don't run internal timer when synced
    
    if (!pomoState.isRunning || !pomoState.lastStart || pomoState.timeLeft <= 0) return;

    // Use StudyTimer's exact elapsed time calculation: timeAtStart + ((now - lastStart) / 1000)
    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = pomoState.timeAtStart + ((now - pomoState.lastStart!) / 1000);
      const currentModeDuration = currentModeConfig?.[pomoState.currentMode] || 1500;
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
        className="text-3xl md:text-4xl xl:text-5xl font-mono mb-6 lg:mb-4 text-center"
        role="timer"
        aria-label="Current pomodoro time"
      >
        <span>{formatPomoTime(pomoState.timeLeft)}</span>
      </div>

      {/* Time Adjustment Buttons */}
      <div className="flex gap-2 mb-4 md:mb-4 lg:mb-4">
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

      {/* Pomodoro State Footer */}
      <div className="w-full py-0 px-4 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] rounded-b-lg">
        <div className="text-center">
          <span className={`text-sm font-mono font-bold uppercase tracking-wider ${
            pomoState.currentMode === 'work' 
              ? 'text-[var(--accent-primary)]' 
              : pomoState.currentMode === 'break' 
              ? 'text-blue-500' 
              : 'text-green-500'
          }`}>
            {pomoState.currentMode === 'work' && 'Work'}
            {pomoState.currentMode === 'break' && 'Break'}
            {pomoState.currentMode === 'longBreak' && 'Long Break'}
          </span>
        </div>
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