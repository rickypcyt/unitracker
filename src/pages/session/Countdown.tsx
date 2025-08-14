import { Bell, BellOff, Pause, Play, RotateCcw, RefreshCw, RefreshCwOff } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setCountdownState, setSyncCountdownWithTimer } from '@/store/slices/uiSlice';
import toast from 'react-hot-toast';
import useEventListener from '@/hooks/useEventListener';

type Field = 'hours' | 'minutes' | 'seconds';
const fields: Field[] = ['hours', 'minutes', 'seconds'];
const fieldMax: Record<Field, number> = { hours: 23, minutes: 59, seconds: 59 };

const pad = (n: number, field: Field) => {
  const max = fieldMax[field];
  const val = Math.min(Math.max(n, 0), max);
  return val.toString().padStart(2, '0');
};

// Eliminado getInitialTime: ya no se usa. El baseline persiste vía writeBaseline/readBaseline.
const Countdown = ({ isSynced, isRunning }) => {
  const dispatch = useDispatch();
  const readBaseline = () => {
    try {
      const saved = localStorage.getItem('countdownBaseline');
      if (saved) {
        const parsed = JSON.parse(saved);
        const safe = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
        const base = { hours: safe(parsed.hours), minutes: safe(parsed.minutes), seconds: safe(parsed.seconds) };
        return base;
      }
    } catch {}
    return { hours: 2, minutes: 0, seconds: 0 };
  };
  const writeBaseline = (t: { hours: number; minutes: number; seconds: number }) => {
    try { localStorage.setItem('countdownBaseline', JSON.stringify(t)); } catch {}
  };
  const initialBaseline = readBaseline();
  const [initialTime, setInitialTime] = useState(initialBaseline);
  const [focusedField, setFocusedField] = useState<Field | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null); // Igual que Pomodoro: fin esperado
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

  // Track previous secondsLeft without creating a dependency on it in effects
  const prevSecondsLeftRef = useRef(null);
  // Mantiene la cifra original configurada de la sesión (inmutable durante sync/running)
  const baselineTimeRef = useRef(initialTime);

  const toggleAlarm = () => {
    setAlarmEnabled(prev => {
      localStorage.setItem('countdownAlarmEnabled', String(!prev));
      return !prev;
    });
  };

  const inputRefs = useRef<Record<Field, React.RefObject<HTMLInputElement | null>>>({
    hours: React.createRef<HTMLInputElement>(),
    minutes: React.createRef<HTMLInputElement>(),
    seconds: React.createRef<HTMLInputElement>()
  });

  const calculateSeconds = ({ hours, minutes, seconds }) =>
    hours * 3600 + minutes * 60 + seconds;

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);
  const [pausedSecondsLeft, setPausedSecondsLeft] = useState(null);
  const [localResetKey, setLocalResetKey] = useState(0);
  // Refs para inferir pausa/reanudación desde studyTimerTimeUpdate
  const lastStudyElapsedRef = useRef<number | null>(null);
  // Ref para detectar cambios en isStudyRunningRedux
  const prevStudyRunningRef = useRef<boolean | null>(null);
  // Flag: ignorar updates externos hasta el próximo Play
  const ignoreExternalUntilPlayRef = useRef<boolean>(false);

  const startCountdown = useCallback((baseTimestamp?: number, fromSync?: boolean) => {
    console.log('[Countdown] startCountdown()', {
      fromSync,
      baseTimestamp,
      baseline: baselineTimeRef.current,
    });
    // Usamos siempre el baseline como fuente de verdad para arrancar
    const sourceTime = baselineTimeRef.current;
    const total = calculateSeconds(sourceTime);
    if (total > 0) {
      // baseline ya es la fuente, aseguramos persistencia
      if (!fromSync) writeBaseline(sourceTime);
      const base = baseTimestamp || Date.now();
      // End exacto: base + total segundos
      const endTs = base + total * 1000;
      setEndTimestamp(endTs);
      const initialLeft = Math.max(0, total);
      setSecondsLeft(initialLeft);
      setIsCountdownRunning(true);
      // Persistencia como en Pomodoro/StudyTimer
      try {
        localStorage.setItem('countdownState', 'running');
        localStorage.setItem('countdownEndTs', String(endTs));
        localStorage.removeItem('countdownPausedLeft');
      } catch {}
      // A partir del Play, ya podemos aceptar externos si fuese necesario
      ignoreExternalUntilPlayRef.current = false;
      dispatch(setCountdownState('running'));
      if (!fromSync && syncCountdownWithTimer) {
        const now = baseTimestamp || Date.now();
        window.dispatchEvent(new CustomEvent("playPomodoroSync", { detail: { baseTimestamp: now } }));
        window.dispatchEvent(new CustomEvent("playCountdownSync", { detail: { baseTimestamp: now } }));
      }
    }
  }, [initialTime, dispatch, syncCountdownWithTimer]);

  const handlePause = useCallback((fromSync) => {
    // Calcular con precisión el tiempo restante basado en endTimestamp para evitar delay
    let remaining = secondsLeft;
    if (endTimestamp) {
      const diffMs = endTimestamp - Date.now();
      remaining = Math.max(0, Math.ceil(diffMs / 1000));
    }
    setIsCountdownRunning(false);
    setPausedSecondsLeft(remaining);
    setSecondsLeft(remaining);
    // Persistencia de pausa
    try {
      localStorage.setItem('countdownState', 'paused');
      localStorage.setItem('countdownPausedLeft', String(remaining));
      localStorage.removeItem('countdownEndTs');
    } catch {}
    dispatch(setCountdownState('paused'));
    if (!fromSync && syncCountdownWithTimer) {
      window.dispatchEvent(new CustomEvent("pausePomodoroSync", { detail: { baseTimestamp: Date.now() } }));
      window.dispatchEvent(new CustomEvent("pauseCountdownSync", { detail: { baseTimestamp: Date.now() } }));
    }
  }, [secondsLeft, endTimestamp, dispatch, syncCountdownWithTimer]);

  const handleResume = useCallback(() => {
    if (pausedSecondsLeft !== null) {
      const now = Date.now();
      const endTs = now + pausedSecondsLeft * 1000;
      setEndTimestamp(endTs);
      setIsCountdownRunning(true);
      setPausedSecondsLeft(null);
      // Reanudado manualmente: permitimos externos nuevamente
      ignoreExternalUntilPlayRef.current = false;
      // Persistencia de reanudación
      try {
        localStorage.setItem('countdownState', 'running');
        localStorage.setItem('countdownEndTs', String(endTs));
        localStorage.removeItem('countdownPausedLeft');
      } catch {}
    }
  }, [pausedSecondsLeft]);

  // Lógica común cuando el countdown llega a cero (desde interval o visibilitychange)
  const handleFinish = useCallback(() => {
    if (!isCountdownRunning) return; // evitar dobles ejecuciones
    setIsCountdownRunning(false);
    try {
      localStorage.setItem('countdownState', 'stopped');
      localStorage.removeItem('countdownEndTs');
      localStorage.removeItem('countdownPausedLeft');
    } catch {}
    if (alarmEnabled) {
      try { new Audio('/sounds/countdownend.mp3').play(); } catch {}
    }
    toast.success('Countdown finished! Session complete.', {
      position: 'top-center',
      style: { backgroundColor: '#000', color: '#fff', border: '2px solid var(--border-primary)' }
    });
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification('Countdown finished!', {
          body: 'Your session is complete.',
          silent: false
        });
        setTimeout(() => notification.close(), 5000);
      } catch {}
    }
  }, [isCountdownRunning, alarmEnabled]);

  const handleReset = useCallback((fromSync = false) => {
    console.log('[Countdown] handleReset()', {
      fromSync,
      lastSyncTimestamp,
      baseline: baselineTimeRef.current,
      syncCountdownWithTimer,
    });
    setIsCountdownRunning(false);
    setSecondsLeft(0);
    setEndTimestamp(null); // Resetear fin
    setPausedSecondsLeft(null);
    lastStudyElapsedRef.current = null;
    // Tras reset: solo ignorar updates externos si el reset es LOCAL.
    // Si viene sincronizado (fromSync === true), permitimos actualizaciones externas inmediatamente
    ignoreExternalUntilPlayRef.current = !fromSync;
    dispatch(setCountdownState('stopped'));
    // Volver al tiempo ORIGINAL configurado de la sesión (baseline)
    // Alinear también el initialTime con el baseline para que la cifra base sea idéntica
    setInitialTime(baselineTimeRef.current);
    // Persistir por coherencia: baseline permanece, no lo sobreescribimos con display
    try {
      localStorage.setItem('countdownState', 'stopped');
      localStorage.removeItem('countdownEndTs');
      localStorage.removeItem('countdownPausedLeft');
    } catch {}
    if (!fromSync) {
      const now = Date.now();
      // Igual que Pomodoro: emitir siempre el reset global
      window.dispatchEvent(new CustomEvent("resetTimerSync", { detail: { baseTimestamp: now } }));
      // Y además, si está sincronizado con StudyTimer, notificar a Pomodoro específicamente
      if (syncCountdownWithTimer) {
        window.dispatchEvent(new CustomEvent("resetPomodoroSync", { detail: { baseTimestamp: now } }));
      }
    }
  }, [dispatch, syncCountdownWithTimer]);

  useEffect(() => {
    if (!isCountdownRunning || !endTimestamp) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = endTimestamp - now;
      const newSecondsLeft = Math.max(0, Math.ceil(diffMs / 1000));
      if (newSecondsLeft !== prevSecondsLeftRef.current) {
        setSecondsLeft(newSecondsLeft);
        prevSecondsLeftRef.current = newSecondsLeft;
      }
      if (newSecondsLeft <= 0) {
        clearInterval(interval);
        handleFinish();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isCountdownRunning, endTimestamp, handleFinish]);

  // Si la sincronización está activa, reflejar directamente el estado Redux del StudyTimer
  useEffect(() => {
    if (!syncCountdownWithTimer) return;
    const prev = prevStudyRunningRef.current;
    if (prev === null) {
      prevStudyRunningRef.current = isStudyRunningRedux as boolean;
      return;
    }
    if (isStudyRunningRedux !== prev) {
      if (!isStudyRunningRedux && isCountdownRunning) {
        // Se pausó el StudyTimer -> pausar countdown
        handlePause(true);
      } else if (isStudyRunningRedux && !isCountdownRunning) {
        // Se reanudó el StudyTimer -> reanudar countdown
        if (pausedSecondsLeft !== null) {
          handleResume();
        } else {
          startCountdown(Date.now(), true);
        }
        // Hemos recibido Play del StudyTimer, ya no ignoramos externos
        ignoreExternalUntilPlayRef.current = false;
      }
      prevStudyRunningRef.current = isStudyRunningRedux as boolean;
    }
  }, [syncCountdownWithTimer, isStudyRunningRedux, isCountdownRunning, pausedSecondsLeft, handlePause, handleResume, startCountdown]);

  // Eliminado: sincronización manual del estado 'time'. Ahora se deriva en render.

  // Sincroniza al volver a enfocar la ventana
  useEffect(() => {
    if (!isCountdownRunning || !endTimestamp) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const diffMs = endTimestamp - Date.now();
        const newSecondsLeft = Math.max(0, Math.ceil(diffMs / 1000));
        setSecondsLeft(newSecondsLeft);
        // Si el tiempo se acabó mientras estaba fuera, ejecutar finalización (alarma/toast)
        if (newSecondsLeft === 0) {
          handleFinish();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isCountdownRunning, endTimestamp, handleFinish]);

  // Ajusta el tiempo total del countdown (en segundos)
  const handleTimeAdjustment = (adjustment) => {
    // Calcula el nuevo total para initialTime (siempre actualizamos para persistencia y cálculos futuros)
    const currentInitialTotal = calculateSeconds(initialTime);
    const newInitialTotal = Math.max(0, currentInitialTotal + adjustment);
    const newH = Math.floor(newInitialTotal / 3600);
    const newM = Math.floor((newInitialTotal % 3600) / 60);
    const newS = newInitialTotal % 60;
    const updatedInitial = { hours: newH, minutes: newM, seconds: newS };

    if (isCountdownRunning) {
      // Si está en ejecución: SOLO ajustar el tiempo restante y el endTimestamp.
      // No tocar initialTime ni el estado editable para que Reset vuelva al valor original de la sesión.
      const newSeconds = Math.max(0, secondsLeft + adjustment);
      setSecondsLeft(newSeconds);
      setEndTimestamp(newSeconds > 0 ? (Date.now() + newSeconds * 1000) : null);
      if (newSeconds === 0) {
        setIsCountdownRunning(false);
        dispatch(setCountdownState('stopped'));
      }
    } else {
    // Si NO está corriendo, actualiza baseline
    setInitialTime(updatedInitial);
    baselineTimeRef.current = updatedInitial;
    // Persistir baseline para que los resets (incluido desde StudyTimer) vuelvan a este valor
    writeBaseline(updatedInitial);
    console.log('[Countdown] handleTimeAdjustment() baseline updated', {
      adjustment,
      updatedInitial,
    });
  }
  };

  // Sincronización con StudyTimer
  useEventListener('playCountdownSync', (event) => {
    if (!(isSynced || syncCountdownWithTimer)) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (!isCountdownRunning) {
      startCountdown(baseTimestamp, true);
    }
  }, [isSynced, syncCountdownWithTimer, lastSyncTimestamp, isCountdownRunning, startCountdown]);

  useEventListener('playPomodoroSync', (event) => {
    if (!(isSynced || syncCountdownWithTimer)) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (!isCountdownRunning) {
      startCountdown(baseTimestamp, true);
    }
  }, [isSynced, syncCountdownWithTimer, lastSyncTimestamp, isCountdownRunning, startCountdown]);

  useEventListener('pauseCountdownSync', (event) => {
    if (!(isSynced || syncCountdownWithTimer)) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    console.log('[Countdown] pauseCountdownSync event', { baseTimestamp, isCountdownRunning });
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (isCountdownRunning) {
      console.log('[Countdown] applying pause from StudyTimer (pauseCountdownSync)');
      handlePause(true);
    } else {
      console.log('[Countdown] already paused/stopped, ignoring pauseCountdownSync');
    }
  }, [isSynced, syncCountdownWithTimer, isCountdownRunning, lastSyncTimestamp, handlePause]);

  // También responder a eventos de Pomodoro (originados por StudyTimer)
  useEventListener('pausePomodoroSync', (event) => {
    if (!(isSynced || syncCountdownWithTimer)) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    console.log('[Countdown] pausePomodoroSync event', { baseTimestamp, isCountdownRunning });
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (isCountdownRunning) {
      console.log('[Countdown] applying pause from StudyTimer (pausePomodoroSync)');
      handlePause(true);
    } else {
      console.log('[Countdown] already paused/stopped, ignoring pausePomodoroSync');
    }
  }, [isSynced, syncCountdownWithTimer, isCountdownRunning, lastSyncTimestamp, handlePause]);

  useEventListener('resetTimerSync', (event) => {
    if (!syncCountdownWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    console.log('[Countdown] resetTimerSync event', { baseTimestamp });
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    handleReset(true);
  }, [syncCountdownWithTimer, lastSyncTimestamp, handleReset]);

  // Escuchar eventos de reset de StudyTimer y Pomodoro cuando están sincronizados
  useEventListener('resetPomodoroSync', (event) => {
    if (!syncCountdownWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    console.log('[Countdown] resetPomodoroSync event', { baseTimestamp });
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    handleReset(true);
  }, [syncCountdownWithTimer, lastSyncTimestamp, handleReset]);

  // resetCountdownSync es una orden específica para Countdown: respetarla SIEMPRE
  // (ya viene emitida desde componentes que deciden la intención de resetear Countdown)
  useEventListener('resetCountdownSync', (event) => {
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    console.log('[Countdown] resetCountdownSync event (forced apply, ignoring dedup)', { baseTimestamp });
    // Para asegurar el reset, ignoramos la deduplicación por timestamp en este evento específico
    setLastSyncTimestamp(baseTimestamp);
    handleReset(true);
  }, [lastSyncTimestamp, handleReset]);

  // Montaje: verificar que el componente está activo y los logs aparecen
  useEffect(() => {
    console.log('[Countdown] mounted');
    return () => console.log('[Countdown] unmounted');
  }, []);

  // DEBUG: listeners nativos para verificar llegada de eventos (independiente del hook)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ baseTimestamp?: number }>; // puede no tener detail
      const baseTimestamp = ce?.detail?.baseTimestamp;
      console.log('[Countdown][DEBUG native]', e.type, { baseTimestamp });
    };
    const events = [
      'resetTimerSync',
      'resetPomodoroSync',
      'resetCountdownSync',
      'pauseCountdownSync',
      'pausePomodoroSync',
      'playCountdownSync',
      'playPomodoroSync',
    ];
    events.forEach((ev) => window.addEventListener(ev as any, handler as any));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev as any, handler as any));
    };
  }, []);

  // Restaurar estado tras recarga, similar a Pomodoro/StudyTimer
  useEffect(() => {
    try {
      const state = localStorage.getItem('countdownState');
      const endTsStr = localStorage.getItem('countdownEndTs');
      const pausedStr = localStorage.getItem('countdownPausedLeft');
      if (state === 'running' && endTsStr) {
        const endTs = parseInt(endTsStr, 10);
        const diffMs = endTs - Date.now();
        const remaining = Math.max(0, Math.ceil(diffMs / 1000));
        if (remaining > 0) {
          setIsCountdownRunning(true);
          setEndTimestamp(endTs);
          setSecondsLeft(remaining);
          console.log('[Countdown] restored running', { endTs, remaining });
        } else {
          // Si ya terminó, detener y limpiar
          localStorage.setItem('countdownState', 'stopped');
          localStorage.removeItem('countdownEndTs');
          setIsCountdownRunning(false);
          setEndTimestamp(null);
          setSecondsLeft(0);
          // Mostrar derivado desde baseline
          console.log('[Countdown] restored expired -> stopped');
        }
      } else if (state === 'paused' && pausedStr) {
        const remaining = Math.max(0, parseInt(pausedStr, 10) || 0);
        setIsCountdownRunning(false);
        setEndTimestamp(null);
        setSecondsLeft(remaining);
        setPausedSecondsLeft(remaining);
        console.log('[Countdown] restored paused', { remaining });
      }
    } catch {}
  }, []);

  useEventListener('adjustCountdownTime', (event) => {
    if (isSyncedWithStudyTimer && !isCountdownRunning) {
      const { adjustment } = event.detail;
      handleTimeAdjustment(adjustment);
    }
  }, [isSyncedWithStudyTimer, isCountdownRunning, handleTimeAdjustment]);

  useEventListener('studyTimerSyncStateChanged', (event) => {
    const { isSyncedWithStudyTimer: newSyncState } = event.detail;
    console.log('[Countdown] studyTimerSyncStateChanged', { newSyncState });
  }, [isSyncedWithStudyTimer]);

  // También escuchar cambios de estado del StudyTimer (running/paused) para trazar
  useEventListener('studyTimerStateChanged', (event) => {
    const { isRunning } = event.detail as { isRunning: boolean };
    console.log('[Countdown] studyTimerStateChanged', { isRunning, isSyncedWithStudyTimer });
  }, [isSyncedWithStudyTimer]);

  // (Eliminado) Manejo duplicado de sincronización global con handlers indefinidos.

  const handleInputChange = useCallback((field: Field, value: string) => {
    // Evitar trabajo si está corriendo: los inputs ya están disabled, pero protegemos el handler
    if (isCountdownRunning) return;
    const clean = value.replace(/\D/g, ''); // Solo números
    let val = parseInt(clean, 10);
    if (isNaN(val)) val = 0;
    const current = baselineTimeRef.current;
    const updated = { ...current, [field]: Math.min(Math.max(val, 0), fieldMax[field]) };
    baselineTimeRef.current = updated;
    setInitialTime(updated);
    localStorage.setItem('countdownLastTime', JSON.stringify(updated));
    writeBaseline(updated);
  }, [isCountdownRunning]);

  const navigateField = useCallback((direction: number, currentIdx: number) => {
    const nextIdx = (currentIdx + direction + fields.length) % fields.length;
    const nextField = fields[nextIdx];
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
        if (!isCountdownRunning) startCountdown(undefined, false);
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
          const next = { ...base, [field]: nextVal };
          baselineTimeRef.current = next;
          setInitialTime(next);
          writeBaseline(next);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (isCountdownRunning) break;
        {
          const base = baselineTimeRef.current;
          const nextVal = (base[field] - step + (fieldMax[field] + 1)) % (fieldMax[field] + 1);
          const next = { ...base, [field]: nextVal };
          baselineTimeRef.current = next;
          setInitialTime(next);
          writeBaseline(next);
        }
        break;
      default:
        break;
    }
  }, [navigateField, startCountdown, isRunningGlobal]);

  const handleFocus = (field: Field, e: React.FocusEvent<HTMLInputElement>) => {
    setFocusedField(field);
    setTimeout(() => {
      e.target.setSelectionRange(e.target.value.length, e.target.value.length);
    }, 0);
  };

  const handleBlur = (field: Field, e: React.FocusEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value.replace(/\D/g, ''), 10);
    if (isNaN(val)) val = 0;
    if (val > fieldMax[field]) val = fieldMax[field];
    const base = baselineTimeRef.current;
    const safe = { ...base, [field]: val };
    setInitialTime(safe);
    if (!isCountdownRunning) {
      baselineTimeRef.current = safe;
      writeBaseline(safe);
    }
    setFocusedField(null);
  };

  // Eliminado setSafeTime: los inputs actualizan baseline directamente.

  // Aplica una actualización de tiempo y alinea initial/baseline cuando no está corriendo
  // Eliminado applyTimeUpdate: no se usa sin estado 'time'.

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
      if (isCountdownRunning) {
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
        <button
          type="button"
          onClick={() => dispatch(setSyncCountdownWithTimer(!syncCountdownWithTimer))}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
          aria-label={syncCountdownWithTimer ? 'Disable Countdown sync' : 'Enable Countdown sync'}
          title={syncCountdownWithTimer ? 'Sync ON (click to turn OFF)' : 'Sync OFF (click to turn ON)'}
        >
          {syncCountdownWithTimer ? (
            <RefreshCw size={20} className="icon" style={{ color: 'var(--accent-primary)' }} />
          ) : (
            <RefreshCwOff size={20} className="icon" style={{ color: 'var(--accent-primary)' }} />
          )}
        </button>
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
          // Derivar el valor mostrado desde la fuente de verdad
          let value;
          if (isCountdownRunning) {
            const h = Math.floor(secondsLeft / 3600);
            const m = Math.floor((secondsLeft % 3600) / 60);
            const s = secondsLeft % 60;
            if (field === 'hours') value = pad(h, 'hours');
            if (field === 'minutes') value = pad(m, 'minutes');
            if (field === 'seconds') value = pad(s, 'seconds');
          } else {
            let h = 0, m = 0, s = 0;
            if (pausedSecondsLeft !== null) {
              h = Math.floor(pausedSecondsLeft / 3600);
              m = Math.floor((pausedSecondsLeft % 3600) / 60);
              s = pausedSecondsLeft % 60;
            } else {
              const base = baselineTimeRef.current;
              h = base.hours;
              m = base.minutes;
              s = base.seconds;
            }
            if (field === 'hours') value = pad(h, 'hours');
            if (field === 'minutes') value = pad(m, 'minutes');
            if (field === 'seconds') value = pad(s, 'seconds');
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
                disabled={isCountdownRunning} // Opcional: deshabilita edición durante cuenta regresiva
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
        >
          -30
        </button>
        <button
          onClick={() => handleTimeAdjustment(-900)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 15 minutes"
        >
          -15
        </button>
        <button
          onClick={() => handleTimeAdjustment(900)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 15 minutes"
        >
          +15
        </button>
        <button
          onClick={() => handleTimeAdjustment(1800)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 30 minutes"
        >
          +30
        </button>
      </div>

      {!(isSynced || syncCountdownWithTimer) && (
        <div className="flex justify-center items-center gap-3 mb-2">
          <button
            onClick={() => handleReset()}
            className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
            aria-label="Reset timer"
          >
            <RotateCcw size={24} className="text-[var(--accent-primary)]" />
          </button>

          {isCountdownRunning ? (
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
              disabled={calculateSeconds(baselineTimeRef.current) === 0}
              className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
              aria-label="Start countdown"
            >
              <Play size={24} className="text-[var(--accent-primary)]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Countdown;
