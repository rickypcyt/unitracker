import { addTaskSuccess, deleteTaskSuccess, updateTaskSuccess } from "@/store/slices/TaskSlice";
import { fetchTasks, forceTaskRefresh, toggleTaskStatus } from "@/store/TaskActions";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import { supabase } from '@/utils/supabaseClient';

export const useTaskManager = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
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

  // Fetch tasks when user changes
  useEffect(() => {
    if (user) {
      dispatch(fetchTasks());
    }
  }, [user, dispatch]);

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
          switch (payload.eventType) {
            case 'INSERT':
              dispatch(addTaskSuccess(payload.new));
              window.dispatchEvent(new CustomEvent('refreshTaskList'));
              break;
            case 'UPDATE':
              dispatch(updateTaskSuccess(payload.new));
              window.dispatchEvent(new CustomEvent('refreshTaskList'));
              break;
            case 'DELETE':
              dispatch(deleteTaskSuccess(payload.old.id));
              window.dispatchEvent(new CustomEvent('refreshTaskList'));
              break;
            default:
              dispatch(fetchTasks());
              window.dispatchEvent(new CustomEvent('refreshTaskList'));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, dispatch]);

  const handleToggleCompletion = async (taskId) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      // Actualizar el estado local inmediatamente
      dispatch(toggleTaskStatus(taskId, !task.completed));

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
        dispatch(toggleTaskStatus(taskId, task.completed));
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
      dispatch(deleteTaskSuccess(taskId));

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        // Si hay error, revertir el estado local
        dispatch(fetchTasks());
        throw error;
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    if (!user) return;

    try {
      // Actualizar el estado local inmediatamente
      dispatch(updateTaskSuccess(updatedTask));

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
        dispatch(fetchTasks());
        throw error;
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return {
    user,
    tasks,
    handleToggleCompletion,
    handleDeleteTask,
    handleUpdateTask,
  };
};
