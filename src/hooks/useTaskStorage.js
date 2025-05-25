import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocalStorage } from './useLocalStorage';
import { 
  addTask as addTaskAction, 
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  toggleTaskStatus as toggleTaskStatusAction
} from '../redux/TaskActions';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';

/**
 * Custom hook for unified task management (local and remote)
 * @returns {Object} Task management functions and state
 */
export const useTaskStorage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const remoteTasks = useSelector((state) => state.tasks.tasks);
  const [localTasks, setLocalTasks] = useLocalStorage('localTasks', []);

  // Get the appropriate tasks based on user status
  const tasks = user ? remoteTasks : localTasks;

  const addTask = useCallback(async (newTask) => {
    try {
      if (!user) {
        const localTask = {
          ...newTask,
          id: Date.now(),
          created_at: new Date().toISOString(),
          completed: false,
          activetask: false
        };
        setLocalTasks(prev => [...prev, localTask]);
        return localTask;
      }

      const result = await dispatch(addTaskAction(newTask)).unwrap();
      return result;
    } catch (error) {
      toast.error('Failed to add task');
      throw error;
    }
  }, [user, dispatch, setLocalTasks]);

  const updateTask = useCallback(async (taskId, updates) => {
    try {
      if (!user) {
        setLocalTasks(prev => 
          prev.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          )
        );
        return;
      }

      await dispatch(updateTaskAction(taskId, updates)).unwrap();
    } catch (error) {
      toast.error('Failed to update task');
      throw error;
    }
  }, [user, dispatch, setLocalTasks]);

  const deleteTask = useCallback(async (taskId) => {
    try {
      if (!user) {
        setLocalTasks(prev => prev.filter(task => task.id !== taskId));
        return;
      }

      await dispatch(deleteTaskAction(taskId)).unwrap();
    } catch (error) {
      toast.error('Failed to delete task');
      throw error;
    }
  }, [user, dispatch, setLocalTasks]);

  const toggleTaskStatus = useCallback(async (taskId, completed) => {
    try {
      if (!user) {
        setLocalTasks(prev => 
          prev.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  completed, 
                  completed_at: completed ? new Date().toISOString() : null 
                } 
              : task
          )
        );
        return;
      }

      await dispatch(toggleTaskStatusAction(taskId, completed)).unwrap();
    } catch (error) {
      toast.error('Failed to update task status');
      throw error;
    }
  }, [user, dispatch, setLocalTasks]);

  const syncLocalTasks = useCallback(async () => {
    if (!user) return;

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Get all local tasks
      const localTasksToSync = JSON.parse(localStorage.getItem('localTasks') || '[]');
      
      // Upload each local task to the server
      for (const task of localTasksToSync) {
        const { id, ...taskData } = task;
        await dispatch(addTaskAction({
          ...taskData,
          user_id: currentUser.id
        })).unwrap();
      }

      // Clear local tasks after successful sync
      setLocalTasks([]);
      toast.success('Tasks synchronized successfully');
    } catch (error) {
      toast.error('Failed to synchronize tasks');
      throw error;
    }
  }, [user, dispatch, setLocalTasks]);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    syncLocalTasks
  };
}; 