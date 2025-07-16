import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useMemo, useState } from 'react';

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
    const day = i + 1;
    // Usar Date.UTC para evitar desfases de zona horaria
    const date = new Date(Date.UTC(year, month, day));
    return date.toISOString().split('T')[0];
  });
}

const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const monthLabels = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const StatsChartsPanel = () => {
  const { laps } = useSelector((state) => state.laps);
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary') || '#1E90FF';

  // Estado para el mes mostrado
  const [monthOffset, setMonthOffset] = useState(0); // 0 = mes actual, -1 = mes anterior, etc.

  // Calcular la fecha base del mes mostrado
  const shownMonthDate = useMemo(() => {
    const now = new Date();
    // Usar UTC para evitar desfases de zona horaria
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    d.setUTCMonth(d.getUTCMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  // Datos del mes mostrado
  const shownMonthData = useMemo(() => {
    const year = shownMonthDate.getFullYear();
    const month = shownMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDays = getMonthDays(shownMonthDate);
    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDateObj = new Date(lap.created_at);
      // Solo contar si el mes y año coinciden exactamente
      if (lapDateObj.getFullYear() === year && lapDateObj.getMonth() === month) {
        const lapDate = lapDateObj.toISOString().split('T')[0];
        const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
        acc[lapDate] = (acc[lapDate] || 0) + minutes;
      }
      return acc;
    }, {});
    return monthDays.map((date, idx) => {
      // dayName ahora es idx (0 para el primer día, 1 para el segundo, ...)
      return {
        date,
        minutes: dailyMinutes[date] || 0,
        hoursLabel: formatMinutesToHHMM(dailyMinutes[date] || 0),
        dayName: idx.toString(),
        realDay: (idx + 1).toString(), // para mostrar el número real si se necesita
      };
    });
  }, [laps, shownMonthDate]);

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
      {/* Card mensual con título y flechas dentro */}
      <StatsChart
        data={shownMonthData}
        title="This Month"
        accentColor={accentColor}
        customTitle={
          <div className="flex items-center justify-center gap-2 w-full mb-1 mt-1">
            <button
              onClick={() => setMonthOffset((prev) => prev - 1)}
              className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <span
              className={`font-semibold text-lg text-center select-none transition-colors duration-200 ${monthOffset === 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
            >
              {shownMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setMonthOffset((prev) => prev + 1)}
              className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Mes siguiente"
              disabled={monthOffset >= 0}
            >
              <ChevronRight size={20} className={monthOffset >= 0 ? 'opacity-40 cursor-not-allowed' : ''} />
            </button>
          </div>
        }
      />
      <StatsChart data={thisYearData} title="This Year" accentColor={accentColor} />
    </div>
  );
};

export default StatsChartsPanel; 