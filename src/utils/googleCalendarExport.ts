import { Task } from '@/pages/tasks/taskStorage';

type CalendarTask = Task & {
  deadline?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  recurrence_type?: string | null;
  recurrence_weekdays?: number[] | null;
  difficulty?: string | null;
};

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: 'email' | 'popup';
      minutes: number;
    }[];
  };
  rrule?: string;
}

export interface GoogleCalendarConfig {
  clientId: string;
  apiKey: string;
  scopes: string;
}

/**
 * Convierte una tarea del sistema a un evento de Google Calendar
 */
export const taskToCalendarEvent = (task: CalendarTask): GoogleCalendarEvent | null => {
  const event: GoogleCalendarEvent = {
    summary: task.title,
    description: task.description || '',
  };

  const times = computeEventTimes(task);
  if (!times) {
    return null;
  }

  if (times.allDay) {
    event.start = { date: formatDate(times.start) };
    event.end = { date: formatDate(times.end) };
  } else {
    event.start = { dateTime: times.start.toISOString() };
    event.end = { dateTime: times.end.toISOString() };
  }

  const reminderMinutes = getReminderMinutesFromDifficulty(task.difficulty);
  if (reminderMinutes > 0) {
    event.reminders = {
      useDefault: false,
      overrides: [
        {
          method: 'popup',
          minutes: reminderMinutes,
        },
      ],
    };
  }

  // Añadir RRULE para recurrencias semanales si aplica
  const rrule = buildWeeklyRRule(task);
  if (rrule) {
    event.rrule = rrule;
  }

  // Añadir información adicional a la descripción
  const additionalInfo = [];
  if (task.assignment) {
    additionalInfo.push(`Assignment: ${task.assignment}`);
  }
  if (task.difficulty) {
    additionalInfo.push(`Difficulty: ${task.difficulty}`);
  }
  if (task.tags && task.tags.length > 0) {
    additionalInfo.push(`Tags: ${task.tags.join(', ')}`);
  }
  
  if (additionalInfo.length > 0) {
    const descriptionParts = [];
    if (event.description && event.description.trim().length > 0) {
      descriptionParts.push(event.description.trim());
    }
    descriptionParts.push(additionalInfo.join('\n'));
    event.description = descriptionParts.join('\n\n');
  }

  return event;
};

/**
 * Determina los minutos de recordatorio basados en la prioridad
 */
const getReminderMinutesFromDifficulty = (difficulty?: string): number => {
  switch ((difficulty || '').toLowerCase()) {
    case 'hard':
      return 60; // 1 hora antes
    case 'medium':
      return 1440; // 1 día antes
    case 'easy':
      return 10080; // 1 semana antes
    default:
      return 0;
  }
};

/**
 * Convierte múltiples tareas a eventos de Google Calendar
 */
export const tasksToCalendarEvents = (tasks: Task[]): GoogleCalendarEvent[] => {
  return tasks
    .filter(task => !task.completed)
    .map(task => taskToCalendarEvent(task as CalendarTask))
    .filter((event): event is GoogleCalendarEvent => event !== null);
};

interface ComputedTimes {
  start: Date;
  end: Date;
  allDay: boolean;
}

const computeEventTimes = (task: CalendarTask): ComputedTimes | null => {
  const startDateTime = parseDateTime(task.start_at);
  const endDateTime = parseDateTime(task.end_at);
  const deadlineDate = parseDateTime(task.deadline);

  if (startDateTime) {
    const start = startDateTime;
    const end = endDateTime && endDateTime > start
      ? endDateTime
      : addMinutes(start, 60);
    if (!isValidDate(start) || !isValidDate(end)) {
      return null;
    }
    return { start, end, allDay: false };
  }

  if (deadlineDate) {
    const hasTime = hasTimeComponent(task.deadline);
    if (hasTime) {
      const start = deadlineDate;
      const end = addMinutes(start, 60);
      if (!isValidDate(start) || !isValidDate(end)) {
        return null;
      }
      return { start, end, allDay: false };
    }

    // Evento de todo el día
    const start = startOfDay(deadlineDate);
    const end = addDays(start, 1);
    if (!isValidDate(start) || !isValidDate(end)) {
      return null;
    }
    return { start, end, allDay: true };
  }

  // Sin fechas válidas
  return null;
};

const parseDateTime = (value?: string | null): Date | null => {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Intentar analizar ISO completo primero
  const isoCandidate = trimmed.includes('T') ? trimmed : null;
  if (isoCandidate) {
    const date = new Date(isoCandidate);
    if (isValidDate(date)) {
      return date;
    }
  }

  // Intentar timestamptz "YYYY-MM-DD HH:MM:SS"
  if (trimmed.includes(' ')) {
    const normalized = trimmed.replace(' ', 'T');
    const date = new Date(normalized);
    if (isValidDate(date)) {
      return date;
    }
  }

  // Fecha simple "YYYY-MM-DD"
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const date = new Date(`${trimmed}T00:00:00Z`);
    if (isValidDate(date)) {
      return date;
    }
  }

  return null;
};

const hasTimeComponent = (value?: string | null): boolean => {
  if (!value) return false;
  return value.includes('T') && /T\d{2}:\d{2}/.test(value);
};

const addMinutes = (date: Date, minutes: number): Date => {
  const copy = new Date(date.getTime());
  copy.setMinutes(copy.getMinutes() + minutes);
  return copy;
};

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
};

const startOfDay = (date: Date): Date => {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]?.replace(/-/g, '') ?? '';
};

const parseDateOnly = (dateString: string): Date => {
  if (/^\d{8}$/.test(dateString)) {
    const year = Number(dateString.slice(0, 4));
    const month = Number(dateString.slice(4, 6)) - 1;
    const day = Number(dateString.slice(6, 8));
    return new Date(Date.UTC(year, month, day));
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(`${dateString}T00:00:00Z`);
  }

  return new Date(dateString);
};

const isValidDate = (date: Date): boolean => {
  return !Number.isNaN(date.getTime());
};

const buildWeeklyRRule = (task: CalendarTask): string | null => {
  if (task.recurrence_type !== 'weekly' || !Array.isArray(task.recurrence_weekdays) || task.recurrence_weekdays.length === 0) {
    return null;
  }

  const byDay = task.recurrence_weekdays
    .map((weekday) => WEEKDAY_MAP[weekday])
    .filter(Boolean)
    .join(',');

  if (!byDay) {
    return null;
  }

  return `FREQ=WEEKLY;BYDAY=${byDay}`;
};

const WEEKDAY_MAP: Record<number, string> = {
  0: 'SU',
  1: 'MO',
  2: 'TU',
  3: 'WE',
  4: 'TH',
  5: 'FR',
  6: 'SA',
};

/**
 * Genera un archivo ICS para importación manual a Google Calendar
 */
export const generateICSFile = (tasks: Task[]): string => {
  const events = tasksToCalendarEvents(tasks);
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniTracker//Export//EN',
    'CALSCALE:GREGORIAN',
  ];

  events.forEach(event => {
    icsContent.push('BEGIN:VEVENT');
    
    // UID único para el evento
    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@unitracker`;
    icsContent.push(`UID:${uid}`);
    
    // Timestamps
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    icsContent.push(`DTSTAMP:${now}Z`);
    
    // Fechas
    if (event.start?.dateTime) {
      const startDateTime = `${formatDateTimeForICS(event.start.dateTime)}Z`;
      const endDateTime = `${formatDateTimeForICS(event.end?.dateTime!)}Z`;
      icsContent.push(`DTSTART:${startDateTime}`);
      icsContent.push(`DTEND:${endDateTime}`);
    } else if (event.start?.date) {
      const startDate = event.start.date!;
      // Para eventos de todo el día, DTEND debe ser el día siguiente (estándar ICS)
      const startDateObj = parseDateOnly(startDate);
      const endDateObj = addDays(startDateObj, 1);
      const endDate = formatDate(endDateObj);
      icsContent.push(`DTSTART;VALUE=DATE:${startDate}`);
      icsContent.push(`DTEND;VALUE=DATE:${endDate}`);
    }

    if (event.rrule) {
      icsContent.push(`RRULE:${event.rrule}`);
    }
    
    // Título y descripción
    icsContent.push(`SUMMARY:${escapeICS(event.summary)}`);
    if (event.description) {
      icsContent.push(`DESCRIPTION:${escapeICS(event.description)}`);
    }
    
    // Recordatorios
    if (event.reminders && event.reminders.overrides) {
      event.reminders.overrides.forEach(reminder => {
        icsContent.push('BEGIN:VALARM');
        icsContent.push('ACTION:DISPLAY');
        icsContent.push(`TRIGGER:-PT${reminder.minutes}M`);
        icsContent.push('DESCRIPTION:Reminder');
        icsContent.push('END:VALARM');
      });
    }
    
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');
  
  return icsContent.join('\r\n');
};

/**
 * Formatea una fecha ISO para el formato ICS
 */
const formatDateTimeForICS = (isoString: string): string => {
  // Formato ICS: YYYYMMDDTHHMMSS (sin Z final, se añade externamente)
  // toISOString() ya termina en Z; se remueve para evitar duplicados al concatenar
  return isoString
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
    .replace(/Z$/, '');
};

/**
 * Escapa caracteres especiales para ICS
 */
const escapeICS = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n'); // Correcto: \n para saltos de línea en ICS
};

/**
 * Descarga el archivo ICS generado
 */
export const downloadICSFile = (tasks: Task[], filename?: string): void => {
  const icsContent = generateICSFile(tasks);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `unitracker-tasks-${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
