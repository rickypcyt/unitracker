import type { AppDispatch, RootState } from "@/store/store";
import { addTaskSuccess, deleteTaskSuccess, updateTaskSuccess } from "@/store/slices/TaskSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Task } from "@/types/taskStorage";
import { setTasks } from "@/store/actions/TaskActions";
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

// ---- Lightweight validation and utilities for local task handling ----
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

// Normalize arbitrary input into a Task with safe defaults. Returns null if invalid.
const normalizeLocalTask = (raw: Record<string, unknown>): Task | null => {
    if (!isPlainObject(raw) || typeof (raw as any).title !== 'string') return null;

    const nowIso = new Date().toISOString();
    const id = typeof (raw as any).id === 'string' && (raw as any).id.trim() ? (raw as any).id : generateLocalId();

    return {
        id,
        title: String((raw as any).title).slice(0, 500),
        description: typeof (raw as any).description === 'string' ? String((raw as any).description).slice(0, 5000) : undefined,
        deadline: typeof (raw as any).deadline === 'string' ? (raw as any).deadline : undefined,
        difficulty: typeof (raw as any).difficulty === 'string' ? (raw as any).difficulty : undefined,
        assignment: typeof (raw as any).assignment === 'string' ? (raw as any).assignment : undefined,
        priority: typeof (raw as any).priority === 'number' ? (raw as any).priority : undefined,
        tags: Array.isArray((raw as any).tags) ? (raw as any).tags.filter((t: any) => typeof t === 'string').slice(0, 50) : undefined,
        created_at: typeof (raw as any).created_at === 'string' ? (raw as any).created_at : nowIso,
        completed: typeof (raw as any).completed === 'boolean' ? (raw as any).completed : false,
        completed_at: typeof (raw as any).completed_at === 'string' || (raw as any).completed_at === null ? (raw as any).completed_at : null,
        activetask: typeof (raw as any).activetask === 'boolean' ? (raw as any).activetask : false,
    } as Task;
};

const validateTaskArray = (value: unknown): Task[] => {
    if (!Array.isArray(value)) return [] as Task[];
    const normalized: Task[] = [];
    for (const item of value) {
        const t = normalizeLocalTask(item);
        if (t) normalized.push(t);
    }
    return normalized;
};

const generateLocalId = (): string => {
    try {
        if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
            return (crypto as any).randomUUID();
        }
    } catch {}
    // Fallback with time + random
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

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
        if (!savedTasks) return [];
        try {
            const parsed = JSON.parse(savedTasks);
            const valid = validateTaskArray(parsed);
            // If parsing succeeds but yields invalid content, clear corrupted storage
            if (!valid.length && parsed && Array.isArray(parsed) && parsed.length) {
                localStorage.removeItem("localTasks");
            }
            return valid;
        } catch {
            // Corrupted JSON, clear to avoid crashes
            localStorage.removeItem("localTasks");
            return [];
        }
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
                if (!e.newValue) {
                    setLocalTasks([]);
                    return;
                }
                try {
                    const parsed = JSON.parse(e.newValue);
                    setLocalTasks(validateTaskArray(parsed));
                } catch {
                    // Ignore corrupted updates
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [dispatch]);

    // Subscribe to real-time changes (only when tab is visible to reduce resource usage)
    useEffect(() => {
        if (!user) return;

        let channel: ReturnType<typeof supabase.channel> | null = null;

        const handlePayload = (payload: RealtimePostgresChangesPayload<Task>) => {
                    // Actualizar inmediatamente en función del tipo de evento
                    if (payload.eventType === 'INSERT' && payload.new && (payload.new as any).user_id === user.id) {
                        dispatch(addTaskSuccess(payload.new));
                        return;
                    }

                    if (payload.eventType === 'UPDATE' && payload.new && (payload.new as any).user_id === user.id) {
                        dispatch(updateTaskSuccess(payload.new));
                        return;
                    }

                    if (payload.eventType === 'DELETE') {
                        const oldRecord = payload.old as Partial<Task> | null;
                        const deletedId = oldRecord && (oldRecord as any).id;

                        // Si Supabase tiene REPLICA IDENTITY FULL activado, old tendrá el id
                        if (deletedId) {
                            dispatch(deleteTaskSuccess(deletedId as string));
                            return;
                        }

                        // Fallback: si no recibimos old (no hay REPLICA IDENTITY FULL), rehacer fetch para mantener el estado consistente
                        (async () => {
                            try {
                                const { data, error } = await supabase
                                    .from('tasks')
                                    .select('*')
                                    .eq('user_id', user.id);
                                if (!error && data) {
                                    dispatch(setTasks(data));
                                }
                            } catch (e) {
                                // no-op
                            }
                        })();
                    }
        };

        const subscribe = () => {
            if (channel) return;
            channel = supabase
                .channel("tasks_changes")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "tasks",
                        filter: `user_id=eq.${user.id}`,
                    },
                    handlePayload
                )
                .subscribe();
        };

        const unsubscribe = () => {
            if (channel) {
                channel.unsubscribe();
                channel = null;
            }
        };

        // Subscribe only when visible; handle offline/online to save resources
        if (typeof document !== 'undefined') {
            if (document.visibilityState === 'visible') {
                subscribe();
                // Quick resync to ensure we didn't miss events while hidden
                (async () => {
                    try {
                        const { data, error } = await supabase
                            .from('tasks')
                            .select('*')
                            .eq('user_id', user.id);
                        if (!error && data) {
                            dispatch(setTasks(data));
                        }
                    } catch {}
                })();
            }

            const onVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    subscribe();
                    // Resync on regain of visibility to catch any missed changes
                    (async () => {
                        try {
                            const { data, error } = await supabase
                                .from('tasks')
                                .select('*')
                                .eq('user_id', user.id);
                            if (!error && data) {
                                dispatch(setTasks(data));
                            }
                        } catch {}
                    })();
                } else {
                    unsubscribe();
                }
            };

            const onOnline = () => {
                if (document.visibilityState === 'visible') {
                    subscribe();
                }
            };

            const onOffline = () => {
                unsubscribe();
            };

            document.addEventListener('visibilitychange', onVisibilityChange);
            window.addEventListener('online', onOnline);
            window.addEventListener('offline', onOffline);

            return () => {
                document.removeEventListener('visibilitychange', onVisibilityChange);
                window.removeEventListener('online', onOnline);
                window.removeEventListener('offline', onOffline);
                unsubscribe();
            };
        }

        // Fallback cleanup (SSR safety)
        return () => {
            unsubscribe();
        };
    }, [user, dispatch]);

    const addTask = async (newTask: NewTask): Promise<Task | null> => {
        if (!user) {
            // Handle local storage
            const localTask: Task = {
                ...newTask,
                id: generateLocalId(),
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
            // Fetch existing tasks to avoid duplicates by simple signature (title|deadline|assignment)
            const { data: existing, error: fetchError } = await supabase
                .from('tasks')
                .select('id,title,deadline,assignment')
                .eq('user_id', user.id);
            if (fetchError) throw fetchError;

            const existingSignatures = new Set(
                (existing || []).map((t: any) => `${t.title ?? ''}|${t.deadline ?? ''}|${t.assignment ?? ''}`)
            );

            // Build local signatures and de-duplicate within local as well
            const seenLocal = new Set<string>();
            const candidates = localTasks.filter((t) => {
                const sig = `${(t as any).title ?? ''}|${(t as any).deadline ?? ''}|${(t as any).assignment ?? ''}`;
                if (existingSignatures.has(sig)) return false;
                if (seenLocal.has(sig)) return false;
                seenLocal.add(sig);
                return true;
            });

            if (!candidates.length) {
                // Nothing new to sync; clear local cache safely
                localStorage.removeItem('localTasks');
                setLocalTasks([]);
                return [];
            }

            // Prepare payload: assign user_id and omit id to let Supabase generate
            const tasksToSync = candidates.map((task) => {
                const { id: _omit, ...rest } = task as any;
                return { ...rest, user_id: user.id };
            });

            const { data, error } = await supabase
                .from('tasks')
                .insert(tasksToSync)
                .select();

            if (error) throw error;

            // Clear local tasks after successful sync
            localStorage.removeItem('localTasks');
            setLocalTasks([]);
            if (data) {
                // Merge: fetch fresh list to be safe and consistent
                try {
                    const { data: refreshed } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('user_id', user.id);
                    if (refreshed) dispatch(setTasks(refreshed));
                } catch {}
            }

            return data ?? [];
        } catch (error: any) {
            console.error('Error syncing local tasks:', error);
            // Handle common duplicate errors gracefully without crashing UX
            const msg = (error && (error.message || error.msg)) || 'Failed to sync local tasks';
            toast.error(msg);
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