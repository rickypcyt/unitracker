import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Activity, Eye, EyeOff } from "lucide-react";

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

  useEffect(() => {
    if (!tasks || !Array.isArray(tasks)) return;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monday = getMonday(today);

    let countToday = 0,
      countWeek = 0,
      countMonth = 0;

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
    });

    setDoneToday(countToday);
    setDoneWeek(countWeek);
    setDoneMonth(countMonth);
  }, [tasks]);

  return { doneToday, doneWeek, doneMonth };
}

function useLapStats(laps, isCurrentWeek) {
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyTotalMinutes, setWeeklyTotalMinutes] = useState(0);
  const [monthlyTotalMinutes, setMonthlyTotalMinutes] = useState(0);
  const prevDataRef = useRef(null);

  useEffect(() => {
    if (!laps) return;
    const today = new Date();
    const monday = getMonday(today, isCurrentWeek ? 0 : 7);

    let todayTotalMinutes = 0;
    let monthTotalMinutes = 0;

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
      prevDataRef.current = formattedWeeklyData;
    }
  }, [laps, isCurrentWeek]);

  return { todayMinutes, weeklyData, weeklyTotalMinutes, monthlyTotalMinutes };
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
    <div className="h-40 sm:h-48 lg:h-56 rounded-lg bg-neutral-950 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={12}>
          <XAxis
            dataKey="dayName"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: "0.75rem" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: "0.75rem" }}
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
  const { doneToday, doneWeek, doneMonth } = useTaskStats(tasks);
  const {
    todayMinutes,
    weeklyData,
    weeklyTotalMinutes,
    monthlyTotalMinutes,
  } = useLapStats(laps, isCurrentWeek);

  const toggleWeek = useCallback(() => setIsCurrentWeek((w) => !w), []);

  return (
    <div className="maincard">
      <div>
        <div className="flex justify-between items-center mb-3 gap-2">
          <h2 className="cardtitle mb-0 text-white flex items-center gap-2">
            <Activity size={24} />
            Statistics
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="stat-card bg-neutral-900 rounded-lg p-4 border border-neutral-800 shadow-lg">
            <div className="text-text-secondary text-base">Today (h)</div>
            <div className="text-2xl font-bold">{formatMinutesToHHMM(todayMinutes)}</div>
            <div className="text-text-secondary text-base">{doneToday} tasks</div>
          </div>
          <div className="stat-card bg-neutral-900 rounded-lg p-4 border border-neutral-800 shadow-lg">
            <div className="text-text-secondary text-base">This Week (h)</div>
            <div className="text-2xl font-bold">{formatMinutesToHHMM(weeklyTotalMinutes)}</div>
            <div className="text-text-secondary text-base">{doneWeek} tasks</div>
          </div>
          <div className="stat-card bg-neutral-900 rounded-lg p-4 border border-neutral-800 shadow-lg">
            <div className="text-text-secondary text-base">This Month (h)</div>
            <div className="text-2xl font-bold">{formatMinutesToHHMM(monthlyTotalMinutes)}</div>
            <div className="text-text-secondary text-base">{doneMonth} tasks</div>
          </div>
        </div>

        <div className="maincard border-none p-0 m-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{isCurrentWeek ? "This Week Progress" : "Last Week Progress"}</h3>
            <button
              onClick={toggleWeek}
              className="text-base text-text-secondary hover:text-white transition-colors duration-200"
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
