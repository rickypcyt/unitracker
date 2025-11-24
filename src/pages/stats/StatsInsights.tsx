import { Award, Calendar, Clock, Target, TrendingDown, TrendingUp } from 'lucide-react';

import { useLaps } from '@/store/appStore';
import { useMemo } from 'react';

const StatsInsights = () => {
  const { laps } = useLaps();

  // Calculate weekly trend separately to avoid nested hooks
  const weeklyTrend: 'up' | 'down' | 'neutral' = useMemo(() => {
    if (!laps || laps.length === 0) return 'neutral';
    
    const now = new Date();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeekMinutes = laps
      .filter(lap => new Date(lap.created_at) >= thisWeek)
      .reduce((acc, lap) => {
        const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
        return acc + minutes;
      }, 0);
    
    const lastWeekMinutes = laps
      .filter(lap => new Date(lap.created_at) >= lastWeek && new Date(lap.created_at) < thisWeek)
      .reduce((acc, lap) => {
        const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
        return acc + minutes;
      }, 0);
    
    if (thisWeekMinutes > lastWeekMinutes * 1.1) return 'up';
    if (thisWeekMinutes < lastWeekMinutes * 0.9) return 'down';
    return 'neutral';
  }, [laps]);

  const insights = useMemo(() => {
    if (!laps || laps.length === 0) {
      return {
        totalStudyTime: 0,
        averageDailyTime: 0,
        mostProductiveDay: '',
        streakDays: 0,
        weeklyTrend: 'neutral' as 'up' | 'down' | 'neutral',
        monthlyGoal: 0,
        monthlyProgress: 0
      };
    }

    // Calculate total study time
    const totalMinutes = laps.reduce((acc, lap) => {
      const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
      return acc + minutes;
    }, 0);

    // Calculate daily study times
    const dailyMinutes: Record<string, number> = {};
    laps.forEach(lap => {
      const date = new Date(lap.created_at).toISOString().split('T')[0];
      if (date) {
        const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
        dailyMinutes[date] = (dailyMinutes[date] || 0) + minutes;
      }
    });

    const dates = Object.keys(dailyMinutes).sort();
    const averageDailyTime = dates.length > 0 ? totalMinutes / dates.length : 0;

    // Find most productive day
    let mostProductiveDay = '';
    let maxMinutes = 0;
    Object.entries(dailyMinutes).forEach(([date, minutes]) => {
      if (minutes > maxMinutes) {
        maxMinutes = minutes;
        mostProductiveDay = date;
      }
    });

    // Calculate streak (consecutive days with study time)
    let streakDays = 0;
    const sortedDates = dates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
    
    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      if (!date) continue;
      
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (date === expectedDateStr && dailyMinutes[date] && dailyMinutes[date] > 0) {
        streakDays++;
      } else {
        break;
      }
    }

    // Calculate total study time
    const monthlyGoal = 20 * 60; // 20 hours in minutes
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyMinutes = laps
      .filter(lap => {
        const lapDate = new Date(lap.created_at);
        return lapDate.getMonth() === currentMonth && lapDate.getFullYear() === currentYear;
      })
      .reduce((acc, lap) => {
        const minutes = parseInt(lap.duration.split(':')[0]) * 60 + parseInt(lap.duration.split(':')[1]);
        return acc + minutes;
      }, 0);
    
    const monthlyProgress = Math.min((monthlyMinutes / monthlyGoal) * 100, 100);

    return {
      totalStudyTime: totalMinutes,
      averageDailyTime,
      mostProductiveDay,
      streakDays,
      weeklyTrend,
      monthlyGoal,
      monthlyProgress
    };
  }, [laps, weeklyTrend]);

  const formatMinutesToHM = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500 rotate-90" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 p-2 sm:p-4">
      <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
        </div>
        <div className="text-xs text-[var(--text-secondary)] mb-1">Total Time</div>
        <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
          {formatMinutesToHM(insights.totalStudyTime)}
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <Target className="w-4 h-4 text-[var(--accent-primary)]" />
        </div>
        <div className="text-xs text-[var(--text-secondary)] mb-1">Daily Average</div>
        <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
          {formatMinutesToHM(Math.round(insights.averageDailyTime))}
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
        </div>
        <div className="text-xs text-[var(--text-secondary)] mb-1">Best Day</div>
        <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
          {insights.mostProductiveDay ? formatDate(insights.mostProductiveDay) : 'None'}
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <Award className="w-4 h-4 text-[var(--accent-primary)]" />
        </div>
        <div className="text-xs text-[var(--text-secondary)] mb-1">Streak</div>
        <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
          {insights.streakDays} days
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center gap-1 mb-2">
          {getTrendIcon(insights.weeklyTrend)}
        </div>
        <div className="text-xs text-[var(--text-secondary)] mb-1">Weekly Trend</div>
        <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] capitalize">
          {insights.weeklyTrend === 'up' ? 'Up' : insights.weeklyTrend === 'down' ? 'Down' : 'Neutral'}
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <Target className="w-4 h-4 text-[var(--accent-primary)]" />
        </div>
        <div className="text-xs text-[var(--text-secondary)] mb-1">Monthly Goal</div>
        <div className="relative">
          <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
            {Math.round(insights.monthlyProgress)}%
          </div>
          <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1 mt-1">
            <div 
              className="bg-[var(--accent-primary)] h-1 rounded-full transition-all duration-300"
              style={{ width: `${insights.monthlyProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsInsights;
