import type { AppDispatch, RootState } from "@/store/store";
import { setTasks } from "@/store/actions/TaskActions";
import { addTaskSuccess, deleteTaskSuccess, updateTaskSuccess } from "@/store/slices/TaskSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import type { Task } from "@/types/taskStorage";
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from "@/utils/supabaseClient";
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
        };
        loadData();
    }, []);

    useEffect(() => {
        if (user) {
            const initializeTasks = async () => {
                try {
                    const { data, error } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('user_id', user.id);

                    if (error) throw error;
                    if (data) {
                        dispatch(setTasks(data));
                    }
                } catch (error) {
                    console.error('Error initializing tasks:', error);
                }
            };

            initializeTasks();
        } else {
            // If no user, use local tasks
            dispatch(setTasks(localTasks));
        }
    }, [user, dispatch, localTasks, supabase]);

    // Listen for storage changes
    useEffect(() => {
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
                (payload: RealtimePostgresChangesPayload<Task>) => {
                    // Evitar procesar el mismo evento múltiples veces
                    const eventId = (payload.new as Task | undefined)?.id ?? (payload.old as Task | undefined)?.id ?? 'unknown';
                    const eventKey = `${payload.eventType}-${eventId}-${Date.now()}`;
                    if (lastProcessedEvent === eventKey) return;
                    lastProcessedEvent = eventKey;

                    // Solo actualizar si el cambio no fue causado por nosotros
                    if (payload.eventType === 'INSERT' && payload.new && payload.new.user_id === user.id) {
                        dispatch(addTaskSuccess(payload.new));
                    } else if (payload.eventType === 'UPDATE' && payload.new && payload.new.user_id === user.id) {
                        dispatch(updateTaskSuccess(payload.new));
                    } else if (payload.eventType === 'DELETE' && payload.old && payload.old.user_id === user.id) {
                        dispatch(deleteTaskSuccess(payload.old.id as string));
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
            dispatch(setTasks(data)); 

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