import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Clock, Calendar, Activity, Eye, EyeOff } from "lucide-react";

// Utilidades para sumar y formatear
const durationToMinutes = (duration) => {
  const [h, m, s] = duration.split(":").map(Number);
  return h * 60 + m + Math.round(s / 60);
};

const formatMinutesToHHMM = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
};

const Statistics = () => {
  const { tasks } = useSelector((state) => state.tasks); // Ajusta si tu slice se llama diferente
  const [doneToday, setDoneToday] = useState(0);
  const [doneWeek, setDoneWeek] = useState(0);
  const [doneMonth, setDoneMonth] = useState(0);
  
  const { laps } = useSelector((state) => state.laps);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [hoveredData, setHoveredData] = useState(null);
  const [isCurrentWeek, setIsCurrentWeek] = useState(true);
  const [weeklyTotalMinutes, setWeeklyTotalMinutes] = useState(0);
  const [monthlyTotalMinutes, setMonthlyTotalMinutes] = useState(0);
  const [showChart, setShowChart] = useState(false);
  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-primary")
    .trim();

  useEffect(() => {
    const processData = (isCurrentWeek) => {
      const today = new Date();
      const currentDay = today.getDay();
      const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - mondayOffset - (isCurrentWeek ? 0 : 7));

      let todayTotalMinutes = 0;
      let monthTotalMinutes = 0;

      // Días de la semana seleccionada (lunes a domingo)
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return date.toISOString().split("T")[0];
      });

      const dailyMinutes = laps.reduce((acc, lap) => {
        const lapDate = new Date(lap.created_at);
        const date = lapDate.toISOString().split("T")[0];
        const minutes = durationToMinutes(lap.duration);

        // Suma para hoy
        if (isCurrentWeek && date === today.toISOString().split("T")[0])
          todayTotalMinutes += minutes;

        // Suma para el mes
        if (
          lapDate.getMonth() === today.getMonth() &&
          lapDate.getFullYear() === today.getFullYear()
        ) {
          monthTotalMinutes += minutes;
        }

        // Suma para la semana (chart)
        if (weekDays.includes(date)) {
          acc[date] = (acc[date] || 0) + minutes;
        }
        return acc;
      }, {});

      // Formatear datos para la gráfica
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
        0,
      );

      setTodayMinutes(todayTotalMinutes);
      setWeeklyData(formattedWeeklyData);
      setWeeklyTotalMinutes(weekTotalMinutes);
      setMonthlyTotalMinutes(monthTotalMinutes);
    };

    processData(isCurrentWeek);

// Lógica para tareas completadas
if (tasks && Array.isArray(tasks)) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Calcular el lunes de la semana actual
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  let countToday = 0, countWeek = 0, countMonth = 0;

  tasks.forEach((task) => {
    if (!task.completed_at) return;
    const completedDate = new Date(task.completed_at);
    const completedStr = completedDate.toISOString().split("T")[0];

    // Hoy
    if (completedStr === todayStr) countToday++;

    // Mes
    if (
      completedDate.getMonth() === currentMonth &&
      completedDate.getFullYear() === currentYear
    ) countMonth++;

    // Semana (desde lunes)
    if (completedDate >= monday && completedDate <= today) countWeek++;
  });

  setDoneToday(countToday);
  setDoneWeek(countWeek);
  setDoneMonth(countMonth);
}

  }, [laps, isCurrentWeek,tasks]);

  // Controladores de eventos para cada barra
  const handleCellMouseEnter = (entry) => {
    setHoveredData(entry);
  };

  const handleCellMouseLeave = () => {
    setHoveredData(null);
  };

  const toggleWeek = () => {
    setIsCurrentWeek(!isCurrentWeek);
  };

  return (
    <div className="maincard">
      <div className="">
        <div className="flex justify-between items-center">
          <h2 className="card-title text-white">
            <Activity size={24} /> Study Statistics
          </h2>
          <button
            onClick={() => setShowChart(!showChart)}
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



      <ul className="space-y-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:space-y-0 sm:gap-8">
  {/* Estadísticas de tiempo */}
  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4">
  {/* Sección de tiempo */}
  <ul className="space-y-2">
    <li className="flex items-center gap-4 text-lg text-white">
      <span className="font-semibold">Today:</span>
      <span>{formatMinutesToHHMM(todayMinutes)}H</span>
    </li>
    <li className="flex items-center gap-4 text-lg text-white">
      <span className="font-semibold">Week:</span>
      <span>{formatMinutesToHHMM(weeklyTotalMinutes)}H</span>
    </li>
    <li className="flex items-center gap-4 text-lg text-white">
      <span className="font-semibold">Month:</span>
      <span>{formatMinutesToHHMM(monthlyTotalMinutes)}H</span>
    </li>
  </ul>

  {/* Separador vertical en pantallas grandes y línea en móviles */}
  <div className="hidden sm:block h-20 border-l border-gray-500 mx-4"></div>
  <span className="block sm:hidden text-gray-500 text-center">|</span>

  {/* Sección de tareas completadas */}
  <ul className="space-y-2">
    <li className="flex items-center gap-4 text-lg text-white">
      <span className="font-semibold">Tasks Today:</span>
      <span>{doneToday}</span>
    </li>
    <li className="flex items-center gap-4 text-lg text-white">
      <span className="font-semibold">This Week:</span>
      <span>{doneWeek}</span>
    </li>
    <li className="flex items-center gap-4 text-lg text-white">
      <span className="font-semibold">This Month:</span>
      <span>{doneMonth}</span>
    </li>
  </ul>
</div>

</ul>


      {/* Segunda fila con el gráfico */}
      {showChart && (
        <div className="bg-black maincard p-3 rounded-lg w-full relative">
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

          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData}
                margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
              >
                <XAxis
                  dataKey="dayName"
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: "0.875rem" }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: "0.875rem" }}
                  tickFormatter={(value) => formatMinutesToHHMM(value)}
                />
                <Bar
                  dataKey="minutes"
                  fill={accentColor}
                  radius={[4, 4, 0, 0]}
                  animationDuration={400}
                >
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      onMouseEnter={() => handleCellMouseEnter(entry)}
                      onMouseLeave={handleCellMouseLeave}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tooltip personalizado */}
          {hoveredData && (
  <div className="absolute left-1/2 -translate-x-1/2 top-4 z-50
      bg-gray-900 bg-opacity-90 backdrop-blur-md text-white
      px-4 py-2 rounded-xl shadow-2xl border border-accent-primary
      pointer-events-none">
    <div className="text-base font-semibold text-accent-primary mb-1 text-center">
      {hoveredData.dayName}
    </div>
    <div className="text-xl font-bold tracking-wide">
      {hoveredData.hoursLabel}h
    </div>

  </div>
)}

        </div>
      )}
    </div>
  );
};

export default Statistics;
