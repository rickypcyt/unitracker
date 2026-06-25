import { useDeleteTaskSuccess, useFetchTasks, useTasks, useToggleTaskStatus, useUpdateTaskSuccess } from '@/store/appStore';
import { useEffect, useRef, useState } from 'react';

import type { User } from '@supabase/supabase-js';
import { parseDateForDB } from '@/utils/timeUtils';
import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';
import { toggleTaskStatus } from "@/store/TaskActions";

// Constant for the "All" workspace
const ALL_WORKSPACE_ID = 'all';

interface Workspace {
  id: string;
  [key: string]: any;
}

export const useTaskManager = (activeWorkspace: Workspace | null) => {
  const updateTaskSuccess = useUpdateTaskSuccess();
  const deleteTaskSuccess = useDeleteTaskSuccess();
  const toggleTaskStatusAction = useToggleTaskStatus();
  const fetchTasksAction = useFetchTasks();
  const { tasks } = useTasks();
  const [user, setUser] = useState<User | null>(null);
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
    if (!activeWorkspace || activeWorkspaceId === ALL_WORKSPACE_ID) {
      fetchTasksRef.current(undefined, true);
    } else if (activeWorkspaceId) {
      fetchTasksRef.current(activeWorkspaceId, true);
    }
  }, [userId, activeWorkspaceId]);

  const handleToggleCompletion = async (taskId: string) => {
    if (!userId) return;

    const task = tasks.find((t: any) => t.id === taskId);
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

  const handleDeleteTask = async (taskId: string) => {
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
        fetchTasksAction(activeWorkspace?.id ?? undefined);
        if (error.message && error.message.includes('violates foreign key constraint')) {
          toast.error('Cannot delete this task because it is associated with an active session. Please deactivate the task first.');
        } else {
          toast.error('Error deleting task: ' + error.message);
        }
        throw error;
      }
    } catch (error: any) {
      if (error.message && error.message.includes('violates foreign key constraint')) {
        toast.error('Cannot delete this task because it is associated with an active session. Please deactivate the task first.');
      } else if (!error.message?.includes('eliminando la tarea')) {
        toast.error('Error deleting task: ' + (error.message || error));
      }
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateTask = async (updatedTask: any) => {
    if (!userId) return;

    try {
      // Convert deadline to proper format for database
      const deadlineForDB = parseDateForDB(updatedTask.deadline);

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
          status: updatedTask.status,
          start_at: updatedTask.start_at,
          end_at: updatedTask.end_at
        })
        .eq('id', updatedTask.id);

      if (error) {
        console.error('Database error:', error);
        // Si hay error, revertir el estado local
        fetchTasksAction(activeWorkspace?.id ?? undefined);
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
        ? tasks.filter((task: any) => task.workspace_id === activeWorkspace.id)
        : tasks,
    handleToggleCompletion,
    handleDeleteTask,
    handleUpdateTask,
  };
};
