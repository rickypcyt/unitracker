import { BookOpen, CheckCircle2, Flame, Timer } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';
import { useLaps, useTasksOnly } from '@/store/appStore';

import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import type { Lap } from '@/types/lap';
import type { Task } from '@/schemas/task';

interface StatData {
  todayMinutes: number;
  yesterdayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  yearMinutes: number;
  lastYearMinutes: number;
  sessionsToday: number;
  sessionsYesterday: number;
  sessionsWeek: number;
  sessionsMonth: number;
  sessionsYear: number;
  sessionsLastYear: number;
  longestStreak: number;
  pomodoros: number;
}

function durationToMinutes(duration: string | undefined): number {
  if (!duration) return 0;
  const [h, m] = duration.split(':');
  return parseInt(h || '0') * 60 + parseInt(m || '0');
}

function formatMinutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function useLapStats(laps: Lap[]) {
  // Obtener fechas en la zona horaria local
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowLocal = new Date(todayLocal);
  tomorrowLocal.setDate(todayLocal.getDate() + 1);
  const yesterdayLocal = new Date(todayLocal);
  yesterdayLocal.setDate(todayLocal.getDate() - 1);

  // Calcular inicio de la semana (lunes)
  const weekStart = new Date(todayLocal);
  weekStart.setDate(todayLocal.getDate() - todayLocal.getDay() + (todayLocal.getDay() === 0 ? -6 : 1));

  // Obtener año y mes actual
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const stats = {
    todayMinutes: 0,
    yesterdayMinutes: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    yearMinutes: 0,
    lastYearMinutes: 0,
    sessionsToday: 0,
    sessionsYesterday: 0,
    sessionsWeek: 0,
    sessionsMonth: 0,
    sessionsYear: 0,
    sessionsLastYear: 0,
  };

  laps.forEach(lap => {
    if (!lap.created_at) return;

    // Usar created_at como fecha principal
    const lapDate = new Date(lap.created_at);

    // Obtener la duración del campo duration (ya en formato HH:MM:SS)
    const minutes = durationToMinutes(lap.duration);
    const lapYear = lapDate.getFullYear();
    const lapMonth = lapDate.getMonth();

    // Verificar si la sesión es de hoy
    if (lapDate >= todayLocal && lapDate < tomorrowLocal) {
      stats.todayMinutes += minutes;
      stats.sessionsToday += 1;
    }

    // Verificar si la sesión es de ayer
    if (lapDate >= yesterdayLocal && lapDate < todayLocal) {
      stats.yesterdayMinutes += minutes;
      stats.sessionsYesterday += 1;
    }

    // Verificar si la sesión es de esta semana
    if (lapDate >= weekStart) {
      stats.weekMinutes += minutes;
      stats.sessionsWeek += 1;
    }

    // Verificar si la sesión es de este mes
    if (lapYear === currentYear && lapMonth === currentMonth) {
      stats.monthMinutes += minutes;
      stats.sessionsMonth += 1;
    }

    // Verificar si la sesión es de este año
    if (lapYear === currentYear) {
      stats.yearMinutes += minutes;
      stats.sessionsYear += 1;
    }

    // Verificar si la sesión es del año pasado
    if (lapYear === currentYear - 1) {
      stats.lastYearMinutes += minutes;
      stats.sessionsLastYear += 1;
    }
  });

  return stats;
}

function hasCompletedAt(task: Task): task is Task & { completed_at: string } {
  return typeof task.completed_at === 'string' && task.completed_at.length > 0;
}

function getLongestStreak(tasks: Task[]): number {
  const completed = tasks
    .filter((t): t is Task & { completed_at: string } => t.completed && hasCompletedAt(t))
    .map(t => new Date(t.completed_at).setHours(0,0,0,0))
    .sort((a, b) => a - b);
  if (completed.length === 0) return 0;
  let streak = 1, maxStreak = 1;
  for (let i = 1; i < completed.length; i++) {
    const current = completed[i];
    const previous = completed[i-1];
    if (current && previous && current - previous === 86400000) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else if (current && previous && current !== previous) {
      streak = 1;
    }
  }
  return maxStreak;
}

function usePomodorosAllTime(userId: string | undefined): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!userId) {
      setTotal(0);
      return;
    }
    const fetchAllTime = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('study_laps')
        .select('pomodoros_completed')
        .eq('user_id', userId);
      if (!error && data) {
        const sum = data.reduce((acc: number, row: { pomodoros_completed?: number }) => acc + (row.pomodoros_completed || 0), 0);
        setTotal(sum);
      }
    };
    fetchAllTime();
  }, [userId]);

  return total;
}

const timePeriods: { key: keyof Pick<StatData, 'todayMinutes' | 'yesterdayMinutes' | 'weekMinutes' | 'monthMinutes' | 'yearMinutes' | 'lastYearMinutes'>; label: string }[] = [
  { key: 'todayMinutes', label: 'Today' },
  { key: 'yesterdayMinutes', label: 'Yesterday' },
  { key: 'weekMinutes', label: 'This Week' },
  { key: 'monthMinutes', label: 'This Month' },
  { key: 'yearMinutes', label: 'This Year' },
  { key: 'lastYearMinutes', label: 'Last Year' },
];

const sessionPeriods: { key: keyof Pick<StatData, 'sessionsToday' | 'sessionsYesterday' | 'sessionsWeek' | 'sessionsMonth' | 'sessionsYear' | 'sessionsLastYear'>; label: string }[] = [
  { key: 'sessionsToday', label: 'Today' },
  { key: 'sessionsYesterday', label: 'Yesterday' },
  { key: 'sessionsWeek', label: 'This Week' },
  { key: 'sessionsMonth', label: 'This Month' },
  { key: 'sessionsYear', label: 'This Year' },
  { key: 'sessionsLastYear', label: 'Last Year' },
];

const Statistics = (): ReactElement => {
  const tasks = useTasksOnly();
  const { laps } = useLaps();
  const { user } = useAuth();
  const { isDemo, demoStats } = useDemoMode();
  const lapStats = useLapStats(laps);
  const longestStreak = getLongestStreak(tasks);

  // Pomodoros completados all time (de la base de datos)
  const pomodorosAllTime = usePomodorosAllTime(user?.id);

  const statData: StatData = {
    ...lapStats,
    longestStreak,
    pomodoros: pomodorosAllTime,
  };

  const statsData = isDemo ? demoStats : statData;

  return (
    <div className="stats-banner bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] py-4 px-5 rounded-2xl shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-[var(--text-primary)] sm:text-lg">Study Statistics</h2>
        <p className="text-xs text-[var(--text-secondary)]">Overview</p>
      </div>

      {/* Study time */}
      <div className="mb-2 flex items-center gap-2 text-[var(--text-secondary)]">
        <Timer size={16} className="text-[var(--accent-primary)]" />
        <span className="text-xs font-semibold uppercase tracking-wide">Study Time</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
        {timePeriods.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
          >
            <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
            <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums whitespace-nowrap">
              {formatMinutesToHHMM(statsData[key])}h
            </span>
          </div>
        ))}
      </div>

      {/* Sessions */}
      <div className="mb-2 flex items-center gap-2 text-[var(--text-secondary)]">
        <BookOpen size={16} className="text-[var(--accent-primary)]" />
        <span className="text-xs font-semibold uppercase tracking-wide">Sessions</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
        {sessionPeriods.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
          >
            <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
            <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
              {statsData[key]}
            </span>
          </div>
        ))}
      </div>

      {/* Pomodoros + Streak */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <CheckCircle2 size={15} className="text-red-500" />
            <span className="text-xs font-medium">Pomodoros</span>
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{statsData.pomodoros ?? 0}</span>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Flame size={15} className="text-orange-500" />
            <span className="text-xs font-medium">Max Streak</span>
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{statsData.longestStreak}</span>
        </div>
      </div>
    </div>
  );
};

export default Statistics; 