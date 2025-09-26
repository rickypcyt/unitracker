import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

function formatMinutesToHMText(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

// Compact label for Y axis: integer hours like "2h"
function formatMinutesToHoursLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  return `${h}h`;
}

const CustomTooltip = ({ active, payload, label, tasks, data, title }) => {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0].payload;
  let date = undefined;
  let year, month;
  let monthIdx;
  if (title === "This Month") {
    // Buscar el objeto cuyo dayName sea igual al del entry
    const dayData = data.find(d => d.dayName === entry.dayName);
    date = dayData?.date;
    if (dayData && dayData.realDay) {
      entry.realDay = dayData.realDay;
    }
    // Extraer año y mes del primer dato del array (todos son del mismo mes)
    if (data.length > 0) {
      const d = new Date(data[0].date);
      year = d.getFullYear();
      month = d.getMonth();
    }
  } else if (title === "This Year") {
    // Para 'This Year', filtrar tasks por mes y año
    const yearStr = entry.date.split('-')[0];
    const monthStr = entry.date.split('-')[1];
    year = parseInt(yearStr, 10);
    monthIdx = parseInt(monthStr, 10) - 1;
    // date = primer día del mes para formato
    date = entry.date;
  } else {
    // Para otros gráficos, mantener la lógica anterior
    const dayData = data.find(d => d.dayName === entry.dayName || d.dayName === label);
    date = dayData?.date;
  }
  // Filtrar tareas por fecha o mes según el gráfico
  let dayTasks = [];
  if (title === "This Year" && typeof monthIdx === 'number' && typeof year === 'number') {
    dayTasks = tasks.filter(t => {
      if (!t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      return completedDate.getFullYear() === year && completedDate.getMonth() === monthIdx;
    });
  } else {
    dayTasks = tasks.filter(t => {
      if (!t.completed_at) return false;
      const completedDate = new Date(t.completed_at).toISOString().split('T')[0];
      return completedDate === date;
    });
  }
  const tags = Array.from(new Set(dayTasks.flatMap(t => t.tags || [])));
  // Formato de fecha para mostrar
  let dayLabel;
  if (title === "This Month" && entry.realDay && year !== undefined && month !== undefined) {
    // Construir la fecha manualmente para evitar desfases de zona horaria
    const correctDate = new Date(year, month, parseInt(entry.realDay, 10));
    dayLabel = correctDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  } else if (title === "This Month" && date) {
    const dateObj = new Date(date);
    dayLabel = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  } else if (title === "This Year" && date) {
    const dateObj = new Date(date);
    dayLabel = dateObj.toLocaleDateString('en-US', { month: 'long' });
  } else if (date) {
    const dateObj = new Date(date);
    dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' });
  } else {
    dayLabel = label;
  }
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-3 shadow-xl min-w-[180px] text-center">
      <div className="font-semibold text-[var(--accent-primary)] mb-1 text-center">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</div>
      <div className="text-[var(--text-primary)] text-center">Time: <b>{formatMinutesToHMText(entry.minutes)}</b></div>
      <div className="text-[var(--text-primary)] text-center">Tasks: <b>{dayTasks.length}</b></div>
      {tags.length > 0 && (
        <div className="text-[var(--text-primary)] text-center">Tags: <span className="italic">{tags.map(tag => `"${tag}"`).join(', ')}</span></div>
      )}
    </div>
  );
};

const StatsChart = ({ data, title, accentColor, small = false, customTitle, xAxisTicks = undefined }) => {
  const chartRef = useRef(null);
  const tasks = useSelector((state) => state.tasks.tasks || []);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsSmall('matches' in e ? e.matches : (e as MediaQueryList).matches);
    // Init
    setIsSmall(mql.matches);
    // Listen
    const handler = (e: MediaQueryListEvent) => onChange(e);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } else {
      // Safari
      // @ts-ignore
      mql.addListener(handler);
      return () => {
        // @ts-ignore
        mql.removeListener(handler);
      };
    }
  }, []);
  // Detectar el índice del día actual
  const today = new Date();
  let todayIndex = -1;
  const minutesArray = Array.isArray(data) ? data.map(d => (typeof d?.minutes === 'number' ? d.minutes : 0)) : [];
  const dataMaxMinutes = minutesArray.length ? Math.max(...minutesArray) : 0;
  const smallYAxisMax = dataMaxMinutes <= 60 ? 60 : 120;
  if (title === 'This Month') {
    todayIndex = data.findIndex(d => {
      const dDate = new Date(d.date);
      return dDate.getDate() === today.getDate() && dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear();
    });
  } else if (title === 'This Week' || title === 'Last Week') {
    todayIndex = data.findIndex(d => {
      const dDate = new Date(d.date);
      return dDate.toDateString() === today.toDateString();
    });
  } else if (title === 'This Year') {
    todayIndex = data.findIndex(d => {
      const dDate = new Date(d.date);
      return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear();
    });
  }

  // Detectar gráfico semanal también cuando el título no sea exactamente "This Week/Last Week"
  const isWeekChart = (
    title === 'This Week' ||
    title === 'Last Week' ||
    (Array.isArray(xAxisTicks) && xAxisTicks.length === 7)
  );
  const isMonthChart = title === 'This Month';
  const isYearChart = title === 'This Year';
  const chartBoxClass = `${small ? 'h-40' : 'h-48 sm:h-56 lg:h-64'} w-full rounded-lg bg-[var(--bg-secondary)] z-10`;

  // Para 'This Year': escalar y mostrar etiquetas enteras según el mayor valor
  const yearDivisor = title === 'This Year' && dataMaxMinutes > 0
    ? Math.max(1, Math.ceil(dataMaxMinutes / 10))
    : 1;
  const chartData = Array.isArray(data)
    ? (title === 'This Year'
        ? data.map(d => ({
            ...d,
            displayValue: Math.round((typeof d?.minutes === 'number' ? d.minutes : 0) / yearDivisor),
          }))
        : data)
    : [];

  // Configurar YAxis dependiendo si hay datos (minutos) o no
  const maxMinutes = Array.isArray(chartData) && chartData.length
    ? Math.max(...chartData.map(d => (typeof d?.minutes === 'number' ? d.minutes : 0)))
    : 0;
  const noMinutesData = !maxMinutes; // true si todos son 0 o no hay datos
  const weekNoData = isWeekChart && noMinutesData;
  // Para datos presentes, definir un máximo dinámico redondeado a horas completas
  const dynamicMax = Math.max(60, Math.ceil(maxMinutes / 60) * 60);
  const yDomain: [number, number] = weekNoData
    ? [0, 360]
    : (noMinutesData ? [0, 180] : [0, dynamicMax]);
  // Ticks unificados: para semana/mes/año usar siempre múltiplos de 60 hasta yDomain
  const yAxisTicksFinal: (number)[] = (() => {
    if (weekNoData) return [0, 60, 120, 180, 240, 300, 360];
    const upper = (yDomain[1] ?? 0);
    const steps = Math.max(1, Math.floor(upper / 60));
    return Array.from({ length: steps + 1 }, (_, i) => i * 60);
  })();

  // Compute X axis ticks optionally. Only pass the prop if defined to satisfy TS exactOptionalPropertyTypes
  const xTicks = (
    isWeekChart ? xAxisTicks :
    (title === 'This Month' && isSmall
      ? (Array.isArray(data)
          ? data.map(d => d.realDay).filter(v => {
              const n = parseInt(v, 10);
              return !isNaN(n) && (n === 1 || n % 5 === 0);
            })
          : undefined)
      : (title === 'This Year' && isSmall
          ? (Array.isArray(data) ? data.map(d => d.dayName).filter((_, i) => i % 2 === 0) : undefined)
          : undefined))
  );

  return (
    <>
      <div className="w-full flex flex-col items-center mt-2 mb-2">
        {customTitle ? customTitle : <span className="text-lg font-semibold">{title}</span>}
      </div>
      <div className="w-full overflow-hidden">
        <div className={chartBoxClass}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: isSmall ? 8 : 12,
                right: isSmall ? 4 : 8,
                bottom: isSmall ? 8 : 12,
                left: isSmall ? 12 : 24
              }} 
              barCategoryGap={
                title === 'This Month' ? (isSmall ? 12 : 8) :
                (title === 'This Week' || title === 'Last Week') ? 20 :
                (title === 'This Year' ? 24 : 20)
              }
            >
              {/** Build ticks for Month on small screens: every 5 days */}
              {(() => null)()}
              <XAxis
                dataKey={
                  isWeekChart
                    ? 'dayName'
                    : title === 'This Year'
                    ? 'dayName'
                    : 'realDay'
                }
                stroke="var(--text-secondary)"
                tickLine={false}
                axisLine={false}
                interval={isWeekChart ? 0 : (title === 'This Month' && isSmall ? 0 : 'preserveStartEnd')}
                minTickGap={isSmall ? 5 : 0}
                tickMargin={title === 'This Month' ? (isSmall ? 4 : 8) : title === 'This Year' ? 12 : 8}
                fontSize={isSmall ? '11px' : '12px'}
                {...(Array.isArray(xTicks) && xTicks.length > 0 ? { ticks: xTicks as (string | number)[] } : {})}
                tickFormatter={(value, index) => {
                  // Para gráficos de semana, usar las etiquetas de días de la semana
                  if (isWeekChart && xAxisTicks && xAxisTicks[index]) {
                    return xAxisTicks[index];
                  }
                  return value;
                }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                tick={{ fill: "var(--text-secondary)", fontSize: isSmall ? "0.65rem" : "0.7rem", dx: 4 }}
                tickFormatter={(v) => formatMinutesToHoursLabel(v as number)}
                axisLine={false}
                tickLine={false}
                width={isSmall ? 28 : 44}
                domain={
                  // Para semana/mes/año usar dominio dinámico
                  (isWeekChart || isMonthChart || isYearChart)
                    ? (yDomain as [number, number])
                    : (isSmall ? [0, smallYAxisMax] as [number, number] : yDomain)
                }
                ticks={yAxisTicksFinal}
                allowDecimals={false}
                tickMargin={isSmall ? 4 : 8}
              />
              <Tooltip content={<CustomTooltip tasks={tasks} data={data} title={title} />} cursor={{ fill: 'rgba(30,144,255,0.08)' }} wrapperStyle={small ? { transform: 'translateY(-40px)' } : {}} />
              <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.25} vertical={false} />
              <Bar
                dataKey="minutes"
                fill={accentColor}
                radius={[6, 6, 0, 0]}
                barSize={title === 'This Month' ? (isSmall ? 8 : 10) : title === 'This Year' ? 18 : 18}
                animationDuration={0}
                ref={chartRef}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === todayIndex ? 'var(--accent-primary)' : accentColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default StatsChart;