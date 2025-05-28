import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTask, fetchTasks } from "../redux/TaskActions";
import { supabase } from "../utils/supabaseClient";
import { toast } from "react-toastify";

/**
 * Custom hook for unified task management (local and remote)
 * @returns {Object} Task management functions and state
 */
export const useTaskStorage = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
  const [user, setUser] = useState(null);
  const [localTasks, setLocalTasks] = useState(() => {
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
      
      if (user) {
        // Clear local tasks when user logs in
        localStorage.removeItem("localTasks");
        setLocalTasks([]);
        dispatch(fetchTasks());
      }
    };
    loadData();

    // Listen for storage changes
    const handleStorageChange = (e) => {
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
        () => {
          dispatch(fetchTasks());
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, dispatch]);

  const addTask = async (newTask) => {
    if (!user) {
      // Handle local storage
      const localTask = {
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
        const { id, ...taskWithoutId } = newTask;
        const { data, error } = await supabase
          .from("tasks")
          .insert([{ ...taskWithoutId, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;

        dispatch(addTask(data));
        return data;
      } catch (error) {
        console.error("Error adding task:", error);
        toast.error("Failed to add task");
        return null;
      }
    }
  };

  const syncLocalTasks = async () => {
    if (!user || !localTasks.length) return;

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
      dispatch(fetchTasks());

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