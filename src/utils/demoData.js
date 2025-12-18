// Demo data for unauthenticated users

// Utilidades para fechas relativas
const today = new Date();
const format = (d) => d.toISOString().split('T')[0];
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const todayStr = format(today);
const yesterdayStr = format(addDays(today, -1));
const tomorrowStr = format(addDays(today, 1));

export const demoWorkspaces = [
  { id: 'demo-ws-1', name: 'Demo Workspace 1' },
  { id: 'demo-ws-2', name: 'Demo Workspace 2' },
];

export const demoAssignments = [
  { id: 'demo-assignment-a', name: 'Demo Assignment A', workspace_id: 'demo-ws-1' },
  { id: 'demo-assignment-b', name: 'Demo Assignment B', workspace_id: 'demo-ws-2' },
];

export const demoTasks = [
  { id: 'demo-task-1', title: 'Demo Task Today', assignment: 'Demo Assignment A', workspace_id: 'demo-ws-1', completed: false, due_date: todayStr, created_at: todayStr, difficulty: 'medium', completed_at: null },
  { id: 'demo-task-2', title: 'Demo Task Yesterday', assignment: 'Demo Assignment A', workspace_id: 'demo-ws-1', completed: true, due_date: yesterdayStr, created_at: yesterdayStr, difficulty: 'easy', completed_at: yesterdayStr },
  { id: 'demo-task-3', title: 'Demo Task Tomorrow', assignment: 'Demo Assignment B', workspace_id: 'demo-ws-2', completed: false, due_date: tomorrowStr, created_at: tomorrowStr, difficulty: 'hard', completed_at: null },
];

export const demoNotes = [
  { id: 'demo-note-1', title: 'Demo Note Today', assignment: 'Demo Assignment A', description: 'This is a demo note for Assignment A.', date: todayStr },
  { id: 'demo-note-2', title: 'Demo Note Yesterday', assignment: 'Demo Assignment B', description: 'This is a demo note for Assignment B.', date: yesterdayStr },
  { id: 'demo-note-3', title: 'Long Lorem Ipsum Note', assignment: 'Demo Assignment A', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc ut laoreet dictum, massa erat cursus enim, nec dictum ex enim eu sem. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam euismod, urna eu tincidunt consectetur, nisi nisl aliquam enim, nec dictum ex enim eu sem. Proin euismod, urna eu tincidunt consectetur, nisi nisl aliquam enim, nec dictum ex enim eu sem.', date: todayStr },
];

export const demoSessions = [
  { id: 'demo-session-1', name: 'Demo Study Session Today', started_at: todayStr + 'T09:00:00', ended_at: todayStr + 'T10:30:00', duration: '01:30:00', tasks_completed: 2, pomodoros_completed: 3 },
  { id: 'demo-session-2', name: 'Demo Study Session Yesterday', started_at: yesterdayStr + 'T14:00:00', ended_at: yesterdayStr + 'T15:00:00', duration: '01:00:00', tasks_completed: 1, pomodoros_completed: 2 },
  { id: 'demo-session-3', name: 'Demo Study Session Last Week', started_at: format(addDays(today, -7)) + 'T16:00:00', ended_at: format(addDays(today, -7)) + 'T18:00:00', duration: '02:00:00', tasks_completed: 3, pomodoros_completed: 4 },
  { id: 'demo-session-4', name: 'Demo Study Session 3 Days Ago', started_at: format(addDays(today, -3)) + 'T11:00:00', ended_at: format(addDays(today, -3)) + 'T12:30:00', duration: '01:30:00', tasks_completed: 2, pomodoros_completed: 3 },
  { id: 'demo-session-5', name: 'Demo Study Session 5 Days Ago', started_at: format(addDays(today, -5)) + 'T08:00:00', ended_at: format(addDays(today, -5)) + 'T09:00:00', duration: '01:00:00', tasks_completed: 1, pomodoros_completed: 2 },
];

// Demo StatData completo para evitar NaN
export const demoStats = {
  todayMinutes: 90,
  weekMinutes: 420,
  monthMinutes: 1800,
  yearMinutes: 12000,
  doneToday: 2,
  doneWeek: 7,
  doneMonth: 20,
  doneYear: 100,
  longestStreak: 4,
  avgPerDay: 60,
  totalTasks: 25,
  pomodoros: 15,
  pomodoroMinutes: 300,
  pomodorosToday: 3,
}; 