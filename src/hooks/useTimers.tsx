import { setPomoRunning, setStudyRunning } from "@/store/slices/uiSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";

// Hook corregido para StudyTimer
export function useStudyTimer(callback, timeAtStart = 0, lastStart = null) {
  const intervalRef = useRef();
  const savedCallback = useRef();
  const startTimeRef = useRef(null);
  const dispatch = useDispatch();
  const isRunning = useSelector((state) => state.ui.isStudyRunning);
  const syncTimers = useSelector((state) => state.ui.syncTimers);

  // Guardar el callback actual
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Efecto principal del timer
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isRunning) {
      if (syncTimers) {
        dispatch(setPomoRunning(false)); // Pause Pomo Timer if sync is on and Study Timer is paused
      }
      return;
    }

    if (!lastStart) {
      return;
    }

    // Inicializar el tiempo de inicio usando lastStart
    startTimeRef.current = lastStart;

    // Actualizar cada 100ms para mantener la precisión
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = timeAtStart + ((now - startTimeRef.current) / 1000);
      savedCallback.current(elapsed);
    }, 100);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeAtStart, lastStart, syncTimers, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

export function usePomoTimer(callback, duration, initialRemaining) {
  const rafRef = useRef();
  const savedCallback = useRef();
  const endTime = useRef();
  const dispatch = useDispatch();
  const isRunning = useSelector((state) => state.ui.isPomoRunning);
  const syncTimers = useSelector((state) => state.ui.syncTimers);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Update the useEffect in usePomoTimer
  useEffect(() => {
    if (!isRunning) {
      cancelAnimationFrame(rafRef.current);
      if (syncTimers) {
        dispatch(setStudyRunning(false)); // Pause Study Timer if sync is on and Pomo Timer is paused
      }
      return;
    }
    const startTime = performance.now();
    endTime.current = startTime + initialRemaining * 1000;
    const tick = (currentTime) => {
      const remaining = Math.max(0, (endTime.current - currentTime) / 1000);
      savedCallback.current(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, duration, initialRemaining, syncTimers, dispatch]);
}

// Format time in seconds to "Xh Ym" format
export const formatStudyTime = (totalSeconds: number | string, roundUp = false): string => {
  try {
    // If input is a string in HH:MM:SS format, convert it to seconds first
    let seconds = 0;
    if (typeof totalSeconds === 'string') {
      const parts = totalSeconds.split(':');
      if (parts.length === 3) {
        const [hh, mm, ss] = parts.map(Number);
        seconds = hh * 3600 + mm * 60 + ss;
      } else {
        seconds = Number(totalSeconds) || 0;
      }
    } else {
      seconds = Math.max(0, roundUp ? Math.ceil(totalSeconds) : Math.floor(totalSeconds));
    }
    
    const hours = Math.floor(seconds / 3600);
    const remainingSeconds = seconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    const secs = Math.floor(remainingSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formatting study time:', error);
    return '00:00:00';
  }
};

export const formatPomoTime = (totalSeconds, roundUp = false) => {
  try {
    // Ensure totalSeconds is a valid number
    const s = Math.max(0, Math.floor(roundUp ? Math.ceil(totalSeconds) : totalSeconds));
    const minutes = Math.floor(s / 60);
    const seconds = Math.floor(s % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formatting pomo time:', error);
    return '00:00';
  }
};

export const getMonthYear = (dateString: string, locale = "en-US"): string => {
  try {
    // Handle different date string formats
    let date: Date;
    
    // Check if the date string includes timezone offset (e.g., '2025-11-17T10:26:15.554+00:00')
    if (dateString.includes('+') || dateString.endsWith('Z')) {
      date = new Date(dateString);
    } 
    // Handle SQL timestamp format: '2025-11-17 10:26:15.554+00'
    else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateString)) {
      // Replace space with T to make it ISO-8601 compatible
      date = new Date(dateString.replace(' ', 'T') + 'Z');
    } 
    // Fallback for other formats
    else {
      date = new Date(dateString);
    }
    
    // Ensure we have a valid date
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric',
      timeZone: 'UTC' // Ensure consistent timezone handling
    };
    
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return 'Invalid Date';
  }
};