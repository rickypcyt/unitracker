import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTasks } from '@/store/appStore';

function formatMinutesToHMText(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

// Compact label for Y axis: integer hours like "2h"
function formatMinutesToHoursLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  return `${h}h`;
}

const CustomTooltip = ({ active, payload, label, tasks, data, title }: any) => {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0].payload;
  let date: string | undefined = undefined;
  let year: string | undefined, month: string | undefined;
  let monthIdx: number | undefined;
  if (title === "This Month") {
    // Buscar el objeto cuyo dayName sea igual al del entry
    const dayData = data.find((d: any) => d.dayName === entry.dayName);
    date = dayData?.date;
    if (dayData && dayData.realDay) {
      entry.realDay = dayData.realDay;
    }
    // Extraer año y mes del primer dato del array (todos son del mismo mes)
    if (data.length > 0) {
      const d = new Date(data[0].date);
      year = d.getFullYear().toString();
      month = d.getMonth().toString();
    }
  } else if (title === 'This Year' || !isNaN(parseInt(title))) {
    // Para 'This Year' o años específicos, filtrar tasks por mes y año
    const dateParts = entry.date.split('-');
    const yearStr = dateParts[0];
    const monthStr = dateParts[1];
    year = yearStr;
    monthIdx = parseInt(monthStr, 10) - 1;
    // date = primer día del mes para formato
    date = entry.date;
  } else {
    // Para otros gráficos, mantener la lógica anterior
    const dayData = data.find((d: any) => d.dayName === entry.dayName || d.dayName === label);
    date = dayData?.date;
  }
  // Filtrar tareas por fecha o mes según el gráfico
  let dayTasks: any[] = [];
  if ((title === "This Year" || !isNaN(parseInt(title))) && typeof monthIdx === 'number' && year) {
    dayTasks = tasks.filter((t: any) => {
      if (!t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      return completedDate.getFullYear() === parseInt(year, 10) && completedDate.getMonth() === monthIdx;
    });
  } else if (date) {
    dayTasks = tasks.filter((t: any) => {
      if (!t.completed_at) return false;
      const completedDate = new Date(t.completed_at).toISOString().split('T')[0];
      return completedDate === date;
    });
  }
  const tags = Array.from(new Set(dayTasks.flatMap((t: any) => t.tags || [])));
  // Formato de fecha para mostrar
  let dayLabel: string;
  if (title === "This Month" && entry.realDay && year !== undefined && month !== undefined) {
    // Construir la fecha manualmente para evitar desfases de zona horaria
    const correctDate = new Date(parseInt(year), parseInt(month), parseInt(entry.realDay, 10));
    dayLabel = correctDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  } else if (title === "This Month" && date) {
    const dateObj = new Date(date);
    dayLabel = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  } else if ((title === "This Year" || !isNaN(parseInt(title))) && date) {
    const dateObj = new Date(date);
    dayLabel = dateObj.toLocaleDateString('en-US', { month: 'long' });
  } else if (date) {
    const dateObj = new Date(date);
    dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' });
  } else {
    dayLabel = label || '';
  }
  
  // Calculate trend compared to previous period
  const getTrendIcon = () => {
    const currentIndex = data.findIndex((d: any) => d.dayName === entry.dayName);
    if (currentIndex > 0) {
      const previousEntry = data[currentIndex - 1];
      if (previousEntry && previousEntry.minutes > 0) {
        const difference = entry.minutes - previousEntry.minutes;
        if (difference > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (difference < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
      }
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };
  
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-4 shadow-xl min-w-[200px] text-center backdrop-blur-sm">
      <div className="font-semibold text-[var(--accent-primary)] mb-2 text-center text-sm">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="text-[var(--text-primary)] text-center">Time: <b className="text-lg">{formatMinutesToHMText(entry.minutes)}</b></div>
        {getTrendIcon()}
      </div>
      <div className="text-[var(--text-primary)] text-center mb-2">Tasks: <b>{dayTasks.length}</b></div>
      {tags.length > 0 && (
        <div className="text-[var(--text-secondary)] text-center text-xs mt-2">
          <div className="font-medium mb-1">Tags:</div>
          <div className="flex flex-wrap gap-1 justify-center">
            {tags.map((tag: any, index: number) => (
              <span key={index} className="bg-[var(--bg-secondary)] px-2 py-1 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatsChart = ({ data, title, accentColor, small = false, customTitle, xAxisTicks = undefined }: any) => {
  const { tasks } = useTasks();
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
  const minutesArray = Array.isArray(data) ? data.map((d: any) => (typeof d?.minutes === 'number' ? d.minutes : 0)) : [];
  const dataMaxMinutes = minutesArray.length ? Math.max(...minutesArray) : 0;
  const smallYAxisMax = dataMaxMinutes <= 60 ? 60 : 120;
  if (title === 'This Month') {
    todayIndex = data.findIndex((d: any) => {
      const dDate = new Date(d.date);
      return dDate.getDate() === today.getDate() && dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear();
    });
  } else if (title === 'This Week' || title === 'Last Week') {
    todayIndex = data.findIndex((d: any) => {
      const dDate = new Date(d.date);
      return dDate.toDateString() === today.toDateString();
    });
  } else if (title === 'This Year' || !isNaN(parseInt(title))) {
    todayIndex = data.findIndex((d: any) => {
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
  const isYearChart = title === 'This Year' || !isNaN(parseInt(title));
  const chartBoxClass = `${small ? 'h-40' : 'h-48 sm:h-56 lg:h-64'} w-full rounded-xl bg-[var(--bg-secondary)] shadow-lg hover:shadow-xl transition-shadow duration-300 z-10`;

  // Para 'This Year' o años específicos: escalar y mostrar etiquetas enteras según el mayor valor
  const yearDivisor = (title === 'This Year' || !isNaN(parseInt(title))) && dataMaxMinutes > 0
    ? Math.max(1, Math.ceil(dataMaxMinutes / 10))
    : 1;
  const chartData = Array.isArray(data)
    ? (title === 'This Year' || !isNaN(parseInt(title))
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
              <Tooltip 
                content={<CustomTooltip tasks={tasks} data={data} title={title} />} 
                cursor={{ fill: 'rgba(30,144,255,0.12)' }} 
                wrapperStyle={small ? { transform: 'translateY(-40px)' } : {}}
                animationDuration={200}
                isAnimationActive={false}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.3} vertical={false} />
              <Bar
                dataKey="minutes"
                fill={accentColor}
                radius={[8, 8, 0, 0]}
                barSize={title === 'This Month' ? (isSmall ? 10 : 12) : title === 'This Year' ? 20 : 20}
                animationDuration={300}
                animationBegin={0}
              >
                {chartData.map((entry: any, index: number) => {
                  const isToday = index === todayIndex;
                  const hasData = entry.minutes > 0;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        isToday 
                          ? 'var(--accent-primary)' 
                          : hasData 
                            ? accentColor 
                            : 'var(--bg-tertiary)'
                      } 
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default StatsChart;