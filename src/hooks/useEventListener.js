import { useEffect, useRef } from "react";

export default function useEventListener(event, handler, deps = []) {
  const savedHandler = useRef();

  // Always keep latest handler in ref so listener stays stable
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Create a stable wrapper bound for this effect run
    const listener = (e) => {
      if (typeof savedHandler.current === "function") {
        savedHandler.current(e);
      }
    };

    // Add listener to window
    window.addEventListener(event, listener);

    // Cleanup removes the exact same function reference added above
    return () => {
      window.removeEventListener(event, listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}
