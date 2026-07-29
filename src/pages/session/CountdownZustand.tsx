import { Bell, BellOff, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import SectionTitle from '@/components/SectionTitle';
import useEventListener from '@/hooks/useEventListener';
import {
  useCountdownState,
  useCountdownBaseline,
  useCountdownSettings,
  useSyncSettings,
  useTimerActions,
  type CountdownTime,
} from '@/store/appStore';

type Field = 'hours' | 'minutes' | 'seconds';
const fields: Field[] = ['hours', 'minutes', 'seconds'];
const fieldMax: Record<Field, number> = { hours: 23, minutes: 59, seconds: 59 };


const DEFAULT_TIME: CountdownTime = { hours: 2, minutes: 0, seconds: 0 };

const CountdownZustand = () => {
  // 🎯 Zustand Hooks - Centralizado y optimizado
  const countdownState = useCountdownState();
  const countdownBaseline = useCountdownBaseline();
  const { alarmEnabled, toggleAlarm: toggleAlarmSetting } = useCountdownSettings();
  const syncSettings = useSyncSettings();
  const timerActions = useTimerActions();

  // 🎯 Local State
  const [focusedField, setFocusedField] = useState<Field | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // 🎯 REFS
  const baselineTimeRef = useRef<CountdownTime>(countdownBaseline ?? DEFAULT_TIME);
  const inputRefs = useRef<Record<Field, React.RefObject<HTMLInputElement | null>>>({
    hours: React.createRef<HTMLInputElement>(),
    minutes: React.createRef<HTMLInputElement>(),
    seconds: React.createRef<HTMLInputElement>()
  });
  const ignoreExternalUntilPlayRef = useRef<boolean>(false);

  // 🎯 DERIVED STATE
  const isCountdownRunning = countdownState.status === 'running';
  const endTimestamp = countdownState.endTimestamp ?? null;
  const pausedSecondsLeft = countdownState.pausedSecondsLeft ?? null;
  const initialTime = countdownBaseline ?? DEFAULT_TIME;

  // 🎯 UTILITIES
  const calculateSeconds = ({ hours, minutes, seconds }: CountdownTime) =>
    hours * 3600 + minutes * 60 + seconds;

  // 🎯 TIMER CONTROLS
  const controls = useMemo(() => ({
    start: (baseTimestamp?: number, fromSync = false) => {
      if (isCountdownRunning) return;

      const now = baseTimestamp ?? Date.now();
      const sourceTime = baselineTimeRef.current;
      const total = calculateSeconds(sourceTime);

      if (total === 0) return;

      const endTs = now + total * 1000;

      timerActions.setCountdownState({
        status: 'running',
        endTimestamp: endTs,
        pausedSecondsLeft: null,
        lastTime: sourceTime,
      });

      setSecondsLeft(total);
      timerActions.setCountdownTimerState('running');
      ignoreExternalUntilPlayRef.current = false;

      if (!fromSync && !syncSettings.syncCountdownWithTimer) {
        window.dispatchEvent(new CustomEvent('playCountdown', { 
          detail: { baseTimestamp: now } 
        }));
      }
    },

    pause: () => {
      if (endTimestamp) {
        const remaining = Math.max(0, (endTimestamp - Date.now()) / 1000);
        
        timerActions.updateCountdownState({
          status: 'paused',
          endTimestamp: null,
          pausedSecondsLeft: Math.round(remaining),
        });
        
        setSecondsLeft(remaining);
        timerActions.setCountdownTimerState('paused');
      }
    },

    reset: (fromSync = false) => {
      timerActions.setCountdownState({
        status: 'stopped',
        endTimestamp: null,
        pausedSecondsLeft: null,
        lastTime: baselineTimeRef.current,
      });

      setSecondsLeft(0);
      timerActions.setCountdownTimerState('stopped');

      if (!fromSync && !syncSettings.syncCountdownWithTimer) {
        window.dispatchEvent(new CustomEvent('resetCountdown', { detail: { baseTimestamp: Date.now() } }));
      }
    },
  }), [isCountdownRunning, countdownBaseline, pausedSecondsLeft, endTimestamp, syncSettings, timerActions]);

  // 🎯 SYNC EVENT HANDLERS
  const handleSyncPlay = useCallback((event: CustomEvent) => {
    if (syncSettings.syncCountdownWithTimer && !isCountdownRunning) {
      const baseTimestamp = event?.detail?.baseTimestamp;
      controls.start(baseTimestamp, true);
    }
  }, [syncSettings.syncCountdownWithTimer, isCountdownRunning, controls.start]);

  const handleSyncPause = useCallback(() => {
    if (syncSettings.syncCountdownWithTimer && isCountdownRunning) {
      controls.pause();
    }
  }, [syncSettings.syncCountdownWithTimer, isCountdownRunning, controls.pause]);

  const handleSyncReset = useCallback(() => {
    if (syncSettings.syncCountdownWithTimer) {
      controls.reset(true);
    }
  }, [syncSettings.syncCountdownWithTimer, controls.reset]);

  // 🎯 EVENT LISTENERS
  useEventListener('playCountdown', handleSyncPlay);
  useEventListener('pauseCountdown', handleSyncPause);
  useEventListener('resetCountdown', handleSyncReset);

  // 🎯 TIMER EFFECT
  useEffect(() => {
    if (!isCountdownRunning || !endTimestamp) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, (endTimestamp - now) / 1000);

      setSecondsLeft(remaining);

      if (remaining === 0) {
        controls.reset();
        timerActions.setCountdownTimerState('stopped');

        if (alarmEnabled) {
          const audio = new Audio('/sounds/countdownend.mp3');
          audio.play().catch((e) => console.warn('Error playing alarm:', e));
        }

        window.dispatchEvent(new CustomEvent('countdownCompleted'));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCountdownRunning, endTimestamp, alarmEnabled, controls.reset, timerActions]);

  // 🎯 INITIALIZATION EFFECT
  useEffect(() => {
    if (countdownState.status === 'running' && countdownState.endTimestamp) {
      const now = Date.now();
      if (countdownState.endTimestamp > now) {
        setSecondsLeft((countdownState.endTimestamp - now) / 1000);
      } else {
        controls.reset();
      }
    } else if (countdownState.status === 'paused' && countdownState.pausedSecondsLeft !== null) {
      setSecondsLeft(countdownState.pausedSecondsLeft);
    }
  }, [countdownState, controls.reset]);

  // 🎯 BASELINE SYNC EFFECT
  useEffect(() => {
    baselineTimeRef.current = countdownBaseline ?? DEFAULT_TIME;
  }, [countdownBaseline]);

  // 🎯 INPUT HANDLERS
  const handleTimeChange = useCallback((field: Field, value: string) => {
    const numValue = parseInt(value, 10);
    if (Number.isNaN(numValue)) return;

    const newTime = { ...baselineTimeRef.current, [field]: numValue };
    baselineTimeRef.current = newTime;
    timerActions.setCountdownBaseline(newTime);
    timerActions.updateCountdownState({ lastTime: newTime });

    if (!isCountdownRunning) {
      // Update display when not running
    }
  }, [countdownBaseline, timerActions, isCountdownRunning]);

  const toggleAlarm = useCallback(() => {
    toggleAlarmSetting();
  }, [toggleAlarmSetting]);

  const navigateField = useCallback((direction: number, currentIdx: number) => {
    const nextIdx = (currentIdx + direction + fields.length) % fields.length;
    const nextField = fields[nextIdx] as Field;
    inputRefs.current[nextField]?.current?.focus();
  }, []);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, field: Field) => {
    const idx = fields.indexOf(field);

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        navigateField(e.shiftKey ? -1 : 1, idx);
        break;
      case 'ArrowRight':
        if (document.querySelector('[role="dialog"]')) break;
        e.preventDefault();
        navigateField(1, idx);
        break;
      case 'ArrowLeft':
        if (document.querySelector('[role="dialog"]')) break;
        e.preventDefault();
        navigateField(-1, idx);
        break;
      case 'ArrowUp':
        if (document.querySelector('[role="dialog"]')) break;
        e.preventDefault();
        navigateField(-1, idx);
        break;
      case 'ArrowDown':
        if (document.querySelector('[role="dialog"]')) break;
        e.preventDefault();
        navigateField(1, idx);
        break;
    }
  }, [controls.start, timerActions, navigateField]);

  // 🎯 RENDER
  const displayTime = useMemo(() => {
    const totalSeconds = Math.round(secondsLeft);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  }, [secondsLeft]);

  return (
    <div className="countdown-container">
      <SectionTitle title="Countdown Timer" tooltip="Set a custom countdown timer" />
      
      <div className="timer-display">
        <div className="time-text">
          {displayTime.hours.toString().padStart(2, '0')}:
          {displayTime.minutes.toString().padStart(2, '0')}:
          {displayTime.seconds.toString().padStart(2, '0')}
        </div>
        <div className="status-badge">{countdownState.status}</div>
      </div>

      <div className="time-inputs">
        {fields.map((field) => (
          <div key={field} className="time-input-group">
            <input
              ref={inputRefs.current[field]}
              type="text"
              value={initialTime[field]}
              onChange={(e) => handleTimeChange(field, e.target.value)}
              onKeyDown={(e) => handleInputKeyDown(e, field)}
              onFocus={() => setFocusedField(field)}
              onBlur={() => setFocusedField(null)}
              disabled={isCountdownRunning}
              maxLength={2}
              className={`time-input ${focusedField === field ? 'focused' : ''}`}
            />
            <span className="time-label">{field}</span>
          </div>
        ))}
      </div>

      <div className="timer-controls">
        <button onClick={() => isCountdownRunning ? controls.pause() : controls.start()}>
          {isCountdownRunning ? <Pause /> : <Play />}
        </button>
        <button onClick={() => controls.reset()}>
          <RotateCcw />
        </button>
        <button onClick={toggleAlarm}>
          {alarmEnabled ? <Bell /> : <BellOff />}
        </button>
      </div>

      <div className="sync-settings">
        <label>
          <input
            type="checkbox"
            checked={syncSettings.isSyncedWithStudyTimer}
            onChange={(e) => timerActions.updateSyncSettings({ isSyncedWithStudyTimer: e.target.checked })}
          />
          Sync with Study Timer
        </label>
      </div>
    </div>
  );
};

export default CountdownZustand;
