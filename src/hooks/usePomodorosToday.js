import { useCallback, useState } from 'react';

import { supabase } from '@/utils/supabaseClient';

export default function usePomodorosToday(userId) {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPomodoros = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('study_laps')
      .select('pomodoros_completed, started_at')
      .eq('user_id', userId)
      .gte('started_at', `${today}T00:00:00`)
      .lte('started_at', `${today}T23:59:59`);
    if (!error && data) {
      const sum = data.reduce((acc, row) => acc + (row.pomodoros_completed || 0), 0);
      setTotal(sum);
    }
    setLoading(false);
  }, [userId]);

  return { total, loading, fetchPomodoros };
} 