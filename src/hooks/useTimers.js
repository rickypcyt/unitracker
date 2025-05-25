import { useRef, useEffect } from "react";

/**
 * Ultra-precise timer hook using requestAnimationFrame and performance.now().
 * @param {Function} callback - Receives elapsed time in seconds (rounded as specified).
 * @param {boolean} isRunning - Whether the timer is active.
 * @param {number} timeAtStart - Accumulated time before last start (in seconds).
 * @param {number|null} lastStart - Timestamp (ms, from performance.now()) when timer was last started, or null if paused.
 * @param {"ceil"|"floor"} rounding - Rounding mode: "ceil" for countdown, "floor" for stopwatch.
 */
export function useStudyTimer(
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
        rounding === "ceil" ? Math.ceil(elapsedRaw) : Math.floor(elapsedRaw);
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

// src/hooks/useAccurateTimer.js

/**
 * Temporizador ultra preciso.
 * @param {Function} callback - Recibe el tiempo restante en segundos (float).
 * @param {boolean} isRunning - Si el temporizador está activo.
 * @param {number} duration - Duración total del timer en segundos.
 * @param {number} initialRemaining - Tiempo restante inicial (en segundos), útil para restaurar pausas.
 */
export function usePomoTimer(
  callback,
  isRunning,
  duration,
  initialRemaining = duration
) {
  const savedCallback = useRef();
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isRunning) return;

    const now = Date.now();
    const remainingMillis = initialRemaining * 1000;
    startTimeRef.current = now;
    endTimeRef.current = now + remainingMillis;

    function tick() {
      const now = Date.now();
      const remaining = Math.max(0, (endTimeRef.current - now) / 1000);

      savedCallback.current(remaining);

      if (remaining <= 0) {
        clearInterval(id);
      }
    }

    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [isRunning, initialRemaining, duration]);
}

export function formatStudyTime(totalSeconds, roundUp = false) {
  const s = Math.max(
    0,
    roundUp ? Math.ceil(totalSeconds) : Math.floor(totalSeconds)
  );
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);

  return (
    `${hours.toString().padStart(2, "0")}:` +
    `${minutes.toString().padStart(2, "0")}:` +
    `${seconds.toString().padStart(2, "0")}`
  );
}

export function getMonthYear(date, locale = "default") {
  const d = new Date(date);
  return `${d.toLocaleString(locale, { month: "long" })} ${d.getFullYear()}`;
}

export function formatPomoTime(totalSeconds, roundUp = false) {
  const s = Math.max(
    0,
    roundUp ? Math.ceil(totalSeconds) : Math.floor(totalSeconds)
  );
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);

  if (hours > 0) {
    return (
      `${hours.toString().padStart(2, "0")}:` +
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}`
    );
  } else {
    return (
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}`
    );
  }
}
