import { useEffect, useRef } from "react";

export default function useEventListener(event, handler, deps = []) {
    const savedHandler = useRef();
    const eventListenerRef = useRef();

    // Update the saved handler if it changes
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        // Create a wrapper that uses the latest handler
        const eventListener = (e) => savedHandler.current(e);
        
        // Store the current event listener reference
        eventListenerRef.current = eventListener;
        
        // Add the event listener
        window.addEventListener(event, eventListener);
        
        // Cleanup function
        return () => {
            // Only remove the specific event listener we added
            window.removeEventListener(event, eventListenerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event, ...deps]);
}
