import { Bell, BellOff, Pause, Play, RefreshCw, RefreshCwOff, RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import SectionTitle from '@/components/SectionTitle';
import { useAppStore } from '@/store/appStore';
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
interface CountdownProps {
  isSynced?: boolean;
  isRunning?: boolean;
}

const Countdown: React.FC<CountdownProps> = ({ isSynced = false, isRunning = false }) => {
  const { 
    setCountdownState, 
    setSyncCountdownWithTimer,
    syncSettings,
    ui
  } = useAppStore();
  
  const syncCountdownWithTimer = syncSettings.syncCountdownWithTimer;
  const isStudyRunningRedux = ui.isStudyRunning;
  const isRunningGlobal = syncCountdownWithTimer ? isStudyRunningRedux : isRunning;
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
  const [isSyncedWithStudyTimer] = useState(() => {
    const savedState = localStorage.getItem('isSyncedWithStudyTimer');
    return savedState ? JSON.parse(savedState) : false;
  });

  // Track previous secondsLeft without creating a dependency on it in effects
  const prevSecondsLeftRef = useRef<number | null>(null);
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

  const calculateSeconds = ({ hours, minutes, seconds }: { hours: number; minutes: number; seconds: number }) =>
    hours * 3600 + minutes * 60 + seconds;

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const [pausedSecondsLeft, setPausedSecondsLeft] = useState<number | null>(null);
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
    // Si hay un tiempo pausado pendiente, al iniciar debemos continuar desde ahí
    const total = (pausedSecondsLeft !== null)
      ? pausedSecondsLeft
      : calculateSeconds(sourceTime);
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
      setCountdownState({ status: 'running', endTimestamp: endTs, pausedSecondsLeft: null, lastTime: baselineTimeRef.current });
      if (!fromSync && syncCountdownWithTimer) {
        const now = baseTimestamp || Date.now();
        window.dispatchEvent(new CustomEvent("playPomodoroSync", { detail: { baseTimestamp: now } }));
        window.dispatchEvent(new CustomEvent("playCountdownSync", { detail: { baseTimestamp: now } }));
      }
    }
  }, [initialTime, syncCountdownWithTimer, pausedSecondsLeft]);

  const handlePause = useCallback((fromSync: boolean) => {
    // Calcular con precisión el tiempo restante basado en endTimestamp para evitar delay
    let remaining = secondsLeft;
    if (endTimestamp) {
      const diffMs = endTimestamp - Date.now();
      remaining = Math.max(0, Math.round(diffMs / 1000));
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
    setCountdownState({ status: 'paused', endTimestamp: null, pausedSecondsLeft: remaining, lastTime: baselineTimeRef.current });
    if (!fromSync && syncCountdownWithTimer) {
      window.dispatchEvent(new CustomEvent("pausePomodoroSync", { detail: { baseTimestamp: Date.now() } }));
      window.dispatchEvent(new CustomEvent("pauseCountdownSync", { detail: { baseTimestamp: Date.now() } }));
    }
  }, [secondsLeft, endTimestamp, syncCountdownWithTimer]);

  const handleResume = useCallback(() => {
    if (pausedSecondsLeft !== null) {
      const now = Date.now();
      const endTs = now + pausedSecondsLeft * 1000;
      setEndTimestamp(endTs);
      setIsCountdownRunning(true);
      // Asegurar que el UI muestre inmediatamente el tiempo restante correcto
      setSecondsLeft(pausedSecondsLeft);
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

    // Request notification permission if not already determined
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification('Countdown finished!', {
            body: 'Your session is complete.',
            icon: '/assets/apple-touch-icon-removebg-preview.png',
            silent: false
          });
          // Close notification after 5 seconds
          setTimeout(() => notification.close(), 5000);
        } catch (error) {
          console.error('Failed to show notification:', error);
        }
      } else if (Notification.permission !== 'denied') {
        // Request permission if not already denied
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            const notification = new Notification('Countdown finished!', {
              body: 'Your session is complete.',
              icon: '/assets/apple-touch-icon.png',
              silent: false
            });
            // Close notification after 5 seconds
            setTimeout(() => notification.close(), 5000);
          }
        });
      }
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
    setEndTimestamp(null);
    setPausedSecondsLeft(null);
    lastStudyElapsedRef.current = null;
    // Tras reset: solo ignorar updates externos si el reset es LOCAL.
    // Si viene sincronizado (fromSync === true), permitimos actualizaciones externas inmediatamente
    ignoreExternalUntilPlayRef.current = !fromSync;

    // 👉 Si el reset viene de StudyTimer y el countdown está en sync,
    // reiniciamos al baseline pero SIN arrancarlo automáticamente.
    if (fromSync && syncCountdownWithTimer) {
      const full = calculateSeconds(baselineTimeRef.current);
      setSecondsLeft(full); // Reset to full baseline duration
      setIsCountdownRunning(false); // Keep it stopped, don't auto-start
      setEndTimestamp(null); // Clear end timestamp since we're not running
      setInitialTime(baselineTimeRef.current); // Update display to show baseline
      setCountdownState({ status: 'stopped', endTimestamp: null, pausedSecondsLeft: null, lastTime: baselineTimeRef.current }); // Set to stopped state
      localStorage.setItem('countdownState', 'stopped');
      localStorage.removeItem('countdownEndTs');
      localStorage.removeItem('countdownPausedLeft');
      return; // 👈 evitamos seguir a la lógica de reset local
    }

    // 👉 Reset manual (no sync): dejamos countdown detenido en 0
    setCountdownState({ status: 'stopped', endTimestamp: null, pausedSecondsLeft: null, lastTime: baselineTimeRef.current });
    localStorage.setItem('countdownState', 'stopped');
    localStorage.removeItem('countdownEndTs');
    localStorage.removeItem('countdownPausedLeft');

    // Volver al tiempo ORIGINAL configurado de la sesión (baseline)
    // Alinear también el initialTime con el baseline para que la cifra base sea idéntica
    setInitialTime(baselineTimeRef.current);

    // Emitir eventos SOLO si estamos sincronizados; si no, el reset es puramente local
    if (!fromSync && syncCountdownWithTimer) {
      const now = Date.now();
      window.dispatchEvent(new CustomEvent('resetTimerSync', { detail: { baseTimestamp: now } }));
      window.dispatchEvent(new CustomEvent('resetPomodoroSync', { detail: { baseTimestamp: now } }));
    }
  }, [syncCountdownWithTimer, calculateSeconds]);

  useEffect(() => {
    // Don't run internal timer when synced with StudyTimer - let studyTimerTimeUpdate handle it
    if (syncCountdownWithTimer) return;
    
    if (!isCountdownRunning || !endTimestamp) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = endTimestamp - now;
      const newSecondsLeft = Math.max(0, Math.round(diffMs / 1000));
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
  }, [isCountdownRunning, endTimestamp, handleFinish, syncCountdownWithTimer]);

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
  const handleTimeAdjustment = (adjustment: number) => {
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
        setCountdownState({ status: 'stopped', endTimestamp: null, pausedSecondsLeft: null, lastTime: baselineTimeRef.current });
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
  useEventListener('playCountdownSync', (event: CustomEvent<{ baseTimestamp?: number }>) => {
    if (!(isSynced || syncCountdownWithTimer)) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (!isCountdownRunning) {
      // Si había un tiempo pausado, reanudar desde ahí en lugar de resetear al baseline
      if (pausedSecondsLeft !== null) {
        handleResume();
      } else {
        startCountdown(baseTimestamp, true);
      }
    }
  }, [isSynced, syncCountdownWithTimer, lastSyncTimestamp, isCountdownRunning, startCountdown, pausedSecondsLeft, handleResume]);

  useEventListener('playPomodoroSync', (event: CustomEvent<{ baseTimestamp?: number }>) => {
    if (!(isSynced || syncCountdownWithTimer)) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (!isCountdownRunning) {
      // Si había un tiempo pausado, reanudar desde ahí en lugar de resetear al baseline
      if (pausedSecondsLeft !== null) {
        handleResume();
      } else {
        startCountdown(baseTimestamp, true);
      }
    }
  }, [isSynced, syncCountdownWithTimer, lastSyncTimestamp, isCountdownRunning, startCountdown, pausedSecondsLeft, handleResume]);

  useEventListener('pauseCountdownSync', (event: CustomEvent<{ baseTimestamp?: number }>) => {
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
  useEventListener('pausePomodoroSync', (event: CustomEvent<{ baseTimestamp?: number }>) => {
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

  useEventListener('resetTimerSync', (event: CustomEvent<{ baseTimestamp?: number }>) => {
    if (!syncCountdownWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    console.log('[Countdown] resetTimerSync event', { baseTimestamp });
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    handleReset(true);
  }, [syncCountdownWithTimer, lastSyncTimestamp, handleReset]);

  // Escuchar eventos de reset de StudyTimer y Pomodoro cuando están sincronizados
  useEventListener('resetPomodoroSync', (event: CustomEvent<{ baseTimestamp?: number }>) => {
    if (!syncCountdownWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    console.log('[Countdown] resetPomodoroSync event', { baseTimestamp });
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    handleReset(true);
  }, [syncCountdownWithTimer, lastSyncTimestamp, handleReset]);

  // Listen to studyTimerTimeUpdate for continuous sync (like Pomodoro does)
  useEventListener('studyTimerTimeUpdate', (event: CustomEvent<{ time: number; isRunning: boolean }>) => {
    if (!syncCountdownWithTimer) return;

    // If countdown is paused, don't do anything - just stay paused at the current value
    if (pausedSecondsLeft !== null) {
      return;
    }

    const studyTime = Math.floor(event.detail.time); // Time elapsed in StudyTimer (seconds)
    const baselineSeconds = calculateSeconds(baselineTimeRef.current); // Total countdown duration
    
    // If StudyTimer resets to 0, reset countdown to baseline
    if (studyTime === 0 && baselineSeconds > 0) {
      console.log('[Countdown] ✅ StudyTimer reset detected - resetting countdown to baseline');
      setSecondsLeft(baselineSeconds);
      setIsCountdownRunning(false);
      setEndTimestamp(null);
      setPausedSecondsLeft(null);
      setCountdownState({ status: 'stopped', endTimestamp: null, pausedSecondsLeft: null, lastTime: baselineTimeRef.current });
      try {
        localStorage.setItem('countdownState', 'stopped');
        localStorage.removeItem('countdownEndTs');
        localStorage.removeItem('countdownPausedLeft');
      } catch {}
      return;
    }

    // Calculate remaining countdown time based on StudyTimer elapsed time
    const remainingTime = Math.max(0, baselineSeconds - studyTime);
    
    // Update countdown display
    setSecondsLeft(remainingTime);
    
    // Sync running state with StudyTimer
    const studyIsRunning = event.detail.isRunning;
    if (studyIsRunning !== isCountdownRunning) {
      setIsCountdownRunning(studyIsRunning);
      setCountdownState({ status: studyIsRunning ? 'running' : 'stopped', endTimestamp: studyIsRunning ? Date.now() + remainingTime * 1000 : null, pausedSecondsLeft: null, lastTime: baselineTimeRef.current });
      
      if (studyIsRunning) {
        // Calculate end timestamp when starting
        const endTs = Date.now() + remainingTime * 1000;
        setEndTimestamp(endTs);
        try {
          localStorage.setItem('countdownState', 'running');
          localStorage.setItem('countdownEndTs', String(endTs));
        } catch {}
      } else {
        // Clear end timestamp when stopping
        setEndTimestamp(null);
        try {
          localStorage.setItem('countdownState', 'stopped');
          localStorage.removeItem('countdownEndTs');
        } catch {}
      }
    }
  }, [syncCountdownWithTimer, calculateSeconds, isCountdownRunning, pausedSecondsLeft]);

  // resetCountdownSync: reiniciar cuando hay sync con StudyTimer O cuando viene de Pomodoro sincronizado
  useEventListener('resetCountdownSync', (event: CustomEvent<{ baseTimestamp?: number }>) => {
    console.log('[Countdown] 🔄 RECEIVED resetCountdownSync event', { 
      event,
      syncCountdownWithTimer,
      baseTimestamp: event?.detail?.baseTimestamp,
      willProcess: !!syncCountdownWithTimer
    });
    
    // Always process if syncCountdownWithTimer is true
    // OR if this is a global reset (check if study timer is also synced)
    const isGlobalSync = useAppStore.getState().syncSettings.syncPomodoroWithTimer;
    if (!syncCountdownWithTimer && !isGlobalSync) {
      console.log('[Countdown] ❌ IGNORING resetCountdownSync - not synced with timer and not in global sync');
      return; // modo independiente: ignorar
    }
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    console.log('[Countdown] ✅ PROCESSING resetCountdownSync event', { baseTimestamp, lastSyncTimestamp });
    if (lastSyncTimestamp === baseTimestamp) {
      console.log('[Countdown] ❌ IGNORING resetCountdownSync - duplicate timestamp');
      return; // deduplicación
    }
    setLastSyncTimestamp(baseTimestamp);

    // Reiniciar desde la duración completa (baseline) pero SIN arrancar automáticamente
    const full = calculateSeconds(baselineTimeRef.current);
    setPausedSecondsLeft(null);
    setIsCountdownRunning(false); // Reset to stopped state, don't auto-start
    setEndTimestamp(null); // Clear end timestamp since we're not running
    setSecondsLeft(full); // Reset to full duration
    setInitialTime(baselineTimeRef.current);
    setCountdownState({ status: 'stopped', endTimestamp: null, pausedSecondsLeft: null, lastTime: baselineTimeRef.current }); // Set to stopped state
    try {
      localStorage.setItem('countdownState', 'stopped');
      localStorage.removeItem('countdownEndTs');
      localStorage.removeItem('countdownPausedLeft');
    } catch {}
  }, [syncCountdownWithTimer, lastSyncTimestamp, calculateSeconds]);

  // Escuchar reset global emitido por SessionPage cuando se pulsa el botón "Reset All"
  useEventListener('globalResetSync', (event: CustomEvent<{ timestamp?: number }>) => {
    if (!isSynced) return; // Solo aplicar cuando la sincronización global está activa
    const ts = event?.detail?.timestamp || Date.now();
    console.log('[Countdown] globalResetSync event', { timestamp: ts });
    if (lastSyncTimestamp === ts) return; // evitar duplicados
    setLastSyncTimestamp(ts);
    handleReset(true);
  }, [isSynced, lastSyncTimestamp, handleReset]);

  // Montaje: verificar que el componente está activo y los logs aparecen
  useEffect(() => {
    // Component mounted/unmounted logging removed
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

  useEventListener('adjustCountdownTime', (event: CustomEvent<{ adjustment: number }>) => {
    if (isSyncedWithStudyTimer && !isCountdownRunning) {
      const { adjustment } = event.detail;
      handleTimeAdjustment(adjustment);
    }
  }, [isSyncedWithStudyTimer, isCountdownRunning, handleTimeAdjustment]);

  useEventListener('studyTimerSyncStateChanged', (event: CustomEvent<{ isSyncedWithStudyTimer: boolean }>) => {
    const { isSyncedWithStudyTimer: newSyncState } = event.detail;
    console.log('[Countdown] studyTimerSyncStateChanged', { newSyncState });
  }, [isSyncedWithStudyTimer]);

  // También escuchar cambios de estado del StudyTimer (running/paused) para trazar
  useEventListener('studyTimerStateChanged', (event: CustomEvent<{ isRunning: boolean }>) => {
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
    if (nextField && inputRefs.current[nextField]?.current) {
      inputRefs.current[nextField].current.focus();
    }
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
        handlePause(false);
      } else if (pausedSecondsLeft !== null) {
        handleResume();
      } else {
        startCountdown();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="section-title justify-center relative w-full px-4 py-3">
        <button
          type="button"
          onClick={() => setSyncCountdownWithTimer(!syncCountdownWithTimer)}
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
        <SectionTitle
          title="Countdown"
          tooltip="A countdown timer that counts down from a set time. Perfect for timed exams, presentations, or any activity with a specific duration limit."
          size="sm"
        />
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

      <div className="flex items-center justify-center mb-2 sm:mb-3">
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
                className={`w-8 sm:w-10 md:w-12 lg:w-14 text-center text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-mono bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-transparent transition-all duration-150 ${focusedField === field && !isRunningGlobal ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
                tabIndex={idx + 1}
                style={{ letterSpacing: '0.05em' }}
                disabled={isCountdownRunning} // Opcional: deshabilita edición durante cuenta regresiva
              />
              {field !== 'seconds' && <span className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-mono text-[var(--text-primary)] mx-0">:</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Time adjustment buttons - only show when not synced */}
      {!(isSynced || syncCountdownWithTimer) && (
        <div className="flex gap-1 mb-1 sm:mb-2">
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
      )}

      {!(isSynced || syncCountdownWithTimer) && (
        <div className="flex justify-center items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleReset()}
            className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
            aria-label="Reset timer"
          >
            <RotateCcw size={20} className="text-[var(--accent-primary)]" />
          </button>

          {isCountdownRunning ? (
            <button
              onClick={() => handlePlayPause()}
              className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
              aria-label="Pause countdown"
            >
              <Pause size={20} className="text-[var(--accent-primary)]" />
            </button>
          ) : (
            <button
              onClick={() => handlePlayPause()}
              disabled={calculateSeconds(baselineTimeRef.current) === 0}
              className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
              aria-label="Start countdown"
            >
              <Play size={20} className="text-[var(--accent-primary)]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Countdown;
