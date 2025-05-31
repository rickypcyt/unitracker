import { AppDispatch, RootState } from "../store/store";
import { addTask as addTaskAction, fetchTasks } from "../store/actions/TaskActions";
import { addTaskSuccess, deleteTaskSuccess, updateTaskSuccess } from "../store/slices/TaskSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import { Task } from "../utils/taskStorage";
import { supabase } from "../config/supabaseClient";
import { toast } from "react-toastify";

interface User {
    id: string;
    email?: string;
}

interface NewTask {
    title: string;
    description?: string;
    deadline?: string;
    difficulty?: string;
    assignment?: string;
    priority?: number;
    tags?: string[];
}

interface TaskStorageHook {
    tasks: Task[];
    addTask: (newTask: NewTask) => Promise<Task | null>;
    syncLocalTasks: () => Promise<Task[] | null>;
    isAuthenticated: boolean;
}

/**
 * Custom hook for unified task management (local and remote)
 * @returns {TaskStorageHook} Task management functions and state
 */
export const useTaskStorage = (): TaskStorageHook => {
    const dispatch = useDispatch<AppDispatch>();
    const tasks = useSelector((state: RootState) => state.tasks.tasks);
    const [user, setUser] = useState<User | null>(null);
    const [localTasks, setLocalTasks] = useState<Task[]>(() => {
        const savedTasks = localStorage.getItem("localTasks");
        return savedTasks ? JSON.parse(savedTasks) : [];
    });

    // Save local tasks to localStorage whenever they change
    useEffect(() => {
        if (!user) {
            localStorage.setItem("localTasks", JSON.stringify(localTasks));
            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent('localTasksUpdated'));
        }
    }, [localTasks, user]);

    // Get user and load tasks on component mount
    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            
            if (user) {
                // Clear local tasks when user logs in
                localStorage.removeItem("localTasks");
                setLocalTasks([]);
                dispatch(fetchTasks() as any); // Type assertion needed for thunk actions
            }
        };
        loadData();

        // Listen for storage changes
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "localTasks") {
                const newTasks = e.newValue ? JSON.parse(e.newValue) : [];
                setLocalTasks(newTasks);
            }
        };

        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [dispatch]);

    // Subscribe to real-time changes
    useEffect(() => {
        if (!user) return;

        let lastProcessedEvent: string | null = null;

        const subscription = supabase
            .channel("tasks_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tasks",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload: any) => {
                    // Evitar procesar el mismo evento múltiples veces
                    const eventKey = `${payload.eventType}-${payload.new?.id || payload.old?.id}-${Date.now()}`;
                    if (lastProcessedEvent === eventKey) return;
                    lastProcessedEvent = eventKey;

                    // Solo actualizar si el cambio no fue causado por nosotros
                    if (payload.eventType === 'INSERT' && payload.new.user_id === user.id) {
                        dispatch(addTaskSuccess(payload.new));
                    } else if (payload.eventType === 'UPDATE' && payload.new.user_id === user.id) {
                        dispatch(updateTaskSuccess(payload.new));
                    } else if (payload.eventType === 'DELETE' && payload.old.user_id === user.id) {
                        dispatch(deleteTaskSuccess(payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, dispatch]);

    const addTask = async (newTask: NewTask): Promise<Task | null> => {
        if (!user) {
            // Handle local storage
            const localTask: Task = {
                ...newTask,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                completed: false,
                completed_at: null,
                activetask: false,
            };
            setLocalTasks((prevTasks) => [...prevTasks, localTask]);
            return localTask;
        } else {
            try {
                // Handle remote storage - remove id from the task data
                const { data, error } = await supabase
                    .from("tasks")
                    .insert([{ ...newTask, user_id: user.id }])
                    .select()
                    .single();

                if (error) throw error;

                // No necesitamos dispatch aquí porque la suscripción en tiempo real lo hará
                return data;
            } catch (error) {
                console.error("Error adding task:", error);
                toast.error("Failed to add task");
                return null;
            }
        }
    };

    const syncLocalTasks = async (): Promise<Task[] | null> => {
        if (!user || !localTasks.length) return null;

        try {
            const tasksToSync = localTasks.map(task => ({
                ...task,
                user_id: user.id,
                id: undefined // Let Supabase generate new IDs
            }));

            const { data, error } = await supabase
                .from("tasks")
                .insert(tasksToSync)
                .select();

            if (error) throw error;

            // Clear local tasks after successful sync
            localStorage.removeItem("localTasks");
            setLocalTasks([]);
            dispatch(fetchTasks() as any); // Type assertion needed for thunk actions

            return data;
        } catch (error) {
            console.error("Error syncing local tasks:", error);
            toast.error("Failed to sync local tasks");
            return null;
        }
    };

    return {
        tasks: user ? tasks : localTasks,
        addTask,
        syncLocalTasks,
        isAuthenticated: !!user
    };
}; 