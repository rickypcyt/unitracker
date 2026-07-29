import type { Task } from '@/types/taskStorage';
import type { Lap } from '@/types/lap';
import type { Workspace } from '@/types/workspace';

// -------------------------
// CSV helpers
// -------------------------

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getTimestamp(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

// -------------------------
// Tasks CSV
// -------------------------

export function exportTasksCSV(tasks: Task[]): string {
  const headers = [
    'ID', 'Title', 'Description', 'Completed', 'Completed At',
    'Created At', 'Due Date', 'Priority', 'Tags', 'Assignment',
    'Difficulty', 'Status', 'Workspace ID', 'Recurrence Type',
    'Recurrence Weekdays', 'Start At', 'End At',
  ];

  const rows = tasks.map(t => [
    t.id, t.title, t.description ?? '', t.completed ? 'yes' : 'no',
    t.completed_at ?? '', t.created_at ?? '', t.due_date ?? t.deadline ?? '',
    t.priority ?? '', (t.tags ?? []).join(';'), t.assignment ?? '',
    t.difficulty ?? '', t.status ?? '', t.workspace_id ?? '',
    t.recurrence_type ?? '', (t.recurrence_weekdays ?? []).join(';'),
    t.start_at ?? '', t.end_at ?? '',
  ]);

  return arrayToCSV(headers, rows);
}

export function downloadTasksCSV(tasks: Task[]): void {
  const csv = exportTasksCSV(tasks);
  downloadBlob(csv, `unitracker-tasks-${getTimestamp()}.csv`, 'text/csv');
}

// -------------------------
// Sessions/Laps CSV
// -------------------------

export function exportSessionsCSV(laps: Lap[]): string {
  const headers = [
    'ID', 'User ID', 'Created At', 'Started At', 'Ended At',
    'Duration', 'Session Number', 'Name', 'Description',
    'Tasks Completed', 'Pomodoros Completed', 'Assignment',
    'Focus Score', 'Productivity Rating', 'Type',
    'Subject ID', 'Subject Name', 'Subject Color',
  ];

  const rows = laps.map(l => [
    l.id, l.user_id, l.created_at, l.started_at ?? '', l.ended_at ?? '',
    l.duration, l.session_number, l.name, l.description ?? '',
    l.tasks_completed, l.pomodoros_completed ?? '', l.session_assignment ?? '',
    l.focus_score ?? '', l.productivity_rating ?? '', l.type ?? '',
    l.subject_id ?? '', l.subject_name ?? '', l.subject_color ?? '',
  ]);

  return arrayToCSV(headers, rows);
}

export function downloadSessionsCSV(laps: Lap[]): void {
  const csv = exportSessionsCSV(laps);
  downloadBlob(csv, `unitracker-sessions-${getTimestamp()}.csv`, 'text/csv');
}

// -------------------------
// Stats CSV
// -------------------------

export interface StatsExportData {
  totalStudyMinutes: number;
  totalTasksCompleted: number;
  totalPomodoros: number;
  longestStreak: number;
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  yearMinutes: number;
  doneToday: number;
  doneWeek: number;
  doneMonth: number;
  doneYear: number;
  avgPerDay: number;
  pomodoroMinutes: number;
}

export function exportStatsCSV(data: StatsExportData): string {
  const headers = ['Metric', 'Value'];
  const rows: (string | number)[][] = [
    ['Total Study Minutes', data.totalStudyMinutes],
    ['Today Study Minutes', data.todayMinutes],
    ['Week Study Minutes', data.weekMinutes],
    ['Month Study Minutes', data.monthMinutes],
    ['Year Study Minutes', data.yearMinutes],
    ['Total Tasks Completed', data.totalTasksCompleted],
    ['Tasks Done Today', data.doneToday],
    ['Tasks Done This Week', data.doneWeek],
    ['Tasks Done This Month', data.doneMonth],
    ['Tasks Done This Year', data.doneYear],
    ['Total Pomodoros', data.totalPomodoros],
    ['Pomodoro Minutes', data.pomodoroMinutes],
    ['Longest Streak (days)', data.longestStreak],
    ['Avg Per Day', data.avgPerDay],
  ];

  return arrayToCSV(headers, rows);
}

export function downloadStatsCSV(data: StatsExportData): void {
  const csv = exportStatsCSV(data);
  downloadBlob(csv, `unitracker-stats-${getTimestamp()}.csv`, 'text/csv');
}

// -------------------------
// Workspaces CSV
// -------------------------

export function exportWorkspacesCSV(workspaces: Workspace[]): string {
  const headers = ['ID', 'Name', 'Icon', 'User ID', 'Created At'];
  const rows = workspaces.map(w => [
    w.id, w.name, w.icon ?? '', w.user_id ?? '', (w as any).created_at ?? '',
  ]);
  return arrayToCSV(headers, rows);
}

export function downloadWorkspacesCSV(workspaces: Workspace[]): void {
  const csv = exportWorkspacesCSV(workspaces);
  downloadBlob(csv, `unitracker-workspaces-${getTimestamp()}.csv`, 'text/csv');
}
