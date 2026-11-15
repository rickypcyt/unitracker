import { BookOpen, Timer } from 'lucide-react';
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

const periods = [
  { label: 'Today', timeKey: 'todayMinutes', sessionKey: 'sessionsToday' },
  { label: 'Yesterday', timeKey: 'yesterdayMinutes', sessionKey: 'sessionsYesterday' },
  { label: 'This Week', timeKey: 'weekMinutes', sessionKey: 'sessionsWeek' },
  { label: 'This Month', timeKey: 'monthMinutes', sessionKey: 'sessionsMonth' },
  { label: 'This Year', timeKey: 'yearMinutes', sessionKey: 'sessionsYear' },
  { label: 'Last Year', timeKey: 'lastYearMinutes', sessionKey: 'sessionsLastYear' },
] as const;

const Statistics = (): ReactElement => {
  const { laps } = useLaps();
  const { isDemo, demoStats } = useDemoMode();
  const lapStats = useLapStats(laps);

  const statsData = isDemo ? demoStats : lapStats;

  return (
    <div className="stats-banner bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] py-4 px-5 rounded-2xl shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-[var(--text-primary)] sm:text-lg">Study Statistics</h2>
        <p className="text-xs text-[var(--text-secondary)]">Overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {periods.map(({ label, timeKey, sessionKey }) => (
          <div
            key={label}
            className="flex flex-col gap-1.5 px-3 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</span>
              <Timer size={13} className="text-[var(--accent-primary)]" />
            </div>
            <span className="text-base font-bold text-[var(--text-primary)] tabular-nums leading-none">
              {formatMinutesToHMS(statsData[timeKey])}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
              <BookOpen size={12} className="text-[var(--accent-primary)]" />
              <span className="tabular-nums">{statsData[sessionKey]} sessions</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Statistics; 