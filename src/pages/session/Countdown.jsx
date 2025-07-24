import { AlarmClock, Bell, BellOff, Link2, Link2Off, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import SectionTitle from '@/components/SectionTitle';
import toast from 'react-hot-toast';
import useEventListener from '@/hooks/useEventListener';
import { useSelector } from 'react-redux';

const fields = ['hours', 'minutes', 'seconds'];
const fieldMax = { hours: 23, minutes: 59, seconds: 59 };

const pad = (n, field) => {
  const max = fieldMax[field];
  const val = Math.min(Math.max(n, 0), max);
  return val.toString().padStart(2, '0');
};

const getInitialTime = () => {
  try {
    const saved = localStorage.getItem('countdownLastTime');
    if (saved) return JSON.parse(saved);
  } catch {}
  return { hours: 1, minutes: 0, seconds: 0 };
};
const Countdown = () => {
  const [time, setTime] = useState(() => {
    try {
      const saved = localStorage.getItem('countdownLastTime');
      if (saved) {
        const parsed = JSON.parse(saved);
        const safe = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
        const safeTime = {
          hours: safe(parsed.hours),
          minutes: safe(parsed.minutes),
          seconds: safe(parsed.seconds)
        };
        if (Object.values(safeTime).some(v => !Number.isFinite(v))) {
          localStorage.removeItem('countdownLastTime');
          return { hours: 1, minutes: 0, seconds: 0 };
        }
        return safeTime;
      }
    } catch {}
    return { hours: 1, minutes: 0, seconds: 0 };
  });
  const [initialTime, setInitialTime] = useState(time);
  const [activeField, setActiveField] = useState('hours');
  const [focusedField, setFocusedField] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTimestamp, setStartTimestamp] = useState(null); // Nuevo: timestamp de inicio
  const [programmaticFocusField, setProgrammaticFocusField] = useState(null);
  // Eliminamos fieldPrevValue y fieldOverwrite
  const [alarmEnabled, setAlarmEnabled] = useState(() => {
    const saved = localStorage.getItem('countdownAlarmEnabled');
    return saved === null ? true : saved === 'true';
  });
  const [isSyncedWithStudyTimer, setIsSyncedWithStudyTimer] = useState(() => {
    const savedState = localStorage.getItem('isSyncedWithStudyTimer');
    return savedState ? JSON.parse(savedState) : false;
  });
  const syncCountdownWithTimer = useSelector(state => state.ui.syncCountdownWithTimer);
  const isStudyRunningRedux = useSelector(state => state.ui.isStudyRunning);
  const isRunningGlobal = syncCountdownWithTimer ? isStudyRunningRedux : isRunning;

  // Estado local para el toggle visual
  const [syncToggle, setSyncToggle] = useState(() => {
    return localStorage.getItem('isSyncedWithStudyTimer') === 'true';
  });

  // Mantener syncToggle en sync con cambios externos
  useEffect(() => {
    const handler = (e) => {
      setSyncToggle(e.detail.isSyncedWithStudyTimer);
    };
    window.addEventListener('studyTimerSyncStateChanged', handler);
    return () => window.removeEventListener('studyTimerSyncStateChanged', handler);
  }, []);

  // Handler para el toggle visual
  const handleSyncToggle = () => {
    const newSync = !syncToggle;
    setSyncToggle(newSync);
    localStorage.setItem('isSyncedWithStudyTimer', newSync ? 'true' : 'false');
    setIsSyncedWithStudyTimer(newSync);
    window.dispatchEvent(new CustomEvent('studyTimerSyncStateChanged', { detail: { isSyncedWithStudyTimer: newSync } }));
  };

  const toggleAlarm = () => {
    setAlarmEnabled(prev => {
      localStorage.setItem('countdownAlarmEnabled', String(!prev));
      return !prev;
    });
  };

  const inputRefs = useRef({
    hours: React.createRef(),
    minutes: React.createRef(),
    seconds: React.createRef()
  });

  const calculateSeconds = ({ hours, minutes, seconds }) =>
    hours * 3600 + minutes * 60 + seconds;

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);
  const [pausedSecondsLeft, setPausedSecondsLeft] = useState(null);

  const startCountdown = (baseTimestamp, fromSync) => {
    // Corrige los valores antes de iniciar
    const correctedTime = {
      hours: Math.min(Math.max(time.hours, 0), fieldMax.hours),
      minutes: Math.min(Math.max(time.minutes, 0), fieldMax.minutes),
      seconds: Math.min(Math.max(time.seconds, 0), fieldMax.seconds),
    };
    setTime(correctedTime);
    const total = calculateSeconds(correctedTime);
    if (total > 0) {
      setInitialTime(correctedTime);
      setSecondsLeft(total);
      setStartTimestamp(baseTimestamp || Date.now());
      setIsRunning(true);
      if (!fromSync && syncCountdownWithTimer) {
        const now = baseTimestamp || Date.now();
        window.dispatchEvent(new CustomEvent("playPomodoroSync", { detail: { baseTimestamp: now } }));
        window.dispatchEvent(new CustomEvent("playCountdownSync", { detail: { baseTimestamp: now } }));
      }
    }
  };

  const handlePause = (fromSync) => {
    setIsRunning(false);
    setPausedSecondsLeft(secondsLeft); // Guarda el tiempo restante al pausar
    if (!fromSync && syncCountdownWithTimer) {
      window.dispatchEvent(new CustomEvent("pausePomodoroSync", { detail: { baseTimestamp: Date.now() } }));
      window.dispatchEvent(new CustomEvent("pauseCountdownSync", { detail: { baseTimestamp: Date.now() } }));
    }
  };

  const handleResume = () => {
    if (pausedSecondsLeft !== null) {
      setStartTimestamp(Date.now());
      setInitialTime({
        hours: Math.floor(pausedSecondsLeft / 3600),
        minutes: Math.floor((pausedSecondsLeft % 3600) / 60),
        seconds: pausedSecondsLeft % 60
      });
      setIsRunning(true);
      setPausedSecondsLeft(null);
    }
  };

  const handleReset = (fromSync = false) => {
    setIsRunning(false);
    setSecondsLeft(0);
    setStartTimestamp(null); // Resetear timestamp
    setTime(initialTime);
    // Limpiar localStorage
    localStorage.removeItem('countdownLastTime');
    if (fromSync) {
      // No emitir eventos de sincronización si viene de sync
      return;
    }
    if (syncCountdownWithTimer) {
      window.dispatchEvent(new CustomEvent("resetPomodoroSync", { detail: { baseTimestamp: Date.now() } }));
      window.dispatchEvent(new CustomEvent("resetCountdownSync", { detail: { baseTimestamp: Date.now() } }));
    }
  };

  useEffect(() => {
    if (!isRunningGlobal || !startTimestamp) return;
    let prevSecondsLeft = secondsLeft;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
      const newSecondsLeft = Math.max(0, calculateSeconds(initialTime) - elapsed);
      if (newSecondsLeft !== prevSecondsLeft) {
        setSecondsLeft(newSecondsLeft);
        prevSecondsLeft = newSecondsLeft;
      }
      if (newSecondsLeft <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        if (alarmEnabled) {
          try {
            new Audio('/sounds/countdownend.mp3').play();
          } catch {}
        }
        toast.success('Countdown finished! Session complete.', {
          position: 'top-center',
          style: {
            backgroundColor: '#000',
            color: '#fff',
            border: '2px solid var(--border-primary)'
          }
        });
        if (Notification.permission === 'granted') {
          try {
            const notification = new Notification('Countdown finished!', {
              body: 'Your session is complete.',
              silent: false,
              vibrate: [200, 100, 200]
            });
            setTimeout(() => notification.close(), 5000);
          } catch {}
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunningGlobal, startTimestamp, initialTime, alarmEnabled]);

  useEffect(() => {
    if (isRunning) {
      setTime({
        hours: Math.floor(secondsLeft / 3600),
        minutes: Math.floor((secondsLeft % 3600) / 60),
        seconds: secondsLeft % 60
      });
    }
  }, [secondsLeft, isRunning]);

  // Sincroniza al volver a enfocar la ventana
  useEffect(() => {
    if (!isRunning || !startTimestamp) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
        const newSecondsLeft = Math.max(0, calculateSeconds(initialTime) - elapsed);
        setSecondsLeft(newSecondsLeft);
        // Si el tiempo se acabó mientras estaba fuera, detener
        if (newSecondsLeft === 0) {
          setIsRunning(false);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, startTimestamp, initialTime]);

  // Ajusta el tiempo total del countdown (en segundos)
  const handleTimeAdjustment = (adjustment) => {
    if (isRunning) return; // No permitir ajuste mientras corre
    const totalSeconds = calculateSeconds(time) + adjustment;
    const clamped = Math.max(0, totalSeconds);
    const h = Math.floor(clamped / 3600);
    const m = Math.floor((clamped % 3600) / 60);
    const s = clamped % 60;
    const updated = { hours: h, minutes: m, seconds: s };
    setTime(updated);
    setInitialTime(updated); // <-- Actualiza initialTime
  };

  // Sincronización con StudyTimer
  useEventListener('playCountdownSync', (event) => {
    if (!syncCountdownWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (!isRunning) {
      startCountdown(baseTimestamp, true);
    }
  }, [syncCountdownWithTimer, isRunning, lastSyncTimestamp]);

  useEventListener('pauseCountdownSync', (event) => {
    if (!syncCountdownWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (isRunning) {
      handlePause(true);
    }
  }, [syncCountdownWithTimer, isRunning, lastSyncTimestamp]);

  useEventListener('resetTimerSync', (event) => {
    if (!syncCountdownWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    handleReset(true);
  }, [syncCountdownWithTimer, lastSyncTimestamp]);

  useEventListener('adjustCountdownTime', (event) => {
    if (isSyncedWithStudyTimer && !isRunning) {
      const { adjustment } = event.detail;
      handleTimeAdjustment(adjustment);
    }
  }, [isSyncedWithStudyTimer, isRunning, handleTimeAdjustment]);

  useEventListener('studyTimerSyncStateChanged', (event) => {
    const { isSyncedWithStudyTimer: newSyncState } = event.detail;
    setIsSyncedWithStudyTimer(newSyncState);
  }, []);

  useEventListener('studyTimerTimeUpdate', (event) => {
    if (isSyncedWithStudyTimer) {
      const studyTime = Math.floor(event.detail.time);
      // Solo sincronizar si está corriendo
      if (isRunning) {
        // Actualiza el tiempo restante para que coincida con el Study Timer
        const h = Math.floor(studyTime / 3600);
        const m = Math.floor((studyTime % 3600) / 60);
        const s = studyTime % 60;
        setTime(setSafeTime({ hours: h, minutes: m, seconds: s }));
        setSecondsLeft(studyTime);
      }
    }
  }, [isSyncedWithStudyTimer, isRunning]);

  const handleInputChange = useCallback((field, value) => {
    const clean = value.replace(/\D/g, ''); // Solo números
    let val = parseInt(clean, 10);
    if (isNaN(val)) val = 0;
    setTime(prev => {
      const updated = { ...prev, [field]: val };
      localStorage.setItem('countdownLastTime', JSON.stringify(updated));
      setInitialTime(updated); // <-- Actualiza initialTime
      return updated;
    });
  }, []);

  const navigateField = useCallback((direction, currentIdx) => {
    const newIndex = (currentIdx + direction + fields.length) % fields.length;
    const nextField = fields[newIndex];
    setActiveField(nextField);
    setProgrammaticFocusField(nextField);
    inputRefs.current[nextField].current?.focus();
  }, []);

  const handleInputKeyDown = useCallback((e, field) => {
    const idx = fields.indexOf(field);
    const step = field === 'minutes' ? 5 : 1;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        navigateField(e.shiftKey ? -1 : 1, idx);
        break;
      case 'Enter':
        if (field === 'seconds') {
          e.preventDefault();
          startCountdown();
        } else {
          e.preventDefault();
          navigateField(1, idx);
        }
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
        setTime(prev => setSafeTime({ ...prev, [field]: (prev[field] + step) % (fieldMax[field] + 1) }));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setTime(prev => setSafeTime({ ...prev, [field]: (prev[field] - step + (fieldMax[field] + 1)) % (fieldMax[field] + 1) }));
        break;
      default:
        break;
    }
  }, [navigateField, startCountdown]);

  const handleFocus = (field, e) => {
    setActiveField(field);
    setFocusedField(field);
    setTime(prev => setSafeTime({ ...prev, [field]: 0 }));
    setTimeout(() => {
      e.target.setSelectionRange(e.target.value.length, e.target.value.length);
      setProgrammaticFocusField(null);
    }, 0);
  };

  const handleBlur = (field, e) => {
    let val = parseInt(e.target.value.replace(/\D/g, ''), 10);
    if (isNaN(val)) val = 0;
    if (val > fieldMax[field]) val = fieldMax[field];
    setTime(prev => setSafeTime({ ...prev, [field]: val }));
    setFocusedField(null);
  };

  const setSafeTime = (t) => {
    const safe = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    const safeTime = {
      hours: safe(t.hours),
      minutes: safe(t.minutes),
      seconds: safe(t.seconds)
    };
    if (Object.values(safeTime).some(v => !Number.isFinite(v))) {
      localStorage.removeItem('countdownLastTime');
    } else {
      localStorage.setItem('countdownLastTime', JSON.stringify(safeTime));
    }
    return safeTime;
  };

  const handlePlayPause = () => {
    if (syncCountdownWithTimer) {
      if (isStudyRunningRedux) {
        window.dispatchEvent(new CustomEvent("pausePomodoroSync", { detail: { baseTimestamp: Date.now() } }));
        window.dispatchEvent(new CustomEvent("pauseCountdownSync", { detail: { baseTimestamp: Date.now() } }));
      } else {
        window.dispatchEvent(new CustomEvent("playPomodoroSync", { detail: { baseTimestamp: Date.now() } }));
        window.dispatchEvent(new CustomEvent("playCountdownSync", { detail: { baseTimestamp: Date.now() } }));
      }
    } else {
      if (isRunning) {
        handlePause();
      } else if (pausedSecondsLeft !== null) {
        handleResume();
      } else {
        startCountdown();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="section-title justify-center mb-4 relative w-full px-4 py-3">
        <AlarmClock size={24} className="icon" style={{ color: 'var(--accent-primary)' }} />
        <span className="font-bold text-lg sm:text-xl text-[var(--text-primary)] ml-1">Countdown</span>
        {/* Botón de alarma */}
        <button
          onClick={toggleAlarm}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title={alarmEnabled ? 'Disable alarm sound' : 'Enable alarm sound'}
          aria-label="Toggle alarm sound"
        >
          {alarmEnabled ? (
            <Bell size={20} className="text-[var(--text-secondary)]" />
          ) : (
            <BellOff size={20} className="text-[var(--text-secondary)]" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-center mb-6">
        {fields.map((field, idx) => {
          // Si está corriendo, calcula el valor desde secondsLeft
          let value;
          if (isRunningGlobal) {
            const h = Math.floor(secondsLeft / 3600);
            const m = Math.floor((secondsLeft % 3600) / 60);
            const s = secondsLeft % 60;
            if (field === 'hours') value = pad(h, 'hours');
            if (field === 'minutes') value = pad(m, 'minutes');
            if (field === 'seconds') value = pad(s, 'seconds');
          } else {
            value = pad(time[field], field);
          }
          return (
            <React.Fragment key={field}>
              <input
                ref={inputRefs.current[field]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value}
                placeholder={undefined}
                onFocus={e => handleFocus(field, e)}
                onBlur={e => handleBlur(field, e)}
                onChange={e => handleInputChange(field, e.target.value)}
                onKeyDown={e => handleInputKeyDown(e, field)}
                className={`w-16 text-center text-4xl sm:text-5xl font-mono bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-transparent transition-all duration-150 ${focusedField === field && !isRunningGlobal ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
                tabIndex={idx + 1}
                style={{ letterSpacing: '0.05em' }}
                disabled={isRunningGlobal} // Opcional: deshabilita edición durante cuenta regresiva
              />
              {field !== 'seconds' && <span className="text-5xl font-mono text-[var(--text-primary)] mx-0">:</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Time adjustment buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTimeAdjustment(-1800)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 30 minutes"
          disabled={isRunningGlobal}
        >
          -30
        </button>
        <button
          onClick={() => handleTimeAdjustment(-900)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 15 minutes"
          disabled={isRunningGlobal}
        >
          -15
        </button>
        <button
          onClick={() => handleTimeAdjustment(900)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 15 minutes"
          disabled={isRunningGlobal}
        >
          +15
        </button>
        <button
          onClick={() => handleTimeAdjustment(1800)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 30 minutes"
          disabled={isRunningGlobal}
        >
          +30
        </button>
      </div>

      <div className="flex justify-center items-center gap-3 mb-2">
        <button
          onClick={handleReset}
          className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
          aria-label="Reset timer"
        >
          <RotateCcw size={24} className="text-[var(--accent-primary)]" />
        </button>

        {isRunningGlobal ? (
          <button
            onClick={() => handlePlayPause()}
            className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
            aria-label="Pause countdown"
          >
            <Pause size={24} className="text-[var(--accent-primary)]" />
          </button>
        ) : (
          <button
            onClick={() => handlePlayPause()}
            disabled={calculateSeconds(time) === 0}
            className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
            aria-label="Start countdown"
          >
            <Play size={24} className="text-[var(--accent-primary)]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Countdown;
