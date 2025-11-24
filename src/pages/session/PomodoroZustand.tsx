import { Bell, BellOff, MoreVertical, Pause, Play, RefreshCw, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { POMODORO_SOUNDS } from '../../constants/pomodoro';
import type { PomodoroModeType } from '../../types/pomodoro';
import PomodoroSettingsModal from '@/modals/PomodoroSettingsModal';
import SectionTitle from '@/components/SectionTitle';
import useEventListener from '@/hooks/useEventListener';
import {
  usePomodoroState,
  usePomodoroModes,
  usePomodoroCounts,
  useSyncSettings,
  useTimerActions,
  type PomoState,
} from '@/store/appStore';



const DEFAULT_STATE: PomoState = {
  timeLeft: 1500, // 25 minutes
  isRunning: false,
  currentMode: 'work',
  modeIndex: 0,
  workSessionsCompleted: 0,
  workSessionsBeforeLongBreak: 4,
  longBreakDuration: 900, // 15 minutes
  startTime: 0,
  pausedTime: 0,
};

const formatPomoTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const PomodoroZustand = () => {
  // 🎯 Zustand Hooks - Centralizado y optimizado
  const pomodoroState = usePomodoroState();
  const pomodoroModes = usePomodoroModes();
  const { thisSession: pomodorosThisSession, todayLocal: pomodorosTodayLocal } = usePomodoroCounts();
  const syncSettings = useSyncSettings();
  const timerActions = useTimerActions();

  // 🎯 Local State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingState] = useState(false);

  // 🎯 Derived State
  const isPomodoroRunning = pomodoroState.isRunning;
  const isWork = pomodoroState.currentMode === 'work';
  const isBreak = pomodoroState.currentMode === 'break';
  const currentModeConfig = pomodoroModes[pomodoroState.modeIndex];
  const isAlarmEnabled = true; // Podría venir del store si es necesario

  // 🎯 TIMER CONTROLS
  const controls = useMemo(() => ({
    start: (baseTimestamp?: number) => {
      const now = baseTimestamp ?? Date.now();
      const currentTime = currentModeConfig?.[pomodoroState.currentMode] ?? 1500;
      
      timerActions.updatePomodoroState({
        isRunning: true,
        timeLeft: currentTime,
        startTime: now,
        pausedTime: 0,
      });
      
      timerActions.setPomodoroTimerState('running');

      if (!syncSettings.syncPomodoroWithTimer) {
        window.dispatchEvent(new CustomEvent('playPomodoro', { 
          detail: { baseTimestamp: now } 
        }));
      }
    },

    pause: () => {
      timerActions.updatePomodoroState({
        isRunning: false,
        pausedTime: Date.now(),
      });
      
      timerActions.setPomodoroTimerState('paused');
      
      if (!syncSettings.syncPomodoroWithTimer) {
        window.dispatchEvent(new CustomEvent('pausePomodoro', { 
          detail: { baseTimestamp: Date.now() } 
        }));
      }
    },

    reset: (fromSync = false) => {
      const resetState: PomoState = {
        ...DEFAULT_STATE,
        timeLeft: currentModeConfig?.[isWork ? 'work' : isBreak ? 'break' : 'longBreak'] ?? 1500,
        currentMode: pomodoroState.currentMode,
        modeIndex: pomodoroState.modeIndex,
      };
      
      timerActions.setPomodoroState(resetState);
      timerActions.setPomodoroTimerState('stopped');
      
      if (!fromSync && !syncSettings.syncPomodoroWithTimer) {
        window.dispatchEvent(new CustomEvent('resetPomodoro', { 
          detail: { baseTimestamp: Date.now() } 
        }));
      }
    },

    skip: () => {
      let nextMode: PomodoroModeType;
      
      if (isWork) {
        const completed = pomodoroState.workSessionsCompleted + 1;
        if (completed >= pomodoroState.workSessionsBeforeLongBreak) {
          nextMode = 'longBreak';
          timerActions.updatePomodoroState({ workSessionsCompleted: 0 });
        } else {
          nextMode = 'break';
          timerActions.updatePomodoroState({ workSessionsCompleted: completed });
        }
      } else if (isBreak) {
        nextMode = 'work';
      } else {
        nextMode = 'work';
      }

      const nextTime = pomodoroModes[pomodoroState.modeIndex]?.[nextMode] ?? 1500;
      timerActions.updatePomodoroState({
        currentMode: nextMode,
        timeLeft: nextTime,
        isRunning: false,
        startTime: 0,
        pausedTime: 0,
      });
    },
  }), [pomodoroState, isPomodoroRunning, syncSettings, currentModeConfig, isWork, isBreak, timerActions]);

  // 🎯 SYNC EVENT HANDLERS
  const handleSyncPlay = useCallback((event: CustomEvent) => {
    if (syncSettings.syncPomodoroWithTimer && !isPomodoroRunning) {
      const baseTimestamp = event?.detail?.baseTimestamp;
      controls.start(baseTimestamp);
    }
  }, [syncSettings.syncPomodoroWithTimer, isPomodoroRunning, controls.start]);

  const handleSyncPause = useCallback(() => {
    if (syncSettings.syncPomodoroWithTimer && isPomodoroRunning) {
      controls.pause();
    }
  }, [syncSettings.syncPomodoroWithTimer, isPomodoroRunning, controls.pause]);

  const handleSyncReset = useCallback(() => {
    if (syncSettings.syncPomodoroWithTimer) {
      controls.reset(true);
    }
  }, [syncSettings.syncPomodoroWithTimer, controls.reset]);

  // 🎯 EVENT LISTENERS
  useEventListener('playPomodoro', handleSyncPlay);
  useEventListener('pausePomodoro', handleSyncPause);
  useEventListener('resetPomodoro', handleSyncReset);

  // 🎯 TIMER EFFECT
  useEffect(() => {
    if (!isPomodoroRunning) return;

    const interval = setInterval(() => {
      timerActions.updatePomodoroState((prev: PomoState) => {
        const newTimeLeft = prev.timeLeft - 1;
        
        if (newTimeLeft <= 0) {
          // Timer completed
          controls.reset();
          timerActions.setPomodoroTimerState('stopped');

          if (isAlarmEnabled) {
            const audio = new Audio(POMODORO_SOUNDS.BREAK);
            audio.play().catch(e => console.warn('Error playing alarm:', e));
          }

          window.dispatchEvent(new CustomEvent('pomodoroCompleted'));

          if (isWork) {
            timerActions.incrementPomodorosThisSession();
            timerActions.incrementPomodorosTodayLocal();
          }

          return prev; // Return original state since controls.reset() will handle it
        }

        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPomodoroRunning, controls.reset, isAlarmEnabled, isWork, timerActions]);

  // 🎯 SESSION RESET
  const resetSessionPomodoros = useCallback(() => {
    timerActions.resetPomodorosThisSession();
  }, [timerActions]);

  useEventListener('sessionStarted', resetSessionPomodoros);

  // 🎯 RENDER
  if (isLoadingState) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="pomodoro-container">
      <SectionTitle title="Pomodoro Timer" tooltip="Focus timer with work/break intervals" />
      
      <div className="timer-display">
        <div className="time-text">{formatPomoTime(pomodoroState.timeLeft)}</div>
        <div className="mode-badge">{pomodoroState.currentMode}</div>
      </div>

      <div className="timer-controls">
        <button onClick={() => isPomodoroRunning ? controls.pause() : controls.start()}>
          {isPomodoroRunning ? <Pause /> : <Play />}
        </button>
        <button onClick={() => controls.reset()}>
          <RotateCcw />
        </button>
        <button onClick={() => controls.skip()}>
          <RefreshCw />
        </button>
        <button onClick={() => {/* Toggle alarm - podría ir al store */}}>
          {isAlarmEnabled ? <Bell /> : <BellOff />}
        </button>
        <button onClick={() => setIsSettingsOpen(true)}>
          <MoreVertical />
        </button>
      </div>

      <div className="stats">
        <div>Today: {pomodorosTodayLocal}</div>
        <div>Session: {pomodorosThisSession}</div>
        <div>Work sessions: {pomodoroState.workSessionsCompleted}/{pomodoroState.workSessionsBeforeLongBreak}</div>
      </div>

      {isSettingsOpen && (
        <PomodoroSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentModeIndex={pomodoroState.modeIndex}
          modes={pomodoroModes.map((mode, index) => ({ ...mode, label: `Mode ${index + 1}` }))}
          onModeChange={(index) => timerActions.updatePomodoroState({ modeIndex: index })}
          onSaveCustomMode={(mode) => {
            timerActions.updatePomodoroMode(pomodoroModes.length - 1, mode);
          }}
          workSessionsBeforeLongBreak={pomodoroState.workSessionsBeforeLongBreak}
          onWorkSessionsChange={(value) => timerActions.updatePomodoroState({ workSessionsBeforeLongBreak: value })}
          longBreakDuration={pomodoroState.longBreakDuration}
          onLongBreakDurationChange={(value) => timerActions.updatePomodoroState({ longBreakDuration: value })}
        />
      )}
    </div>
  );
};

export default PomodoroZustand;
