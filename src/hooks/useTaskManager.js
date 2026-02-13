import { useAddTaskSuccess, useDeleteTaskSuccess, useFetchTasks, useTasks, useToggleTaskStatus, useUpdateTaskSuccess } from '@/store/appStore';
import { useEffect, useRef, useState } from 'react';

import { parseDateForDB } from '@/utils/timeUtils';
import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';
import { toggleTaskStatus } from "@/store/TaskActions";
import { useAuth } from '@/hooks/useAuth';

// Constant for the "All" workspace
const ALL_WORKSPACE_ID = 'all';

export const useTaskManager = (activeWorkspace) => {
  const addTaskSuccess = useAddTaskSuccess();
  const updateTaskSuccess = useUpdateTaskSuccess();
  const deleteTaskSuccess = useDeleteTaskSuccess();
  const toggleTaskStatusAction = useToggleTaskStatus();
  const fetchTasksAction = useFetchTasks();
  const { tasks } = useTasks();
  const [user, setUser] = useState(null);
  const fetchTasksRef = useRef(fetchTasksAction);

  const userId = user?.id || null;
  const activeWorkspaceId = activeWorkspace?.id || null;

  useEffect(() => {
    fetchTasksRef.current = fetchTasksAction;
  }, [fetchTasksAction]);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch tasks when user or workspace changes
  useEffect(() => {
    if (!userId) return;
    
    // For "All" workspace, fetch all tasks without workspace filter
    if (activeWorkspaceId === ALL_WORKSPACE_ID) {
      console.log('useTaskManager - Fetching all tasks for "All" workspace');
      fetchTasksRef.current(null, true); // Pass null to fetch all tasks
    } else if (activeWorkspaceId) {
      console.log('useTaskManager - Fetching tasks for workspace:', activeWorkspaceId);
      fetchTasksRef.current(activeWorkspaceId, true);
    }
  }, [userId, activeWorkspaceId]);

  const handleToggleCompletion = async (taskId) => {
    if (!userId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      // Actualizar el estado local inmediatamente
      toggleTaskStatusAction(taskId, !task.completed);

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null 
        })
        .eq('id', taskId);

      if (error) {
        // Si hay error, revertir el estado local
        toggleTaskStatus(taskId, task.completed);
        throw error;
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!userId) return;

    try {
      // Actualizar el estado local inmediatamente
      deleteTaskSuccess(taskId);

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        // Si hay error, revertir el estado local
        fetchTasksAction(activeWorkspace?.id);
        if (error.message && error.message.includes('violates foreign key constraint')) {
          toast.error('Cannot delete this task because it is associated with an active session. Please deactivate the task first.');
        } else {
          toast.error('Error deleting task: ' + error.message);
        }
        throw error;
      }
    } catch (error) {
      if (error.message && error.message.includes('violates foreign key constraint')) {
        toast.error('Cannot delete this task because it is associated with an active session. Please deactivate the task first.');
      } else if (!error.message?.includes('eliminando la tarea')) {
        toast.error('Error deleting task: ' + (error.message || error));
      }
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    if (!userId) return;

    try {
      // Convert deadline to proper format for database
      console.log('Original deadline from task:', updatedTask.deadline);
      const deadlineForDB = parseDateForDB(updatedTask.deadline);
      console.log('Converted deadline for DB:', deadlineForDB);

      // Actualizar el estado local inmediatamente
      updateTaskSuccess(updatedTask);

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          deadline: deadlineForDB,
          completed: updatedTask.completed,
          difficulty: updatedTask.difficulty,
          assignment: updatedTask.assignment,
          activetask: updatedTask.activetask,
          status: updatedTask.status
        })
        .eq('id', updatedTask.id);

      if (error) {
        console.error('Database error:', error);
        // Si hay error, revertir el estado local
        fetchTasksAction(activeWorkspace?.id);
        throw error;
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return {
    user,
    tasks: activeWorkspaceId === ALL_WORKSPACE_ID 
      ? tasks // Return all tasks for "All" workspace
      : activeWorkspace 
        ? tasks.filter(task => task.workspace_id === activeWorkspace.id)
        : tasks,
    handleToggleCompletion,
    handleDeleteTask,
    handleUpdateTask,
  };
};
