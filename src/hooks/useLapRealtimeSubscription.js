import { fetchLaps } from "@/store/LapActions";
import { supabase } from "@/utils/supabaseClient";
import { useAppStore } from "@/store/appStore";
import { useEffect } from "react";

export const useLapRealtimeSubscription = () => {
  const addLap = useAppStore((state) => state.addLap);
  const updateLap = useAppStore((state) => state.updateLap);
  const deleteLap = useAppStore((state) => state.deleteLap);
  const invalidateCache = useAppStore((state) => state.invalidateCache);

  useEffect(() => {
    let channel = null;
    let isMounted = true;

    const setupSubscription = async () => {
      fetchLaps();
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
            invalidateCache();
            switch (payload.eventType) {
              case 'INSERT':
                addLap(payload.new);
                break;
              case 'UPDATE':
                updateLap(payload.new.id, payload.new);
                break;
              case 'DELETE':
                deleteLap(payload.old.id);
                break;
              default:
                fetchLaps();
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
  }, [addLap, updateLap, deleteLap, invalidateCache]);
}; 