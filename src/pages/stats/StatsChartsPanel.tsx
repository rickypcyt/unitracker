import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { memo, useMemo, useState } from 'react';

import ChartCard from './ChartCard';
import StatsChart from './StatsChart';
import { getLocalDateString } from '@/utils/dateUtils';
import { durationToSeconds, formatHMS } from '@/utils/timeUtils';
import useDemoMode from '@/utils/useDemoMode';
import { useAccentColor } from '@/hooks/settings/useAccentColor';
import { useLaps } from '@/store/appStore';

const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthLabels = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function formatMinutesToHHMM(minutes: number) {
  return formatHMS(minutes * 60);
}

function getMonday(date: Date, offset = 0) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) - offset;
  return new Date(d.setDate(diff));
}

function getWeekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return getLocalDateString(d);
  });
}

function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return getLocalDateString(d);
  });
}

function getISOWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

interface PeriodNavProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
}

const PeriodNav = ({ label, onPrevious, onNext, isNextDisabled }: PeriodNavProps) => (
  <div className="flex items-center gap-1 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-1">
    <button
      onClick={onPrevious}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)]"
      aria-label="Previous"
    >
      <ChevronLeft size={18} />
    </button>
    <span className="min-w-[96px] select-none text-center text-sm font-semibold text-[var(--text-primary)] sm:min-w-[132px]">
      {label}
    </span>
    <button
      onClick={onNext}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-30"
      aria-label="Next"
      disabled={isNextDisabled}
    >
      <ChevronRight size={18} />
    </button>
  </div>
);

const PeriodSelector = ({
  period,
  onChange,
}: {
  period: 'week' | 'month' | 'year';
  onChange: (period: 'week' | 'month' | 'year') => void;
}) => (
  <div className="flex w-full items-center gap-1 rounded-xl bg-[var(--bg-secondary)] p-1 sm:w-auto" role="tablist" aria-label="Chart period">
    {(['week', 'month', 'year'] as const).map(option => (
      <button
        key={option}
        role="tab"
        aria-selected={period === option}
        onClick={() => onChange(option)}
        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition-colors sm:flex-none sm:px-4 ${
          period === option
            ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
            : 'text-[var(--text-secondary)]'
        }`}
      >
        {option}
      </button>
    ))}
  </div>
);

const fmtHM = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(Math.round(minutes % 60)).padStart(2, '0')}m`;

const SummaryStat = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'up' | 'down' }) => (
  <div className="min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2.5">
    <div className="truncate text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{label}</div>
    <div className={`mt-0.5 truncate text-lg font-bold tabular-nums leading-tight sm:text-xl ${
      tone === 'up' ? 'text-green-500' : tone === 'down' ? 'text-red-500' : 'text-[var(--text-primary)]'
    }`}>
      {value}
    </div>
    {sub && <div className="truncate text-xs text-[var(--text-secondary)]">{sub}</div>}
  </div>
);

const StatsChartsPanel = memo(() => {
  const { laps } = useLaps();
  const { isDemo } = useDemoMode();
  const accentColor = useAccentColor();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Week
  const [weekOffset, setWeekOffset] = useState(0);
  const shownWeekMonday = useMemo(() => {
    const today = new Date();
    return getMonday(today, weekOffset * 7);
  }, [weekOffset]);
  const shownWeekNumber = getISOWeekNumber(shownWeekMonday);
  const shownWeekData = useMemo(() => {
    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDate = getLocalDateString(new Date(lap.created_at));
      if (!lapDate) return acc;

      const minutes = Math.round(durationToSeconds(lap.duration) / 60);
      acc[lapDate] = (acc[lapDate] || 0) + minutes;
      return acc;
    }, {} as Record<string, number>);
    
    const weekDays = getWeekDays(shownWeekMonday);
    return weekDayLabels.map((label, idx) => {
      const date = weekDays[idx];
      const minutes = date && dailyMinutes[date] ? dailyMinutes[date] : 0;
      return {
        date: date || '',
        minutes,
        hoursLabel: formatMinutesToHHMM(minutes),
        dayName: label,
      };
    });
  }, [laps, shownWeekMonday]);

  // Month
  const [monthOffset, setMonthOffset] = useState(0);
  const shownMonthDate = useMemo(() => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    d.setUTCMonth(d.getUTCMonth() + monthOffset);
    return d;
  }, [monthOffset]);
  const shownMonthData = useMemo(() => {
    const year = shownMonthDate.getFullYear();
    const month = shownMonthDate.getMonth();
    const monthDays = getMonthDays(shownMonthDate);
    
    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDateObj = new Date(lap.created_at);
      if (lapDateObj.getFullYear() === year && lapDateObj.getMonth() === month) {
        const lapDate = getLocalDateString(lapDateObj);
        if (!lapDate) return acc;

        const minutes = Math.round(durationToSeconds(lap.duration) / 60);
        acc[lapDate] = (acc[lapDate] || 0) + minutes;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return monthDays.map((date, idx) => {
      const minutes = date && dailyMinutes[date] ? dailyMinutes[date] : 0;
      return {
        date: date || '',
        minutes,
        hoursLabel: formatMinutesToHHMM(minutes),
        dayName: idx.toString(),
        realDay: (idx + 1).toString(),
      };
    });
  }, [laps, shownMonthDate]);

  // Year
  const [yearOffset, setYearOffset] = useState(0);
  const shownYear = useMemo(() => {
    const today = new Date();
    return today.getFullYear() - yearOffset;
  }, [yearOffset]);
  
  const shownYearData = useMemo(() => {
    const monthlyMinutes = Array(12).fill(0);
    
    laps.forEach(lap => {
      const lapDate = new Date(lap.created_at);
      if (lapDate.getFullYear() === shownYear) {
        const month = lapDate.getMonth();
        const minutes = Math.round(durationToSeconds(lap.duration) / 60);
        monthlyMinutes[month] = (monthlyMinutes[month] || 0) + minutes;
      }
    });
    
    return monthLabels.map((label, idx) => ({
      month: label,
      minutes: monthlyMinutes[idx] || 0,
      hoursLabel: formatMinutesToHHMM(monthlyMinutes[idx] || 0),
      dayName: label,
      date: `${shownYear}-${String(idx+1).padStart(2,'0')}-01`,
    }));
  }, [laps, shownYear]);

  // Demo data
  const demoData = useMemo(() => {
    if (!isDemo) return null;
    const demoWeek = [60, 90, 120, 80, 100, 110, 70];
    const demoMonth = [60, 80, 120, 90, 60, 150, 100, 70, 60, 130, 140, 60, 80, 120, 60, 60, 110, 90, 60, 150, 100, 70, 60, 130, 140, 60, 80, 120, 60, 60, 90];
    const demoYear = [120, 90, 100, 80, 110, 130, 120, 100, 90, 110, 120, 100];
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return getLocalDateString(d);
    });
    const thisWeekData = weekDayLabels.map((label, idx) => ({
      date: weekDays[idx] || '',
      minutes: demoWeek[idx] || 0,
      hoursLabel: formatMinutesToHHMM(demoWeek[idx] || 0),
      dayName: label,
    }));
    const shownMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const shownMonthData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(shownMonthDate);
      date.setDate(i + 1);
      return {
        date: getLocalDateString(date) || '',
        minutes: demoMonth[i % demoMonth.length] || 0,
        hoursLabel: formatMinutesToHHMM(demoMonth[i % demoMonth.length] || 0),
        dayName: i.toString(),
        realDay: (i + 1).toString(),
      };
    });
    const thisYearData = monthLabels.map((label, idx) => ({
      month: label,
      minutes: demoYear[idx] || 0,
      hoursLabel: formatMinutesToHHMM(demoYear[idx] || 0),
      dayName: label,
      date: `${shownYear}-${String(idx+1).padStart(2,'0')}-01`,
    }));
    return { thisWeekData, shownMonthData, thisYearData };
  }, [isDemo, shownYear]);

  const weekData = isDemo ? demoData!.thisWeekData : shownWeekData;
  const monthData = isDemo ? demoData!.shownMonthData : shownMonthData;
  const yearData = isDemo ? demoData!.thisYearData : shownYearData;

  const weekLabel = `Week ${shownWeekNumber}`;
  const monthLabel = shownMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const yearLabel = `${shownYear}`;
  const chartData = period === 'week' ? weekData : period === 'month' ? monthData : yearData;
  const chartLabel = period === 'week' ? weekLabel : period === 'month' ? monthLabel : yearLabel;
  const chartTicks = period === 'week' ? weekDayLabels : undefined;

  const handlePrevious = () => {
    if (period === 'week') setWeekOffset(previous => previous + 1);
    if (period === 'month') setMonthOffset(previous => previous - 1);
    if (period === 'year') setYearOffset(previous => previous + 1);
  };

  const handleNext = () => {
    if (period === 'week') setWeekOffset(previous => previous - 1);
    if (period === 'month') setMonthOffset(previous => previous + 1);
    if (period === 'year') setYearOffset(previous => previous - 1);
  };

  const isNextDisabled = period === 'week'
    ? weekOffset === 0
    : period === 'month'
    ? monthOffset >= 0
    : yearOffset === 0;

  // Summary for the shown period + comparison with the previous one
  const summary = useMemo(() => {
    const today = new Date();
    const total = chartData.reduce((sum, d) => sum + (d.minutes || 0), 0);
    const elapsed = chartData.filter(d => !d.date || new Date(d.date) <= today).length;
    const avg = Math.round(total / Math.max(1, elapsed));
    const best = chartData.reduce((top, d) => (d.minutes > (top?.minutes ?? 0) ? d : top), null as null | (typeof chartData)[number]);
    const activeUnits = chartData.filter(d => d.minutes > 0).length;

    let prevTotal: number | null = null;
    if (!isDemo) {
      let from: Date;
      let to: Date;
      if (period === 'week') {
        to = new Date(shownWeekMonday);
        to.setHours(0, 0, 0, 0);
        from = new Date(to);
        from.setDate(from.getDate() - 7);
      } else if (period === 'month') {
        from = new Date(shownMonthDate.getFullYear(), shownMonthDate.getMonth() - 1, 1);
        to = new Date(shownMonthDate.getFullYear(), shownMonthDate.getMonth(), 1);
      } else {
        from = new Date(shownYear - 1, 0, 1);
        to = new Date(shownYear, 0, 1);
      }
      prevTotal = laps.reduce((sum, lap) => {
        const d = new Date(lap.created_at);
        return d >= from && d < to ? sum + Math.round(durationToSeconds(lap.duration) / 60) : sum;
      }, 0);
    }
    const delta = prevTotal && prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
    return { total, avg, best, activeUnits, delta };
  }, [chartData, period, laps, isDemo, shownWeekMonday, shownMonthDate, shownYear]);

  const unitLabel = period === 'year' ? 'month' : 'day';
  const bestLabel = summary.best && summary.best.minutes > 0
    ? (period === 'month' ? `${monthLabels[Number(summary.best.date.slice(5, 7)) - 1] ?? ''} ${(summary.best as any).realDay}` : summary.best.dayName)
    : '—';

  return (
    <div className="w-full">
      <ChartCard
        paddingClass="p-3 sm:p-4"
        isDemo={isDemo}
        header={
          <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[var(--accent-primary)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Charts</h3>
            </div>
            <PeriodSelector period={period} onChange={setPeriod} />
            <div className="flex sm:justify-self-end">
              <PeriodNav
                label={chartLabel}
                onPrevious={handlePrevious}
                onNext={handleNext}
                isNextDisabled={isNextDisabled}
              />
            </div>
          </div>
        }
      >
        {/* Summary row */}
        <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <SummaryStat label="Total" value={fmtHM(summary.total)} sub={`${summary.activeUnits} active ${unitLabel}${summary.activeUnits === 1 ? '' : 's'}`} />
          <SummaryStat label={`Avg / ${unitLabel}`} value={fmtHM(summary.avg)} />
          <SummaryStat label="Best" value={bestLabel} sub={summary.best && summary.best.minutes > 0 ? fmtHM(summary.best.minutes) : 'No data yet'} />
          <SummaryStat
            label={`vs previous ${period}`}
            value={summary.delta === null ? '—' : `${summary.delta > 0 ? '+' : ''}${summary.delta}%`}
            {...(summary.delta !== null && summary.delta !== 0 ? { tone: summary.delta > 0 ? 'up' as const : 'down' as const } : {})}
          />
        </div>
        <StatsChart
          period={period}
          data={chartData}
          title={chartLabel}
          accentColor={accentColor}
          customTitle={<></>}
          {...(chartTicks ? { xAxisTicks: chartTicks } : {})}
        />
      </ChartCard>
    </div>
  );
});

StatsChartsPanel.displayName = 'StatsChartsPanel';

export default StatsChartsPanel; 