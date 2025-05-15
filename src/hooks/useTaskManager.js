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
  const [localTasks, setLocalTasks] = useState([]);

  // Load local tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("localTasks");
    if (savedTasks) {
      setLocalTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save local tasks to localStorage whenever they change
  useEffect(() => {
    if (!user) {
      localStorage.setItem("localTasks", JSON.stringify(localTasks));
    }
  }, [localTasks, user]);

  // Obtener usuario y cargar tareas al montar el componente
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        dispatch(fetchTasks());
      } else {
        // Cargar tareas locales si no hay usuario
        const savedTasks = localStorage.getItem("localTasks");
        if (savedTasks) {
          setLocalTasks(JSON.parse(savedTasks));
        }
      }
    };
    loadData();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e) => {
      if (e.key === "localTasks") {
        const newTasks = e.newValue ? JSON.parse(e.newValue) : [];
        setLocalTasks(newTasks);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Escuchar evento personalizado para actualización local
    const handleLocalUpdate = () => {
      const savedTasks = localStorage.getItem("localTasks");
      if (savedTasks) {
        setLocalTasks(JSON.parse(savedTasks));
      }
    };

    window.addEventListener("localTasksUpdated", handleLocalUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localTasksUpdated", handleLocalUpdate);
    };
  }, [dispatch]);

  // Suscribirse a cambios en tiempo real
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
      // Handle local storage update
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
      // Handle remote storage update
      dispatch(toggleTaskStatus(task.id, !task.completed));
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ 
            completed: !task.completed,
            completed_at: !task.completed ? new Date().toISOString() : null 
          })
          .eq("id", task.id);

        if (error) throw error;
      } catch (error) {
        dispatch(toggleTaskStatus(task.id, task.completed));
        console.error("Error updating task:", error);
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!user) {
      // Handle local storage delete
      setLocalTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
    } else {
      // Handle remote storage delete
      dispatch(deleteTask(taskId));
    }
  };

  const handleUpdateTask = async (task) => {
    if (!user) {
      // Handle local storage update
      setLocalTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? task : t))
      );
    } else {
      // Handle remote storage update
      try {
        await dispatch(updateTask(task));
        
        // Si estamos activando una tarea, desactivamos otras
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

  return { 
    user, 
    tasks, 
    localTasks, 
    handleToggleCompletion, 
    handleDeleteTask, 
    handleUpdateTask 
  };
};
