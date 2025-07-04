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
  } else {
    // Para otros gráficos, mantener la lógica anterior
    const dayData = data.find(d => d.dayName === entry.dayName || d.dayName === label);
    date = dayData?.date;
  }
  // Filtrar tareas por fecha
  const dayTasks = tasks.filter(t => {
    if (!t.completed_at) return false;
    const completedDate = new Date(t.completed_at).toISOString().split('T')[0];
    return completedDate === date;
  });
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

  return (
    <div className="maincard p-0.5 mb-3">
      <div className="w-full flex flex-col items-center mt-2 mb-2">
        {customTitle ? customTitle : <span className="text-lg font-semibold">{title}</span>}
      </div>
      <div className={`${small ? 'h-40' : 'h-48 sm:h-56 lg:h-64'} rounded-lg bg-[var(--bg-secondary)] p-2 z-10 overflow-visible`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 30, right: 0, bottom: 20, left: 32 }} barCategoryGap={12}>
            <XAxis
              dataKey={
                title === 'This Week' || title === 'Last Week'
                  ? 'dayName'
                  : title === 'This Year'
                  ? 'dayName'
                  : 'realDay'
              }
              stroke="var(--text-secondary)"
              tick={{ fill: "var(--text-secondary)", fontSize: "0.75rem" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              minTickGap={0}
              tickFormatter={
                title === 'This Week' || title === 'Last Week'
                  ? (v) => v
                  : title === 'This Year'
                  ? (v) => v
                  : undefined
              }
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
                <Cell key={`cell-${index}`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsChart;