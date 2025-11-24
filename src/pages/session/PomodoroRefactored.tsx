import { Bell, BellOff, MoreVertical, Pause, Play, RefreshCw, RotateCcw } from 'lucide-react';
import { useCounterStorage, useObjectStorage, useStorage } from '@/hooks/useStorage';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';

import { POMODORO_SOUNDS } from '../../constants/pomodoro';
import type { PomodoroModeType } from '../../types/pomodoro';
import PomodoroSettingsModal from '@/modals/PomodoroSettingsModal';
import type { RootState } from '@/store/store';
import SectionTitle from '@/components/SectionTitle';
import { getLocalDateString } from '@/utils/dateUtils';
import { setPomodoroState } from '@/store/appStore';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import useEventListener from '@/hooks/useEventListener';
import usePomodorosToday from '@/hooks/usePomodorosToday';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================


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
// VALIDATOR FOR POMO STATE
// ============================================================================

const isPomoState = (obj: any): obj is PomoState => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.modeIndex === 'number' &&
    typeof obj.timeLeft === 'number' &&
    typeof obj.isRunning === 'boolean' &&
    ['work', 'break', 'longBreak'].includes(obj.currentMode) &&
    typeof obj.pomodoroToday === 'number' &&
    typeof obj.workSessionsBeforeLongBreak === 'number' &&
    typeof obj.workSessionsCompleted === 'number' &&
    typeof obj.startTime === 'number' &&
    typeof obj.pausedTime === 'number' &&
    typeof obj.lastManualAdjustment === 'number' &&
    typeof obj.pomodorosThisSession === 'number'
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PomodoroRefactored() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { total: pomodorosToday, fetchPomodoros } = usePomodorosToday(user?.id || '');
  
  const isStudyRunningRedux = useSelector((state: RootState) => state.ui.isStudyRunning);
  const syncPomodoroWithTimer = useSelector((state: RootState) => state.ui.syncPomodoroWithTimer);

  // 🎯 STORAGE HOOKS - Centralizado y tipado
  const { value: modes, setValue: setModes } = useStorage('pomodoroModes', {
    defaultValue: INITIAL_MODES,
  });

  const { value: pomoState, setValue: setPomoState, isLoading: isLoadingState } = useObjectStorage<PomoState>(
    'pomodoroState',
    {
      defaultValue: DEFAULT_STATE,
      validator: isPomoState,
    }
  );

  const { count: pomodorosThisSession, increment: incrementSessionPomodoros, reset: resetSessionPomodoros } = useCounterStorage(
    'pomodorosThisSession',
    0
  );

  const { count: pomodorosTodayLocal, increment: incrementTodayPomodoros, setCount: setTodayPomodoros } = useCounterStorage(
    `pomodoroDailyCount_${getLocalDateString()}`,
    0
  );

  const { value: isAlarmEnabled, setValue: setAlarmEnabled } = useStorage('pomodoroAlarmEnabled', {
    defaultValue: true,
  });

  const { value: lastReset, setValue: setLastReset } = useStorage('lastPomodoroReset', {
    defaultValue: '',
  });

  // 🎯 UI STATE
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 🎯 DERIVED STATE
  const currentModeConfig = modes?.[pomoState?.modeIndex ?? 0] ?? INITIAL_MODES[0];
  const isPomodoroRunning = syncPomodoroWithTimer ? isStudyRunningRedux : (pomoState?.isRunning ?? false);
  const isWork = pomoState?.currentMode === 'work';
  const isBreak = pomoState?.currentMode === 'break';
  const isLongBreak = pomoState?.currentMode === 'longBreak';

  // 🎯 DAILY RESET LOGIC
  useEffect(() => {
    const today = getLocalDateString();
    if (lastReset !== today) {
      setLastReset(today);
      setTodayPomodoros(0);
      if (user) fetchPomodoros();
    }
  }, [lastReset, setLastReset, setTodayPomodoros, user, fetchPomodoros]);

  // 🎯 TIMER CONTROLS
  const controls = useMemo(() => ({
    start: () => {
      if (!isPomodoroRunning) {
        const newState: PomoState = {
          ...pomoState!,
          isRunning: true,
          startTime: Date.now(),
          pausedTime: 0,
        };
        setPomoState(newState);
        dispatch(setPomodoroState('running'));
        
        if (!syncPomodoroWithTimer) {
          window.dispatchEvent(new CustomEvent('playPomodoro', { detail: { baseTimestamp: Date.now() } }));
        }
      }
    },

    pause: () => {
      if (isPomodoroRunning) {
        const newState: PomoState = {
          ...pomoState!,
          isRunning: false,
          pausedTime: pomoState!.pausedTime + (Date.now() - pomoState!.startTime),
        };
        setPomoState(newState);
        dispatch(setPomodoroState('paused'));
        
        if (!syncPomodoroWithTimer) {
          window.dispatchEvent(new CustomEvent('pausePomodoro', { detail: { baseTimestamp: Date.now() } }));
        }
      }
    },

    reset: (fromSync = false) => {
      const resetState: PomoState = {
        ...DEFAULT_STATE,
        timeLeft: (currentModeConfig ?? INITIAL_MODES[0])?.[isWork ? 'work' : isBreak ? 'break' : 'longBreak'] ?? 1500,
        currentMode: pomoState?.currentMode ?? 'work',
        modeIndex: pomoState?.modeIndex ?? 0,
      };
      setPomoState(resetState);
      dispatch(setPomodoroState('stopped'));
      
      if (!fromSync && !syncPomodoroWithTimer) {
        window.dispatchEvent(new CustomEvent('resetPomodoro', { detail: { baseTimestamp: Date.now() } }));
      }
    },

    skip: () => {
      let nextMode: PomodoroModeType;
      
      if (isWork) {
        const completed = (pomoState?.workSessionsCompleted ?? 0) + 1;
        if (completed >= (pomoState?.workSessionsBeforeLongBreak ?? 4)) {
          nextMode = 'longBreak';
          setPomoState((prev) => ({ ...prev!, workSessionsCompleted: 0 } as PomoState));
        } else {
          nextMode = 'break';
          setPomoState((prev) => ({ ...prev!, workSessionsCompleted: completed } as PomoState));
        }
      } else if (isBreak) {
        nextMode = 'work';
      } else {
        nextMode = 'work';
      }

      const nextTime = (modes ?? INITIAL_MODES)[pomoState?.modeIndex ?? 0]?.[nextMode] ?? INITIAL_MODES[0]?.[nextMode] ?? 1500;
      setPomoState((prev) => ({
        ...prev!,
        currentMode: nextMode,
        timeLeft: nextTime,
        isRunning: false,
        startTime: 0,
        pausedTime: 0,
      } as PomoState));
    },
  }), [pomoState, isPomodoroRunning, syncPomodoroWithTimer, currentModeConfig, isWork, isBreak, setPomoState, dispatch, modes]);

  // 🎯 TIMER EFFECT
  useEffect(() => {
    if (!isPomodoroRunning || !pomoState?.startTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - (pomoState?.startTime ?? 0)) / 1000;
      const newTimeLeft = Math.max(0, (pomoState?.timeLeft ?? 0) - elapsed);

      if (newTimeLeft === 0) {
        // Timer completed
        if (isWork) {
          incrementSessionPomodoros();
          incrementTodayPomodoros();
          window.dispatchEvent(new CustomEvent('pomodoroCompleted'));
          
          // Update database
          if (user) {
            const sessionId = localStorage.getItem('activeSessionId');
            if (sessionId) {
              supabase
                .from('study_laps')
                .update({ pomodoros_completed: pomodorosThisSession + 1 })
                .eq('id', sessionId)
                .then(({ error }) => {
                  if (error) console.error('Error updating pomodoros:', error);
                });
            }
          }
        }

        // Play sound
        if (isAlarmEnabled) {
          const sound = isWork ? sounds.work : isLongBreak ? sounds.longBreak : sounds.break;
          sound.play().catch(e => console.warn('Error playing sound:', e));
        }

        // Auto-skip to next mode
        controls.skip();
      } else {
        setPomoState((prev) => ({ ...prev!, timeLeft: newTimeLeft } as PomoState));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomoState, isWork, isLongBreak, isAlarmEnabled, user, pomodorosThisSession, incrementSessionPomodoros, incrementTodayPomodoros, controls.skip, setPomoState]);

  // 🎯 SYNC EVENTS
  useEventListener('playPomodoro', () => controls.start());
  useEventListener('pausePomodoro', () => controls.pause());
  useEventListener('resetPomodoro', () => controls.reset(true));
  useEventListener('sessionStarted', () => resetSessionPomodoros());

  // 🎯 MODES MANAGEMENT (removido - ya no necesario con el modal actualizado)
  // const updateMode = useCallback((modeIndex: number, newMode: { work: number; break: number; longBreak: number; }) => {
  //   if (!modes || !pomoState) return;
  //   
  //   const newModes = [...modes];
  //   newModes[modeIndex] = newMode;
  //   setModes(newModes);
  //   
  //   // Update current timer if this mode is active
  //   if (pomoState.modeIndex === modeIndex) {
  //     const currentTime = newMode[pomoState.currentMode] ?? 1500;
  //     setPomoState((prev) => ({ ...prev!, timeLeft: currentTime } as PomoState));
  //   }
  // }, [modes, pomoState, setModes, setPomoState]);

  // 🎯 RENDER
  if (isLoadingState) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="pomodoro-container">
      <SectionTitle title="Pomodoro Timer" tooltip="Focus timer with work/break intervals" />
      
      <div className="timer-display">
        <div className="time-text">{formatPomoTime(pomoState?.timeLeft ?? 0)}</div>
        <div className="mode-badge">{pomoState?.currentMode}</div>
      </div>

      <div className="timer-controls">
        <button onClick={isPomodoroRunning ? controls.pause : controls.start}>
          {isPomodoroRunning ? <Pause /> : <Play />}
        </button>
        <button onClick={() => controls.reset()}>
          <RotateCcw />
        </button>
        <button onClick={() => controls.skip()}>
          <RefreshCw />
        </button>
        <button onClick={() => setAlarmEnabled(!isAlarmEnabled)}>
          {isAlarmEnabled ? <Bell /> : <BellOff />}
        </button>
        <button onClick={() => setIsSettingsOpen(true)}>
          <MoreVertical />
        </button>
      </div>

      <div className="stats">
        <div>Today: {pomodorosTodayLocal + pomodorosToday}</div>
        <div>Session: {pomodorosThisSession}</div>
        <div>Work sessions: {pomoState?.workSessionsCompleted ?? 0}/{pomoState?.workSessionsBeforeLongBreak ?? 4}</div>
      </div>

      {isSettingsOpen && (
        <PomodoroSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentModeIndex={pomoState?.modeIndex ?? 0}
          modes={(modes ?? INITIAL_MODES).map((mode, index) => ({ ...mode, label: `Mode ${index + 1}` }))}
          onModeChange={(index) => setPomoState(prev => ({ ...prev!, modeIndex: index } as PomoState))}
          onSaveCustomMode={(mode) => {
            const newModes = [...(modes ?? INITIAL_MODES)];
            newModes[newModes.length - 1] = mode;
            setModes(newModes);
          }}
          workSessionsBeforeLongBreak={pomoState?.workSessionsBeforeLongBreak ?? 4}
          onWorkSessionsChange={(value) => setPomoState(prev => ({ ...prev!, workSessionsBeforeLongBreak: value } as PomoState))}
          longBreakDuration={pomoState?.longBreakDuration ?? 900}
          onLongBreakDurationChange={(value) => setPomoState(prev => ({ ...prev!, longBreakDuration: value } as PomoState))}
        />
      )}
    </div>
  );
}
