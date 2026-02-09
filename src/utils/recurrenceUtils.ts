/**
 * Recurrence helpers for weekly repeating tasks (e.g. university classes).
 * recurrence_weekdays: 0 = Sunday, 1 = Monday, ... 6 = Saturday (JS getDay()).
 */

export type TaskWithRecurrence = {
  id: string;
  deadline?: string | null;
  recurrence_type?: string | null;
  recurrence_weekdays?: number[] | null;
  start_at?: string | null;
  end_at?: string | null;
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

/** Parse timestamptz or "HH:MM" or "HH:MM:SS" to minutes since midnight */
export function timeToMinutes(t: string | null | undefined): number {
  if (!t || typeof t !== 'string') return 0;
  
  try {
    // Handle ISO date format: '2026-02-09T17:00:00+00:00'
    if (t.includes('T')) {
      const timePart = t.split('T')[1]; // '17:00:00+00:00'
      if (!timePart) return 0;
      
      // Remove timezone info if present
      const cleanTimePart = timePart.split('+')[0]?.split('-')[0];
      if (!cleanTimePart) return 0;
      
      const parts = cleanTimePart.split(':').map(Number);
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      
      // Validate hours and minutes
      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        console.warn('Invalid time values in ISO date:', t, { h, m });
        return 0;
      }
      
      return h * 60 + m;
    }
    
    // Handle timestamptz format: '2026-02-09 10:00:00+00'
    if (t.includes(' ')) {
      const timePart = t.split(' ')[1]; // '10:00:00+00'
      if (!timePart) return 0;
      
      // Remove timezone info if present
      const cleanTimePart = timePart.split('+')[0]?.split('-')[0];
      if (!cleanTimePart) return 0;
      
      const parts = cleanTimePart.split(':').map(Number);
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      
      // Validate hours and minutes
      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        console.warn('Invalid time values in timestamptz:', t, { h, m });
        return 0;
      }
      
      return h * 60 + m;
    }
    
    // Handle old format: "HH:MM" or "HH:MM:SS"
    const parts = t.trim().split(':').map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    
    // Validate hours and minutes
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      console.warn('Invalid time values in time string:', t, { h, m });
      return 0;
    }
    
    return h * 60 + m;
  } catch (error) {
    console.warn('Error parsing time:', t, error);
    return 0;
  }
}

/** Minutes between start_at and end_at (duration in minutes) */
export function getDurationMinutes(task: TaskWithRecurrence): number {
  const start = timeToMinutes(task.start_at);
  const end = timeToMinutes(task.end_at);
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
  
  // Validate date before using it
  if (isNaN(date.getTime())) {
    console.warn('Invalid date provided to getOccurrenceForDate:', date);
    return null;
  }

  const startM = timeToMinutes(task.start_at);
  const endM = timeToMinutes(task.end_at);
  const endMinutes = endM > startM ? endM : startM + 60;

  // Create new date instances properly to avoid mutation issues
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setHours(Math.floor(startM / 60), startM % 60, 0, 0);

  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  end.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

  // Validate the created dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('Invalid dates created in getOccurrenceForDate:', { start, end, originalDate: date, startM, endM });
    return null;
  }

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
  
  // Validate the parsed date
  if (isNaN(startDate.getTime())) {
    console.warn('Invalid startDate in getOccurrenceForDayAndHour:', occ.occurrenceStart);
    return null;
  }
  
  const startHour = startDate.getHours();
  // Show task in the row for its start hour
  if (hour === startHour) return occ;
  return null;
}
