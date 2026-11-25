import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export interface LandingStats {
  users: number;
  sessions: number;
  hours: number;
  avg_hours_per_day: number;
  avg_hours_per_week: number;
  avg_hours_per_month: number;
}

// Aggregate, all-time stats from the public `landing_stats` RPC.
// Returns null while loading or if the RPC is unavailable (section then hides).
export function useLandingStats(): LandingStats | null {
  const [stats, setStats] = useState<LandingStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('landing_stats')
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setStats(data as LandingStats);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}
