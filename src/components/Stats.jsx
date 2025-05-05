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

const Statistics = () => {
  const { laps } = useSelector((state) => state.laps);
  const [todayHours, setTodayHours] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [hoveredData, setHoveredData] = useState(null);
  const [isCurrentWeek, setIsCurrentWeek] = useState(true);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [showChart, setShowChart] = useState(false);
  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-primary")
    .trim();

  // Convierte duración HH:MM:SS a horas decimales
  const durationToHours = (duration) => {
    const [hours, minutes] = duration.split(":");
    return parseInt(hours) + parseInt(minutes) / 60;
  };

  // Procesar datos cuando cambian los laps o la semana seleccionada
  useEffect(() => {
    const processData = (isCurrentWeek) => {
      const today = new Date();
      const currentDay = today.getDay();
      const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - mondayOffset - (isCurrentWeek ? 0 : 7));

      let todayTotal = 0;
      let monthTotal = 0;

      // Crear un arreglo con los días de lunes a domingo de la semana seleccionada
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return date.toISOString().split("T")[0];
      });

      const dailyHours = laps.reduce((acc, lap) => {
        const lapDate = new Date(lap.created_at);
        const date = lapDate.toISOString().split("T")[0];
        const hours = durationToHours(lap.duration);

        if (isCurrentWeek && date === today.toISOString().split("T")[0])
          todayTotal += hours;

        // Calcular el total mensual
        if (
          lapDate.getMonth() === today.getMonth() &&
          lapDate.getFullYear() === today.getFullYear()
        ) {
          monthTotal += hours;
        }

        if (weekDays.includes(date)) {
          acc[date] = (acc[date] || 0) + hours;
        }
        return acc;
      }, {});

      // Formatear datos para la gráfica
      const formattedWeeklyData = weekDays.map((date) => {
        const dayDate = new Date(date);
        return {
          date,
          hours: dailyHours[date]?.toFixed(2) || 0,
          dayName: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
        };
      });

      const weekTotal = formattedWeeklyData.reduce(
        (sum, day) => sum + parseFloat(day.hours),
        0,
      );

      setTodayHours(isCurrentWeek ? todayTotal.toFixed(2) : 0);
      setWeeklyData(formattedWeeklyData);
      setWeeklyTotal(weekTotal.toFixed(2));
      setMonthlyTotal(monthTotal.toFixed(2));
    };

    processData(isCurrentWeek);
  }, [laps, isCurrentWeek]);

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

      {/* Lista simple de estadísticas */}
      <ul className="space-y-4 mb-4">
        <li className="flex items-center gap-4 text-lg text-white">
          <Clock size={22} />
          <span className="font-semibold">Today:</span>
          <span>{todayHours} H</span>
        </li>
        <li className="flex items-center gap-4 text-lg text-white">
          <Calendar size={22} />
          <span className="font-semibold">Week:</span>
          <span>{weeklyTotal} H</span>
        </li>
        <li className="flex items-center gap-4 text-lg text-white">
          <Calendar size={22} />
          <span className="font-semibold">Month:</span>
          <span>{monthlyTotal} H</span>
        </li>
      </ul>

      {/* Segunda fila con el gráfico */}
      {showChart && (
        <div className="bg-stats p-6 rounded-lg w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h3 className="card-subtitle text-white flex items-center gap-2 text-lg">
              {isCurrentWeek ? "This Week's" : "Last Week's"} Daily Study Hours
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
                  tickFormatter={(value) => `${value}h`}
                />
                <Bar
                  dataKey="hours"
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
            <div className="absolute mt-16  top-5 right-5 bg-gray-900 bg-opacity-80 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl pointer-events-none">
              <div className="text-sm sm:text-base font-semibold">
                {hoveredData.dayName}
              </div>
              <div className="text-lg sm:text-xl font-bold">
                {hoveredData.hours} h
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Statistics;
