import { useRef, useEffect } from "react";

// Hook corregido para StudyTimer
export function useStudyTimer(callback, isRunning, timeAtStart = 0, lastStart = null) {
  const rafRef = useRef();
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    if (!isRunning) {
      return;
    }

    const tick = () => {
      const now = Date.now();
      const elapsed = timeAtStart + ((now - lastStart) / 1000);
      savedCallback.current(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isRunning, timeAtStart, lastStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
}

export function usePomoTimer(callback, isRunning, duration, initialRemaining) {
  const rafRef = useRef();
  const savedCallback = useRef();
  const endTime = useRef();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  // Update the useEffect in usePomoTimer
  useEffect(() => {
    if (!isRunning) {
      cancelAnimationFrame(rafRef.current);
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
  }, [isRunning, duration]); // Removed initialRemaining from dependencies
}
// Funciones de utilidad mejoradas
export const formatStudyTime = (totalSeconds, roundUp = false) => {
  const s = Math.max(0, roundUp ? Math.ceil(totalSeconds) : Math.floor(totalSeconds));
  return new Date(s * 1000).toISOString().substr(11, 8); // Formato HH:MM:SS
};

export const formatPomoTime = (totalSeconds, roundUp = false) => {
  const s = Math.max(0, roundUp ? Math.ceil(totalSeconds) : Math.floor(totalSeconds));
  const date = new Date(s * 1000);
  return s >= 3600
    ? date.toISOString().substr(11, 8)
    : date.toISOString().substr(14, 5); // MM:SS o HH:MM:SS
};

export const getMonthYear = (date, locale = "default") => {
  const options = { month: "long", year: "numeric" };
  return new Date(date).toLocaleDateString(locale, options);
};