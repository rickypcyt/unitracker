import { memo, useCallback, useMemo, useState } from 'react';

import MonthStatsCard from './MonthStatsCard';
import WeekStatsCard from './WeekStatsCard';
import YearStatsCard from './YearStatsCard';
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
    return d.toISOString().split('T')[0] || '';
  });
}

function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(Date.UTC(year, month, day));
    return date.toISOString().split('T')[0] || '';
  });
}

function getISOWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

// Obtener color de acento una sola vez fuera del componente
const getAccentColor = () => getComputedStyle(document.documentElement).getPropertyValue('--accent-primary') || '#1E90FF';

const StatsChartsPanel = memo(() => {
  const { laps } = useLaps();
  const { isDemo } = useDemoMode();
  const accentColor = getAccentColor();

  // Semana
  const [weekOffset, setWeekOffset] = useState(0);
  const shownWeekMonday = useMemo(() => {
    const today = new Date();
    return getMonday(today, weekOffset * 7);
  }, [weekOffset]);
  const shownWeekNumber = getISOWeekNumber(shownWeekMonday);
  const shownWeekData = useMemo(() => {
    // Pre-calcular dailyMinutes una sola vez
    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDate = new Date(lap.created_at).toISOString().split('T')[0];
      if (lapDate) {
        const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
        acc[lapDate] = (acc[lapDate] || 0) + minutes;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const weekDays = getWeekDays(shownWeekMonday);
    // Siempre 7 elementos, uno por cada día de la semana
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

  // Mes
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
    
    // Pre-calcular dailyMinutes para el mes específico
    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDateObj = new Date(lap.created_at);
      if (lapDateObj.getFullYear() === year && lapDateObj.getMonth() === month) {
        const lapDate = lapDateObj.toISOString().split('T')[0];
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

  // Año
  const [yearOffset, setYearOffset] = useState(0);
  const shownYear = useMemo(() => {
    const today = new Date();
    return today.getFullYear() - yearOffset;
  }, [yearOffset]);
  
  const shownYearData = useMemo(() => {
    const monthlyMinutes = Array(12).fill(0);
    
    // Procesar laps una sola vez para el año específico
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

  // Memoize the handlers to prevent unnecessary re-renders
  const handleWeekPrevious = useCallback(() => {
    setWeekOffset((prev) => prev + 1);
  }, []);
  
  const handleWeekNext = useCallback(() => {
    setWeekOffset((prev) => prev - 1);
  }, []);
  
  const handleMonthPrevious = useCallback(() => {
    setMonthOffset((prev) => prev - 1);
  }, []);
  
  const handleMonthNext = useCallback(() => {
    setMonthOffset((prev) => prev + 1);
  }, []);
  
  const handleYearPrevious = useCallback(() => {
    setYearOffset((prev) => prev + 1);
  }, []);
  
  const handleYearNext = useCallback(() => {
    setYearOffset((prev) => prev - 1);
  }, []);

  if (isDemo) {
    const demoWeek = [60, 90, 120, 80, 100, 110, 70];
    const demoMonth = [60, 80, 120, 90, 60, 150, 100, 70, 60, 130, 140, 60, 80, 120, 60, 60, 110, 90, 60, 150, 100, 70, 60, 130, 140, 60, 80, 120, 60, 60, 90];
    const demoYear = [120, 90, 100, 80, 110, 130, 120, 100, 90, 110, 120, 100];
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    const thisWeekData = weekDayLabels.map((label, idx) => {
      const date = weekDays[idx];
      return {
        date: date || '',
        minutes: demoWeek[idx] || 0,
        hoursLabel: formatMinutesToHHMM(demoWeek[idx] || 0),
        dayName: label,
      };
    });
    const shownMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const shownMonthData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(shownMonthDate);
      date.setDate(i + 1);
      return {
        date: date.toISOString().split('T')[0] || '',
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
    return (
      <div className="w-full flex flex-col gap-2 sm:gap-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          <div className="h-full">
            <WeekStatsCard
              data={thisWeekData}
              accentColor={accentColor}
              shownWeekNumber={shownWeekNumber}
              weekOffset={weekOffset}
              setWeekOffset={setWeekOffset}
              isDemo={true}
              handleWeekPrevious={handleWeekPrevious}
              handleWeekNext={handleWeekNext}
            />
          </div>
          <div className="h-full">
            <MonthStatsCard
              data={shownMonthData}
              accentColor={accentColor}
              shownMonthDate={shownMonthDate}
              setMonthOffset={setMonthOffset}
              monthOffset={monthOffset}
              isDemo={true}
              handleMonthPrevious={handleMonthPrevious}
              handleMonthNext={handleMonthNext}
            />
          </div>
        </div>
        <div className="w-full">
          <YearStatsCard
            data={thisYearData}
            accentColor={accentColor}
            shownYear={shownYear}
            yearOffset={yearOffset}
            setYearOffset={setYearOffset}
            isDemo={true}
            handleYearPrevious={handleYearPrevious}
            handleYearNext={handleYearNext}
          />
        </div>
      </div>
    );
  }

  // Logueado
  return (
    <div className="w-full flex flex-col gap-2 sm:gap-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-stretch">
        <div className="h-full">
          <WeekStatsCard
            data={shownWeekData}
            accentColor={accentColor}
            shownWeekNumber={shownWeekNumber}
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
            isDemo={false}
            handleWeekPrevious={handleWeekPrevious}
            handleWeekNext={handleWeekNext}
          />
        </div>
        <div className="h-full">
          <MonthStatsCard
            data={shownMonthData}
            accentColor={accentColor}
            shownMonthDate={shownMonthDate}
            setMonthOffset={setMonthOffset}
            monthOffset={monthOffset}
            isDemo={false}
            handleMonthPrevious={handleMonthPrevious}
            handleMonthNext={handleMonthNext}
          />
        </div>
      </div>
      <div className="w-full">
        <YearStatsCard
          data={shownYearData}
          accentColor={accentColor}
          shownYear={shownYear}
          yearOffset={yearOffset}
          setYearOffset={setYearOffset}
          isDemo={false}
          handleYearPrevious={handleYearPrevious}
          handleYearNext={handleYearNext}
        />
      </div>
    </div>
  );
});

StatsChartsPanel.displayName = 'StatsChartsPanel';

export default StatsChartsPanel; 