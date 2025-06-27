/**
 * Types for task storage
 */
export interface Task {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    completed_at: string | null;
    created_at?: string;
    updated_at?: string;
    due_date?: string;
    priority?: number;
    tags?: string[];
    user_id?: string;
    activetask?: boolean;
    difficulty?: string;
    assignment?: string;
}

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