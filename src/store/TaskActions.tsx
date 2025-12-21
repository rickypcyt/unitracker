import { supabase } from '@/utils/supabaseClient';
import { useAppStore } from '@/store/appStore';

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

// En tu archivo TaskActions.js
export const fetchTasks = async (workspaceId?: string, forceRefresh: boolean = false) => {
  console.log('TaskActions.fetchTasks - Called with:', { workspaceId, forceRefresh });
  
  const { tasks: taskState } = useAppStore.getState();
  
  // Create a unique key for this request
  const requestKey = `${workspaceId || 'all'}-${forceRefresh ? 'force' : 'cached'}`;
  
  // Check if there's already an ongoing request for the same parameters
  if (ongoingRequests.has(requestKey)) {
    console.log('fetchTasks - returning ongoing request for:', requestKey);
    return ongoingRequests.get(requestKey);
  }
  
  // Create the request promise
  const requestPromise = (async () => {
    try {
      // Set loading state
      useAppStore.setState((state) => ({
        tasks: { ...state.tasks, loading: true }
      }));
      
      // Check if we have a valid cache (unless force refresh)
      if (!forceRefresh && taskState.isCached && taskState.lastFetch && (Date.now() - taskState.lastFetch < CACHE_DURATION)) {
        useAppStore.setState((state) => ({
          tasks: { ...state.tasks, loading: false, tasks: taskState.tasks }
        }));
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Filter by workspace if provided, otherwise get all tasks
      let query = supabase
        .from('tasks')
        .select('id, title, description, completed, completed_at, created_at, updated_at, user_id, assignment, difficulty, activetask, deadline, workspace_id, status')
        .eq('user_id', user.id);

      // Add workspace filter if workspaceId is provided
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      query = query.order('assignment');

      const { data, error } = await query;

      if (error) throw error;

      console.log('fetchTasks - fetched tasks count:', data?.length);
      console.log('fetchTasks - fetched tasks:', data);
      console.log('fetchTasks - workspaceId:', workspaceId);

      useAppStore.setState((state) => ({
        tasks: { ...state.tasks, loading: false, tasks: data, error: null, isCached: true, lastFetch: Date.now() }
      }));
      saveTasksToLocalStorage(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      useAppStore.setState((state) => ({
        tasks: { ...state.tasks, loading: false, error: errorMessage }
      }));
    } finally {
      // Clean up the ongoing request
      ongoingRequests.delete(requestKey);
    }
  })();
  
  // Store the ongoing request
  ongoingRequests.set(requestKey, requestPromise);
  
  return requestPromise;
};

// Acción para obtener tareas
export const addTask = async (newTask: any) => {
  const { addTask, tasks: taskState, workspace } = useAppStore.getState();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // If no user, generate a local ID and store in localStorage
      const localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
      const localTask = {
        ...newTask,
        id: Date.now(), // Use timestamp as local ID
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

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskWithUser])
      .select()
      .single();

    if (error) throw error;

    addTask(data);
    // Actualiza localStorage
    saveTasksToLocalStorage([...taskState.tasks, data]);
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    useAppStore.setState((state) => ({
      tasks: { ...state.tasks, error: errorMessage }
    }));
    throw error;
  }
};

// Acción para marcar como completado/no completado
export const toggleTaskStatus = async (id: any, completed: any) => {
  const { updateTask, tasks: taskState } = useAppStore.getState();
  
  try {
    // Actualización optimista
    const currentTask = taskState.tasks.find(t => t.id === id);
    if (!currentTask) return;
    
    updateTask(id, { completed, completed_at: completed ? new Date().toISOString() : null });

    // Actualizar en la base de datos
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        completed: completed,
        completed_at: completed ? new Date().toISOString() : null 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Revertir en caso de error
      updateTask(id, { completed: !completed, completed_at: currentTask.completed_at });
      throw error;
    }

    // Actualizar el estado con la respuesta del servidor
    updateTask(id, data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    useAppStore.setState((state) => ({
      tasks: { ...state.tasks, error: errorMessage }
    }));
  }
};

// Acción para eliminar tarea
export const deleteTask = async (id: any) => {
  const { deleteTask, tasks: taskState } = useAppStore.getState();
  
  try {
    // Eliminar la tarea de la base de datos
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    deleteTask(id);
    // Actualiza localStorage
    saveTasksToLocalStorage(taskState.tasks.filter(t => t.id !== id));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    useAppStore.setState((state) => ({
      tasks: { ...state.tasks, error: errorMessage }
    }));
  }
};

// Acción para actualizar tarea
export const updateTaskAction = async (task: any) => {
  const { updateTask, tasks: taskState } = useAppStore.getState();
  
  console.log('updateTaskAction - Updating task with data:', task);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!task || !task.id) {
      throw new Error('ID de tarea inválido');
    }

    // Verificar que la tarea pertenece al usuario
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', task.id)
      .single();

    if (taskError) throw taskError;

    if (!taskData || taskData.user_id !== user.id) {
      throw new Error('No tienes permiso para editar esta tarea');
    }

    const updateData = {
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      completed: task.completed,
      difficulty: task.difficulty,
      assignment: task.assignment,
      activetask: task.activetask,
      status: task.status
    };
    
    console.log('updateTaskAction - Sending to database:', updateData);

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', task.id)
      .select();

    if (error) {
      console.error('updateTaskAction - Database error:', error);
      throw error;
    }

    console.log('updateTaskAction - Database response:', data);
    updateTask(task.id, data[0]);
    // Actualiza localStorage
    const updatedTasks = taskState.tasks.map(t => t.id === data[0].id ? data[0] : t);
    saveTasksToLocalStorage(updatedTasks);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    useAppStore.setState((state) => ({
      tasks: { ...state.tasks, error: errorMessage }
    }));
    throw error;
  }
};

// Acción para forzar una actualización de las tareas
export const forceTaskRefresh = async (workspaceId?: string) => {
  useAppStore.setState((state) => ({
    tasks: { ...state.tasks, isCached: false }
  }));
  return fetchTasks(workspaceId);
};

// Helper para obtener tasks actuales
// async function getTasksFromStoreOrLocalStorage() {
//   try {
//     const local = localStorage.getItem('tasksHydrated');
//     if (local) return JSON.parse(local);
//   } catch {
//     // no-op
//   }
//   return [];
// }

