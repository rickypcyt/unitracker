import { supabase } from '@/utils/supabaseClient';

export type LeaderboardPeriod = 'week' | 'month' | 'year' | 'all';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_seconds: number;
  sessions: number;
}

// Sample data shown to signed-out users (demo mode). [name, monthly hours, monthly sessions]
const DEMO_USERS: [string, number, number][] = [
  ['sofia.studies', 86, 112],
  ['alex_dev', 74, 98],
  ['mariana', 69, 91],
  ['kenji', 61, 80],
  ['nora.writes', 55, 73],
  ['lucas_m', 48, 64],
  ['priya', 42, 57],
  ['tomás', 37, 49],
  ['emma_k', 31, 41],
  ['jordan', 24, 33],
];

// How much of a month's study time each period represents
const DEMO_PERIOD_FACTOR: Record<LeaderboardPeriod, number> = {
  week: 0.25,
  month: 1,
  year: 9,
  all: 14,
};

export class LeaderboardService {
  static getDemoTop(period: LeaderboardPeriod, limit = 10): LeaderboardEntry[] {
    const factor = DEMO_PERIOD_FACTOR[period];
    return DEMO_USERS.slice(0, limit).map(([username, hours, sessions], i) => ({
      user_id: `demo-user-${i}`,
      username,
      avatar_url: null,
      total_seconds: Math.round(hours * 3600 * factor),
      sessions: Math.max(1, Math.round(sessions * factor)),
    }));
  }

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
