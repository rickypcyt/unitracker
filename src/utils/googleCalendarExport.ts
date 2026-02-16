import { Task } from '@/pages/tasks/taskStorage';

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
}

export interface GoogleCalendarConfig {
  clientId: string;
  apiKey: string;
  scopes: string;
}

/**
 * Convierte una tarea del sistema a un evento de Google Calendar
 */
export const taskToCalendarEvent = (task: Task): GoogleCalendarEvent => {
  const event: GoogleCalendarEvent = {
    summary: task.title,
    description: task.description || '',
  };

  if (task.due_date) {
    const dueDate = new Date(task.due_date);
    
    // Si tiene hora específica, usar dateTime, sino usar date (todo el día)
    if (dueDate.getHours() > 0 || dueDate.getMinutes() > 0) {
      event.start = {
        dateTime: dueDate.toISOString(),
      };
      // Si es una tarea, asumir 1 hora de duración
      const endDate = new Date(dueDate);
      endDate.setHours(endDate.getHours() + 1);
      event.end = {
        dateTime: endDate.toISOString(),
      };
    } else {
      // Evento de todo el día
      event.start = {
        date: dueDate.toISOString().split('T')[0]!,
      };
      event.end = {
        date: dueDate.toISOString().split('T')[0]!,
      };
    }
  } else {
    // Sin fecha - usar fecha actual como placeholder
    const now = new Date();
    event.start = {
      dateTime: now.toISOString(),
    };
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 1);
    event.end = {
      dateTime: endTime.toISOString(),
    };
  }

  // Añadir recordatorios basados en la prioridad
  if (task.priority) {
    const reminderMinutes = getReminderMinutes(task.priority);
    if (reminderMinutes > 0) {
      event.reminders = {
        useDefault: false,
        overrides: [
          {
            method: 'popup' as const,
            minutes: reminderMinutes,
          },
        ],
      };
    }
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
    event.description = `${event.description || ''}\n\n${additionalInfo.join('\n')}`;
  }

  return event;
};

/**
 * Determina los minutos de recordatorio basados en la prioridad
 */
const getReminderMinutes = (priority: number): number => {
  switch (priority) {
    case 1: // Alta prioridad
      return 60; // 1 hora antes
    case 2: // Media prioridad
      return 1440; // 1 día antes
    case 3: // Baja prioridad
      return 10080; // 1 semana antes
    default:
      return 1440; // Por defecto 1 día antes
  }
};

/**
 * Convierte múltiples tareas a eventos de Google Calendar
 */
export const tasksToCalendarEvents = (tasks: Task[]): GoogleCalendarEvent[] => {
  return tasks
    .filter(task => !task.completed) // Solo exportar tareas no completadas
    .map(task => taskToCalendarEvent(task));
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
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z', '') + 'Z';
    icsContent.push(`DTSTAMP:${now}`);
    
    // Fechas
    if (event.start?.dateTime) {
      const startDateTime = formatDateTimeForICS(event.start.dateTime);
      const endDateTime = formatDateTimeForICS(event.end?.dateTime!);
      icsContent.push(`DTSTART:${startDateTime}`);
      icsContent.push(`DTEND:${endDateTime}`);
    } else if (event.start?.date) {
      const startDate = event.start.date!;
      const endDate = event.end?.date || event.start.date;
      icsContent.push(`DTSTART;VALUE=DATE:${startDate}`);
      icsContent.push(`DTEND;VALUE=DATE:${endDate}`);
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
  return isoString.replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z';
};

/**
 * Escapa caracteres especiales para ICS
 */
const escapeICS = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
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
