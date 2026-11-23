import { supabase } from '@/utils/supabaseClient';

export type LeaderboardPeriod = 'week' | 'month' | 'year' | 'all';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_seconds: number;
  sessions: number;
}

export class LeaderboardService {
  static async getTop(period: LeaderboardPeriod, limit = 10): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('leaderboard', { period, lim: limit });
    if (error) throw error;
    return ((data ?? []) as LeaderboardEntry[]).map((row) => ({
      ...row,
      total_seconds: Number(row.total_seconds),
      sessions: Number(row.sessions),
    }));
  }
}
