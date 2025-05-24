// src/hooks/useAccurateTimer.js
import { useRef, useEffect } from "react";

/**
 * Temporizador ultra preciso.
 * @param {Function} callback - Recibe el tiempo restante en segundos (float).
 * @param {boolean} isRunning - Si el temporizador está activo.
 * @param {number} duration - Duración total del timer en segundos.
 * @param {number} initialRemaining - Tiempo restante inicial (en segundos), útil para restaurar pausas.
 */
export default function useAccurateTimer(
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
