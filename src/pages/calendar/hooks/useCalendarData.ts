import {
  getOccurrenceForDate,
  getOccurrenceForDayAndHour,
  isRecurringTask,
} from '@/utils/recurrenceUtils';
import { isSameDay, parseISO } from 'date-fns';
import { useCallback, useMemo } from 'react';

import type { Task } from '@/types/taskStorage';
import { useAppStore } from '@/store/appStore';

/** Task with optional occurrence range for calendar slots (recurring or one-off with duration) */
export type CalendarTask = Task & { occurrenceStart?: string; occurrenceEnd?: string };

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

      return tasks.filter(task => {
        // Recurring weekly: show on days that match recurrence_weekdays
        if (isRecurringTask(task) && !task.completed) {
          if (getOccurrenceForDate(task, targetDate)) return true;
        }

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
        if (isRecurringTask(task) && !task.completed && getOccurrenceForDate(task, targetDate))
          return true;
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

      const withDeadline = tasks.filter(task => {
        if (task.completed) return false;
        if (isRecurringTask(task) && getOccurrenceForDate(task, targetDate)) return true;
        
        // Include tasks with start_at and end_at
        if (task.start_at && task.end_at) {
          // For now, we'll show tasks with start/end times on their deadline date
          // This could be enhanced to show them on multiple days if needed
          if (task.deadline) {
            const taskDate = new Date(task.deadline);
            taskDate.setHours(0, 0, 0, 0);
            return isSameDay(parseISO(taskDate.toISOString()), parseISO(targetDate.toISOString()));
          }
          // If no deadline, we could show on today or selected date
          return isSameDay(targetDate, new Date());
        }
        
        // Legacy deadline behavior
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return isSameDay(parseISO(taskDate.toISOString()), parseISO(targetDate.toISOString()));
      });
      return withDeadline;
    },
    [tasks]
  );

  const getTasksForDayAndHour = useCallback(
    (day: Date, hour: number): CalendarTask[] => {
      const targetDate = new Date(day);
      targetDate.setHours(0, 0, 0, 0);

      const result: CalendarTask[] = [];

      for (const task of tasks) {
        if (task.completed) continue;

        if (isRecurringTask(task)) {
          const occ = getOccurrenceForDayAndHour(task, targetDate, hour);
          if (occ) {
            result.push({
              ...task,
              occurrenceStart: occ.occurrenceStart,
              occurrenceEnd: occ.occurrenceEnd,
            });
          }
          continue;
        }

        // Handle tasks with start_at and end_at (no deadline needed)
        if (task.start_at && task.end_at) {
          const startT = task.start_at.split(':').map(Number);
          const endT = task.end_at.split(':').map(Number);
          
          if (startT.length >= 2 && endT.length >= 2) {
            const startHour = startT[0] ?? 0;
            const endHour = endT[0] ?? 0;
            
            // Check if this task spans the current hour
            if (hour >= startHour && hour < endHour) {
              const start = new Date(targetDate);
              start.setHours(startHour, startT[1] ?? 0, 0, 0);
              const end = new Date(targetDate);
              end.setHours(endHour, endT[1] ?? 0, 0, 0);
              
              result.push({
                ...task,
                occurrenceStart: start.toISOString(),
                occurrenceEnd: end.toISOString(),
              });
            }
          }
          continue;
        }

        // Handle tasks with only deadline (legacy behavior)
        if (!task.deadline) continue;
        const taskDate = new Date(task.deadline);
        const taskHour = taskDate.getHours();
        const taskDay = new Date(taskDate);
        taskDay.setHours(0, 0, 0, 0);

        if (!isSameDay(parseISO(taskDay.toISOString()), parseISO(targetDate.toISOString())))
          continue;
        if (taskHour === hour || ((taskHour === 0 || taskHour === 9) && hour === 9)) {
          const start = new Date(task.deadline);
          const end = new Date(task.deadline);
          const timeStr = (t: string | null | undefined) => (t && typeof t === 'string' ? t : '');
          const startT = timeStr(task.start_at).split(':').map(Number);
          const endT = timeStr(task.end_at).split(':').map(Number);
          if (startT.length >= 2 && endT.length >= 2 && (endT[0] ?? 0) > (startT[0] ?? 0)) {
            start.setHours(startT[0] ?? 0, startT[1] ?? 0, 0, 0);
            end.setHours(endT[0] ?? 0, endT[1] ?? 0, 0, 0);
          } else {
            end.setHours(end.getHours() + 1, 0, 0, 0);
          }
          result.push({
            ...task,
            occurrenceStart: start.toISOString(),
            occurrenceEnd: end.toISOString(),
          });
        }
      }

      return result.sort((a, b) => {
        const timeA = (a.occurrenceStart ? new Date(a.occurrenceStart) : new Date(a.deadline || 0)).getTime();
        const timeB = (b.occurrenceStart ? new Date(b.occurrenceStart) : new Date(b.deadline || 0)).getTime();
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