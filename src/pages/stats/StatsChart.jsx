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
  // Buscar la fecha real (YYYY-MM-DD) en data
  const dayData = data.find(d => d.dayName === entry.dayName || d.dayName === label);
  const date = dayData?.date;
  // Filtrar tareas por fecha
  const dayTasks = tasks.filter(t => {
    if (!t.completed_at) return false;
    const completedDate = new Date(t.completed_at).toISOString().split('T')[0];
    return completedDate === date;
  });
  const tags = Array.from(new Set(dayTasks.flatMap(t => t.tags || [])));
  // Formato de fecha para mostrar
  const dateObj = date ? new Date(date) : null;
  let dayLabel;
  if (title === "This Month" && dateObj) {
    dayLabel = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  } else if (title === "This Year" && dateObj) {
    dayLabel = dateObj.toLocaleDateString('en-US', { month: 'long' });
  } else if (dateObj) {
    dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' });
  } else {
    dayLabel = label;
  }
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-3 shadow-xl min-w-[180px]">
      <div className="font-semibold text-[var(--accent-primary)] mb-1">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</div>
      <div className="text-[var(--text-primary)]">Tiempo: <b>{formatMinutesToHMText(entry.minutes)}</b></div>
      <div className="text-[var(--text-primary)]">Tareas: <b>{dayTasks.length}</b></div>
      {tags.length > 0 && (
        <div className="text-[var(--text-primary)]">Tags: <span className="italic">{tags.map(tag => `"${tag}"`).join(', ')}</span></div>
      )}
    </div>
  );
};

const StatsChart = ({ data, title, accentColor, small = false }) => {
  const chartRef = useRef(null);
  const tasks = useSelector((state) => state.tasks.tasks || []);

  return (
    <div className="maincard p-0.5 mb-3">
      <div className="section-title mt-4 mb-2">
        <Activity size={22} className="icon" />
        <span>{title}</span>
      </div>
      <div className={`${small ? 'h-40' : 'h-48 sm:h-56 lg:h-64'} rounded-lg bg-[var(--bg-secondary)] p-2 z-10 overflow-visible`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 30, right: 0, bottom: 20, left: 32 }} barCategoryGap={12}>
            <XAxis
              dataKey="dayName"
              stroke="var(--text-secondary)"
              tick={{ fill: "var(--text-secondary)", fontSize: "0.75rem" }}
              axisLine={false}
              tickLine={false}
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