import { useCallback, useMemo } from 'react';
import { isSameDay, parseISO } from 'date-fns';
import { useAppStore } from '@/store/appStore';

interface UseCalendarDataProps {
  currentDate: Date;
  selectedDate: Date;
}

export const useCalendarData = ({ currentDate, selectedDate }: UseCalendarDataProps) => {
  const { tasks } = useAppStore((state) => state.tasks);
  const laps = useAppStore((state) => state.laps.laps);

  const getDaysInMonth = useCallback((year: number, month: number) =>
    new Date(year, month + 1, 0).getDate(), []);

  const getFirstDayOfMonth = useCallback((year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday start
  }, []);

  const isToday = useCallback((date: Date) => isSameDay(date, new Date()), []);
  const isSelected = useCallback((date: Date) => isSameDay(date, selectedDate), [selectedDate]);

  const isCurrentWeek = useCallback((date: Date) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return date >= weekStart && date <= weekEnd;
  }, []);

  const getTasksForDate = useCallback(
    (date: Date) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      // Show tasks with deadline on this date OR tasks completed on this date
      return tasks.filter(task => {
        // Tasks with deadline on this date
        if (task.deadline) {
          const taskDate = new Date(task.deadline);
          taskDate.setHours(0, 0, 0, 0);
          if (isSameDay(parseISO(taskDate.toISOString()), parseISO(targetDate.toISOString()))) {
            return true;
          }
        }

        // Tasks completed on this date
        if (task.completed && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          if (isSameDay(parseISO(completedDate.toISOString()), parseISO(targetDate.toISOString()))) {
            return true;
          }
        }

        return false;
      });
    },
    [tasks]
  );

  const getStudiedHoursForDate = useCallback(
    (date: Date) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const totalMinutes = laps.reduce((total, lap) => {
        if (!lap.duration || lap.duration === "00:00:00") return total;

        const lapDate = new Date(lap.created_at);
        lapDate.setHours(0, 0, 0, 0);

        if (isSameDay(lapDate, targetDate)) {
          const [h, m] = lap.duration.split(":").map(Number);
          return total + h * 60 + m;
        }
        return total;
      }, 0);

      return (totalMinutes / 60).toFixed(1);
    },
    [laps]
  );

  const hasTasksWithDeadline = useCallback(
    (deadlineDate: Date) => {
      const targetDate = new Date(deadlineDate);
      targetDate.setHours(0, 0, 0, 0);

      return tasks.some(task => {
        if (!task.deadline) return false;
        const taskDeadline = new Date(task.deadline);
        taskDeadline.setHours(0, 0, 0, 0);
        return isSameDay(parseISO(taskDeadline.toISOString()), parseISO(targetDate.toISOString()));
      });
    },
    [tasks]
  );

  const getTasksWithDeadline = useCallback(
    (date: Date) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      return tasks.filter(task => {
        if (!task.deadline || task.completed) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return isSameDay(parseISO(taskDate.toISOString()), parseISO(targetDate.toISOString()));
      });
    },
    [tasks]
  );

  const getTasksForDayAndHour = useCallback(
    (day: Date, hour: number) => {
      const targetDate = new Date(day);
      targetDate.setHours(0, 0, 0, 0);

      return tasks.filter(task => {
        if (!task.deadline || task.completed) return false;
        const taskDate = new Date(task.deadline);
        const taskHour = taskDate.getHours();
        const taskDay = new Date(taskDate);
        taskDay.setHours(0, 0, 0, 0);

        // Match day first
        if (!isSameDay(parseISO(taskDay.toISOString()), parseISO(targetDate.toISOString()))) {
          return false;
        }

        // Match hour: tasks show in the hour they're scheduled for
        if (taskHour === hour) {
          return true;
        }

        // If task is at midnight (00:00) or 9 AM (default), show it at 9 AM
        if ((taskHour === 0 || taskHour === 9) && hour === 9) {
          return true;
        }

        return false;
      }).sort((a, b) => {
        // Sort by deadline time
        const timeA = new Date(a.deadline || 0).getTime();
        const timeB = new Date(b.deadline || 0).getTime();
        return timeA - timeB;
      });
    },
    [tasks]
  );

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const days = [];

    // Previous month
    for (let i = firstDay - 1; i >= 0; i--)
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        currentMonth: false,
      });

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        currentMonth: true,
        isToday: isToday(date),
        isSelected: isSelected(date),
      });
    }

    // Next month
    const total = Math.ceil((daysInMonth + firstDay) / 7) * 7;
    for (let i = 1; i <= total - days.length; i++)
      days.push({ date: new Date(year, month + 1, i), currentMonth: false });

    return days;
  }, [currentDate, getDaysInMonth, getFirstDayOfMonth, isToday, isSelected]);

  return {
    getDaysInMonth,
    getFirstDayOfMonth,
    isToday,
    isSelected,
    isCurrentWeek,
    getTasksForDate,
    getStudiedHoursForDate,
    hasTasksWithDeadline,
    getTasksWithDeadline,
    getTasksForDayAndHour,
    calendarDays,
  };
};