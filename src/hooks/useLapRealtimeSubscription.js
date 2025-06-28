import { addLapSuccess, deleteLapSuccess, invalidateCache, lapError, updateLapSuccess } from "@/store/slices/LapSlice";

import { fetchLaps } from "@/store/LapActions";
import { supabase } from "@/utils/supabaseClient";
import { useDispatch } from "react-redux";
import { useEffect } from "react";

export const useLapRealtimeSubscription = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    let channel = null;
    let isMounted = true;

    const setupSubscription = async () => {
      dispatch(fetchLaps());
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
      channel = supabase
        .channel('study_laps_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'study_laps',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
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
            window.dispatchEvent(new CustomEvent('refreshStats'));
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [dispatch]);
}; 