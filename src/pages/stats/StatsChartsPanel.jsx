import React, { useMemo } from 'react';

import StatsChart from './StatsChart';
import { useSelector } from 'react-redux';

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
    const d = new Date(year, month, i + 1);
    return d.toISOString().split('T')[0];
  });
}

const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const monthLabels = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const StatsChartsPanel = () => {
  const { laps } = useSelector((state) => state.laps);
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary') || '#1E90FF';

  // This Week
  const thisWeekData = useMemo(() => {
    const today = new Date();
    const monday = getMonday(today, 0);
    const weekDays = getWeekDays(monday);
    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDate = new Date(lap.created_at).toISOString().split('T')[0];
      const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
      if (weekDays.includes(lapDate)) {
        acc[lapDate] = (acc[lapDate] || 0) + minutes;
      }
      return acc;
    }, {});
    return weekDays.map((date, idx) => ({
      date,
      minutes: dailyMinutes[date] || 0,
      hoursLabel: formatMinutesToHHMM(dailyMinutes[date] || 0),
      dayName: weekDayLabels[idx],
    }));
  }, [laps]);

  // Last Week
  const lastWeekData = useMemo(() => {
    const today = new Date();
    const monday = getMonday(today, 7);
    const weekDays = getWeekDays(monday);
    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDate = new Date(lap.created_at).toISOString().split('T')[0];
      const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
      if (weekDays.includes(lapDate)) {
        acc[lapDate] = (acc[lapDate] || 0) + minutes;
      }
      return acc;
    }, {});
    return weekDays.map((date, idx) => ({
      date,
      minutes: dailyMinutes[date] || 0,
      hoursLabel: formatMinutesToHHMM(dailyMinutes[date] || 0),
      dayName: weekDayLabels[idx],
    }));
  }, [laps]);

  // This Month
  const thisMonthData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Generar todos los días del mes actual (1 hasta el último día)
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    });
    
    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDate = new Date(lap.created_at).toISOString().split('T')[0];
      const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
      if (monthDays.includes(lapDate)) {
        acc[lapDate] = (acc[lapDate] || 0) + minutes;
      }
      return acc;
    }, {});
    
    return monthDays.map((date, idx) => {
      const dayOfMonth = idx + 1; // Siempre empieza en 1
      return {
        date,
        minutes: dailyMinutes[date] || 0,
        hoursLabel: formatMinutesToHHMM(dailyMinutes[date] || 0),
        dayName: dayOfMonth.toString(),
      };
    });
  }, [laps]);

  // This Year
  const thisYearData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    // Inicializar array de 12 meses
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

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <StatsChart data={thisWeekData} title="This Week" accentColor={accentColor} small />
        </div>
        <div className="w-full md:w-1/2">
          <StatsChart data={lastWeekData} title="Last Week" accentColor={accentColor} small />
        </div>
      </div>
      <StatsChart data={thisMonthData} title="This Month" accentColor={accentColor} />
      <StatsChart data={thisYearData} title="This Year" accentColor={accentColor} />
    </div>
  );
};

export default StatsChartsPanel; 