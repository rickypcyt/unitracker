import { CheckCircle2, Clock, Flame, Timer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLaps, useTasksOnly } from '@/store/appStore';
import { supabase } from '@/utils/supabaseClient';

const durationToSeconds = (duration?: string | number | null): number => {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;
  if (/^\d+$/.test(duration)) return parseInt(duration, 10);
  const parts = duration.split(':');
  if (parts.length !== 3) return 0;
  return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
};

const formatHours = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  if (h >= 100) return `${h}h`;
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

function getLongestStreak(tasks: any[]): number {
  const completed = tasks
    .filter(t => t.completed && t.completed_at)
    .map(t => new Date(t.completed_at).setHours(0, 0, 0, 0))
    .sort((a, b) => a - b);
  if (completed.length === 0) return 0;
  let streak = 1, maxStreak = 1;
  for (let i = 1; i < completed.length; i++) {
    if (completed[i]! - completed[i - 1]! === 86400000) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else if (completed[i] !== completed[i - 1]) {
      streak = 1;
    }
  }
  return maxStreak;
}

const QuickStats = () => {
  const { user } = useAuth();
  const { laps } = useLaps();
  const tasks = useTasksOnly();

  const [pomodorosAllTime, setPomodorosAllTime] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setPomodorosAllTime(0);
      return;
    }
    const fetchAllTime = async () => {
      const { data, error } = await supabase
        .from('study_laps')
        .select('pomodoros_completed')
        .eq('user_id', user.id);
      if (!error && data) {
        const sum = data.reduce((acc: number, row: any) => acc + (row.pomodoros_completed || 0), 0);
        setPomodorosAllTime(sum);
      }
    };
    fetchAllTime();
  }, [user?.id]);

  const stats = useMemo(() => {
    const totalStudySeconds = (laps || []).reduce((acc: number, lap: any) => acc + durationToSeconds(lap.duration), 0);
    const tasksDone = tasks.filter(t => t.completed).length;
    const streak = getLongestStreak(tasks);
    return {
      pomodoros: pomodorosAllTime,
      studyTime: totalStudySeconds,
      streak,
      tasksDone,
    };
  }, [laps, tasks, pomodorosAllTime]);

  const cards = [
    {
      label: 'Pomodoros',
      value: stats.pomodoros.toString(),
      sub: 'total',
      icon: <Timer size={16} className="text-red-500" />,
      bg: 'bg-red-500/10',
    },
    {
      label: 'Study Time',
      value: formatHours(stats.studyTime),
      sub: 'total',
      icon: <Clock size={16} className="text-blue-500" />,
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Current Streak',
      value: stats.streak.toString(),
      sub: 'days',
      icon: <Flame size={16} className="text-orange-500" />,
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Tasks Done',
      value: stats.tasksDone.toString(),
      sub: 'total',
      icon: <CheckCircle2 size={16} className="text-green-500" />,
      bg: 'bg-green-500/10',
    },
  ];

  return (
    <div className="w-full dashboard-noise-card" style={{ padding: 'clamp(0.75rem, 0.6rem + 0.6vw, 1.25rem)' }}>
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 'clamp(0.375rem, 0.3rem + 0.4vw, 0.75rem)' }}>
        {cards.map(card => (
          <div key={card.label} className="dashboard-stat-card">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                {card.icon}
              </div>
              <span className="font-medium text-[var(--text-secondary)] uppercase tracking-wide" style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.75rem)' }}>
                {card.label}
              </span>
            </div>
            <div className="font-bold text-[var(--text-primary)]" style={{ fontSize: 'clamp(1rem, 0.85rem + 0.8vw, 1.5rem)' }}>
              {card.value}
            </div>
            <div className="text-[var(--text-secondary)]" style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.75rem)' }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickStats;
