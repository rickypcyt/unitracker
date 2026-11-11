import { useEffect, useRef } from "react";

import { durationToSeconds, formatHMS } from "@/utils/timeUtils";
import { useAppStore } from "@/store/appStore";

// Hook corregido para StudyTimer
export function useStudyTimer(callback: (elapsed: number) => void, timeAtStart: number = 0, lastStart: number | null = null) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const savedCallback = useRef<((elapsed: number) => void) | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const { setPomoRunning } = useAppStore();
  
  // Get the correct properties from Zustand state
  const isRunning = useAppStore((state) => state.ui.isStudyRunning);
  const syncTimers = useAppStore((state) => state.ui.syncTimers);

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
        setPomoRunning(false); // Pause Pomo Timer if sync is on and Study Timer is paused
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
      const elapsed = timeAtStart + ((now - startTimeRef.current!) / 1000);
      savedCallback.current!(elapsed);
    }, 100);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeAtStart, lastStart, syncTimers, setPomoRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

export function usePomoTimer(callback: (remaining: number) => void, duration: number, initialRemaining: number) {
  const rafRef = useRef<number | null>(null);
  const savedCallback = useRef<((remaining: number) => void) | null>(null);
  const endTime = useRef<number>(0);
  const { setStudyRunning } = useAppStore();
  const isRunning = useAppStore((state) => state.ui.isPomoRunning);
  const syncTimers = useAppStore((state) => state.ui.syncTimers);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Update the useEffect in usePomoTimer
  useEffect(() => {
    if (!isRunning) {
      cancelAnimationFrame(rafRef.current!);
      if (syncTimers) {
        setStudyRunning(false); // Pause Study Timer if sync is on and Pomo Timer is paused
      }
      return;
    }
    const startTime = performance.now();
    endTime.current = startTime + initialRemaining * 1000;
    const tick = (currentTime: number) => {
      const remaining = Math.max(0, (endTime.current - currentTime) / 1000);
      savedCallback.current!(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [isRunning, duration, initialRemaining, syncTimers, setStudyRunning]);
}

// Format time in seconds to "HH:MM:SS" format
export const formatStudyTime = (totalSeconds: number | string, roundUp: boolean = false): string => {
  try {
    const seconds = typeof totalSeconds === 'string'
      ? durationToSeconds(totalSeconds)
      : Math.max(0, roundUp ? Math.ceil(totalSeconds) : Math.floor(totalSeconds));
    return formatHMS(seconds);
  } catch (error) {
    console.error('Error formatting study time:', error);
    return '00:00:00';
  }
};

export const formatPomoTime = (totalSeconds: number, roundUp: boolean = false) => {
  try {
    // Ensure totalSeconds is a valid number
    const s = Math.max(0, Math.floor(roundUp ? Math.ceil(totalSeconds) : totalSeconds));
    return formatHMS(s);
  } catch (error) {
    console.error('Error formatting pomo time:', error);
    return '00:00:00';
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