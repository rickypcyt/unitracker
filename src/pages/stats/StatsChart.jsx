import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import React, { useRef } from 'react';

import { Activity } from 'lucide-react';
import { useSelector } from 'react-redux';

function formatMinutesToHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function formatMinutesToHMText(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
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

const StatsChart = ({ data, title, accentColor, small = false, customTitle }) => {
  const chartRef = useRef(null);
  const tasks = useSelector((state) => state.tasks.tasks || []);
  // Detectar el índice del día actual
  const today = new Date();
  let todayIndex = -1;
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

  const isThisYear = title === 'This Year';
  return (
    <div className={`maincard p-0.5 ${isThisYear ? 'mb-2' : 'mb-1'}`}>
      <div className="w-full flex flex-col items-center mt-2 mb-2">
        {customTitle ? customTitle : <span className="text-lg font-semibold">{title}</span>}
      </div>
      {title === 'This Month' ? (
        <div className="w-full">
          <div className="overflow-x-auto">
            <div className={`${small ? 'h-40' : 'h-48 sm:h-56 lg:h-64'} min-w-[700px] rounded-lg bg-[var(--bg-secondary)] z-10`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data} 
                  margin={{ 
                    top: 30, 
                    right: 16, 
                    bottom: 30, 
                    left: 16
                  }} 
                  barCategoryGap={8}
                >
                  <XAxis
                    dataKey={
                      title === 'This Week' || title === 'Last Week'
                        ? 'dayName'
                        : title === 'This Year'
                        ? 'dayName'
                        : 'realDay'
                    }
                    stroke="var(--text-secondary)"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    minTickGap={0}
                    tickMargin={title === 'This Month' ? 12 : title === 'This Year' ? 18 : 16}
                    tickFormatter={(v) => v}
                    tick={{
                      fill: (tickProps) => {
                        if ((title === 'This Week' || title === 'Last Week') && tickProps.index === todayIndex) {
                          return 'var(--accent-primary)';
                        }
                        if (title === 'This Month') {
                          const dayNum = parseInt(tickProps.value, 10);
                          if (!isNaN(dayNum) && dayNum === today.getDate()) {
                            return 'var(--accent-primary)';
                          }
                        }
                        if (title === 'This Year' && tickProps.index === todayIndex) {
                          return 'var(--accent-primary)';
                        }
                        return 'var(--text-secondary)';
                      },
                      fontSize: title === 'This Month' ? '0.7rem' : title === 'This Year' ? '0.85rem' : '0.65rem',
                      angle: title === 'This Year' ? 0 : 0,
                      textAnchor: title === 'This Year' ? 'middle' : (title === 'This Week' || title === 'Last Week' || title === 'This Month' ? 'middle' : undefined),
                    }}
                  />
                  <YAxis
                    stroke="var(--text-secondary)"
                    tick={{ fill: "var(--text-secondary)", fontSize: "0.75rem" }}
                    tickFormatter={(v) => formatMinutesToHHMM(v)}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    domain={[0, 'auto']}
                    tickMargin={8}
                  />
                  <Tooltip content={<CustomTooltip tasks={tasks} data={data} title={title} />} cursor={{ fill: 'rgba(30,144,255,0.08)' }} wrapperStyle={small ? { transform: 'translateY(-40px)' } : {}} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.25} vertical={false} />
                  <Bar
                    dataKey="minutes"
                    fill={accentColor}
                    radius={[6, 6, 0, 0]}
                    barSize={title === 'This Month' ? 10 : title === 'This Year' ? 18 : 18}
                    animationDuration={0}
                    ref={chartRef}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === todayIndex ? 'var(--accent-primary)' : accentColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : ['This Week', 'Last Week', 'This Year'].includes(title) ? (
        <div className="w-full">
          <div className="overflow-x-auto">
            <div className={`${small ? 'h-40' : 'h-48 sm:h-56 lg:h-64'} rounded-lg bg-[var(--bg-secondary)] z-10`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data} 
                  margin={{ 
                    top: 30, 
                    right: (title === 'This Week' || title === 'Last Week') ? 16 : (title === 'This Year' ? 16 : 30), 
                    bottom: 30, 
                    left: (title === 'This Week' || title === 'Last Week') ? 16 : (title === 'This Year' ? 16 : 30) 
                  }} 
                  barCategoryGap={title === 'This Week' || title === 'Last Week' ? 16 : (title === 'This Year' ? 18 : 20)}
                >
                  <XAxis
                    dataKey={
                      title === 'This Week' || title === 'Last Week'
                        ? 'dayName'
                        : title === 'This Year'
                        ? 'dayName'
                        : 'realDay'
                    }
                    stroke="var(--text-secondary)"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    minTickGap={0}
                    tickMargin={title === 'This Month' ? 12 : title === 'This Year' ? 18 : 16}
                    tickFormatter={(v) => v}
                    tick={{
                      fill: (tickProps) => {
                        if ((title === 'This Week' || title === 'Last Week') && tickProps.index === todayIndex) {
                          return 'var(--accent-primary)';
                        }
                        if (title === 'This Month') {
                          const dayNum = parseInt(tickProps.value, 10);
                          if (!isNaN(dayNum) && dayNum === today.getDate()) {
                            return 'var(--accent-primary)';
                          }
                        }
                        if (title === 'This Year' && tickProps.index === todayIndex) {
                          return 'var(--accent-primary)';
                        }
                        return 'var(--text-secondary)';
                      },
                      fontSize: title === 'This Month' ? '0.7rem' : title === 'This Year' ? '0.85rem' : '0.65rem',
                      angle: title === 'This Year' ? 0 : 0,
                      textAnchor: title === 'This Year' ? 'middle' : (title === 'This Week' || title === 'Last Week' || title === 'This Month' ? 'middle' : undefined),
                    }}
                  />
                  <YAxis
                    stroke="var(--text-secondary)"
                    tick={{ fill: "var(--text-secondary)", fontSize: "0.75rem" }}
                    tickFormatter={(v) => formatMinutesToHHMM(v)}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    domain={[0, 'auto']}
                    tickMargin={8}
                  />
                  <Tooltip content={<CustomTooltip tasks={tasks} data={data} title={title} />} cursor={{ fill: 'rgba(30,144,255,0.08)' }} wrapperStyle={small ? { transform: 'translateY(-40px)' } : {}} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.25} vertical={false} />
                  <Bar
                    dataKey="minutes"
                    fill={accentColor}
                    radius={[6, 6, 0, 0]}
                    barSize={title === 'This Month' ? 10 : title === 'This Year' ? 18 : 18}
                    animationDuration={0}
                    ref={chartRef}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === todayIndex ? 'var(--accent-primary)' : accentColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${small ? 'h-40' : 'h-48 sm:h-56 lg:h-64'} rounded-lg bg-[var(--bg-secondary)] z-10 overflow-visible`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ 
                top: 30, 
                right: 30, 
                bottom: 30, 
                left: 30
              }} 
              barCategoryGap={20}
            >
              <XAxis
                dataKey={'realDay'}
                stroke="var(--text-secondary)"
                tickLine={false}
                axisLine={false}
                interval={0}
                minTickGap={0}
                tickMargin={16}
                tickFormatter={(v) => v}
                tick={{
                  fill: 'var(--text-secondary)',
                  fontSize: '0.65rem',
                  angle: 0,
                  textAnchor: undefined,
                }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                tick={{ fill: "var(--text-secondary)", fontSize: "0.75rem" }}
                tickFormatter={(v) => formatMinutesToHHMM(v)}
                axisLine={false}
                tickLine={false}
                width={40}
                domain={[0, 'auto']}
                tickMargin={8}
              />
              <Tooltip content={<CustomTooltip tasks={tasks} data={data} title={title} />} cursor={{ fill: 'rgba(30,144,255,0.08)' }} wrapperStyle={small ? { transform: 'translateY(-40px)' } : {}} />
              <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.25} vertical={false} />
              <Bar
                dataKey="minutes"
                fill={accentColor}
                radius={[6, 6, 0, 0]}
                barSize={18}
                animationDuration={0}
                ref={chartRef}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === todayIndex ? 'var(--accent-primary)' : accentColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default StatsChart;