import { Bell, BellOff, MoreVertical, Pause, Play, RefreshCw, RefreshCwOff, RotateCcw } from 'lucide-react';
// Pomodoro.tsx - Refactored
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore, usePomodoroModes, useUiActions } from '@/store/appStore';

// import { POMODORO_CONFIG, POMODORO_SOUNDS } from '../../constants/pomodoro';
import { POMODORO_SOUNDS } from '../../constants/pomodoro';
import type { PomodoroModeType } from '../../types/pomodoro';
import PomodoroSettingsModal from '@/modals/PomodoroSettingsModal';
// import { SYNC_EVENTS } from '@/hooks/study-timer/useStudySync'; // Not used
import SectionTitle from '@/components/SectionTitle';
import TimeSegmentDisplay from './TimeSegmentDisplay';
import { getLocalDateString } from '@/utils/dateUtils';
import { supabase } from '@/utils/supabaseClient';
// import { supabase } from '@/utils/supabaseClient'; // No longer used
import toast from 'react-hot-toast';
import { updateLap } from '@/store/LapActions';
// import { useAuth } from '@/hooks/useAuth'; // Not used
import useEventListener from '@/hooks/useEventListener';

// import usePomodorosToday from '@/hooks/usePomodorosToday'; // Not used

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

// const { STORAGE_KEYS } = POMODORO_CONFIG; // Not used

const DEFAULT_STATE = {
  modeIndex: 1,
  // Extended Focus as default (50min work, 10min break)
  currentMode: 'work' as PomodoroModeType,
  timeLeft: 3000,
  // Default 50 minutes (Extended Focus work duration)
  isRunning: false,
  pomodoroToday: 0,
  workSessionsBeforeLongBreak: 4,
  workSessionsCompleted: 0,
  timeAtStart: 0,
  // Accumulated elapsed time like StudyTimer
  lastStart: null,
  // Timestamp of last start like StudyTimer
  lastManualAdjustment: 0,
  pomodorosThisSession: 0,
  longBreakDuration: 900
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

const safeNumber = (v: unknown, def: number): number => typeof v === 'number' && Number.isFinite(v) ? v : def;
const loadSounds = () => {
  const sounds = {
    work: new Audio(POMODORO_SOUNDS.WORK),
    break: new Audio(POMODORO_SOUNDS.BREAK),
    longBreak: new Audio(POMODORO_SOUNDS.LONG_BREAK)
  };
  Object.values(sounds).forEach(s => {
    s.load();
    s.volume = 0.5;
  });
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
    const defaultState = {
      ...DEFAULT_STATE
    };

    // Limpiar modos antiguos del localStorage si existen
    try {
      const modesFromStore = localStorage.getItem('pomodoroModes');
      if (modesFromStore) {
        const modes = JSON.parse(modesFromStore);
        const hasOldModes = modes.some((mode: any) => mode.label === 'Quick Sprints' || mode.label === 'Student');
        if (hasOldModes) {
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
      workSessionsCompleted: authoritativeSessionCount
    };
  }
  try {
    const parsed = JSON.parse(savedState);
    const state: PomoState = {
      modeIndex: safeNumber(parsed.modeIndex, DEFAULT_STATE.modeIndex),
      currentMode: ['work', 'break', 'longBreak'].includes(parsed.currentMode) ? parsed.currentMode : 'work',
      timeLeft: safeNumber(parsed.timeLeft, DEFAULT_STATE.timeLeft),
      isRunning: false,
      pomodoroToday: authoritativeDailyCount,
      // Always use the authoritative value
      pomodorosThisSession: authoritativeSessionCount,
      // Always use the authoritative value
      workSessionsBeforeLongBreak: safeNumber(parsed.workSessionsBeforeLongBreak, 4),
      workSessionsCompleted: authoritativeSessionCount,
      // Always use the authoritative value
      timeAtStart: safeNumber(parsed.timeAtStart ?? parsed.startTime, 0),
      // Migrate from startTime
      lastStart: parsed.lastStart ?? null,
      // Keep existing lastStart or null
      lastManualAdjustment: 0,
      manuallyPaused: parsed.manuallyPaused || false // Load manual pause state
    };
    const hasInvalidValues = Object.values(state).some(v => v === null || v === undefined || typeof v === 'number' && !Number.isFinite(v));
    if (hasInvalidValues) {
      localStorage.removeItem('pomodoroIsRunning');
      localStorage.removeItem('pomodorosThisSession');
      return {
        ...DEFAULT_STATE,
        pomodoroToday: authoritativeDailyCount,
        pomodorosThisSession: authoritativeSessionCount,
        workSessionsCompleted: authoritativeSessionCount
      };
    }
    return state;
  } catch (error) {
    console.error('Error parsing saved pomodoro state:', error);
    return {
      ...DEFAULT_STATE,
      pomodoroToday: authoritativeDailyCount,
      pomodorosThisSession: authoritativeSessionCount,
      workSessionsCompleted: authoritativeSessionCount
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
    manuallyPaused: state.manuallyPaused || false // Save manual pause state
  };
  const hasInvalid = Object.values(toSave).some(v => typeof v === 'number' && !Number.isFinite(v));
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
    return;
  }
  const opts = {
    ...options,
    icon: '/assets/apple-touch-icon-removebg-preview.png',
    silent: false,
    vibrate: [200, 100, 200]
  };
  const createNotification = () => {
    try {
      const n = new Notification(title, opts);
      setTimeout(() => n.close(), 5000);
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (error) {
      console.error('[Pomodoro] ❌ Error creating notification:', error);
    }
  };
  if (Notification.permission === 'granted') {
    createNotification();
  } else {}
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
    setEnabled(prev => {
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

interface PomodoroProps {
  hideHeader?: boolean;
}
const Pomodoro: React.FC<PomodoroProps> = ({ hideHeader = false }) => {
  // const { user }: { user: import('@supabase/supabase-js').User | null } = useAuth(); // Not used
  const {
    syncSettings,
    updatePomodoroMode
  } = useAppStore() as any;
  const {
    setSyncPomodoroWithTimer
  } = useUiActions();
  const syncPomodoroWithTimer = syncSettings.syncPomodoroWithTimer;
  // const isStudyRunning = ui.isStudyRunning; // Not used

  // Use Zustand store for modes
  const modes = usePomodoroModes();
  const [pomoState, setPomoState] = useState<PomoState>(loadPomoState);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const [localResetKey, setLocalResetKey] = useState(0);
  const [isCounting, setIsCounting] = useState(false); // Prevent double counting

  // Listen for settings open from UnifiedTimer
  useEffect(() => {
    const handler = () => setIsSettingsModalOpen(true);
    window.addEventListener("pomodoro-open-settings", handler);
    return () => window.removeEventListener("pomodoro-open-settings", handler);
  }, []);
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
  const updatePomodoroStats = useCallback(async (_increment = 1) => {
    try {
      const activeSessionId = localStorage.getItem('activeSessionId');
      if (!activeSessionId) {
        return;
      }

      // Ensure user is authenticated
      const {
        data: {
          user
        },
        error: authError
      } = await supabase.auth.getUser();
      if (authError || !user) {
        console.warn('[Pomodoro] Skipping DB update - user not authenticated');
        return;
      }

      // Sync DB using the DAILY count as the authoritative value
      const todayKey = `pomodoroDailyCount_${getLocalDateString()}`;
      const todayCount = parseInt(localStorage.getItem(todayKey) || '0', 10) || 0;

      // Update via shared Lap action to also update store
      await updateLap(activeSessionId, {
        pomodoros_completed: todayCount
      });
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
      return;
    }
    // Additional dedupe window using lastPomoIncrementTs
    try {
      const lastTs = Number(localStorage.getItem('lastPomoIncrementTs') || '0');
      const nowTs = Date.now();
      if (lastTs && Math.abs(nowTs - lastTs) < 2000) {
        return;
      }
    } catch {}
    setIsCounting(true);
    const currentCount = getPomodoroCount();
    try {
      // Get current count from single source of truth
      const newCount = currentCount + 1; // Daily count
      const today = getLocalDateString();

      // Update localStorage (single source of truth)
      localStorage.setItem(`pomodoroDailyCount_${today}`, String(newCount));
      // Update per-session count separately (not equal to daily)
      const currentSessionCount = parseInt(localStorage.getItem('pomodorosThisSession') || '0', 10) || 0;
      const newSessionCount = currentSessionCount + 1;
      localStorage.setItem('pomodorosThisSession', String(newSessionCount));
      // Mark last increment time for deduping external events
      try {
        localStorage.setItem('lastPomoIncrementTs', String(Date.now()));
      } catch {}

      // Update state to match localStorage
      setPomoState(prev => ({
        ...prev,
        pomodoroToday: newCount,
        pomodorosThisSession: newSessionCount,
        workSessionsCompleted: prev.workSessionsCompleted + 1
      }));

      // Dispatch event (DB sync is deferred to Finish Session to avoid drift)
      window.dispatchEvent(new CustomEvent('pomodoroCompleted'));
      return newCount;
    } finally {
      // Always reset the flag after a short delay (longer window to avoid duplicates)
      setTimeout(() => setIsCounting(false), 800);
    }
  }, [getPomodoroCount, updatePomodoroStats, isCounting, pomoState.pomodoroToday]);

  // Decrement pomodoro count (e.g., when rewinding time via media controls)
  const decrementPomodoroCount = useCallback((by: number = 1) => {
    if (by <= 0) return 0;
    const today = getLocalDateString();
    const currentDaily = parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10) || 0;
    const currentSession = parseInt(localStorage.getItem('pomodorosThisSession') || '0', 10) || 0;
    const newDaily = Math.max(0, currentDaily - by);
    const newSession = Math.max(0, currentSession - by);
    localStorage.setItem(`pomodoroDailyCount_${today}`, String(newDaily));
    localStorage.setItem('pomodorosThisSession', String(newSession));
    setPomoState(prev => ({
      ...prev,
      pomodoroToday: newDaily,
      pomodorosThisSession: newSession,
      workSessionsCompleted: Math.max(0, (prev.workSessionsCompleted || 0) - by)
    }));
    return newDaily;
  }, []);

  // Reset pomodoro count to 0
  const resetPomodoroCount = useCallback(() => {
    const today = getLocalDateString();

    // Reset localStorage (single source of truth)
    localStorage.setItem(`pomodoroDailyCount_${today}`, '0');
    localStorage.setItem('pomodorosThisSession', '0');

    // Update state to match localStorage
    setPomoState(prev => ({
      ...prev,
      pomodoroToday: 0,
      pomodorosThisSession: 0,
      workSessionsCompleted: 0
    }));
  }, []);

  // Sync y notifica cuando StudyTimer emite la notificación. Incrementa sólo si NO es tras reanudar y si el tiempo indica cruce real Work->Break reciente.
  useEventListener('pomodoroWorkCompleteNotice', useCallback(async (event: CustomEvent) => {
    try {
      const detail: any = event?.detail || {};
      const prev = detail.previousMode;
      const next = detail.newMode;
      const isWorkToBreak = prev === 'Work' && (next === 'Break' || next === 'Long Break');
      if (isWorkToBreak) {
        // Validación basada en tiempo para evitar falsos positivos al reanudar
        const workDuration = currentModeConfig?.work || 3000;
        const breakDuration = currentModeConfig?.break || 600;
        const totalCycle = workDuration + breakDuration;
        const studyTime = latestStudyTimeRef.current;
        const timeInCurrentCycle = studyTime % totalCycle;
        const targetMode: PomodoroModeType = timeInCurrentCycle >= workDuration ? 'break' : 'work';
        const timeInCurrentMode = targetMode === 'break' ? timeInCurrentCycle - workDuration : timeInCurrentCycle;
        const expectedCompletedCycles = Math.floor(studyTime / totalCycle);
        const justEnteredBreak = targetMode === 'break' && timeInCurrentMode < 3; // 3s de margen
        const notAfterResume = hasSyncedFromStudyRef.current === true;
        const nextCycleReady = expectedCompletedCycles > lastCountedCycleRef.current;
        const pastResumeWindow = Date.now() > (resumeUntilTsRef.current || 0);
        if (notAfterResume && justEnteredBreak && nextCycleReady && pastResumeWindow) {
          try {
            await incrementPomodoroCount();
            lastCountedCycleRef.current = expectedCompletedCycles;
          } catch {}
        }
        if (notAfterResume && justEnteredBreak && nextCycleReady && pastResumeWindow && alarmEnabled) {
          try {
            const nowTs = Date.now();
            const lastSoundTs = Number(localStorage.getItem('lastPomoSoundTs') || '0');
            const recentlyNotified = lastSoundTs && Math.abs(nowTs - lastSoundTs) < 3000;
            if (!recentlyNotified) {
              sounds['work'].currentTime = 0;
              sounds['work'].play().catch(() => {});
              localStorage.setItem('lastPomoSoundTs', String(nowTs));
            }
          } catch {}
        }
        const notifTitle = 'Work Session Complete! 🎉';
        const notifBody = next === 'Long Break' ? 'Great job! Time to take a well-deserved long break.' : 'Great job! Time to take a short break.';
        if (notAfterResume && justEnteredBreak && nextCycleReady && pastResumeWindow) {
          try {
            const nowTs2 = Date.now();
            const lastNotifyTs2 = Number(localStorage.getItem('lastPomoNotifyTs') || '0');
            const recentlyNotified2 = lastNotifyTs2 && Math.abs(nowTs2 - lastNotifyTs2) < 3000;
            if (!recentlyNotified2) {
              showNotification(notifTitle, {
                body: notifBody,
                icon: '🍅',
                badge: '🍅',
                tag: 'pomodoro-notification',
                requireInteraction: true
              });
              localStorage.setItem('lastPomoNotifyTs', String(nowTs2));
            }
          } catch {}
        }
      }

      // Final sync from localStorage to ensure UI reflects authoritative values
      const todayCount = getPomodoroCount();
      const sessionCount = parseInt(localStorage.getItem('pomodorosThisSession') || '0', 10);
      setPomoState((prev: PomoState) => ({
        ...prev,
        pomodoroToday: todayCount,
        pomodorosThisSession: sessionCount
      }));
    } catch (e) {
      console.warn('[Pomodoro] Could not sync counts after notification', e);
    }
  }, [getPomodoroCount, alarmEnabled]));

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
        setPomoState(prev => ({
          ...prev,
          timeLeft: correctTime
        }));
      }
    } else {
      // Check if the current mode's time doesn't match the expected time
      const currentModeTime = modes[pomoState.modeIndex]?.[pomoState.currentMode];
      if (currentModeTime && pomoState.timeLeft !== currentModeTime) {
        setPomoState(prev => ({
          ...prev,
          timeLeft: currentModeTime
        }));
      }
    }
  }, [modes, pomoState.modeIndex, pomoState.currentMode, pomoState.timeLeft, pomoState.isRunning, pomoState.manuallyPaused, syncPomodoroWithTimer]);

  // Remove session dependencies - Pomodoro is now independent
  // const activeSessionId = localStorage.getItem('activeSessionId');
  const isPomodoroRunning = pomoState.isRunning; // Remove sync dependency

  // Ensure we always have a valid mode configuration - use Extended Focus as sensible default
  const getDefaultModeConfig = () => ({
    work: 3000,
    // 50min - Extended Focus default
    break: 600,
    // 10min - Extended Focus default  
    longBreak: 1800 // 30min - Extended Focus default
  });
  const currentModeConfig = modes[pomoState.modeIndex] || getDefaultModeConfig();

  // ============================================================================
  // POMODORO ACTIONS
  // ============================================================================

  const handlePomodoroComplete = useCallback(async () => {
    const isWork = pomoState.currentMode === 'work';
    const willTakeLongBreak = isWork && (pomoState.workSessionsCompleted + 1) % pomoState.workSessionsBeforeLongBreak === 0;
    const nextMode: PomodoroModeType = isWork ? willTakeLongBreak ? 'longBreak' : 'break' : 'work';
    // Play sound (deduped across tick and notification handlers)
    if (alarmEnabled) {
      try {
        const nowTs = Date.now();
        const lastSoundTs = Number(localStorage.getItem('lastPomoSoundTs') || '0');
        const recentlyNotified = lastSoundTs && Math.abs(nowTs - lastSoundTs) < 3000;
        if (!recentlyNotified) {
          const soundKey = isWork ? 'work' : pomoState.currentMode === 'longBreak' ? 'longBreak' : 'break';
          sounds[soundKey].currentTime = 0;
          sounds[soundKey].play().catch(console.error);
          localStorage.setItem('lastPomoSoundTs', String(nowTs));
        } else {}
      } catch (e) {
        console.warn('[Pomodoro] Could not process sound dedupe:', e);
      }
    }

    // Update database and stats for work sessions ONLY
    if (isWork) {
      // Deduplicate: if a manual adjustment already incremented very recently, skip
      try {
        const lastTs = Number(localStorage.getItem('lastPomoIncrementTs') || '0');
        const nowTs = Date.now();
        const recentlyIncremented = lastTs && Math.abs(nowTs - lastTs) < 1500;
        if (recentlyIncremented) {} else {
          // Use centralized count increment
          await incrementPomodoroCount();
        }
      } catch {
        await incrementPomodoroCount();
      }
    }

    // Update state - use the localStorage value as single source of truth
    setPomoState(prev => {
      const today = getLocalDateString();
      const updatedDailyCount = isWork ? parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10) : prev.pomodoroToday;
      const nextModeTime = currentModeConfig?.[nextMode] || (nextMode === 'break' ? 600 : nextMode === 'longBreak' ? 1800 : 3000);
      return {
        ...prev,
        currentMode: nextMode,
        timeLeft: nextModeTime,
        pomodoroToday: updatedDailyCount,
        // Use the authoritative value from localStorage
        workSessionsCompleted: isWork ? prev.workSessionsCompleted + 1 : prev.workSessionsCompleted,
        pomodorosThisSession: isWork ? prev.pomodorosThisSession + 1 : prev.pomodorosThisSession
      };
    });

    // Notifications
    const notifTitle = isWork ? willTakeLongBreak ? 'Work Session Complete! Time for a Long Break! 🎉' : 'Work Session Complete! 🎉' : 'Break Complete! ⏰';
    const notifBody = isWork ? willTakeLongBreak ? 'Great job! Time to take a well-deserved long break.' : 'Great job! Time to take a short break.' : 'Break is over! Time to get back to work.';
    toast(isWork ? willTakeLongBreak ? 'Work session complete! Time for a long break.' : 'Work session complete! Time for a break.' : "Break is over! Let's get back to work!", {
      icon: isWork ? '🎉' : '💪'
    });
    showNotification(notifTitle, {
      body: notifBody,
      icon: isWork ? '🍅' : '💪',
      badge: isWork ? '🍅' : '💪',
      tag: 'pomodoro-notification',
      requireInteraction: true
    });
  }, [pomoState, currentModeConfig, alarmEnabled, incrementPomodoroCount]);
  const handleStart = useCallback((baseTimestamp?: number, fromSync?: boolean) => {
    const now = baseTimestamp || Date.now();
    const modeDuration = currentModeConfig?.[pomoState.currentMode] || 1500;
    setPomoState(prev => {
      // If we have some accumulated time and we're resuming, keep it
      // Otherwise start fresh for this session
      const newTimeAtStart = prev.timeLeft > 0 && prev.timeLeft < modeDuration ? prev.timeAtStart // Keep accumulated time if we're in the middle of a session
      : 0; // Start fresh if this is a new session

      return {
        ...prev,
        isRunning: true,
        timeAtStart: newTimeAtStart,
        lastStart: now,
        // Set last start timestamp
        timeLeft: prev.timeLeft > 0 ? prev.timeLeft : modeDuration,
        lastManualAdjustment: now,
        manuallyPaused: false // Clear manual pause flag when starting
      };
    });

    // Zustand action would go here - currently using local state

    if (!fromSync && syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent('playPomodoroSync', {
        detail: {
          baseTimestamp: now
        }
      }));
      window.dispatchEvent(new CustomEvent('playCountdownSync', {
        detail: {
          baseTimestamp: now
        }
      }));
    }
  }, [currentModeConfig, pomoState.currentMode, pomoState.timeLeft, syncPomodoroWithTimer]);
  const handleStop = useCallback((fromSync?: boolean) => {
    setPomoState(prev => {
      // Calculate elapsed time like StudyTimer: timeAtStart + ((now - lastStart) / 1000)
      const elapsed = prev.lastStart ? prev.timeAtStart + (Date.now() - prev.lastStart) / 1000 : prev.timeAtStart;

      // Calculate the remaining time based on elapsed time
      const currentModeDuration = currentModeConfig?.[prev.currentMode] || 1500;
      const remainingTime = Math.max(0, currentModeDuration - elapsed);
      return {
        ...prev,
        isRunning: false,
        timeAtStart: elapsed,
        // Accumulate elapsed time
        timeLeft: remainingTime,
        // Update display to show current remaining time
        lastStart: null,
        // Clear last start
        lastManualAdjustment: Date.now(),
        manuallyPaused: !fromSync // Mark as manually paused if not from sync
      };
    });

    // Zustand action would go here - currently using local state

    if (!fromSync && syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent('pauseTimerSync', {
        detail: {
          baseTimestamp: Date.now()
        }
      }));
    }
  }, [syncPomodoroWithTimer, currentModeConfig]);
  const handleReset = useCallback((fromSync?: boolean) => {
    const now = Date.now();
    const modeDuration = currentModeConfig?.work || 1500;

    // Reset pomodoro count to 0 when manually resetting
    if (!fromSync) {
      resetPomodoroCount();
      // Ensure next completion can notify immediately
      try {
        localStorage.removeItem('lastPomoNotifyTs');
      } catch {}
    } else {
      // From StudyTimer sync: reset ONLY the per-session count locally (keep daily and DB untouched)
      try {
        localStorage.setItem('pomodorosThisSession', '0');
      } catch {}
      setPomoState(prev => ({
        ...prev,
        pomodorosThisSession: 0,
        workSessionsCompleted: 0
      }));
      // Ensure next completion can notify immediately
      try {
        localStorage.removeItem('lastPomoNotifyTs');
      } catch {}
      // Do NOT touch DB here to avoid race with Finish Session write
    }
    setPomoState(prev => ({
      ...prev,
      isRunning: false,
      currentMode: 'work',
      timeLeft: modeDuration,
      timeAtStart: 0,
      // Reset accumulated time
      lastStart: null,
      // Reset last start
      lastManualAdjustment: now,
      manuallyPaused: false // Clear manual pause flag on reset
      // Don't reset count here - resetPomodoroCount handles it
    }));

    // Zustand action would go here - currently using local state

    if (!fromSync) {
      localStorage.removeItem('pomodoroState');
      localStorage.removeItem('pomodoroIsRunning');
    }
    if (!fromSync) {
      window.dispatchEvent(new CustomEvent('resetTimerSync', {
        detail: {
          baseTimestamp: now
        }
      }));
      // Always emit resetCountdownSync when Pomodoro is synced to ensure all timers reset together
      if (syncPomodoroWithTimer) {
        window.dispatchEvent(new CustomEvent('resetCountdownSync', {
          detail: {
            baseTimestamp: now
          }
        }));
      }
    }
  }, [currentModeConfig, syncPomodoroWithTimer, resetPomodoroCount]);
  const handleModeChange = useCallback((index: number) => {
    const safeIndex = Math.min(index, modes.length - 1);
    setPomoState(prev => {
      const modeTime = modes[safeIndex]?.[prev.currentMode] || DEFAULT_STATE.timeLeft;
      const newState = {
        ...prev,
        modeIndex: safeIndex,
        timeLeft: modeTime,
        isRunning: false
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
  const handleSaveCustomMode = useCallback((customMode: {
    work: number;
    break: number;
    longBreak: number;
  }) => {
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
    setPomoState(prev => {
      const newState = {
        ...prev,
        modeIndex: customModeIndex,
        timeLeft: customMode[prev.currentMode],
        // Update time left for current mode
        isRunning: false // Stop timer when switching modes
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
  }, [modes, updatePomodoroMode]);
  const handleTimeAdjustment = useCallback(async (adjustment: number) => {
    const now = Date.now();
    const maxTime = currentModeConfig?.[pomoState.currentMode] || 1500;
    const newTimeLeft = Math.max(0, Math.min(pomoState.timeLeft + adjustment, maxTime));

    // Check if we're completing a work session by manual adjustment
    const isWork = pomoState.currentMode === 'work';
    const wasWorkSessionCompleted = isWork && newTimeLeft === 0 && pomoState.timeLeft > 0;
    if (wasWorkSessionCompleted) {
      // Do NOT increment here to avoid double counting.
      // We immediately transition and let handlePomodoroComplete() run the single increment with dedupe.

      // Transition to break mode
      const willTakeLongBreak = (pomoState.workSessionsCompleted + 1) % pomoState.workSessionsBeforeLongBreak === 0;
      const nextMode: PomodoroModeType = willTakeLongBreak ? 'longBreak' : 'break';
      const nextModeTime = currentModeConfig?.[nextMode] || (nextMode === 'break' ? 600 : 1800);
      setTimeout(() => {
        setPomoState(prev => ({
          ...prev,
          currentMode: nextMode,
          timeLeft: nextModeTime,
          isRunning: false
        }));
      }, 1000);
      return;
    }
    setPomoState(prev => {
      // If running, update timeAtStart to reflect the adjustment
      const newTimeAtStart = prev.isRunning && prev.lastStart ? prev.timeAtStart - adjustment // Subtract adjustment from accumulated time
      : prev.timeAtStart;
      return {
        ...prev,
        timeLeft: newTimeLeft,
        timeAtStart: newTimeAtStart,
        lastStart: prev.isRunning ? prev.lastStart : prev.lastStart,
        lastManualAdjustment: now,
        manuallyPaused: false // Clear manual pause flag when adjusting time
      };
    });
    if (newTimeLeft === 0 && pomoState.isRunning) {
      // Stop the timer before calling complete to prevent duplicate calls
      setPomoState(prev => ({
        ...prev,
        isRunning: false,
        lastStart: null
      }));
      handlePomodoroComplete();
    }
    if (syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent('adjustStudyTimerTime', {
        detail: {
          adjustment: -adjustment,
          forceSync: true
        }
      }));
    }
  }, [pomoState, currentModeConfig, syncPomodoroWithTimer, incrementPomodoroCount]);

  // ============================================================================
  // SYNC EVENT HANDLERS
  // ============================================================================

  const createSyncHandler = useCallback((action: 'start' | 'stop' | 'reset') => (event: CustomEvent) => {
    if (!syncPomodoroWithTimer) return;
    const ts = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === ts) return;
    setLastSyncTimestamp(ts);
    if (action === 'start' && !pomoState.isRunning) handleStart(ts, true);else if (action === 'stop' && pomoState.isRunning) handleStop(true);else if (action === 'reset') handleReset(true);
  }, [syncPomodoroWithTimer, lastSyncTimestamp, pomoState.isRunning, handleStart, handleStop, handleReset]);

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
    const {
      pomodoros
    } = event.detail || {};
    if (typeof pomodoros === 'number' && pomodoros > 0) {
      // Update pomodoro count to match the session
      const today = getLocalDateString();
      localStorage.setItem(`pomodoroDailyCount_${today}`, String(pomodoros));
      localStorage.setItem('pomodorosThisSession', String(pomodoros));
      // Re-arm first-tick sync guard to avoid accidental increment after resume
      try {
        hasSyncedFromStudyRef.current = false;
      } catch {}
      // Suprime notificaciones/sonidos unos segundos tras reanudar
      try {
        resumeUntilTsRef.current = Date.now() + 4000;
      } catch {}
      // Align cycle counter with DB/session pomodoros to prevent recounting past cycles
      try {
        lastCountedCycleRef.current = pomodoros;
      } catch {}
      // Update state to match localStorage
      setPomoState(prev => {
        const newState = {
          ...prev,
          pomodoroToday: pomodoros,
          pomodorosThisSession: pomodoros,
          workSessionsCompleted: pomodoros
        };
        return newState;
      });
    } else {}
  }, []));

  // También armar el guard si sólo llega la duración primero
  useEventListener('loadSessionDuration', useCallback(() => {
    try {
      hasSyncedFromStudyRef.current = false;
      resumeUntilTsRef.current = Date.now() + 4000;
    } catch {}
  }, []));

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Save pomoState to localStorage
  useEffect(() => {
    savePomoState(pomoState);
    // Emit event for SessionPage to detect changes
    window.dispatchEvent(new CustomEvent('pomodoroStateUpdate', {
      detail: pomoState
    }));
  }, [pomoState]);

  // Sync pomodoroToday with localStorage (authoritative source) - only on mount
  useEffect(() => {
    const authoritativeCount = getPomodoroCount();
    if (pomoState.pomodoroToday !== authoritativeCount) {
      setPomoState(prev => ({
        ...prev,
        pomodoroToday: authoritativeCount,
        pomodorosThisSession: authoritativeCount,
        workSessionsCompleted: authoritativeCount
      }));
    }
  }, []); // Run only on mount - remove getPomodoroCount dependency to prevent re-runs

  // Save session pomodoros
  useEffect(() => {
    localStorage.setItem('pomodorosThisSession', pomoState.pomodorosThisSession.toString());
  }, [pomoState.pomodorosThisSession]);

  // Midnight reset
  useMidnightReset(useCallback(() => {
    setPomoState(prev => ({
      ...prev,
      pomodoroToday: 0
    }));
  }, []));
  const lastCountedCycleRef = useRef<number>(0); // track último ciclo contado
  const latestStudyTimeRef = useRef<number>(0); // último tiempo reportado por StudyTimer para validaciones
  const hasSyncedFromStudyRef = useRef<boolean>(true); // por defecto no saltar el primer ciclo; sólo al reanudar se arma
  const resumeUntilTsRef = useRef<number>(0); // ventana para suprimir notificaciones/sonidos tras reanudar
  const lastTargetModeRef = useRef<PomodoroModeType>('work'); // último modo calculado por el tiempo

  // Reemplaza el handler de studyTimerTimeUpdate con una versión robusta:
  useEventListener('studyTimerTimeUpdate', async (event: CustomEvent<{
    time: number;
    isRunning: boolean;
  }>) => {
    if (!syncPomodoroWithTimer) return;
    if (pomoState.manuallyPaused) return;
    const studyTime = Math.floor(event.detail.time);
    latestStudyTimeRef.current = studyTime;
    const workDuration = currentModeConfig?.work || 3000;
    const breakDuration = currentModeConfig?.break || 600;
    const totalCycle = workDuration + breakDuration;
    const timeInCurrentCycle = studyTime % totalCycle;

    // Calcular modo y timeLeft SIEMPRE
    let targetMode: PomodoroModeType = 'work';
    let timeInCurrentMode = timeInCurrentCycle;
    if (timeInCurrentCycle >= workDuration) {
      targetMode = 'break';
      timeInCurrentMode = timeInCurrentCycle - workDuration;
    }
    const newTimeLeft = (targetMode === 'work' ? workDuration : breakDuration) - timeInCurrentMode;
    const expectedCompletedPomodoros = Math.floor(studyTime / totalCycle) + (timeInCurrentCycle >= workDuration ? 1 : 0);

    // Si el usuario retrocede el tiempo con media controls, ajustar el conteo hacia abajo
    if (expectedCompletedPomodoros < (lastCountedCycleRef.current || 0)) {
      const delta = (lastCountedCycleRef.current || 0) - expectedCompletedPomodoros;
      if (delta > 0) {
        decrementPomodoroCount(delta);
        lastCountedCycleRef.current = expectedCompletedPomodoros;
      }
    }

    // Primer tick tras reanudar: sincroniza estado sin contar
    if (!hasSyncedFromStudyRef.current) {
      hasSyncedFromStudyRef.current = true;
      // Keep the higher of what we already know (from DB) vs what time suggests for completed work sessions
      lastCountedCycleRef.current = Math.max(lastCountedCycleRef.current || 0, expectedCompletedPomodoros);
      // Asegura que el modo/tiempo reflejen el estado actual del StudyTimer
      setPomoState(prev => ({
        ...prev,
        currentMode: targetMode,
        timeLeft: newTimeLeft
      }));
      return;
    }

    // Si resetea el timer externo
    if (studyTime === 0 && !event.detail.isRunning && !pomoState.manuallyPaused) {
      resetPomodoroCount();
      setPomoState(prev => ({
        ...prev,
        isRunning: false,
        currentMode: 'work',
        timeLeft: workDuration,
        workSessionsCompleted: 0,
        pomodoroToday: 0,
        pomodorosThisSession: 0
      }));
      lastCountedCycleRef.current = 0;
      // Tras un reset completo, no queremos saltar el próximo ciclo
      hasSyncedFromStudyRef.current = true;
      return;
    }

    // Si detectamos que aumentó el número de pomodoros completados (al entrar en break), cuenta de forma robusta
    if (expectedCompletedPomodoros > lastCountedCycleRef.current && targetMode === 'break') {
      lastCountedCycleRef.current = expectedCompletedPomodoros;
      await handlePomodoroComplete();
    }

    // Notificación/sonido al pasar de break -> work (no cuenta pomodoro)
    try {
      const notAfterResume = hasSyncedFromStudyRef.current === true;
      const pastResumeWindow = Date.now() > (resumeUntilTsRef.current || 0);
      const justEnteredWork = lastTargetModeRef.current === 'break' && targetMode === 'work' && timeInCurrentMode < 2; // margen 2s
      if (notAfterResume && pastResumeWindow && justEnteredWork) {
        // Sonido (dedupe)
        if (alarmEnabled) {
          try {
            const nowTs = Date.now();
            const lastSoundTs = Number(localStorage.getItem('lastPomoSoundTs') || '0');
            const recentlyNotified = lastSoundTs && Math.abs(nowTs - lastSoundTs) < 3000;
            if (!recentlyNotified) {
              // Baja un poco el volumen sólo para esta transición (break -> work)
              const prevVol = sounds['break'].volume;
              const tempVol = Math.max(0, Math.min(1, prevVol * 0.7));
              sounds['break'].volume = tempVol;
              sounds['break'].currentTime = 0; // sonido al finalizar break
              sounds['break'].play().catch(() => {}).finally(() => {
                // Restaura el volumen anterior inmediatamente después de intentar reproducir
                try {
                  sounds['break'].volume = prevVol;
                } catch {}
              });
              localStorage.setItem('lastPomoSoundTs', String(nowTs));
            }
          } catch {}
        }
        // Notificación escritorio (dedupe)
        try {
          const nowTs2 = Date.now();
          const lastNotifyTs2 = Number(localStorage.getItem('lastPomoNotifyTs') || '0');
          const recentlyNotified2 = lastNotifyTs2 && Math.abs(nowTs2 - lastNotifyTs2) < 3000;
          if (!recentlyNotified2) {
            showNotification('Break Complete! ⏰', {
              body: 'Break is over! Time to get back to work.',
              icon: '💪',
              badge: '💪',
              tag: 'pomodoro-notification',
              requireInteraction: true
            });
            localStorage.setItem('lastPomoNotifyTs', String(nowTs2));
          }
        } catch {}
      }
    } finally {
      // Actualiza último modo calculado
      lastTargetModeRef.current = targetMode;
    }

    // Sincroniza SIEMPRE UI (modo, timeLeft, ciclos)
    setPomoState(prev => ({
      ...prev,
      currentMode: targetMode,
      timeLeft: newTimeLeft,
      workSessionsCompleted: expectedCompletedPomodoros
    }));
  });

  // Check for work session completion based on elapsed time
  const checkWorkSessionCompletion = useCallback(async () => {
    if (pomoState.currentMode !== 'work' || !pomoState.lastStart) return;
    const workDuration = currentModeConfig?.work || 3000;
    const elapsed = pomoState.timeAtStart + (Date.now() - pomoState.lastStart) / 1000;

    // Check if we've completed the work session based on elapsed time
    if (elapsed >= workDuration && !pomoState.manuallyPaused) {
      // Only increment if we haven't already counted this session
      const expectedCount = Math.floor(elapsed / workDuration);
      if (expectedCount > pomoState.pomodoroToday) {
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

    if (!pomoState.isRunning || !pomoState.lastStart) return;

    // Use StudyTimer's exact elapsed time calculation: timeAtStart + ((now - lastStart) / 1000)
    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = pomoState.timeAtStart + (now - pomoState.lastStart!) / 1000;
      const currentModeDuration = currentModeConfig?.[pomoState.currentMode] || (pomoState.currentMode === 'break' ? 600 : pomoState.currentMode === 'longBreak' ? 1800 : 3000);
      const newTimeLeft = Math.max(0, currentModeDuration - elapsed);
      if (newTimeLeft <= 0) {
        // Stop the timer immediately to prevent multiple completion calls
        setPomoState(prev => ({
          ...prev,
          isRunning: false,
          lastStart: null
        }));
        if (alarmEnabled) {
          try {
            new Audio('/sounds/pomo-end.mp3').play();
          } catch {}
        }
        handlePomodoroComplete();
        return;
      }

      // Only update if the time actually changed to prevent unnecessary re-renders
      if (Math.abs(newTimeLeft - pomoState.timeLeft) >= 0.1) {
        setPomoState(prev => ({
          ...prev,
          timeLeft: newTimeLeft
        }));
      }
    }, 100); // Update every 100ms for smooth display like StudyTimer

    return () => clearInterval(interval);
  }, [syncPomodoroWithTimer, pomoState.isRunning, pomoState.lastStart, pomoState.timeAtStart, pomoState.timeLeft, currentModeConfig, pomoState.currentMode, alarmEnabled, handlePomodoroComplete]);

  // Global sync handler
  useEffect(() => {
    if (!syncPomodoroWithTimer) return;
    const handleGlobalSync = (e: CustomEvent) => {
      const {
        isRunning: globalRunning
      } = e.detail;
      if (globalRunning !== pomoState.isRunning) {
        globalRunning ? handleStart(Date.now(), true) : handleStop(true);
      }
    };
    const handleGlobalReset = (e: CustomEvent) => {
      const {
        resetKey
      } = e.detail;
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

  return <div className="flex flex-col items-center h-full">
      {/* Header */}
      {hideHeader ? null : <div className="section-title justify-center relative w-full px-4 py-3">
        <button type="button" onClick={() => setSyncPomodoroWithTimer(!syncPomodoroWithTimer)} className="absolute left-0 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20" aria-label={syncPomodoroWithTimer ? 'Disable Pomodoro sync' : 'Enable Pomodoro sync'} title={syncPomodoroWithTimer ? 'Sync ON (click to turn OFF)' : 'Sync OFF (click to turn ON)'}>
          {syncPomodoroWithTimer ? <RefreshCw size={20} className="icon" style={{
          color: 'var(--accent-primary)'
        }} /> : <RefreshCwOff size={20} className="icon" style={{
          color: 'var(--accent-primary)'
        }} />}
        </button>

        <SectionTitle title="Pomo" tooltip="The Pomodoro Technique is a time management method that uses focused work sessions (typically 25 minutes) followed by short breaks." size="sm" />

        <button onClick={() => setIsSettingsModalOpen(true)} className="absolute right-6 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="Configure pomodoro">
          <MoreVertical size={20} />
        </button>

        <button onClick={toggleAlarm} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title={alarmEnabled ? 'Disable alarm sound' : 'Enable alarm sound'} aria-label="Toggle alarm sound">
          {alarmEnabled ? <Bell size={20} className="text-[var(--text-secondary)]" /> : <BellOff size={20} className="text-[var(--text-secondary)]" />}
        </button>
      </div>}

      {/* Timer Display - bold with mode-colored accent */}
      <div className="relative group w-full flex flex-col items-center py-1" role="timer" aria-label="Current pomodoro time">
        <div className="flex items-start justify-center gap-1.5">
          {(() => {
            const roundedSeconds = Math.round(pomoState.timeLeft);
            const mins = Math.floor(roundedSeconds / 60);
            const secs = roundedSeconds % 60;
            const parts = [
              { val: mins.toString().padStart(2, '0'), label: 'min' },
              { val: secs.toString().padStart(2, '0'), label: 'sec' },
            ];
            const colorClass = pomoState.currentMode === 'work' ? 'text-red-500' :
              pomoState.currentMode === 'break' ? 'text-green-500' : 'text-blue-500';
            return parts.map((p, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className={`text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-mono font-bold tabular-nums tracking-tight leading-none ${colorClass}`}>{p.val}</span>
                <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mt-1">{p.label}</span>
              </div>
            )).flatMap((el, i) => i < 1 ? [
              el,
              <span key={`sep-${i}`} className={`text-2xl sm:text-3xl md:text-4xl font-mono font-bold leading-none mt-2 ${colorClass}`}>:</span>
            ] : [el]);
          })()}
        </div>

        {/* Hover tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 hidden group-hover:block bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] shadow-xl min-w-[180px] text-center">
          <div className="flex items-center justify-center gap-1.5">
            {pomoState.currentMode === 'work' && <>
                <span className="text-sm">🍅</span>
                <span>Work Session</span>
              </>}
            {pomoState.currentMode === 'break' && <>
                <span className="text-sm">☕</span>
                <span>Short Break</span>
              </>}
            {pomoState.currentMode === 'longBreak' && <>
                <span className="text-sm">🎉</span>
                <span>Long Break</span>
              </>}
          </div>

          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            {pomoState.currentMode === 'work' && <div>Focus time: {Math.floor((currentModeConfig?.work || 3000) / 60)}min</div>}
            {pomoState.currentMode === 'break' && <div>Break time: {Math.floor((currentModeConfig?.break || 600) / 60)}min</div>}
            {pomoState.currentMode === 'longBreak' && <div>Long break: {Math.floor((currentModeConfig?.longBreak || 1800) / 60)}min</div>}
          </div>

          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            Completed today: {pomoState.pomodoroToday}
          </div>
        </div>
      </div>

      {/* Time adjustment buttons - only show when not synced */}
      {!syncPomodoroWithTimer && <div className="flex gap-1 mb-1.5">
          {[-600, -300, 300, 600].map(adj => <button key={adj} onClick={() => handleTimeAdjustment(adj)} className="timer-adjust-btn" aria-label={`${adj > 0 ? 'Add' : 'Subtract'} ${Math.abs(adj / 60)} minutes`}>
              {adj > 0 ? '+' : ''}{adj / 60}
            </button>)}
        </div>}

      {/* Timer Controls */}
      <div className="flex justify-center items-center gap-2 mb-1">
        {!syncPomodoroWithTimer && <>
            <button onClick={() => handleReset()} className="timer-ctrl-btn" aria-label="Reset timer">
              <RotateCcw size={18} className="text-[var(--text-secondary)]" />
            </button>
            {!isPomodoroRunning ? <button onClick={() => handleStart()} className="timer-ctrl-btn timer-ctrl-btn-pomo" aria-label="Start timer">
                <Play size={18} />
              </button> : <button onClick={() => handleStop()} className="timer-ctrl-btn timer-ctrl-btn-pomo" aria-label="Pause timer">
                <Pause size={18} />
              </button>}
          </>}
      </div>

      
      {/* Settings Modal */}
      <PomodoroSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} currentModeIndex={pomoState.modeIndex} onModeChange={handleModeChange} onSaveCustomMode={handleSaveCustomMode} />
    </div>;
};
export default Pomodoro;