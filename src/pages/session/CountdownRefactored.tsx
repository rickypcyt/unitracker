import { Bell, BellOff, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useObjectStorage, useStorage } from '@/hooks/useStorage';

import SectionTitle from '@/components/SectionTitle';
import { setCountdownState } from '@/store/slices/uiSlice';
import useEventListener from '@/hooks/useEventListener';

type Field = 'hours' | 'minutes' | 'seconds';
const fields: Field[] = ['hours', 'minutes', 'seconds'];
const fieldMax: Record<Field, number> = { hours: 23, minutes: 59, seconds: 59 };

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownState {
  status: 'running' | 'paused' | 'stopped';
  endTimestamp: number | null;
  pausedSecondsLeft: number | null;
  lastTime: CountdownTime;
}

const DEFAULT_TIME: CountdownTime = { hours: 2, minutes: 0, seconds: 0 };
const DEFAULT_STATE: CountdownState = {
  status: 'stopped',
  endTimestamp: null,
  pausedSecondsLeft: null,
  lastTime: DEFAULT_TIME,
};

const isCountdownState = (obj: any): obj is CountdownState => {
  return (
    obj &&
    typeof obj === 'object' &&
    ['running', 'paused', 'stopped'].includes(obj.status) &&
    (obj.endTimestamp === null || typeof obj.endTimestamp === 'number') &&
    (obj.pausedSecondsLeft === null || typeof obj.pausedSecondsLeft === 'number') &&
    obj.lastTime &&
    typeof obj.lastTime.hours === 'number' &&
    typeof obj.lastTime.minutes === 'number' &&
    typeof obj.lastTime.seconds === 'number'
  );
};


const Countdown = () => {
  const dispatch = useDispatch();
  
  // 🎯 STORAGE HOOKS - Centralizado y tipado
  const { value: baseline, setValue: setBaseline } = useObjectStorage<CountdownTime>(
    'countdownBaseline',
    { defaultValue: DEFAULT_TIME }
  );

  const { value: state, setValue: setState, isLoading: isLoadingState } = useObjectStorage<CountdownState>(
    'countdownState',
    { defaultValue: DEFAULT_STATE, validator: isCountdownState }
  );

  const { value: alarmEnabled, setValue: setAlarmEnabled } = useStorage('countdownAlarmEnabled', {
    defaultValue: true,
  });

  const { value: isSyncedWithStudyTimer, setValue: setIsSyncedWithStudyTimer } = useStorage(
    'isSyncedWithStudyTimer',
    { defaultValue: false }
  );

  // 🎯 REDUX STATE
  const syncCountdownWithTimer = useSelector((state: any) => state.ui.syncCountdownWithTimer);

  // 🎯 LOCAL STATE
  const [focusedField, setFocusedField] = useState<Field | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // 🎯 REFS
  const baselineTimeRef = useRef<CountdownTime>(baseline ?? DEFAULT_TIME);
  const inputRefs = useRef<Record<Field, React.RefObject<HTMLInputElement | null>>>({
    hours: React.createRef<HTMLInputElement>(),
    minutes: React.createRef<HTMLInputElement>(),
    seconds: React.createRef<HTMLInputElement>()
  });
  const ignoreExternalUntilPlayRef = useRef<boolean>(false);

  // 🎯 DERIVED STATE
  const isCountdownRunning = state?.status === 'running';
  const endTimestamp = state?.endTimestamp ?? null;
  const pausedSecondsLeft = state?.pausedSecondsLeft ?? null;
  const initialTime = baseline ?? DEFAULT_TIME;

  // 🎯 UTILITIES
  const calculateSeconds = ({ hours, minutes, seconds }: CountdownTime) =>
    hours * 3600 + minutes * 60 + seconds;

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 🎯 TIMER CONTROLS
  const controls = useMemo(() => ({
    start: (baseTimestamp?: number, fromSync?: boolean) => {
      const sourceTime = baselineTimeRef.current;
      const total = pausedSecondsLeft !== null 
        ? pausedSecondsLeft 
        : calculateSeconds(sourceTime);

      if (total > 0) {
        const now = baseTimestamp ?? Date.now();
        const endTs = now + total * 1000;

        setState({
          status: 'running',
          endTimestamp: endTs,
          pausedSecondsLeft: null,
          lastTime: sourceTime,
        });

        setSecondsLeft(total);
        dispatch(setCountdownState('running'));
        ignoreExternalUntilPlayRef.current = false;

        if (!fromSync && !syncCountdownWithTimer) {
          window.dispatchEvent(new CustomEvent('playCountdown', { 
            detail: { baseTimestamp: now } 
          }));
        }
      }
    },

    pause: () => {
      if (endTimestamp) {
        const remaining = Math.max(0, (endTimestamp - Date.now()) / 1000);
        
        setState(prev => ({ ...prev!, status: 'paused', endTimestamp: null, pausedSecondsLeft: Math.round(remaining) }));
        setSecondsLeft(remaining);
        dispatch(setCountdownState('paused'));
      }
    },

    reset: (fromSync = false) => {
      setState({
        status: 'stopped',
        endTimestamp: null,
        pausedSecondsLeft: null,
        lastTime: baselineTimeRef.current,
      });

      setSecondsLeft(0);
      dispatch(setCountdownState('stopped'));

      if (!fromSync && !syncCountdownWithTimer) {
        window.dispatchEvent(new CustomEvent('resetCountdown', { detail: { baseTimestamp: Date.now() } }));
      }
    },
  }), [baseline, pausedSecondsLeft, endTimestamp, syncCountdownWithTimer, setState, dispatch]);

  const handleSyncPlay = useCallback((event: CustomEvent) => {
    if (syncCountdownWithTimer && !isCountdownRunning) {
      const baseTimestamp = event?.detail?.baseTimestamp;
      controls.start(baseTimestamp, true);
    }
  }, [syncCountdownWithTimer, isCountdownRunning, controls.start]);

  const handleSyncPause = useCallback(() => {
    if (syncCountdownWithTimer && isCountdownRunning) {
      controls.pause();
    }
  }, [syncCountdownWithTimer, isCountdownRunning, controls.pause]);

  const handleSyncReset = useCallback(() => {
    if (syncCountdownWithTimer) {
      controls.reset(true);
    }
  }, [syncCountdownWithTimer, controls.reset]);

  useEventListener('playCountdown', handleSyncPlay);
  useEventListener('pauseCountdown', handleSyncPause);
  useEventListener('resetCountdown', handleSyncReset);

  useEffect(() => {
    if (!isCountdownRunning || !endTimestamp) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, (endTimestamp - now) / 1000);

      setSecondsLeft(remaining);

      if (remaining === 0) {
        controls.reset();
        dispatch(setCountdownState('stopped'));

        if (alarmEnabled) {
          const audio = new Audio('/sounds/countdownend.mp3');
          audio.play().catch((e) => console.warn('Error playing alarm:', e));
        }

        window.dispatchEvent(new CustomEvent('countdownCompleted'));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCountdownRunning, endTimestamp, alarmEnabled, controls.reset, dispatch]);

  useEffect(() => {
    if (isLoadingState) return;

    if (state?.status === 'running' && state.endTimestamp) {
      const now = Date.now();
      if (state.endTimestamp > now) {
        setSecondsLeft((state.endTimestamp - now) / 1000);
      } else {
        controls.reset();
      }
    } else if (state?.status === 'paused' && state.pausedSecondsLeft !== null) {
      setSecondsLeft(state.pausedSecondsLeft);
    }
  }, [state, isLoadingState, controls.reset]);

  useEffect(() => {
    baselineTimeRef.current = baseline ?? DEFAULT_TIME;
  }, [baseline]);

  // 🎯 INPUT HANDLERS
  const handleTimeChange = useCallback((field: Field, value: string) => {
    const numValue = parseInt(value, 10);
    if (Number.isNaN(numValue)) return;

    const newTime = { ...baselineTimeRef.current, [field]: numValue };
    baselineTimeRef.current = newTime;
    setBaseline(newTime);
    setState(prev => ({ ...prev!, lastTime: newTime }));

    if (!isCountdownRunning) {
      // Update display when not running
    }
  }, [baseline, setBaseline, setState, isCountdownRunning]);

  const toggleAlarm = useCallback(() => {
    setAlarmEnabled(prev => !prev);
  }, [setAlarmEnabled]);

  const navigateField = useCallback((direction: number, currentIdx: number) => {
    const nextIdx = (currentIdx + direction + fields.length) % fields.length;
    const nextField = fields[nextIdx] as Field;
    inputRefs.current[nextField]?.current?.focus();
  }, []);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, field: Field) => {
    const idx = fields.indexOf(field);
    const step = e.shiftKey ? 10 : 1;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        navigateField(e.shiftKey ? -1 : 1, idx);
        break;
      case 'Enter':
        if (!isCountdownRunning) controls.start();
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateField(1, idx);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigateField(-1, idx);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isCountdownRunning) break;
        {
          const base = baselineTimeRef.current;
          const nextVal = (base[field] + step) % (fieldMax[field] + 1);
          const next = { ...base, [field]: nextVal as unknown as Field };
          baselineTimeRef.current = next;
          setBaseline(next);
          setState(prev => ({ ...prev!, lastTime: next }));
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (isCountdownRunning) break;
        {
          const base = baselineTimeRef.current;
          const nextVal = (base[field] - step + (fieldMax[field] + 1)) % (fieldMax[field] + 1);
          const next = { ...base, [field]: nextVal as unknown as Field };
          baselineTimeRef.current = next;
          setBaseline(next);
          setState(prev => ({ ...prev!, lastTime: next }));
        }
        break;
    }
  }, [isCountdownRunning, controls.start, setBaseline, setState, navigateField]);

  // 🎯 RENDER
  if (isLoadingState) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="countdown-container">
      <SectionTitle title="Countdown Timer" tooltip="Set a custom countdown timer" />
      
      <div className="timer-display">
        <div className="time-text">{formatTime(Math.round(secondsLeft))}</div>
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

      <div className="sync-status">
        <label>
          <input
            type="checkbox"
            checked={isSyncedWithStudyTimer ?? false}
            onChange={(e) => setIsSyncedWithStudyTimer(e.target.checked)}
          />
          Sync with Study Timer
        </label>
      </div>
    </div>
  );
};

export default Countdown;
