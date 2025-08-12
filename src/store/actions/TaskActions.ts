import type { Task } from '../../types/taskStorage';

type DeleteTaskAction = { type: 'tasks/deleteTask'; payload: string };
type ToggleTaskStatusAction = { type: 'tasks/toggleStatus'; payload: string };
type UpdateTaskAction = { type: 'tasks/updateTask'; payload: Task };
type AddTaskAction = { type: 'tasks/addTask'; payload: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> };
type SetTasksAction = { type: 'tasks/setTasks'; payload: Task[] };

export const deleteTask = (taskId: string): DeleteTaskAction => ({
  type: 'tasks/deleteTask' as const,
  payload: taskId
});

export const toggleTaskStatus = (taskId: string): ToggleTaskStatusAction => ({
  type: 'tasks/toggleStatus' as const,
  payload: taskId
});

export const updateTask = (task: Task): UpdateTaskAction => ({
  type: 'tasks/updateTask' as const,
  payload: task
});

export const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): AddTaskAction => ({
  type: 'tasks/addTask' as const,
  payload: task
});

export const setTasks = (tasks: Task[]): SetTasksAction => ({
  type: 'tasks/setTasks' as const,
  payload: tasks
});

export type TaskAction =
  | ReturnType<typeof deleteTask>
  | ReturnType<typeof toggleTaskStatus>
  | ReturnType<typeof updateTask>
  | ReturnType<typeof addTask>
  | ReturnType<typeof setTasks>;
