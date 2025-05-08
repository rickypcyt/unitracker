import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addTask } from "./TaskActions";
import { supabase } from "../utils/supabaseClient";
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
    deadline: formatDate(new Date()),
    difficulty: "medium",
    assignment: "",
    color: "",
  });
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [assignmentColors, setAssignmentColors] = useState({});

  // Cargar colores guardados en localStorage al montar (modo local)
  useEffect(() => {
    const savedColors = JSON.parse(localStorage.getItem("assignmentColors") || "{}");
    setAssignmentColors(savedColors);
  }, []);

  // Fetch assignments y colores desde Supabase
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("tasks")
          .select("assignment, color")
          .eq("user_id", user.id)
          .not("assignment", "is", null)
          .not("assignment", "eq", "")
          .order("assignment");

        if (error) throw error;

        // Extrae colores únicos por asignatura
        const colorsMap = {};
        data.forEach((task) => {
          if (task.assignment && task.color) {
            colorsMap[task.assignment] = task.color;
          }
        });
        setAssignmentColors(colorsMap);

        const uniqueAssignments = [...new Set(data.map((task) => task.assignment))];
        setAssignments(uniqueAssignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    fetchAssignments();
  }, []);

  // updateField mejorado
  const updateField = (field, value) => {
    setNewTask((prev) => {
      if (field === "assignment" && assignmentColors[value]) {
        return { ...prev, assignment: value, color: assignmentColors[value] };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.deadline) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Modo local
        const localTasks = JSON.parse(localStorage.getItem("localTasks") || "[]");
        const newLocalTask = {
          id: Date.now(),
          title: newTask.title,
          description: newTask.description || "",
          deadline: newTask.deadline,
          completed: false,
          difficulty: newTask.difficulty || "medium",
          assignment: newTask.assignment || "",
          color: newTask.color || "#8888ff",
          created_at: new Date().toISOString(),
        };

        localTasks.push(newLocalTask);
        localStorage.setItem("localTasks", JSON.stringify(localTasks));

        // Guardar el color de la asignatura en localStorage
        const localAssignmentsColors = JSON.parse(localStorage.getItem("assignmentColors") || "{}");
        if (newTask.assignment && newTask.color) {
          localAssignmentsColors[newTask.assignment] = newTask.color;
          localStorage.setItem("assignmentColors", JSON.stringify(localAssignmentsColors));
        }

        // Disparar evento de actualización
        window.dispatchEvent(new CustomEvent("localTasksUpdated"));

        // Resetear el formulario
        setNewTask({
          title: "",
          description: "",
          deadline: "",
          difficulty: "medium",
          assignment: "",
          color: "",
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
        color: newTask.color || assignmentColors[newTask.assignment] || "#8888ff",
        user_id: user.id,
      };

      await dispatch(addTask(taskData));

      // Resetear el formulario
      setNewTask({
        title: "",
        description: "",
        deadline: formatDate(new Date()),
        difficulty: "medium",
        assignment: "",
        color: "",
      });

      toast.success("Task added successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to add task");
    }
  };

  return {
    newTask,
    error,
    assignments,
    assignmentColors, 
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
