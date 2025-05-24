import { useRef, useEffect } from "react";

/**
 * Ultra-precise timer hook using requestAnimationFrame and performance.now().
 * @param {Function} callback - Receives elapsed time in seconds (rounded as specified).
 * @param {boolean} isRunning - Whether the timer is active.
 * @param {number} timeAtStart - Accumulated time before last start (in seconds).
 * @param {number|null} lastStart - Timestamp (ms, from performance.now()) when timer was last started, or null if paused.
 * @param {"ceil"|"floor"} rounding - Rounding mode: "ceil" for countdown, "floor" for stopwatch.
 */
export default function usePreciseTimer(
  callback,
  isRunning,
  timeAtStart = 0,
  lastStart = null,
  rounding = "ceil"
) {
  const rafRef = useRef();

  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const tick = () => {
      const elapsedRaw = lastStart
        ? timeAtStart + (performance.now() - lastStart) / 1000
        : timeAtStart;
      const elapsedRounded =
        rounding === "ceil"
          ? Math.ceil(elapsedRaw)
          : Math.floor(elapsedRaw);
      callback(elapsedRounded);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isRunning, callback, timeAtStart, lastStart, rounding]);
}
