import { createAllDayEvent, createEvent } from '@dayflow/core';

import { Temporal } from 'temporal-polyfill';

interface Task {
  id: string | number;
  title: string;
  completed: boolean;
  deadline?: string;
  start_at?: string;
  end_at?: string;
  workspace_id?: string;
}

function createPlainDateTimeFromTimestamp(timestamp: string) {
  if (!timestamp) throw new Error('timestamp is required');

  const date = new Date(timestamp);
  return new Temporal.PlainDateTime(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
}

export function tasksToEvents(tasks: Task[]) {
  return tasks
    .filter(t => !t.completed && t.deadline) // solo tareas activas con fecha
    .map(task => {
      const eventTitle = task.title;
      
      // Evento con horario específico
      if (task.start_at && task.end_at) {
        const start = createPlainDateTimeFromTimestamp(task.start_at);
        const end = createPlainDateTimeFromTimestamp(task.end_at);
        
        return createEvent({
          id: String(task.id),
          title: eventTitle,
          start,
          end,
          ...(task.workspace_id && { calendarId: task.workspace_id }),
        });
      }

      // Evento de todo el día
      const allDayDate = new Date(task.deadline!);
      return createAllDayEvent(String(task.id), eventTitle, allDayDate);
    });
}
