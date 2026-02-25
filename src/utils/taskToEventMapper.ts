import { createAllDayEvent, createEvent } from '@dayflow/core';

import { Temporal } from 'temporal-polyfill';

interface Task {
  id: string | number;
  title: string;
  completed: boolean;
  deadline?: string | null;
  due_date?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  workspace_id?: string | null;
}

function normalizeTimestamp(timestamp: string) {
  let normalized = timestamp.trim();

  if (normalized.includes(' ')) {
    normalized = normalized.replace(' ', 'T');
  }

  if (/([+-]\d{2})$/.test(normalized)) {
    normalized = `${normalized}:00`;
  }

  return normalized;
}

function createPlainDateTimeFromTimestamp(timestamp: string) {
  if (!timestamp) throw new Error('timestamp is required');

  const date = new Date(normalizeTimestamp(timestamp));
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
  return tasks.flatMap((task) => {
    if (task.completed) return [];

    const deadline = task.deadline ?? task.due_date ?? undefined;
    const hasSchedule = Boolean(task.start_at && task.end_at);

    if (!deadline && !hasSchedule) return [];

    const eventTitle = task.title;
    const calendarMeta = task.workspace_id ? { calendarId: task.workspace_id } : {};

    if (hasSchedule) {
      try {
        const start = createPlainDateTimeFromTimestamp(task.start_at!);
        const end = createPlainDateTimeFromTimestamp(task.end_at!);

        return [
          createEvent({
            id: String(task.id),
            title: eventTitle,
            start,
            end,
            ...calendarMeta,
          }),
        ];
      } catch (error) {
        console.warn('DayFlow: failed to convert task schedule to event, falling back to all-day', {
          taskId: task.id,
          error,
        });
      }
    }

    if (!deadline) return [];

    const allDayDate = new Date(deadline);
    if (Number.isNaN(allDayDate.valueOf())) return [];

    return [createAllDayEvent(String(task.id), eventTitle, allDayDate)];
  });
}
