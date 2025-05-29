// utils/taskUpdater.js
import { toggleTaskStatus, deleteTask, updateTask } from "../store/actions/TaskActions";
import { getLocalTasks, setLocalTasks } from "./taskStorage";

export const updateTaskStatus = async ({ user, task, dispatch, supabase }) => {
    if (!user) {
        // Local
        const tasks = getLocalTasks().map(t =>
            t.id === task.id
                ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null }
                : t
        );
        setLocalTasks(tasks);
    } else {
        // Remoto
        dispatch(toggleTaskStatus(task.id, !task.completed));
        try {
            const { error } = await supabase
                .from("tasks")
                .update({ completed: !task.completed })
                .eq("id", task.id);
            if (error) throw error;
        } catch (error) {
            dispatch(toggleTaskStatus(task.id, task.completed));
            console.error("Error updating task:", error);
        }
    }
};

export const deleteTaskHandler = async ({ user, taskId, dispatch }) => {
    if (!user) {
        const tasks = getLocalTasks().filter(t => t.id !== taskId);
        setLocalTasks(tasks);
    } else {
        dispatch(deleteTask(taskId));
    }
};

export const updateTaskHandler = async ({ user, task, dispatch, supabase }) => {
    if (!user) {
        const tasks = getLocalTasks().map(t => (t.id === task.id ? task : t));
        setLocalTasks(tasks);
    } else {
        try {
            await dispatch(updateTask(task));
            await supabase.from("tasks").update(task).eq("id", task.id);
        } catch (error) {
            await dispatch(updateTask(task));
            console.error("Error updating task:", error);
        }
    }
};
