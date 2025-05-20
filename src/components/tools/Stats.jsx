import { useState, useEffect, useCallback, useMemo } from "react";
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
  const [h, m, s] = duration.split(":").map(Number);
  return h * 60 + m + Math.round(s / 60);
};

const formatMinutesToHHMM = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
};

const getMonday = (date, offset = 0) => {
  const d = new Date(date);
  const day = d.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
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

    const formattedWeeklyData = weekDays.map((date) => {
      const dayDate = new Date(date);
      const minutes = dailyMinutes[date] || 0;
      return {
        date,
        minutes,
        hoursLabel: formatMinutesToHHMM(minutes),
        dayName: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
      };
    });

    const weekTotalMinutes = formattedWeeklyData.reduce(
      (sum, day) => sum + day.minutes,
      0
    );

    setTodayMinutes(todayTotalMinutes);
    setWeeklyData(formattedWeeklyData);
    setWeeklyTotalMinutes(weekTotalMinutes);
    setMonthlyTotalMinutes(monthTotalMinutes);
  }, [laps, isCurrentWeek]);

  return { todayMinutes, weeklyData, weeklyTotalMinutes, monthlyTotalMinutes };
}

// --- Chart y Tooltip DRY ---
function WeeklyBarChart({
  data,
  accentColor,
  onBarEnter,
  onBarLeave,
  hoveredData,
}) {
  return (
    <div className="h-64 sm:h-72 lg:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <XAxis
            dataKey="dayName"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: "0.875rem" }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: "0.875rem" }}
            tickFormatter={formatMinutesToHHMM}
          />
          <Bar
            dataKey="minutes"
            fill={accentColor}
            radius={[4, 4, 0, 0]}
            animationDuration={400}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                onMouseEnter={() => onBarEnter(entry)}
                onMouseLeave={onBarLeave}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {hoveredData && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-4 z-50
          bg-gray-900 bg-opacity-90 backdrop-blur-md text-white
          px-4 py-2 rounded-xl shadow-2xl border border-accent-primary
          pointer-events-none"
        >
          <div className="text-base font-semibold text-accent-primary mb-1 text-center">
            {hoveredData.dayName}
          </div>
          <div className="text-xl font-bold tracking-wide">
            {hoveredData.hoursLabel}h
          </div>
        </div>
      )}
    </div>
  );
}

// --- Componente principal ---
const Statistics = () => {
  const { tasks } = useSelector((state) => state.tasks);
  const { laps } = useSelector((state) => state.laps);

  const [showChart, setShowChart] = useState(false);
  const [isCurrentWeek, setIsCurrentWeek] = useState(true);
  const [hoveredData, setHoveredData] = useState(null);

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
        <div className="flex justify-between items-center">
          <h2 className="cardtitle text-white">
            <Activity size={24} /> Study Statistics
          </h2>
          <button
            onClick={() => setShowChart((v) => !v)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200 mb-6"
          >
            {showChart ? (
              <>
                <EyeOff size={20} />
                <span className="hidden sm:inline">Hide Chart</span>
              </>
            ) : (
              <>
                <Eye size={20} />
                <span className="hidden sm:inline">Show Chart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabla de estadísticas */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-black">
          <thead>
            <tr>
              <th className="border-b border-black px-4 py-2 text-center"></th>
              <th className="border-b border-black px-4 py-2 text-center">
                Tasks Completed
              </th>
              <th className="border-b border-black px-4 py-2 text-center">
                Hours Studied
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-black px-4 py-2 text-center">
                Today
              </td>
              <td className="border-b border-black px-4 py-2 text-center">
                {doneToday}
              </td>
              <td className="border-b border-black px-4 py-2 text-center">
                {formatMinutesToHHMM(todayMinutes)}
              </td>
            </tr>
            <tr>
              <td className="border-b border-black px-4 py-2 text-center">
                This Week
              </td>
              <td className="border-b border-black px-4 py-2 text-center">
                {doneWeek}
              </td>
              <td className="border-b border-black px-4 py-2 text-center">
                {formatMinutesToHHMM(weeklyTotalMinutes)}
              </td>
            </tr>
            <tr>
              <td className="border-b border-black px-4 py-2 text-center">
                This Month
              </td>
              <td className="border-b border-black px-4 py-2 text-center">
                {doneMonth}
              </td>
              <td className="border-b border-black px-4 py-2 text-center">
                {formatMinutesToHHMM(monthlyTotalMinutes)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Gráfico semanal */}
      {showChart && (
        <div className="mt-6 bg-black p-3 rounded-lg w-full relative">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h3 className="card-subtitle text-white flex items-center gap-2 text-lg">
              {isCurrentWeek ? "This Week's" : "Last Week's"} Chart
            </h3>
            <button
              onClick={toggleWeek}
              className="textbutton w-full sm:w-auto"
            >
              {isCurrentWeek ? "Show Last Week" : "Show This Week"}
            </button>
          </div>
          <WeeklyBarChart
            data={weeklyData}
            accentColor={accentColor}
            onBarEnter={setHoveredData}
            onBarLeave={() => setHoveredData(null)}
            hoveredData={hoveredData}
          />
        </div>
      )}
    </div>
  );
};

export default Statistics;
