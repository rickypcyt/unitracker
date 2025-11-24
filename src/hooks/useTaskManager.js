import { fetchTasks, forceTaskRefresh, toggleTaskStatus } from "@/store/TaskActions";
import { useAddTaskSuccess, useAppStore, useDeleteTaskSuccess, useFetchTasks, useTasks, useToggleTaskStatus, useUpdateTaskSuccess } from '@/store/appStore';
import { useEffect, useState } from "react";

import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';

export const useTaskManager = (activeWorkspace) => {
  const addTaskSuccess = useAddTaskSuccess();
  const updateTaskSuccess = useUpdateTaskSuccess();
  const deleteTaskSuccess = useDeleteTaskSuccess();
  const toggleTaskStatusAction = useToggleTaskStatus();
  const fetchTasksAction = useFetchTasks();
  const { tasks } = useTasks();
  console.log('useTaskManager - tasks from store:', tasks);
  const [user, setUser] = useState(null);

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
    if (user) {
      console.log('useTaskManager - fetching tasks for workspace:', activeWorkspace?.id || 'all');
      // Always fetch with workspace filter if activeWorkspace exists
      // This ensures we only load the tasks we need
      fetchTasksAction(activeWorkspace?.id);
    }
  }, [user, activeWorkspace?.id]); // Include workspaceId to fetch workspace-specific tasks

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Real-time update received:', payload);
          
          // Only process real-time updates if the task belongs to the current workspace
          // or if no workspace is active
          const taskWorkspaceId = payload.new?.workspace_id || payload.old?.workspace_id;
          if (activeWorkspace && taskWorkspaceId !== activeWorkspace.id) {
            console.log('Ignoring real-time update for different workspace:', taskWorkspaceId);
            return;
          }
          
          switch (payload.eventType) {
            case 'INSERT':
              addTaskSuccess(payload.new);
              window.dispatchEvent(new CustomEvent('refreshTaskList'));
              break;
            case 'UPDATE':
              updateTaskSuccess(payload.new);
              window.dispatchEvent(new CustomEvent('refreshTaskList'));
              break;
            case 'DELETE':
              deleteTaskSuccess(payload.old.id);
              window.dispatchEvent(new CustomEvent('refreshTaskList'));
              break;
            default:
              // Don't fetch on default events to avoid unnecessary calls
              // The real-time updates handle individual changes
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeWorkspace?.id]); // Include activeWorkspace to filter real-time updates

  const handleToggleCompletion = async (taskId) => {
    if (!user) return;

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
    if (!user) return;

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
    if (!user) return;

    try {
      // Actualizar el estado local inmediatamente
      updateTaskSuccess(updatedTask);

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          deadline: updatedTask.deadline,
          completed: updatedTask.completed,
          difficulty: updatedTask.difficulty,
          assignment: updatedTask.assignment,
          activetask: updatedTask.activetask
        })
        .eq('id', updatedTask.id);

      if (error) {
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
    tasks: activeWorkspace 
      ? tasks.filter(task => task.workspace_id === activeWorkspace.id)
      : tasks,
    handleToggleCompletion,
    handleDeleteTask,
    handleUpdateTask,
  };
};
