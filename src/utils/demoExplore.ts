import { useSyncExternalStore } from 'react';

// "Let me look around first" mode: lets signed-out users try creating a temporary task.
// Tasks live in memory only, so they vanish on reload and never touch the database.
const KEY = 'demoExplore';

export interface DemoUserTask {
  id: string;
  title: string;
  assignment: string;
  workspace_id: string;
  completed: boolean;
  due_date: string;
  deadline: string;
  created_at: string;
  difficulty: string;
  completed_at: null;
}

let created: DemoUserTask[] = [];
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => created;

export const enableDemoExplore = () => {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {}
};

export const isDemoExplore = () => {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

export const addDemoUserTask = (input: { title: string; workspace_id: string; assignment: string }) => {
  const today = new Date().toISOString().slice(0, 10);
  created = [
    ...created,
    {
      id: `demo-task-user-${Date.now()}`,
      title: input.title,
      assignment: input.assignment,
      workspace_id: input.workspace_id,
      completed: false,
      due_date: today,
      deadline: today,
      created_at: today,
      difficulty: 'medium',
      completed_at: null,
    },
  ];
  listeners.forEach((l) => l());
};

export const useDemoUserTasks = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
