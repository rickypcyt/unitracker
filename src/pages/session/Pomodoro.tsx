import { Bell, BellOff, MoreVertical, Pause, Play, RefreshCw, RefreshCwOff, RotateCcw } from 'lucide-react';
import { POMODORO_CONFIG, POMODORO_SOUNDS } from '../../constants/pomodoro';
// Pomodoro.tsx - Refactored
import React, { useCallback, useEffect, useState } from 'react';
import { useUi, useUiActions } from '@/store/appStore';

import type { PomodoroModeType } from '../../types/pomodoro';
import PomodoroSettingsModal from '@/modals/PomodoroSettingsModal';
import SectionTitle from '@/components/SectionTitle';
import { getLocalDateString } from '@/utils/dateUtils';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import useEventListener from '@/hooks/useEventListener';
import usePomodorosToday from '@/hooks/usePomodorosToday';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const { STORAGE_KEYS } = POMODORO_CONFIG;

const INITIAL_MODES = [
  { work: 1500, break: 300, longBreak: 900 },
  { work: 3000, break: 600, longBreak: 1800 },
  { work: 2700, break: 540, longBreak: 1620 },
];

const DEFAULT_STATE = {
  modeIndex: 0,
  currentMode: 'work' as PomodoroModeType,
  timeLeft: INITIAL_MODES[0]?.work ?? 1500,
  isRunning: false,
  pomodoroToday: 0,
  workSessionsBeforeLongBreak: 4,
  workSessionsCompleted: 0,
  startTime: 0,
  pausedTime: 0,
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
  startTime: number;
  pausedTime: number;
  lastManualAdjustment: number;
  pomodorosThisSession: number;
  longBreakDuration?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const safeNumber = (v: unknown, def: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : def;

const formatPomoTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
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

const loadModes = () => {
  try {
    const saved = localStorage.getItem('pomodoroModes');
    return saved ? JSON.parse(saved) : INITIAL_MODES;
  } catch {
    return INITIAL_MODES;
  }
};

const loadPomoState = (): PomoState => {
  const today = getLocalDateString();
  const savedState = localStorage.getItem('pomodoroState');
  
  if (!savedState) return { ...DEFAULT_STATE, pomodoroToday: parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10) };

  try {
    const parsed = JSON.parse(savedState);
    const state: PomoState = {
      modeIndex: safeNumber(parsed.modeIndex, 0),
      currentMode: ['work', 'break', 'longBreak'].includes(parsed.currentMode) ? parsed.currentMode : 'work',
      timeLeft: safeNumber(parsed.timeLeft, DEFAULT_STATE.timeLeft),
      isRunning: false,
      pomodoroToday: parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10),
      workSessionsBeforeLongBreak: safeNumber(parsed.workSessionsBeforeLongBreak, 4),
      workSessionsCompleted: safeNumber(parsed.workSessionsCompleted, 0),
      startTime: safeNumber(parsed.startTime, 0),
      pausedTime: safeNumber(parsed.pausedTime, 0),
      lastManualAdjustment: 0,
      pomodorosThisSession: parseInt(localStorage.getItem('pomodorosThisSession') || '0', 10),
    };

    const hasInvalidValues = Object.values(state).some(
      (v) => typeof v === 'number' && !Number.isFinite(v)
    );

    if (hasInvalidValues) {
      localStorage.removeItem('pomodoroState');
      localStorage.removeItem('pomodoroIsRunning');
      localStorage.removeItem('pomodorosThisSession');
      return DEFAULT_STATE;
    }

    return state;
  } catch {
    return DEFAULT_STATE;
  }
};

const savePomoState = (state: PomoState) => {
  const toSave = {
    modeIndex: safeNumber(state.modeIndex, 0),
    currentMode: state.currentMode || 'work',
    timeLeft: safeNumber(state.timeLeft, 1500),
    startTime: safeNumber(state.startTime, 0),
    pausedTime: safeNumber(state.pausedTime, 0),
    workSessionsBeforeLongBreak: safeNumber(state.workSessionsBeforeLongBreak, 4),
    workSessionsCompleted: safeNumber(state.workSessionsCompleted, 0),
    pomodoroToday: safeNumber(state.pomodoroToday, 0),
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
  const { user }: { user: import('@supabase/supabase-js').User | null } = useAuth();
  const { setSyncPomodoroWithTimer } = useUiActions();
  const { syncPomodoroWithTimer, isStudyRunning } = useUi();

  // Local state
  const [modes, setModes] = useState(loadModes);
  const [pomoState, setPomoState] = useState<PomoState>(loadPomoState);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const [localResetKey, setLocalResetKey] = useState(0);
  const [pomodorosTodayLocal, setPomodorosTodayLocal] = useState(() =>
    parseInt(localStorage.getItem(`pomodoroDailyCount_${getLocalDateString()}`) || '0', 10)
  );

  const [alarmEnabled, toggleAlarm] = useAlarmEnabled();
  const { total: pomodorosToday, fetchPomodoros } = usePomodorosToday(user?.id || '');

  const activeSessionId = localStorage.getItem('activeSessionId');
  const isPomodoroRunning = syncPomodoroWithTimer ? isStudyRunning : pomoState.isRunning;
  const currentModeConfig = modes[pomoState.modeIndex];

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  const updatePomodoroInDatabase = useCallback(async (increment = 1) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const sessionId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
      if (!sessionId) return;

      const { data: session } = await supabase
        .from('study_laps')
        .select('pomodoros_completed')
        .eq('id', sessionId)
        .single();

      if (session) {
        await supabase
          .from('study_laps')
          .update({ pomodoros_completed: (session.pomodoros_completed || 0) + increment })
          .eq('id', sessionId);
      }
    } catch (error) {
      console.error('Error updating pomodoro count:', error);
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
        await updatePomodoroInDatabase(1);
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
        setPomodorosTodayLocal(newCount);
      }

      return {
        ...prev,
        currentMode: nextMode,
        timeLeft: currentModeConfig[nextMode],
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
  }, [pomoState, currentModeConfig, alarmEnabled, updatePomodoroInDatabase]);

  const handleStart = useCallback((baseTimestamp?: number, fromSync?: boolean) => {
    const now = baseTimestamp || Date.now();
    const modeDuration = currentModeConfig[pomoState.currentMode];

    setPomoState((prev) => ({
      ...prev,
      isRunning: true,
      startTime: now / 1000,
      pausedTime: 0,
      timeLeft: prev.pausedTime > 0 ? prev.timeLeft : modeDuration,
      lastManualAdjustment: now,
    }));

    // Zustand action would go here - currently using local state

    if (!fromSync && syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent('playPomodoroSync', { detail: { baseTimestamp: now } }));
      window.dispatchEvent(new CustomEvent('playCountdownSync', { detail: { baseTimestamp: now } }));
    }
  }, [currentModeConfig, pomoState.currentMode, syncPomodoroWithTimer]);

  const handleStop = useCallback((fromSync?: boolean) => {
    setPomoState((prev) => ({
      ...prev,
      isRunning: false,
      pausedTime: Date.now() / 1000,
      lastManualAdjustment: Date.now(),
    }));

    // Zustand action would go here - currently using local state

    if (!fromSync && syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent('pauseTimerSync', { detail: { baseTimestamp: Date.now() } }));
    }
  }, [syncPomodoroWithTimer]);

  const handleReset = useCallback((fromSync?: boolean) => {
    const now = Date.now();
    const modeDuration = currentModeConfig.work;

    setPomoState((prev) => ({
      ...prev,
      isRunning: false,
      currentMode: 'work',
      timeLeft: modeDuration,
      startTime: 0,
      pausedTime: 0,
      lastManualAdjustment: now,
    }));

    // Zustand action would go here - currently using local state

    localStorage.removeItem('pomodoroState');
    localStorage.removeItem('pomodoroIsRunning');
    localStorage.removeItem('pomodorosThisSession');

    if (!fromSync) {
      window.dispatchEvent(new CustomEvent('resetTimerSync', { detail: { baseTimestamp: now } }));
      if (syncPomodoroWithTimer) {
        window.dispatchEvent(new CustomEvent('resetCountdownSync', { detail: { baseTimestamp: now } }));
      }
    }
  }, [currentModeConfig, syncPomodoroWithTimer]);

  const handleModeChange = useCallback((index: number) => {
    const safeIndex = Math.min(index, modes.length - 1);
    setPomoState((prev) => ({
      ...prev,
      modeIndex: safeIndex,
      timeLeft: modes[safeIndex][prev.currentMode],
      isRunning: false,
    }));
  }, [modes]);

  const handleSaveCustomMode = useCallback((customMode: typeof INITIAL_MODES[0]) => {
    setModes((prev: typeof INITIAL_MODES) => {
      const newModes = [...prev];
      newModes[newModes.length - 1] = customMode;
      handleModeChange(newModes.length - 1);
      return newModes;
    });
    setIsSettingsModalOpen(false);
  }, [handleModeChange]);

  const handleTimeAdjustment = useCallback((adjustment: number) => {
    const now = Date.now();
    const maxTime = currentModeConfig[pomoState.currentMode];
    const newTimeLeft = Math.max(0, Math.min(pomoState.timeLeft + adjustment, maxTime));

    setPomoState((prev) => ({
      ...prev,
      timeLeft: newTimeLeft,
      startTime: prev.isRunning ? now / 1000 : prev.startTime,
      pausedTime: prev.isRunning ? 0 : prev.pausedTime,
      lastManualAdjustment: now,
    }));

    if (newTimeLeft === 0) handlePomodoroComplete();

    if (syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent('adjustStudyTimerTime', {
        detail: { adjustment: -adjustment, forceSync: true },
      }));
    }
  }, [pomoState, currentModeConfig, syncPomodoroWithTimer, handlePomodoroComplete]);

  const handleWorkSessionsChange = useCallback((sessions: number) => {
    setPomoState((prev) => ({ ...prev, workSessionsBeforeLongBreak: sessions, workSessionsCompleted: 0 }));
  }, []);

  const handleLongBreakDurationChange = useCallback((duration: number) => {
    setPomoState((prev) => ({ ...prev, longBreakDuration: duration }));
  }, []);

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
    if (pomoState.isRunning && syncPomodoroWithTimer) handleStop();
  });

  useEventListener('playTimerSync', createSyncHandler('start'));
  useEventListener('playPomodoroSync', createSyncHandler('start'));
  useEventListener('pausePomodoroSync', createSyncHandler('stop'));
  useEventListener('resetTimerSync', createSyncHandler('reset'));
  useEventListener('resetPomodoroSync', createSyncHandler('reset'));
  useEventListener('resetCountdownSync', createSyncHandler('reset'));

  useEventListener('studyTimerReset', () => {
    if (syncPomodoroWithTimer) handleReset();
  });

  useEventListener('studyTimerSyncStateChanged', () => {
    // State update handled by Redux
  });

  useEventListener('adjustPomodoroTime', (e: CustomEvent) => {
    handleTimeAdjustment(e.detail.adjustment);
  });

  useEventListener('finishSession', () => {
    setPomoState((prev) => ({ ...prev, pomodorosThisSession: 0 }));
  });

  useEventListener('sessionStarted', () => {
    setPomoState((prev) => ({ ...prev, pomodorosThisSession: 0 }));
    localStorage.setItem('pomodorosThisSession', '0');
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Save modes to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroModes', JSON.stringify(modes));
  }, [modes]);

  // Save pomoState to localStorage
  useEffect(() => {
    savePomoState(pomoState);
  }, [pomoState]);

  // Save session pomodoros
  useEffect(() => {
    localStorage.setItem('pomodorosThisSession', pomoState.pomodorosThisSession.toString());
  }, [pomoState.pomodorosThisSession]);

  // Midnight reset
  useMidnightReset(useCallback(() => {
    setPomoState((prev) => ({ ...prev, pomodoroToday: 0 }));
  }, []));

  // Fetch pomodoros on mount
  useEffect(() => {
    fetchPomodoros();
    const handler = () => fetchPomodoros();
    window.addEventListener('refreshStats', handler);
    return () => window.removeEventListener('refreshStats', handler);
  }, [fetchPomodoros]);

  // Timer interval
  useEffect(() => {
    const isRunning = syncPomodoroWithTimer ? isStudyRunning : pomoState.isRunning;
    if (!isRunning || pomoState.timeLeft <= 0) return;

    const startTime = Date.now();
    const startCountingFrom = pomoState.timeLeft;

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const newTimeLeft = Math.max(0, startCountingFrom - elapsed);

      if (newTimeLeft <= 0) {
        if (alarmEnabled) {
          try { new Audio('/sounds/pomo-end.mp3').play(); } catch {}
        }
        handlePomodoroComplete();
        return;
      }

      setPomoState((prev) => ({ ...prev, timeLeft: newTimeLeft }));
    }, 1000);

    return () => clearInterval(interval);
  }, [syncPomodoroWithTimer, isStudyRunning, pomoState.isRunning, pomoState.timeLeft, alarmEnabled, handlePomodoroComplete]);

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
        className="relative group text-3xl md:text-4xl xl:text-5xl font-mono mb-6 lg:mb-4 text-center"
        role="timer"
        aria-label="Current pomodoro time"
      >
        <span>{formatPomoTime(pomoState.timeLeft)}</span>
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 hidden group-hover:block bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] shadow-xl min-w-[180px] text-center">
          <div className="font-semibold mb-1">
            {pomoState.currentMode === 'work' && 'Work'}
            {pomoState.currentMode === 'break' && 'Break'}
            {pomoState.currentMode === 'longBreak' && 'Long Break'}
          </div>
          <div>Pomodoros done today: <b>{user ? pomodorosToday : pomodorosTodayLocal}</b></div>
          {activeSessionId && <div>Pomodoros during session: <b>{pomoState.pomodorosThisSession}</b></div>}
        </div>
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
      <div className="timer-controls flex justify-center items-center gap-3 xl:mb-0">
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
        modes={modes}
        onModeChange={handleModeChange}
        onSaveCustomMode={handleSaveCustomMode}
        workSessionsBeforeLongBreak={pomoState.workSessionsBeforeLongBreak}
        onWorkSessionsChange={handleWorkSessionsChange}
        longBreakDuration={pomoState.longBreakDuration}
        onLongBreakDurationChange={handleLongBreakDurationChange}
      />
    </div>
  );
};

export default Pomodoro;