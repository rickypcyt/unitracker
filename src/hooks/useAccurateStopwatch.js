import { useRef, useEffect } from "react";

/**
 * Ultra-precise interval hook with Date.now() and localStorage support.
 * @param {Function} callback - Receives elapsed time in seconds (float).
 * @param {boolean} isRunning - Whether the interval is active.
 * @param {number} timeAtStart - Accumulated time before last start (in seconds).
 * @param {number|null} lastStart - Timestamp (ms) when timer was last started, or null if paused.
 */
export default function useInterval(callback, isRunning, timeAtStart = 0, lastStart = null) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    intervalRef.current = setInterval(() => {
      // Si lastStart es null, solo muestra el tiempo acumulado
      const elapsed = lastStart
        ? timeAtStart + (Date.now() - lastStart) / 1000
        : timeAtStart;
      callback(elapsed);
    }, 50);

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isRunning, callback, timeAtStart, lastStart]);
}
