import React, { useMemo, useState } from 'react';

import MonthStatsCard from './MonthStatsCard';
import WeekStatsCard from './WeekStatsCard';
import YearStatsCard from './YearStatsCard';
import useDemoMode from '@/utils/useDemoMode';
import { useSelector } from 'react-redux';

const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const monthLabels = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function formatMinutesToHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function getMonday(date, offset = 0) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) - offset;
  return new Date(d.setDate(diff));
}

function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function getMonthDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(Date.UTC(year, month, day));
    return date.toISOString().split('T')[0];
  });
}

const StatsChartsPanel = () => {
  const { laps } = useSelector((state) => state.laps);
  const { isDemo } = useDemoMode();
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary') || '#1E90FF';

  // Semana
  const [weekOffset, setWeekOffset] = useState(0);
  const shownWeekMonday = useMemo(() => {
    const today = new Date();
    return getMonday(today, weekOffset * 7);
  }, [weekOffset]);
  function getISOWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  }
  const shownWeekNumber = getISOWeekNumber(shownWeekMonday);
  const shownWeekData = useMemo(() => {
    const weekDays = getWeekDays(shownWeekMonday); // array de fechas (YYYY-MM-DD) de lunes a domingo
    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDate = new Date(lap.created_at).toISOString().split('T')[0];
      const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
      acc[lapDate] = (acc[lapDate] || 0) + minutes;
      return acc;
    }, {});
    // Siempre 7 elementos, uno por cada día de la semana
    return weekDayLabels.map((label, idx) => {
      const date = weekDays[idx];
      return {
        date,
        minutes: dailyMinutes[date] || 0,
        hoursLabel: formatMinutesToHHMM(dailyMinutes[date] || 0),
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
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDays = getMonthDays(shownMonthDate);
    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDateObj = new Date(lap.created_at);
      if (lapDateObj.getFullYear() === year && lapDateObj.getMonth() === month) {
        const lapDate = lapDateObj.toISOString().split('T')[0];
        const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
        acc[lapDate] = (acc[lapDate] || 0) + minutes;
      }
      return acc;
    }, {});
    return monthDays.map((date, idx) => ({
      date,
      minutes: dailyMinutes[date] || 0,
      hoursLabel: formatMinutesToHHMM(dailyMinutes[date] || 0),
      dayName: idx.toString(),
      realDay: (idx + 1).toString(),
    }));
  }, [laps, shownMonthDate]);

  // Año
  const thisYearData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const monthlyMinutes = Array(12).fill(0);
    laps.forEach(lap => {
      const lapDate = new Date(lap.created_at);
      if (lapDate.getFullYear() === year) {
        const month = lapDate.getMonth();
        const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
        monthlyMinutes[month] += minutes;
      }
    });
    return monthLabels.map((label, idx) => ({
      month: label,
      minutes: monthlyMinutes[idx],
      hoursLabel: formatMinutesToHHMM(monthlyMinutes[idx]),
      dayName: label,
      date: `${year}-${String(idx+1).padStart(2,'0')}-01`,
    }));
  }, [laps]);

  // Demo data
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
        date,
        minutes: demoWeek[idx],
        hoursLabel: formatMinutesToHHMM(demoWeek[idx]),
        dayName: label,
      };
    });
    const shownMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const shownMonthData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(shownMonthDate);
      date.setDate(i + 1);
      return {
        date: date.toISOString().split('T')[0],
        minutes: demoMonth[i % demoMonth.length],
        hoursLabel: formatMinutesToHHMM(demoMonth[i % demoMonth.length]),
        dayName: i.toString(),
        realDay: (i + 1).toString(),
      };
    });
    const thisYearData = monthLabels.map((label, idx) => ({
      month: label,
      minutes: demoYear[idx],
      hoursLabel: formatMinutesToHHMM(demoYear[idx]),
      dayName: label,
      date: `${today.getFullYear()}-${String(idx+1).padStart(2,'0')}-01`,
    }));
    return (
      <div className="w-full flex flex-col gap-1">
        <WeekStatsCard
          data={thisWeekData}
          accentColor={accentColor}
          shownWeekNumber={shownWeekNumber}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          isDemo={true}
        />
        <MonthStatsCard
          data={shownMonthData}
          accentColor={accentColor}
          shownMonthDate={shownMonthDate}
          setMonthOffset={setMonthOffset}
          monthOffset={monthOffset}
          isDemo={true}
        />
        <YearStatsCard
          data={thisYearData}
          accentColor={accentColor}
          isDemo={true}
        />
      </div>
    );
  }

  // Logueado
  return (
    <div className="w-full flex flex-col gap-1">
      <WeekStatsCard
        data={shownWeekData}
        accentColor={accentColor}
        shownWeekNumber={shownWeekNumber}
        weekOffset={weekOffset}
        setWeekOffset={setWeekOffset}
        isDemo={false}
      />
      <MonthStatsCard
        data={shownMonthData}
        accentColor={accentColor}
        shownMonthDate={shownMonthDate}
        setMonthOffset={setMonthOffset}
        monthOffset={monthOffset}
        isDemo={false}
      />
      <YearStatsCard
        data={thisYearData}
        accentColor={accentColor}
        isDemo={false}
      />
    </div>
  );
};

export default StatsChartsPanel; 