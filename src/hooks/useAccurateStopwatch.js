import { useRef, useEffect } from "react";

/**
 * Hook de intervalo ultra preciso usando setInterval y Date.now().
 * 
 * @param {Function} callback - Recibe el tiempo total transcurrido en segundos (float).
 * @param {boolean} isRunning - Si el intervalo está activo.
 * @param {number} initialElapsed - Tiempo ya transcurrido (en segundos), útil para restaurar.
 */
export default function useInterval(callback, isRunning, initialElapsed = 0) {
  const savedCallback = useRef();
  const lastTimeRef = useRef(null);
  const elapsedRef = useRef(initialElapsed);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isRunning) return;

    lastTimeRef.current = Date.now();
    elapsedRef.current = initialElapsed;

    function tick() {
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      elapsedRef.current += delta;
      lastTimeRef.current = now;
      savedCallback.current(elapsedRef.current);
    }

    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [isRunning, initialElapsed]);
}
