import type { Task } from '@/schemas/task';

export type { Task };

export interface TaskStorage {
  getTasks(): Promise<Task[]>;
  saveTasks(tasks: Task[]): Promise<void>;
  getTask(id: string): Promise<Task | undefined>;
  addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Omit<Task, 'id'>>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  toggleTaskStatus(id: string): Promise<Task | undefined>;
}

declare global {
  interface Window {
    taskStorage: TaskStorage;
  }
}

export const getLocalTasks: () => Task[];
export const setLocalTasks: (tasks: Task[]) => void;
