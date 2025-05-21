// src/hooks/useAccurateTimer.js
import { useRef, useEffect } from "react";

/**
 * Temporizador ultra preciso.
 * @param {Function} callback - Recibe el tiempo restante en segundos (float).
 * @param {boolean} isRunning - Si el temporizador está activo.
 * @param {number} duration - Duración total del timer en segundos.
 * @param {number} initialRemaining - Tiempo restante inicial (en segundos), útil para restaurar pausas.
 */
export default function useAccurateTimer(callback, isRunning, duration, initialRemaining = duration) {
  const savedCallback = useRef();
  const lastTimeRef = useRef(null);
  const remainingRef = useRef(initialRemaining);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isRunning) return;

    lastTimeRef.current = Date.now();
    remainingRef.current = initialRemaining;

    function tick() {
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      remainingRef.current -= delta;
      lastTimeRef.current = now;

      if (remainingRef.current <= 0) {
        savedCallback.current(0);
        remainingRef.current = 0;
        clearInterval(id);
        return;
      }

      savedCallback.current(remainingRef.current);
    }

    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [isRunning, initialRemaining, duration]);
}
