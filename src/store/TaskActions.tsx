import { supabase } from '@/utils/supabaseClient';
import { useAppStore } from '@/store/appStore';
import { TaskService } from '@/services/TaskService';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

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

export const fetchTasks = async (workspaceId?: string, forceRefresh: boolean = false) => {
  const { tasks: taskState } = useAppStore.getState();

  const requestKey = `${workspaceId || 'all'}-${forceRefresh ? 'force' : 'cached'}`;

  if (ongoingRequests.has(requestKey)) {
    return ongoingRequests.get(requestKey);
  }

  const requestPromise = (async () => {
    try {
      useAppStore.setState(state => ({
        tasks: { ...state.tasks, loading: true }
      }));

      if (!forceRefresh && !workspaceId && taskState.isCached && taskState.lastFetch && Date.now() - taskState.lastFetch < CACHE_DURATION) {
        useAppStore.setState(state => ({
          tasks: { ...state.tasks, loading: false, tasks: taskState.tasks }
        }));
        return;
      }

      const combinedTasks = await TaskService.fetchTasks(workspaceId);

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

    const data = await TaskService.createTask(taskWithUser);
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

    const data = await TaskService.toggleComplete(id, completed);

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

  try {
    await TaskService.deleteTask(id);
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

    const data = await TaskService.updateTask(task.id, updateData);
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