// src/hooks/useEventListener.js
import { useEffect } from "react";
export default function useEventListener(event, handler, deps = []) {
    useEffect(() => {
        window.addEventListener(event, handler);
        return () => window.removeEventListener(event, handler);
    }, deps);
}
