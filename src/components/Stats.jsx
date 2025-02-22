import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Calendar, Zap, Activity } from 'lucide-react';

const Statistics = () => {
  const { laps } = useSelector((state) => state.laps);
  const [processedData, setProcessedData] = useState([]);
  const [todayHours, setTodayHours] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);

  // Convertir duración HH:MM:SS a horas decimales
  const durationToHours = (duration) => {
    const [hours, minutes] = duration.split(':');
    return parseInt(hours) + (parseInt(minutes) / 60);
  };

  // Procesar datos cuando cambian los laps
  useEffect(() => {
    const processData = () => {
      const today = new Date().toISOString().split('T')[0];
      let todayTotal = 0;
      
      // Datos semanales
      const weekDays = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyHours = laps.reduce((acc, lap) => {
        const date = new Date(lap.created_at).toISOString().split('T')[0];
        const hours = durationToHours(lap.duration);
        
        if (date === today) todayTotal += hours;
        
        acc[date] = (acc[date] || 0) + hours;
        return acc;
      }, {});

      // Formatear datos para la gráfica
      const formattedWeeklyData = weekDays.map(date => {
        const dayDate = new Date(date);
        return {
          date,
          hours: dailyHours[date]?.toFixed(2) || 0,
          dayName: dayDate.toLocaleDateString('en-US', { weekday: 'short' })
        };
      });

      setTodayHours(todayTotal.toFixed(2));
      setWeeklyData(formattedWeeklyData);
    };

    processData();
  }, [laps]);

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg  mr-2 ml-2">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Activity size={24} /> Study Statistics
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90 mb-1 flex items-center gap-2">
                <Clock size={18} /> Today's Study
              </div>
              <div className="text-3xl font-bold">{todayHours} hrs</div>
            </div>
            <Zap size={40} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-cyan-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90 mb-1 flex items-center gap-2">
                <Calendar size={18} /> Weekly Total
              </div>
              <div className="text-3xl font-bold">
                {weeklyData.reduce((sum, day) => sum + parseFloat(day.hours), 0).toFixed(2)} hrs
              </div>
            </div>
            <Calendar size={40} className="opacity-80" />
          </div>
        </div>
      </div>

      <div className="bg-bg-tertiary p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Daily Study Hours
        </h3>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis 
                dataKey="dayName" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fill: '#94a3b8' }}
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: '#f8fafc' }}
                formatter={(value) => [`${parseFloat(value).toFixed(2)} hours`, '']}
              />
              <Bar 
                dataKey="hours" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                animationDuration={400}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Statistics;