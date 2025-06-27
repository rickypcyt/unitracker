import { useCallback, useEffect, useState } from "react";

import { addTask } from "@/TaskActions";
import { formatDateForInput } from '@/utils/dateUtils';
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";

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
    deadline: formatDateForInput(new Date()),
    difficulty: "medium",
    assignment: "",
  });
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const tasks = useSelector((state) => state.tasks.tasks); // Tareas remotas
  const [localTasks, setLocalTasks] = useState([]); // Tareas locales
  const [user, setUser] = useState(null);


  // Extrae fetchAssignments para reutilizarla
  const fetchAssignments = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("tasks")
        .select("assignment")
        .eq("user_id", user.id)
        .not("assignment", "is", null)
        .not("assignment", "eq", "")
        .order("assignment");
      if (error) throw error;
      setAssignments([...new Set(data.map((task) => task.assignment))]);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
  const sourceTasks = user ? tasks : localTasks;
  const uniqueAssignments = [
    ...new Set(sourceTasks.map((task) => task.assignment).filter(Boolean)),
  ];
  setAssignments(uniqueAssignments);
}, [tasks, localTasks, user]);


  // Cargar tareas locales al montar
  useEffect(() => {
    if (!user) {
      const savedTasks = localStorage.getItem("localTasks");
      if (savedTasks) setLocalTasks(JSON.parse(savedTasks));
    }
  }, [user]);

  // Actualiza assignments cada vez que cambian las tareas
  useEffect(() => {
    const sourceTasks = user ? tasks : localTasks;
    const uniqueAssignments = [
      ...new Set(sourceTasks.map((task) => task.assignment).filter(Boolean)),
    ];
    setAssignments(uniqueAssignments);
  }, [tasks, localTasks, user]);

  // Centraliza el reseteo del formulario
  const resetForm = () => setNewTask({
    title: "",
    description: "",
    deadline: formatDateForInput(new Date()),
    difficulty: "medium",
    assignment: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.deadline) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Lógica local
        const localTasks = JSON.parse(localStorage.getItem("localTasks") || "[]");
        const newLocalTask = {
          ...newTask,
          id: Date.now(),
          completed: false,
          created_at: new Date().toISOString(),
        };
        localTasks.push(newLocalTask);
        localStorage.setItem("localTasks", JSON.stringify(localTasks));
        window.dispatchEvent(new CustomEvent("localTasksUpdated"));
        resetForm();
        await fetchAssignments();
        return;
      }
      // Lógica remota
      await dispatch(addTask({
        ...newTask,
        completed: false,
        user_id: user.id,
      }));
      resetForm();
      await fetchAssignments();
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
    handleSetToday: () => updateField("deadline", formatDateForInput(new Date())),
    handleSetTomorrow: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      updateField("deadline", formatDateForInput(tomorrow));
    },
  };
};
