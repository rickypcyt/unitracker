import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addTask } from "./TaskActions";
import { supabase } from "../utils/supabaseClient"; // Importa el cliente de Supabase
import { toast } from "react-toastify";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useTaskForm = () => {
  const dispatch = useDispatch();
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: formatDate(new Date()), // Fecha actual por defecto    difficulty: "medium", // Add default difficulty
    assignment: "", // Add assignment field
  });
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);

  // Fetch assignments when component mounts
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("tasks")
          .select("assignment")
          .eq("user_id", user.id)
          .not("assignment", "is", null)
          .not("assignment", "eq", "")
          .order("assignment");

        if (error) throw error;

        // Get unique assignments and remove duplicates
        const uniqueAssignments = [
          ...new Set(data.map((task) => task.assignment)),
        ];
        setAssignments(uniqueAssignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    fetchAssignments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.deadline) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Modo local
        const localTasks = JSON.parse(
          localStorage.getItem("localTasks") || "[]",
        );
        const newLocalTask = {
          id: Date.now(), // Usar timestamp como ID
          title: newTask.title,
          description: newTask.description || "",
          deadline: newTask.deadline,
          completed: false,
          difficulty: newTask.difficulty || "medium",
          assignment: newTask.assignment || "",
          created_at: new Date().toISOString(),
        };

        localTasks.push(newLocalTask);
        localStorage.setItem("localTasks", JSON.stringify(localTasks));

        // Disparar evento de actualización
        window.dispatchEvent(new CustomEvent("localTasksUpdated"));

        // Resetear el formulario
        setNewTask({
          title: "",
          description: "",
          deadline: "",
          difficulty: "medium",
          assignment: "",
        });

        toast.success("Task added successfully");
        return;
      }

      // Si hay usuario, continuar con la lógica existente
      const taskData = {
        title: newTask.title,
        description: newTask.description || "",
        deadline: newTask.deadline,
        completed: false,
        difficulty: newTask.difficulty || "medium",
        assignment: newTask.assignment || "",
        user_id: user.id,
      };

      await dispatch(addTask(taskData));

      // Resetear el formulario
      setNewTask({
        title: "",
        description: "",
        deadline: formatDate(new Date()), // Resetear a hoy        difficulty: "medium",
        assignment: "",
      });

      toast.success("Task added successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to add task");
    }
  };

  const updateField = (field, value) => {
    setNewTask((prev) => ({ ...prev, [field]: value }));
  };

  return {
    newTask,
    error,
    assignments,
    handleSubmit,
    updateField,
    setNewTask,
    handleSetToday: () => {
      const today = new Date();
      const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      updateField("deadline", isoDate);
    },
    handleSetTomorrow: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
      updateField("deadline", isoDate);
    },
  };
};
