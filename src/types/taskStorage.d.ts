export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  deadline?: string; // Alias de due_date para compatibilidad
  priority?: number;
  tags?: string[];
  user_id?: string;
  workspace_id?: string;
  activetask?: boolean;
  difficulty?: string;
  assignment?: string;
  status?: string; // Añadido para el nuevo sistema de estados
}

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
