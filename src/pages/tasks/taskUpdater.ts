import type { AnyAction, Dispatch } from "redux";
import { deleteTask, toggleTaskStatus, updateTaskAction } from "@/store/TaskActions";
import { getLocalTasks, setLocalTasks } from "@/types/taskStorage";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "@/types/taskStorage";

interface User {
    id: string;
    email?: string;
}

interface TaskUpdateParams {
    user: User | null;
    task: Task;
    dispatch: Dispatch<AnyAction>;
    supabase: SupabaseClient;
}

interface TaskDeleteParams {
    user: User | null;
    taskId: string;
    dispatch: Dispatch<AnyAction>;
}

/**
 * Updates the completion status of a task
 * @param params - Object containing user, task, dispatch, and supabase client
 */
export const updateTaskStatus = async ({ user, task, dispatch, supabase }: TaskUpdateParams): Promise<void> => {
    if (!user) {
        // Local
        const tasks = getLocalTasks().map(t =>
            t.id === task.id
                ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null }
                : t
        );
        setLocalTasks(tasks);
    } else {
        // Remote
        const newCompletedStatus = !task.completed;
        await dispatch(toggleTaskStatus(task.id) as unknown as AnyAction);
        try {
            const { error } = await supabase
                .from("tasks")
                .update({ 
                    completed: newCompletedStatus,
                    completed_at: newCompletedStatus ? new Date().toISOString() : null 
                })
                .eq("id", task.id);
            if (error) throw error;
        } catch (error) {
            // Revert the optimistic update if the API call fails
            await dispatch(toggleTaskStatus(task.id) as unknown as AnyAction);
            console.error("Error updating task:", error);
        }
    }
};

/**
 * Deletes a task
 * @param params - Object containing user, taskId, and dispatch
 */
export const deleteTaskHandler = async ({ user, taskId, dispatch }: TaskDeleteParams): Promise<void> => {
    if (!user) {
        const tasks = getLocalTasks().filter(t => t.id !== taskId);
        setLocalTasks(tasks);
    } else {
        await dispatch(deleteTask(taskId) as unknown as AnyAction);
    }
};

/**
 * Updates a task's details
 * @param params - Object containing user, task, dispatch, and supabase client
 */
export const updateTaskHandler = async ({ user, task, dispatch, supabase }: TaskUpdateParams): Promise<void> => {
    if (!user) {
        const tasks = getLocalTasks().map(t => (t.id === task.id ? task : t));
        setLocalTasks(tasks);
    } else {
        try {
            await dispatch(updateTaskAction(task) as unknown as AnyAction);
            await supabase.from("tasks").update(task).eq("id", task.id);
        } catch (error) {
            await dispatch(updateTaskAction(task) as unknown as AnyAction);
            console.error("Error updating task:", error);
        }
    }
}; 