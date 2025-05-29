import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "../utils/supabaseClient";
import { addLapSuccess, updateLapSuccess, deleteLapSuccess, lapError, invalidateCache } from "../redux/LapSlice";
import { fetchLaps } from "../redux/LapActions";

export const useLapRealtimeSubscription = () => {
  const dispatch = useDispatch();

  useEffect(() => {
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
              // For other events or in case of uncertainty, refetch laps
              dispatch(fetchLaps());
              // Optionally invalidate cache here if fetchLaps doesn't
              // dispatch(invalidateCache());
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch]); // Added dispatch as a dependency
}; 