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
  { id: 'demo-ws-1', name: 'University (demo)' },
  { id: 'demo-ws-2', name: 'Work (demo)' },
];

export const demoAssignments = [
  { id: 'demo-assignment-a', name: 'Advanced Mathematics (demo)', workspace_id: 'demo-ws-1' },
  { id: 'demo-assignment-b', name: 'Web Project (demo)', workspace_id: 'demo-ws-2' },
];

export const demoTasks = [
  { id: 'demo-task-1', title: 'Solve calculus exercises (demo)', assignment: 'demo-assignment-a', workspace_id: 'demo-ws-1', completed: false, due_date: todayStr, created_at: todayStr, difficulty: 'medium', completed_at: null },
  { id: 'demo-task-2', title: 'Review theorems (demo)', assignment: 'demo-assignment-a', workspace_id: 'demo-ws-1', completed: true, due_date: yesterdayStr, created_at: yesterdayStr, difficulty: 'easy', completed_at: yesterdayStr },
  { id: 'demo-task-3', title: 'Implement REST API (demo)', assignment: 'demo-assignment-b', workspace_id: 'demo-ws-2', completed: false, due_date: tomorrowStr, created_at: tomorrowStr, difficulty: 'hard', completed_at: null },
];

export const demoNotes = [
  { id: 'demo-note-1', title: 'Important formulas (demo)', assignment: 'demo-assignment-a', description: 'Integration by parts: ∫u dv = uv - ∫v du. Chain rule for derivatives.', date: todayStr },
  { id: 'demo-note-2', title: 'Client meeting (demo)', assignment: 'demo-assignment-b', description: 'Discuss requirements for new payment module. Due: next Friday.', date: yesterdayStr },
  { id: 'demo-note-3', title: 'Design ideas (demo)', assignment: 'demo-assignment-a', description: 'Research design patterns to improve system architecture. Consider MVC and microservices.', date: todayStr },
];

export const demoSessions = [
  { id: 'demo-session-1', name: 'Math Study (demo)', started_at: todayStr + 'T09:00:00', ended_at: todayStr + 'T10:30:00', duration: '01:30:00', tasks_completed: 2, pomodoros_completed: 3 },
  { id: 'demo-session-2', name: 'Web Programming (demo)', started_at: yesterdayStr + 'T14:00:00', ended_at: yesterdayStr + 'T15:00:00', duration: '01:00:00', tasks_completed: 1, pomodoros_completed: 2 },
  { id: 'demo-session-3', name: 'Exam preparation (demo)', started_at: format(addDays(today, -7)) + 'T16:00:00', ended_at: format(addDays(today, -7)) + 'T18:00:00', duration: '02:00:00', tasks_completed: 3, pomodoros_completed: 4 },
  { id: 'demo-session-4', name: 'Code debugging (demo)', started_at: format(addDays(today, -3)) + 'T11:00:00', ended_at: format(addDays(today, -3)) + 'T12:30:00', duration: '01:30:00', tasks_completed: 2, pomodoros_completed: 3 },
  { id: 'demo-session-5', name: 'Framework research (demo)', started_at: format(addDays(today, -5)) + 'T08:00:00', ended_at: format(addDays(today, -5)) + 'T09:00:00', duration: '01:00:00', tasks_completed: 1, pomodoros_completed: 2 },
];

export const demoHabits = [
  { 
    id: 'demo-habit-1', 
    name: 'Study', 
    description: 'Study for 1 hour every morning before breakfast', 
    frequency: 'daily', 
    target_count: 7, 
    current_count: 5, 
    color: '#3B82F6', 
    icon: '📚', 
    workspace_id: 'demo-ws-1', 
    created_at: format(addDays(today, -7)), 
    completed_dates: [format(addDays(today, -2)), format(addDays(today, -1)), todayStr],
    user_id: 'demo-user',
    completions: {
      [format(addDays(today, -2))]: true,
      [format(addDays(today, -1))]: true,
      [todayStr]: true
    }
  },
  { 
    id: 'demo-habit-2', 
    name: 'Exercise', 
    description: 'Take a 15-minute break every 2 hours of study', 
    frequency: 'daily', 
    target_count: 5, 
    current_count: 3, 
    color: '#10B981', 
    icon: '🏃', 
    workspace_id: 'demo-ws-1', 
    created_at: format(addDays(today, -5)), 
    completed_dates: [yesterdayStr, todayStr],
    user_id: 'demo-user',
    completions: {
      [yesterdayStr]: true,
      [todayStr]: true
    }
  },
  { 
    id: 'demo-habit-3', 
    name: 'Code', 
    description: 'Review and refactor code for 30 minutes daily', 
    frequency: 'daily', 
    target_count: 7, 
    current_count: 4, 
    color: '#8B5CF6', 
    icon: '💻', 
    workspace_id: 'demo-ws-2', 
    created_at: format(addDays(today, -6)), 
    completed_dates: [format(addDays(today, -3)), format(addDays(today, -1)), todayStr],
    user_id: 'demo-user',
    completions: {
      [format(addDays(today, -3))]: true,
      [format(addDays(today, -1))]: true,
      [todayStr]: true
    }
  },
  { 
    id: 'demo-habit-4', 
    name: 'Project', 
    description: 'Plan weekly tasks and goals every Sunday', 
    frequency: 'weekly', 
    target_count: 4, 
    current_count: 2, 
    color: '#F59E0B', 
    icon: '📋', 
    workspace_id: 'demo-ws-2', 
    created_at: format(addDays(today, -14)), 
    completed_dates: [format(addDays(today, -7)), format(addDays(today, -14))],
    user_id: 'demo-user',
    completions: {
      [format(addDays(today, -7))]: true,
      [format(addDays(today, -14))]: true
    }
  },
  { 
    id: 'demo-habit-5', 
    name: 'Reading', 
    description: 'Read 2 technical articles per week', 
    frequency: 'weekly', 
    target_count: 8, 
    current_count: 5, 
    color: '#EF4444', 
    icon: '📖', 
    workspace_id: 'demo-ws-1', 
    created_at: format(addDays(today, -21)), 
    completed_dates: [format(addDays(today, -7)), format(addDays(today, -3)), todayStr],
    user_id: 'demo-user',
    completions: {
      [format(addDays(today, -7))]: true,
      [format(addDays(today, -3))]: true,
      [todayStr]: true
    }
  }
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