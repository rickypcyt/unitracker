const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Given a list of ISO timestamps (any activity: laps, completed tasks, habit
 * completions), returns the current and best streak of consecutive active days.
 * The current streak stays alive if the last active day was yesterday.
 */
export const getStreakStats = (
  isoDates: (string | null | undefined)[]
): { current: number; best: number } => {
  const days = new Set<string>();
  for (const iso of isoDates) {
    if (!iso) continue;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) days.add(dayKey(d));
  }
  if (days.size === 0) return { current: 0, best: 0 };

  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (days.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sorted = [...days].sort().map(k => new Date(`${k}T00:00:00`).getTime());
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]! - sorted[i - 1]! === 86400000) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  return { current, best };
};

export const durationToSeconds = (duration?: string | number | null): number => {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;
  if (/^\d+$/.test(duration)) return parseInt(duration, 10);
  const parts = duration.split(':');
  if (parts.length !== 3) return 0;
  return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
};

export const formatHours = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  if (h >= 100) return `${h}h`;
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export interface StreakTier {
  min: number;
  name: string;
  /** gradient stops used for the flame ring and accents on the share card */
  from: string;
  to: string;
}

const STREAK_TIERS: StreakTier[] = [
  { min: 100, name: 'Mythic', from: '#22d3ee', to: '#a855f7' },
  { min: 60, name: 'Legendary', from: '#fbbf24', to: '#f59e0b' },
  { min: 30, name: 'Study Machine', from: '#8b5cf6', to: '#6366f1' },
  { min: 14, name: 'Unstoppable', from: '#ef4444', to: '#ec4899' },
  { min: 7, name: 'On Fire', from: '#f97316', to: '#ef4444' },
  { min: 3, name: 'Warming Up', from: '#f59e0b', to: '#f97316' },
  { min: 0, name: 'Getting Started', from: '#64748b', to: '#38bdf8' },
];

export const getStreakTier = (days: number): StreakTier =>
  STREAK_TIERS.find(t => days >= t.min) ?? STREAK_TIERS[STREAK_TIERS.length - 1]!;
