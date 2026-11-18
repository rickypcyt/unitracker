import { Clock } from 'lucide-react';
import { ReactElement } from 'react';
import { useLaps } from '@/store/appStore';

import useDemoMode from '@/utils/useDemoMode';
import { durationToSeconds, formatHMS } from '@/utils/timeUtils';
import type { Lap } from '@/types/lap';

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
}

function durationToMinutes(duration: string | undefined): number {
  return Math.round(durationToSeconds(duration) / 60);
}

function formatMinutesToHMS(minutes: number): string {
  return formatHMS(minutes * 60);
}

export function useLapStats(laps: Lap[]) {
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

export const periods = [
  { label: 'Today', timeKey: 'todayMinutes', sessionKey: 'sessionsToday' },
  { label: 'Yesterday', timeKey: 'yesterdayMinutes', sessionKey: 'sessionsYesterday' },
  { label: 'This Week', timeKey: 'weekMinutes', sessionKey: 'sessionsWeek' },
  { label: 'This Month', timeKey: 'monthMinutes', sessionKey: 'sessionsMonth' },
  { label: 'This Year', timeKey: 'yearMinutes', sessionKey: 'sessionsYear' },
  { label: 'Last Year', timeKey: 'lastYearMinutes', sessionKey: 'sessionsLastYear' },
] as const;

const PERIOD_COLORS: Record<string, string> = {
  'Today': '#0A84FF',
  'Yesterday': '#a855f7',
  'This Week': '#22c55e',
  'This Month': '#f59e0b',
  'This Year': '#ef4444',
  'Last Year': '#14b8a6',
};

export const StatisticsGrid = ({ statsData }: { statsData: StatData }) => {
  const maxMinutes = Math.max(1, ...periods.map(({ timeKey }) => statsData[timeKey] || 0));
  return (
    <section
      aria-label="Study time by period"
      className="overflow-hidden rounded-2xl border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)]"
    >
      {/* Card header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[var(--accent-primary)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Study time</h3>
        </div>
        <span className="text-xs tabular-nums text-[var(--text-secondary)]">
          {statsData.sessionsYear} sessions this year
        </span>
      </div>

      {/* Cells separated by 1px dividers (gap reveals the border colour behind) */}
      <div className="grid grid-cols-2 gap-px bg-[var(--border-primary)] sm:grid-cols-3 lg:grid-cols-6">
        {periods.map(({ label, timeKey, sessionKey }) => {
          const color = PERIOD_COLORS[label] ?? 'var(--accent-primary)';
          const minutes = statsData[timeKey] || 0;
          const sessions = statsData[sessionKey] || 0;
          const active = minutes > 0;
          const pct = Math.round((minutes / maxMinutes) * 100);
          return (
            <div key={label} className="flex flex-col gap-1.5 bg-[var(--bg-secondary)] px-4 py-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: color, opacity: active ? 1 : 0.4 }}
                  aria-hidden="true"
                />
                <span className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</span>
              </div>
              <span
                className="text-xl font-bold leading-tight tabular-nums sm:text-2xl"
                style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {formatMinutesToHMS(minutes)}
              </span>
              <span className="text-xs tabular-nums text-[var(--text-secondary)]">
                {sessions} {sessions === 1 ? 'session' : 'sessions'}
              </span>
              <div
                className="mt-1 h-1 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const Statistics = (): ReactElement => {
  const { laps } = useLaps();
  const { isDemo, demoStats } = useDemoMode();
  const lapStats = useLapStats(laps);

  const statsData = isDemo ? demoStats : lapStats;

  return (
    <StatisticsGrid statsData={statsData} />
  );
};

export default Statistics; 