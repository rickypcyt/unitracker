import { supabase } from '@/utils/supabaseClient';
import { useAppStore } from '@/store/appStore';
import { TaskService } from '@/services/TaskService';

// Cache duration in milliseconds (1 minute — tasks refresh periodically, not on every page visit)
const CACHE_DURATION = 60 * 1000;

// Per-workspace task cache so navigating back to a page doesn't refetch
const tasksCache = new Map<string, { tasks: any[]; lastFetch: number }>();

const invalidateTasksCache = () => tasksCache.clear();

// Track ongoing requests to prevent duplicates
const ongoingRequests = new Map<string, Promise<any>>();

// Helper para guardar en localStorage
function saveTasksToLocalStorage(tasks: any[]) {
  try {
    localStorage.setItem('tasksHydrated', JSON.stringify(tasks));
  } catch {
    // no-op
  }
}

// ============================================================================
// OFFLINE MUTATION QUEUE
// Mutations made while offline are applied optimistically and queued here;
// they replay against Supabase when the connection comes back.
// ============================================================================
const OFFLINE_QUEUE_KEY = 'taskMutationQueue';

type QueuedMutation =
  | { type: 'create'; tempId: number; task: any; userId: string }
  | { type: 'update'; id: any; update: any }
  | { type: 'delete'; id: any }
  | { type: 'toggle'; id: any; completed: boolean };

const readQueue = (): QueuedMutation[] => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeQueue = (q: QueuedMutation[]) => {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
  } catch {
    // no-op
  }
};

const enqueue = (m: QueuedMutation) => {
  const q = readQueue();
  // Compact: drop mutations on a task that was later deleted; merge update into a pending create
  if (m.type === 'delete') {
    const idx = q.findIndex(x => x.type === 'create' && x.tempId === m.id);
    if (idx !== -1) {
      // created offline and deleted before sync — remove create + all ops on it
      writeQueue(q.filter(x => !(x.type === 'create' && x.tempId === m.id) && !('id' in x && x.id === m.id)));
      return;
    }
  } else if (m.type === 'update') {
    const createIdx = q.findIndex(x => x.type === 'create' && x.tempId === m.id);
    if (createIdx !== -1) {
      const c = q[createIdx] as any;
      q[createIdx] = { ...c, task: { ...c.task, ...m.update } };
      writeQueue(q);
      return;
    }
  }
  q.push(m);
  writeQueue(q);
};

const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine;

export const flushOfflineTaskQueue = async () => {
  const queue = readQueue();
  if (!queue.length) return;

  const remaining: QueuedMutation[] = [];
  const idMap = new Map<any, any>(); // tempId -> real server id
  const { addTask: addTaskToStore, updateTask, deleteTask: deleteTaskFromStore, tasks: taskState } = useAppStore.getState();

  for (const m of queue) {
    try {
      if (m.type === 'create') {
        const data = await TaskService.createTask({ ...m.task, user_id: m.userId });
        idMap.set(m.tempId, data.id);
        deleteTaskFromStore(m.tempId);
        addTaskToStore(data);
      } else if (m.type === 'update') {
        const realId = idMap.get(m.id) ?? m.id;
        const data = await TaskService.updateTask(realId, m.update);
        updateTask(realId, data);
      } else if (m.type === 'delete') {
        const realId = idMap.get(m.id) ?? m.id;
        await TaskService.deleteTask(realId);
      } else if (m.type === 'toggle') {
        const realId = idMap.get(m.id) ?? m.id;
        await TaskService.toggleComplete(realId, m.completed);
      }
    } catch {
      // Server rejected or still offline — keep it for the next flush
      remaining.push(m);
    }
  }

  writeQueue(remaining);
  invalidateTasksCache();
  saveTasksToLocalStorage(useAppStore.getState().tasks.tasks);
};

// Flush the queue whenever connectivity returns, and once on module load
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineTaskQueue().catch(() => {});
  });
  setTimeout(() => {
    flushOfflineTaskQueue().catch(() => {});
  }, 3000);
}

export const fetchTasks = async (workspaceId?: string, forceRefresh: boolean = false) => {
  const requestKey = `${workspaceId || 'all'}-${forceRefresh ? 'force' : 'cached'}`;

  if (ongoingRequests.has(requestKey)) {
    return ongoingRequests.get(requestKey);
  }

  const requestPromise = (async () => {
    try {
      useAppStore.setState(state => ({
        tasks: { ...state.tasks, loading: true }
      }));

      const cacheKey = workspaceId || 'all';
      const cacheHit = tasksCache.get(cacheKey);
      if (!forceRefresh && cacheHit && Date.now() - cacheHit.lastFetch < CACHE_DURATION) {
        useAppStore.setState(state => ({
          tasks: {
            ...state.tasks,
            loading: false,
            tasks: cacheHit.tasks,
            error: null,
            isCached: true,
            lastFetch: cacheHit.lastFetch
          }
        }));
        return;
      }

      const combinedTasks = await TaskService.fetchTasks(workspaceId);
      tasksCache.set(cacheKey, { tasks: combinedTasks, lastFetch: Date.now() });

      useAppStore.setState(state => ({
        tasks: {
          ...state.tasks,
          loading: false,
          tasks: combinedTasks,
          error: null,
          isCached: true,
          lastFetch: Date.now()
        }
      }));
      saveTasksToLocalStorage(combinedTasks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      useAppStore.setState(state => ({
        tasks: { ...state.tasks, loading: false, error: errorMessage }
      }));
    } finally {
      ongoingRequests.delete(requestKey);
    }
  })();

  ongoingRequests.set(requestKey, requestPromise);
  return requestPromise;
};

export const addTask = async (newTask: any) => {
  if (!newTask.title || newTask.title.trim().length < 3) {
    throw new Error('Task title is required and must be at least 3 characters long');
  }
  if (!newTask.assignment || newTask.assignment.trim().length === 0) {
    throw new Error('Task assignment/subject is required');
  }
  if (!newTask.difficulty) {
    throw new Error('Task difficulty is required');
  }

  const { addTask: addTaskToStore, tasks: taskState, workspace } = useAppStore.getState();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
      const localTask = {
        ...newTask,
        id: Date.now(),
        created_at: new Date().toISOString(),
        completed: false,
        activetask: false
      };
      localTasks.push(localTask);
      localStorage.setItem('localTasks', JSON.stringify(localTasks));
      return localTask;
    }

    const taskWithUser = {
      ...newTask,
      user_id: user.id,
      created_at: new Date().toISOString(),
      completed: false,
      activetask: false,
      workspace_id: workspace?.currentWorkspace?.id || null
    };

    // Offline: apply optimistically and queue for sync on reconnect
    if (isOffline()) {
      const tempId = -Date.now(); // negative to avoid clashing with server ids
      const optimisticTask = { ...taskWithUser, id: tempId };
      enqueue({ type: 'create', tempId, task: { ...taskWithUser, id: undefined }, userId: user.id });
      addTaskToStore(optimisticTask);
      saveTasksToLocalStorage([...taskState.tasks, optimisticTask]);
      return optimisticTask;
    }

    const data = await TaskService.createTask(taskWithUser);
    invalidateTasksCache();
    addTaskToStore(data);
    saveTasksToLocalStorage([...taskState.tasks, data]);
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    useAppStore.setState(state => ({
      tasks: { ...state.tasks, error: errorMessage }
    }));
    throw error;
  }
};

export const toggleTaskStatus = async (id: any, completed: any) => {
  const { updateTask, tasks: taskState } = useAppStore.getState();

  try {
    const currentTask = taskState.tasks.find(t => t.id === id);
    if (!currentTask) return;

    updateTask(id, {
      completed,
      completed_at: completed ? new Date().toISOString() : null
    });

    if (isOffline()) {
      enqueue({ type: 'toggle', id, completed });
      return;
    }

    const data = await TaskService.toggleComplete(id, completed);

    invalidateTasksCache();
    updateTask(id, data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    useAppStore.setState(state => ({
      tasks: { ...state.tasks, error: errorMessage }
    }));
  }
};

export const deleteTask = async (id: any) => {
  const { deleteTask: deleteTaskFromStore, tasks: taskState } = useAppStore.getState();

  if (isOffline()) {
    deleteTaskFromStore(id);
    saveTasksToLocalStorage(taskState.tasks.filter(t => t.id !== id));
    enqueue({ type: 'delete', id });
    return;
  }

  try {
    await TaskService.deleteTask(id);
    invalidateTasksCache();
    deleteTaskFromStore(id);
    saveTasksToLocalStorage(taskState.tasks.filter(t => t.id !== id));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    useAppStore.setState(state => ({
      tasks: { ...state.tasks, error: errorMessage }
    }));
  }
};

export const updateTaskAction = async (task: any) => {
  const { updateTask, tasks: taskState } = useAppStore.getState();

  try {
    const updateData = {
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      completed: task.completed,
      difficulty: task.difficulty,
      assignment: task.assignment,
      activetask: task.activetask,
      status: task.status,
      recurrence_type: task.recurrence_type ?? 'none',
      recurrence_weekdays: task.recurrence_weekdays ?? null,
      start_at: task.start_at ?? null,
      end_at: task.end_at ?? null
    };

    if (isOffline()) {
      updateTask(task.id, updateData);
      enqueue({ type: 'update', id: task.id, update: updateData });
      const updated = taskState.tasks.map(t => t.id === task.id ? { ...t, ...updateData } : t);
      saveTasksToLocalStorage(updated);
      return;
    }

    const data = await TaskService.updateTask(task.id, updateData);
    invalidateTasksCache();
    updateTask(task.id, data);
    const updatedTasks = taskState.tasks.map(t => t.id === data.id ? data : t);
    saveTasksToLocalStorage(updatedTasks);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    useAppStore.setState(state => ({
      tasks: { ...state.tasks, error: errorMessage }
    }));
    throw error;
  }
};

// Acción para forzar una actualización de las tareas
export const forceTaskRefresh = async (workspaceId?: string) => {
  useAppStore.setState(state => ({
    tasks: {
      ...state.tasks,
      isCached: false
    }
  }));
  return fetchTasks(workspaceId);
};