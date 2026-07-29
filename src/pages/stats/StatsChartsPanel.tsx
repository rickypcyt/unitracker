import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo, useMemo, useState } from 'react';

import ChartCard from './ChartCard';
import StatsChart from './StatsChart';
import { getLocalDateString } from '@/utils/dateUtils';
import useDemoMode from '@/utils/useDemoMode';
import { useLaps } from '@/store/appStore';

const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthLabels = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function formatMinutesToHHMM(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
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

const getAccentColor = () => getComputedStyle(document.documentElement).getPropertyValue('--accent-primary') || '#1E90FF';

let cachedAccentColor: string | null = null;
const getCachedAccentColor = () => {
  if (!cachedAccentColor) {
    cachedAccentColor = getAccentColor();
  }
  return cachedAccentColor;
};

interface PeriodNavProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
}

const PeriodNav = ({ label, onPrevious, onNext, isNextDisabled }: PeriodNavProps) => (
  <div className="flex items-center gap-1.5">
    <button
      onClick={onPrevious}
      className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center"
      aria-label="Previous"
    >
      <ChevronLeft size={18} className="text-[var(--text-primary)]" />
    </button>
    <span className="font-semibold text-sm sm:text-base text-center select-none transition-colors duration-200 text-[var(--accent-primary)] min-w-[80px] sm:min-w-[120px]">
      {label}
    </span>
    <button
      onClick={onNext}
      className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label="Next"
      disabled={isNextDisabled}
    >
      <ChevronRight size={18} className={`text-[var(--text-primary)] ${isNextDisabled ? 'opacity-40' : ''}`} />
    </button>
  </div>
);

const StatsChartsPanel = memo(() => {
  const { laps } = useLaps();
  const { isDemo } = useDemoMode();
  const accentColor = getCachedAccentColor();

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
      if (lapDate) {
        const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
        acc[lapDate] = (acc[lapDate] || 0) + minutes;
      }
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
        if (lapDate) {
          const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
          acc[lapDate] = (acc[lapDate] || 0) + minutes;
        }
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
        const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
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

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Week chart */}
      <ChartCard
        paddingClass="p-2"
        isDemo={isDemo}
        header={<PeriodNav label={weekLabel} onPrevious={() => setWeekOffset(prev => prev + 1)} onNext={() => setWeekOffset(prev => prev - 1)} isNextDisabled={weekOffset === 0} />}
      >
        <StatsChart
          data={weekData}
          title={weekLabel}
          accentColor={accentColor}
          customTitle={<></>}
          xAxisTicks={weekDayLabels}
        />
      </ChartCard>

      {/* Month chart */}
      <ChartCard
        paddingClass="p-2"
        isDemo={isDemo}
        header={<PeriodNav label={monthLabel} onPrevious={() => setMonthOffset(prev => prev - 1)} onNext={() => setMonthOffset(prev => prev + 1)} isNextDisabled={monthOffset >= 0} />}
      >
        <StatsChart
          data={monthData}
          title={monthLabel}
          accentColor={accentColor}
          customTitle={<></>}
        />
      </ChartCard>

      {/* Year chart */}
      <ChartCard
        paddingClass="p-2"
        isDemo={isDemo}
        header={<PeriodNav label={yearLabel} onPrevious={() => setYearOffset(prev => prev + 1)} onNext={() => setYearOffset(prev => prev - 1)} isNextDisabled={yearOffset === 0} />}
      >
        <StatsChart
          data={yearData}
          title={yearLabel}
          accentColor={accentColor}
          customTitle={<></>}
        />
      </ChartCard>
    </div>
  );
});

StatsChartsPanel.displayName = 'StatsChartsPanel';

export default StatsChartsPanel; 