/**
 * Recurrence helpers for weekly repeating tasks (e.g. university classes).
 * recurrence_weekdays: 0 = Sunday, 1 = Monday, ... 6 = Saturday (JS getDay()).
 */

export type TaskWithRecurrence = {
  id: string;
  deadline?: string | null;
  recurrence_type?: string | null;
  recurrence_weekdays?: number[] | null;
  start_time?: string | null;
  end_time?: string | null;
  completed?: boolean;
  [key: string]: unknown;
};

export type CalendarOccurrence = {
  occurrenceStart: string; // ISO
  occurrenceEnd: string;   // ISO
};

/** True if task repeats weekly on specific weekdays */
export function isRecurringTask(task: TaskWithRecurrence): boolean {
  return (
    task.recurrence_type === 'weekly' &&
    Array.isArray(task.recurrence_weekdays) &&
    task.recurrence_weekdays.length > 0
  );
}

/** Parse "HH:MM" or "HH:MM:SS" to minutes since midnight */
export function timeToMinutes(t: string | null | undefined): number {
  if (!t || typeof t !== 'string') return 0;
  const parts = t.trim().split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  return h * 60 + m;
}

/** Minutes between start_time and end_time (duration in minutes) */
export function getDurationMinutes(task: TaskWithRecurrence): number {
  const start = timeToMinutes(task.start_time);
  const end = timeToMinutes(task.end_time);
  if (end <= start) return 60; // default 1 hour
  return end - start;
}

/** Get JS weekday for a date (0 = Sun, 1 = Mon, ... 6 = Sat) */
function getWeekday(d: Date): number {
  return d.getDay();
}

/** Check if a date matches this recurring task's weekdays */
export function dateMatchesRecurrence(task: TaskWithRecurrence, date: Date): boolean {
  const weekdays = task.recurrence_weekdays;
  if (!Array.isArray(weekdays) || weekdays.length === 0) return false;
  return weekdays.includes(getWeekday(date));
}

/**
 * For a recurring task and a given date (same day), build occurrence start/end as ISO strings.
 * Returns null if that date's weekday is not in recurrence_weekdays.
 */
export function getOccurrenceForDate(
  task: TaskWithRecurrence,
  date: Date
): CalendarOccurrence | null {
  if (!dateMatchesRecurrence(task, date)) return null;

  const startM = timeToMinutes(task.start_time);
  const endM = timeToMinutes(task.end_time);
  const endMinutes = endM > startM ? endM : startM + 60;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setHours(Math.floor(startM / 60), startM % 60, 0, 0);

  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  end.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

  return {
    occurrenceStart: start.toISOString(),
    occurrenceEnd: end.toISOString(),
  };
}

/**
 * Get occurrence that includes the given hour (hour is 0-23).
 * Returns the occurrence if this day matches and startHour <= hour < endHour (or single-hour slot at hour).
 */
export function getOccurrenceForDayAndHour(
  task: TaskWithRecurrence,
  day: Date,
  hour: number
): CalendarOccurrence | null {
  const occ = getOccurrenceForDate(task, day);
  if (!occ) return null;

  const startDate = new Date(occ.occurrenceStart);
  const startHour = startDate.getHours();
  // Show task in the row for its start hour
  if (hour === startHour) return occ;
  return null;
}
