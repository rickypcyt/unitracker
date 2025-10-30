import { CalendarDays, CheckCircle2, Flame, ListChecks, Timer, TrendingUp } from 'lucide-react';
import React, { ReactElement, ReactNode, useEffect, useState } from 'react';

import { supabase } from '@/utils/supabaseClient';
import useDemoMode from '@/utils/useDemoMode';
import usePomodorosToday from '@/hooks/usePomodorosToday';
import { useSelector } from 'react-redux';

// Tipos para las entidades
interface Task {
  completed: boolean;
  completed_at?: string;
}

interface Lap {
  created_at: string;
  duration: string;
  type?: string;
  name?: string;
}

interface StatData {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  yearMinutes: number;
  doneToday: number;
  doneWeek: number;
  doneMonth: number;
  doneYear: number;
  longestStreak: number;
  avgPerDay: number;
  totalTasks: number;
  pomodoros: number;
  pomodoroMinutes: number;
  pomodorosToday: number;
}

interface StatCard {
  label: string;
  icon: ReactNode;
  value: (s: StatData) => string | number;
  sub: (s: StatData) => string;
}

function durationToMinutes(duration: string | undefined): number {
  if (!duration) return 0;
  const [h, m] = duration.split(':');
  return parseInt(h || '0') * 60 + parseInt(m || '0');
}

function formatMinutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function useTaskStats(tasks: Task[]): { doneToday: number; doneWeek: number; doneMonth: number; doneYear: number } {
  // Obtener fechas en la zona horaria local
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowLocal = new Date(todayLocal);
  tomorrowLocal.setDate(todayLocal.getDate() + 1);
  
  // Calcular inicio de la semana (lunes)
  const weekStart = new Date(todayLocal);
  weekStart.setDate(todayLocal.getDate() - todayLocal.getDay() + (todayLocal.getDay() === 0 ? -6 : 1));
  
  // Obtener año y mes actual
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  let doneToday = 0, doneWeek = 0, doneMonth = 0, doneYear = 0;

  tasks.forEach(task => {
    if (task.completed && task.completed_at) {
      const completedDate = new Date(task.completed_at);
      
      // Verificar si la tarea se completó hoy
      if (completedDate >= todayLocal && completedDate < tomorrowLocal) {
        doneToday++;
      }
      
      // Verificar si la tarea se completó esta semana
      if (completedDate >= weekStart) {
        doneWeek++;
      }
      
      // Verificar si la tarea se completó este mes
      if (completedDate.getFullYear() === currentYear && 
          completedDate.getMonth() === currentMonth) {
        doneMonth++;
      }
      
      // Verificar si la tarea se completó este año
      if (completedDate.getFullYear() === currentYear) {
        doneYear++;
      }
    }
  });
  return { doneToday, doneWeek, doneMonth, doneYear };
}

function useLapStats(laps: Lap[]): { todayMinutes: number; weekMinutes: number; monthMinutes: number; yearMinutes: number } {
  // Obtener fechas en la zona horaria local
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowLocal = new Date(todayLocal);
  tomorrowLocal.setDate(todayLocal.getDate() + 1);
  
  // Calcular inicio de la semana (lunes)
  const weekStart = new Date(todayLocal);
  weekStart.setDate(todayLocal.getDate() - todayLocal.getDay() + (todayLocal.getDay() === 0 ? -6 : 1));
  
  // Obtener año y mes actual
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  let todayMinutes = 0, weekMinutes = 0, monthMinutes = 0, yearMinutes = 0;

  laps.forEach(lap => {
    if (!lap.created_at) return;
    
    // Usar started_at si está disponible, de lo contrario usar created_at
    const lapDate = lap.started_at ? new Date(lap.started_at) : new Date(lap.created_at);
    
    // Obtener la duración del campo duration (ya en formato HH:MM:SS)
    const minutes = durationToMinutes(lap.duration);
    
    // Verificar si la sesión es de hoy
    if (lapDate >= todayLocal && lapDate < tomorrowLocal) {
      todayMinutes += minutes;
    }
    
    // Verificar si la sesión es de esta semana
    if (lapDate >= weekStart) {
      weekMinutes += minutes;
    }
    
    // Verificar si la sesión es de este mes
    if (lapDate.getFullYear() === currentYear && 
        lapDate.getMonth() === currentMonth) {
      monthMinutes += minutes;
    }
    
    // Verificar si la sesión es de este año
    if (lapDate.getFullYear() === currentYear) {
      yearMinutes += minutes;
    }
  });
  
  return { todayMinutes, weekMinutes, monthMinutes, yearMinutes };
}

function hasCompletedAt(task: Task): task is Task & { completed_at: string } {
  return typeof task.completed_at === 'string' && task.completed_at.length > 0;
}

function getLongestStreak(tasks: Task[]): number {
  const completed = tasks
    .filter((t): t is Task & { completed_at: string } => t.completed && hasCompletedAt(t))
    .map(t => new Date(t.completed_at).setHours(0,0,0,0))
    .sort((a, b) => a - b);
  if (completed.length === 0) return 0;
  let streak = 1, maxStreak = 1;
  for (let i = 1; i < completed.length; i++) {
    const current = completed[i];
    const previous = completed[i-1];
    if (current && previous && current - previous === 86400000) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else if (current && previous && current !== previous) {
      streak = 1;
    }
  }
  return maxStreak;
}

function getAveragePerDay(laps: Lap[]): number {
  if (!laps.length) return 0;
  const days = new Set(laps.map(lap => new Date(lap.created_at).toISOString().split('T')[0]));
  const totalMinutes = laps.reduce((acc, lap) => acc + durationToMinutes(lap.duration), 0);
  return days.size ? totalMinutes / days.size : 0;
}

function getPomodoroMinutes(laps: Lap[]): number {
  return laps
    .filter(lap => lap.type === 'pomodoro' || (lap.name && lap.name.toLowerCase().includes('pomo')))
    .reduce((acc, lap) => acc + durationToMinutes(lap.duration), 0);
}

function usePomodorosAllTime(userId: string | undefined): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!userId) {
      setTotal(0);
      return;
    }
    const fetchAllTime = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('study_laps')
        .select('pomodoros_completed')
        .eq('user_id', userId);
      if (!error && data) {
        const sum = data.reduce((acc: number, row: { pomodoros_completed?: number }) => acc + (row.pomodoros_completed || 0), 0);
        setTotal(sum);
      }
    };
    fetchAllTime();
  }, [userId]);

  return total;
}

const statCards: StatCard[] = [
  {
    label: 'Today',
    icon: <CalendarDays size={22} className="text-[var(--accent-primary)]" />, 
    value: s => formatMinutesToHHMM(s.todayMinutes),
    sub: s => `${s.doneToday} tasks`,
  },
  {
    label: 'This Week',
    icon: <TrendingUp size={22} className="text-[var(--accent-primary)]" />, 
    value: s => formatMinutesToHHMM(s.weekMinutes),
    sub: s => `${s.doneWeek} tasks`,
  },
  {
    label: 'This Month',
    icon: <CalendarDays size={22} className="text-[var(--accent-primary)]" />, 
    value: s => formatMinutesToHHMM(s.monthMinutes),
    sub: s => `${s.doneMonth} tasks`,
  },
  {
    label: 'This Year',
    icon: <CalendarDays size={22} className="text-[var(--accent-primary)]" />, 
    value: s => formatMinutesToHHMM(s.yearMinutes),
    sub: s => `${s.doneYear} tasks`,
  },
  
  {
    label: 'Per Day',
    icon: <Timer size={22} className="text-gray-400" />, 
    value: s => formatMinutesToHHMM(Math.round(s.avgPerDay)),
    sub: () => 'average',
  },
  {
    label: 'Max Streak',
    icon: <Flame size={22} className="text-orange-500" />, 
    value: s => s.longestStreak,
    sub: () => 'days',
  },
  {
    label: 'Pomodoro',
    icon: <CheckCircle2 size={22} className="text-red-500" />, 
    value: s => s.pomodoros ?? 0,
    sub: () => 'total',
  },
  {
    label: 'Tasks Done',
    icon: <ListChecks size={22} className="text-green-500" />, 
    value: s => s.totalTasks,
    sub: () => 'total',
  },
];

interface RootState {
  tasks: { tasks: Task[] };
  laps: { laps: Lap[] };
  auth: { user?: { id?: string } };
}

const Statistics = (): ReactElement => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { laps } = useSelector((state: RootState) => state.laps);
  const user = useSelector((state: RootState) => state.auth.user);
  const { isDemo, demoStats } = useDemoMode();

  const { doneToday, doneWeek, doneMonth, doneYear } = useTaskStats(tasks);
  const { todayMinutes, weekMinutes, monthMinutes, yearMinutes } = useLapStats(laps);
  const longestStreak = getLongestStreak(tasks);
  const avgPerDay = getAveragePerDay(laps);
  const totalTasks = tasks.filter((t: Task) => t.completed).length;
  const pomodoroMinutes = getPomodoroMinutes(laps);

  // Pomodoros completados hoy (de la base de datos)
  const { total: pomodorosToday } = usePomodorosToday(user?.id);

  // Pomodoros completados all time (de la base de datos)
  const pomodorosAllTime = usePomodorosAllTime(user?.id);

  const statData: StatData = {
    todayMinutes, weekMinutes, monthMinutes, yearMinutes,
    doneToday, doneWeek, doneMonth, doneYear,
    longestStreak, avgPerDay, totalTasks, pomodoros: pomodorosAllTime,
    pomodoroMinutes,
    pomodorosToday,
  };

  // Si es demo, usar demoStats
  if (isDemo) {
    return (
      <div className="stats-banner bg-[var(--bg-primary)] border border-[var(--border-primary)] py-3 px-6 mx-4 rounded-lg sticky top-0 z-50">
        <div className="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-2 w-full">
            {statCards.slice(0, 4).map((card, i) => (
              <div key={i} className="stat-item flex items-center gap-2 flex-shrink-0 min-w-0">
                <div className="flex-shrink-0">{card.icon}</div>
                <div className="flex flex-col min-w-0">
                  <div className="text-sm text-[var(--text-secondary)] font-medium truncate">{card.label}</div>
                  <div className="text-sm font-bold text-[var(--text-primary)] truncate">{card.value(demoStats)}</div>
                  <div className="text-sm text-[var(--text-secondary)] truncate">{card.sub(demoStats)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-2 w-full">
            {statCards.slice(4).map((card, i) => (
              <div key={i + 4} className="stat-item flex items-center gap-2 flex-shrink-0 min-w-0">
                <div className="flex-shrink-0">{card.icon}</div>
                <div className="flex flex-col min-w-0">
                  <div className="text-sm text-[var(--text-secondary)] font-medium truncate">{card.label}</div>
                  <div className="text-sm font-bold text-[var(--text-primary)] truncate">{card.value(demoStats)}</div>
                  <div className="text-sm text-[var(--text-secondary)] truncate">{card.sub(demoStats)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    );
  }

  return (
    <div className="stats-banner bg-[var(--bg-primary)] border border-[var(--border-primary)] py-3 px-2 rounded-lg sticky  mt-4">
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 w-full items-center justify-items-center">
        {statCards.map((card, i) => (
          <div key={i} className="stat-item flex flex-col items-center gap-1 flex-shrink-0 min-w-0 text-center">
            <div className="flex-shrink-0">{card.icon}</div>
            <div className="flex flex-col min-w-0">
              <div className="text-sm text-[var(--text-secondary)] font-medium truncate">{card.label}</div>
              <div className="text-sm font-bold text-[var(--text-primary)] truncate">{card.value(statData)}</div>
              <div className="text-sm text-[var(--text-secondary)] truncate">{card.sub(statData)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Statistics; 