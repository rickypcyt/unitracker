import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  toggleTaskStatus, 
  deleteTask, 
  fetchTasks, 
  updateTask 
} from "../redux/TaskActions";
import { supabase } from "../utils/supabaseClient";

export const useTaskManager = () => {
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

  const handleToggleCompletion = async (task) => {
    if (!user) {
      setLocalTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                completed: !t.completed,
                completed_at: !t.completed ? new Date().toISOString() : null,
              }
            : t
        )
      );
    } else {
      dispatch(toggleTaskStatus(task.id, !task.completed));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!user) {
      setLocalTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
    } else {
      dispatch(deleteTask(taskId));
    }
  };

  const handleUpdateTask = async (task) => {
    if (!user) {
      setLocalTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? task : t))
      );
    } else {
      try {
        await dispatch(updateTask(task));
        
        // If we're activating a task, deactivate others
        if (task.activetask) {
          const otherActiveTasks = tasks.filter(
            (t) => t.id !== task.id && t.activetask
          );
          await Promise.all(
            otherActiveTasks.map((t) =>
              supabase.from("tasks").update({ activetask: false }).eq("id", t.id)
            )
          );
        }
      } catch (error) {
        console.error("Error updating task:", error);
      }
    }
  };

  const clearLocalTasks = () => {
    localStorage.removeItem("localTasks");
    setLocalTasks([]);
  };

  return { 
    user, 
    tasks, 
    localTasks, 
    handleToggleCompletion, 
    handleDeleteTask, 
    handleUpdateTask,
    clearLocalTasks
  };
};
