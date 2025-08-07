import type { Task } from '../../types/taskStorage';

export const deleteTask = (taskId: string) => ({
  type: 'tasks/deleteTask' as const,
  payload: taskId
});

export const toggleTaskStatus = (taskId: string) => ({
  type: 'tasks/toggleStatus' as const,
  payload: taskId
});

export const updateTask = (task: Task) => ({
  type: 'tasks/updateTask' as const,
  payload: task
});

export const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => ({
  type: 'tasks/addTask' as const,
  payload: task
});

export const setTasks = (tasks: Task[]) => ({
  type: 'tasks/setTasks' as const,
  payload: tasks
});

export type TaskAction =
  | ReturnType<typeof deleteTask>
  | ReturnType<typeof toggleTaskStatus>
  | ReturnType<typeof updateTask>
  | ReturnType<typeof addTask>
  | ReturnType<typeof setTasks>;
