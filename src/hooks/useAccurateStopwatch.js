// src/hooks/useInterval.js
import { useRef, useEffect } from "react";
export default function useInterval(callback, isRunning) {
  const intervalRef = useRef(null);
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(callback, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, callback]);
  return intervalRef;
}
