import { Activity, Eye, EyeOff } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSelector } from "react-redux";

// --- Utilidades DRY ---
const durationToMinutes = (duration) => {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) {
    [h, m, s] = parts;
  } else if (parts.length === 2) {
    [h, m] = parts;
  } else if (parts.length === 1) {
    [h] = parts;
  }
  return h * 60 + m + Math.round((s || 0) / 60);
};

const formatMinutesToHHMM = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const getMonday = (date, offset = 0) => {
  const d = new Date(date);
  const day = d.getDay();
  // 0 (domingo) -> 6, 1 (lunes) -> 0, ..., 6 (sábado) -> 5
  const mondayOffset = (day + 6) % 7;
  d.setDate(d.getDate() - mondayOffset - offset);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekDays = (monday) =>
  Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().split("T")[0];
  });

const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getAccentColor = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-primary")
    .trim();

// --- Hooks SOLID ---
function useTaskStats(tasks) {
  const [doneToday, setDoneToday] = useState(0);
  const [doneWeek, setDoneWeek] = useState(0);
  const [doneMonth, setDoneMonth] = useState(0);
  const [doneYear, setDoneYear] = useState(0);

  useEffect(() => {
    if (!tasks || !Array.isArray(tasks)) return;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monday = getMonday(today);

    let countToday = 0,
      countWeek = 0,
      countMonth = 0,
      countYear = 0;

    tasks.forEach((task) => {
      if (!task.completed_at) return;
      const completedDate = new Date(task.completed_at);
      const completedStr = completedDate.toISOString().split("T")[0];

      if (completedStr === todayStr) countToday++;
      if (
        completedDate.getMonth() === currentMonth &&
        completedDate.getFullYear() === currentYear
      )
        countMonth++;
      if (completedDate >= monday && completedDate <= today) countWeek++;
      if (completedDate.getFullYear() === currentYear) countYear++;
    });

    setDoneToday(countToday);
    setDoneWeek(countWeek);
    setDoneMonth(countMonth);
    setDoneYear(countYear);
  }, [tasks]);

  return { doneToday, doneWeek, doneMonth, doneYear };
}

function useLapStats(laps, isCurrentWeek) {
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyTotalMinutes, setWeeklyTotalMinutes] = useState(0);
  const [monthlyTotalMinutes, setMonthlyTotalMinutes] = useState(0);
  const [yearlyTotalMinutes, setYearlyTotalMinutes] = useState(0);
  const prevDataRef = useRef(null);

  useEffect(() => {
    if (!laps) return;
    const today = new Date();
    const monday = getMonday(today, isCurrentWeek ? 0 : 7);

    let todayTotalMinutes = 0;
    let monthTotalMinutes = 0;
    let yearTotalMinutes = 0;

    const weekDays = getWeekDays(monday);

    const dailyMinutes = laps.reduce((acc, lap) => {
      const lapDate = new Date(lap.created_at);
      const date = lapDate.toISOString().split("T")[0];
      const minutes = durationToMinutes(lap.duration);

      if (isCurrentWeek && date === today.toISOString().split("T")[0])
        todayTotalMinutes += minutes;

      if (
        lapDate.getMonth() === today.getMonth() &&
        lapDate.getFullYear() === today.getFullYear()
      ) {
        monthTotalMinutes += minutes;
      }

      if (lapDate.getFullYear() === today.getFullYear()) {
        yearTotalMinutes += minutes;
      }

      if (weekDays.includes(date)) {
        acc[date] = (acc[date] || 0) + minutes;
      }
      return acc;
    }, {});

    const formattedWeeklyData = weekDays.map((date, idx) => {
      const dayDate = new Date(date);
      const minutes = dailyMinutes[date] || 0;
      return {
        date,
        minutes,
        hoursLabel: formatMinutesToHHMM(minutes),
        dayName: weekDayLabels[idx],
      };
    });

    const weekTotalMinutes = formattedWeeklyData.reduce(
      (sum, day) => sum + day.minutes,
      0
    );

    // Solo actualizar si los datos han cambiado
    if (JSON.stringify(formattedWeeklyData) !== JSON.stringify(prevDataRef.current)) {
      setTodayMinutes(todayTotalMinutes);
      setWeeklyData(formattedWeeklyData);
      setWeeklyTotalMinutes(weekTotalMinutes);
      setMonthlyTotalMinutes(monthTotalMinutes);
      setYearlyTotalMinutes(yearTotalMinutes);
      prevDataRef.current = formattedWeeklyData;
    }
  }, [laps, isCurrentWeek]);

  return { todayMinutes, weeklyData, weeklyTotalMinutes, monthlyTotalMinutes, yearlyTotalMinutes };
}

// --- Chart y Tooltip DRY ---
function WeeklyBarChart({
  data,
  accentColor,
}) {
  const chartRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (chartRef.current && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [hasAnimated]);

  return (
    <div className="h-40 sm:h-48 lg:h-56 rounded-lg bg-[var(--bg-secondary)] p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={12}>
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
          />
          <Bar
            dataKey="minutes"
            fill={accentColor}
            radius={[6, 6, 0, 0]}
            barSize={18}
            animationDuration={hasAnimated ? 0 : 350}
            ref={chartRef}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Componente principal ---
const Statistics = () => {
  const { tasks } = useSelector((state) => state.tasks);
  const { laps } = useSelector((state) => state.laps);

  const [isCurrentWeek, setIsCurrentWeek] = useState(true);

  const accentColor = useMemo(getAccentColor, []);

  // Custom hooks para lógica separada
  const { doneToday, doneWeek, doneMonth, doneYear } = useTaskStats(tasks);
  const {
    todayMinutes,
    weeklyData,
    weeklyTotalMinutes,
    monthlyTotalMinutes,
    yearlyTotalMinutes,
  } = useLapStats(laps, isCurrentWeek);

  const toggleWeek = useCallback(() => setIsCurrentWeek((w) => !w), []);

  return (
    <div className="maincard">
      <div>
        <div className="flex justify-between items-center mb-3 gap-2">
          <h2 className="cardtitle mb-0 text-[var(--text-primary)] flex items-center gap-2">
            <Activity size={24} />
            Statistics
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-2 md:grid-cols-4">
          <div className="stat-card aspect-square bg-[var(--bg-secondary)] rounded-lg p-4 border-2 border-[var(--border-primary)]">
            <div className="text-[var(--text-secondary)] text-base">Today (h)</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{formatMinutesToHHMM(todayMinutes)}</div>
            <div className="text-[var(--text-secondary)] text-base">{doneToday} tasks</div>
          </div>
          <div className="stat-card aspect-square bg-[var(--bg-secondary)] rounded-lg p-4 border-2 border-[var(--border-primary)]">
            <div className="text-[var(--text-secondary)] text-base">This Week (h)</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{formatMinutesToHHMM(weeklyTotalMinutes)}</div>
            <div className="text-[var(--text-secondary)] text-base">{doneWeek} tasks</div>
          </div>
          <div className="stat-card aspect-square bg-[var(--bg-secondary)] rounded-lg p-4 border-2 border-[var(--border-primary)]">
            <div className="text-[var(--text-secondary)] text-base">This Month (h)</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{formatMinutesToHHMM(monthlyTotalMinutes)}</div>
            <div className="text-[var(--text-secondary)] text-base">{doneMonth} tasks</div>
          </div>
          <div className="stat-card aspect-square bg-[var(--bg-secondary)] rounded-lg p-4 border-2 border-[var(--border-primary)]">
            <div className="text-[var(--text-secondary)] text-base">This Year (h)</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{formatMinutesToHHMM(yearlyTotalMinutes)}</div>
            <div className="text-[var(--text-secondary)] text-base">{doneYear} tasks</div>
          </div>
        </div>

        <div className="border-none p-3 m-0 bg-[var(--bg-secondary)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{isCurrentWeek ? "This Week Progress" : "Last Week Progress"}</h3>
            <button
              onClick={toggleWeek}
              className="text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
            >
              {isCurrentWeek ? "Last Week" : "This Week"}
            </button>
          </div>
          <div className="mb-4">
            <WeeklyBarChart
              data={weeklyData}
              accentColor={accentColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
