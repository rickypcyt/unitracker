import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { getLocalDateString } from '@/utils/dateUtils';

export default function usePomodorosToday(userId) {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPomodoros = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const today = getLocalDateString();
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

  // Add effect to listen for pomodoro completion events
  useEffect(() => {
    // Initial fetch
    fetchPomodoros();

    // Listen for pomodoro completion events
    const handlePomodoroComplete = () => {
      fetchPomodoros();
    };

    // Add event listener
    window.addEventListener('pomodoroCompleted', handlePomodoroComplete);
    
    // Clean up
    return () => {
      window.removeEventListener('pomodoroCompleted', handlePomodoroComplete);
    };
  }, [fetchPomodoros]);

  return { total, loading, fetchPomodoros };
}