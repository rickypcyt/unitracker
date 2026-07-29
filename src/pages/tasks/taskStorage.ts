import type { Task } from '@/schemas/task';

export type { Task };

/**
 * Retrieves tasks from localStorage
 * @returns Array of tasks from localStorage or empty array if none exist
 */
export const getLocalTasks = (): Task[] => 
    JSON.parse(localStorage.getItem("localTasks") || "[]");

/**
 * Saves tasks to localStorage
 * @param tasks - Array of tasks to save
 */
export const setLocalTasks = (tasks: Task[]): void => 
    localStorage.setItem("localTasks", JSON.stringify(tasks)); 