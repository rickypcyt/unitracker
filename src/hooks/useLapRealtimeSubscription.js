import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "../config/supabaseClient";
import { addLapSuccess, updateLapSuccess, deleteLapSuccess, lapError, invalidateCache } from "../store/slices/LapSlice";
import { fetchLaps } from "../store/actions/LapActions";

export const useLapRealtimeSubscription = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchLaps());

    const channel = supabase
      .channel('study_laps_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'study_laps'
          // Consider adding a filter here if needed, e.g., for user_id
        }, 
        (payload) => {
          console.log('Change received!', payload);
          
          // Invalidar caché antes de procesar el cambio
          dispatch(invalidateCache());
          
          switch (payload.eventType) {
            case 'INSERT':
              dispatch(addLapSuccess(payload.new));
              break;
            case 'UPDATE':
              dispatch(updateLapSuccess(payload.new));
              break;
            case 'DELETE':
              dispatch(deleteLapSuccess(payload.old.id));
              break;
            default:
              dispatch(fetchLaps());
              break;
          }
          
          // Disparar evento para actualizar la UI
          window.dispatchEvent(new CustomEvent('refreshStats'));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch]); // Added dispatch as a dependency
}; 