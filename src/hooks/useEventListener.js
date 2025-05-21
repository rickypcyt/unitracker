import { useEffect, useRef } from "react";

export default function useEventListener(event, handler, deps = []) {
    const savedHandler = useRef();

    // Actualiza la referencia si el handler cambia
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        // Crea un wrapper para siempre usar el handler más actualizado
        const eventListener = (e) => savedHandler.current(e);
        window.addEventListener(event, eventListener);
        return () => {
            window.removeEventListener(event, eventListener);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event, ...deps]);
}
