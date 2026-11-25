import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { capitalizeFirst, getLocalDateString } from '@/utils/dateUtils';
import i18n from '@/i18n';
import { formatHMS } from '@/utils/timeUtils';
import { useTasksOnly } from '@/store/appStore';

function formatMinutesToHMText(minutes: number) {
  return formatHMS(minutes * 60);
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
      const completedDate = getLocalDateString(new Date(t.completed_at));
      return completedDate === date;
    });
  }
  const tags = Array.from(new Set(dayTasks.flatMap((t: any) => t.tags || [])));
  // Formato de fecha para mostrar
  let dayLabel: string;
  if (title === "This Month" && entry.realDay && year !== undefined && month !== undefined) {
    // Construir la fecha manualmente para evitar desfases de zona horaria
    const correctDate = new Date(parseInt(year), parseInt(month), parseInt(entry.realDay, 10));
    dayLabel = correctDate.toLocaleDateString(i18n.language, { month: 'long', day: 'numeric' });
  } else if (title === "This Month" && date) {
    const dateObj = new Date(date);
    dayLabel = dateObj.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' });
  } else if ((title === "This Year" || !isNaN(parseInt(title))) && date) {
    const dateObj = new Date(date);
    dayLabel = dateObj.toLocaleDateString(i18n.language, { month: 'long' });
  } else if (date) {
    const dateObj = new Date(date);
    dayLabel = capitalizeFirst(dateObj.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric' }));
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
    <div className="min-w-[180px] rounded-xl border border-(--border-primary) bg-(--bg-primary) p-3 text-left shadow-xl">
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-(--accent-primary)">
        {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tabular-nums leading-none text-(--text-primary)">{formatMinutesToHMText(entry.minutes)}</span>
        {getTrendIcon()}
      </div>
      <div className="mt-2 flex items-center justify-between gap-4 border-t border-(--border-primary) pt-2 text-xs text-(--text-secondary)">
        <span>Tasks completed</span>
        <b className="tabular-nums text-(--text-primary)">{dayTasks.length}</b>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag: any, index: number) => (
            <span key={index} className="rounded-md bg-(--bg-secondary) px-1.5 py-0.5 text-xs text-(--text-secondary)">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const StatsChart = ({ data, title: titleProp, accentColor, small = false, customTitle, xAxisTicks = undefined, period }: any) => {
  // `period` (week|month|year) is explicit; fall back to the legacy title sniffing
  const title: string = period === 'month' ? 'This Month' : titleProp;
  const tasks = useTasksOnly();
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
  const chartBoxClass = `${small ? 'h-40' : 'h-56 sm:h-64 lg:h-72'} w-full z-10`;

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

  const elapsedUnits = Array.isArray(data) ? data.filter((d: any) => !d?.date || new Date(d.date) <= today) : [];
  const avgMinutes = elapsedUnits.length
    ? Math.round(elapsedUnits.reduce((sum: number, d: any) => sum + (d?.minutes || 0), 0) / elapsedUnits.length)
    : 0;
  const gradientId = 'statsBarGradient';
  const todayGradientId = 'statsBarToday';

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
      : (isYearChart && isSmall
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
                isWeekChart ? 8 :
                isMonthChart ? 4 :
                isYearChart ? 12 : 8
              }
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0.45} />
                </linearGradient>
                <linearGradient id={todayGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey={
                  isWeekChart
                    ? 'dayName'
                    : isYearChart
                    ? 'dayName'
                    : 'realDay'
                }
                stroke="var(--text-secondary)"
                tickLine={false}
                axisLine={false}
                interval={isWeekChart ? 0 : (isYearChart ? 0 : (title === 'This Month' && isSmall ? 0 : 'preserveStartEnd'))}
                minTickGap={isSmall ? 5 : 0}
                tickMargin={title === 'This Month' ? (isSmall ? 4 : 8) : isYearChart ? 12 : 8}
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
                cursor={{ fill: 'var(--text-primary)', fillOpacity: 0.05, radius: 8 }} 
                wrapperStyle={small ? { transform: 'translateY(-40px)' } : {}}
                animationDuration={200}
                isAnimationActive={false}
              />
              <CartesianGrid strokeDasharray="2 6" stroke="var(--border-primary)" opacity={0.7} vertical={false} />
              {avgMinutes > 0 && (
                <ReferenceLine
                  y={avgMinutes}
                  stroke="var(--accent-primary)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.55}
                  ifOverflow="extendDomain"
                />
              )}
              <Bar
                dataKey="minutes"
                fill={`url(#${gradientId})`}
                radius={[8, 8, 3, 3]}
                maxBarSize={isYearChart ? 36 : isMonthChart ? 18 : 44}
                background={{ fill: 'var(--bg-secondary)', radius: 8 }}
                animationDuration={500}
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
                          ? `url(#${todayGradientId})`
                          : hasData
                            ? `url(#${gradientId})`
                            : 'transparent'
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