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
    const [showNewAssignment, setShowNewAssignment] = useState(false);
    const [newAssignmentName, setNewAssignmentName] = useState("");
    const [newAssignmentColor, setNewAssignmentColor] = useState("#8888ff");

    // Cargar colores y asignaturas guardados en localStorage al montar (modo local)
    useEffect(() => {
        const savedColors = JSON.parse(
            localStorage.getItem("assignmentColors") || "{}",
        );
        setAssignmentColors(savedColors);

        const savedAssignments = JSON.parse(
            localStorage.getItem("localAssignments") || "[]",
        );
        setAssignments(savedAssignments);
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

    // updateField mejorado
    const updateField = (field, value) => {
        setNewTask((prev) => {
            if (field === "assignment" && assignmentColors[value]) {
                return { ...prev, assignment: value, color: assignmentColors[value] };
            }
            if (field === "assignment" && !assignmentColors[value]) {
                return { ...prev, assignment: value, color: "#8888ff" };
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
                const localTasks = JSON.parse(
                    localStorage.getItem("localTasks") || "[]",
                );
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
                const localAssignmentsColors = JSON.parse(
                    localStorage.getItem("assignmentColors") || "{}",
                );
                if (newTask.assignment && newTask.color) {
                    localAssignmentsColors[newTask.assignment] = newTask.color;
                    localStorage.setItem(
                        "assignmentColors",
                        JSON.stringify(localAssignmentsColors),
                    );
                }

                // Guardar la asignatura en localStorage
                const localAssignments = JSON.parse(
                    localStorage.getItem("localAssignments") || "[]",
                );
                if (
                    newTask.assignment &&
                    !localAssignments.includes(newTask.assignment)
                ) {
                    localAssignments.push(newTask.assignment);
                    localStorage.setItem(
                        "localAssignments",
                        JSON.stringify(localAssignments),
                    );
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
                color:
                    newTask.color || assignmentColors[newTask.assignment] || "#8888ff",
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

    // Para crear una nueva asignatura desde el form
    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!newAssignmentName) return;

        // Guardar en localStorage
        const localAssignments = JSON.parse(
            localStorage.getItem("localAssignments") || "[]",
        );
        if (!localAssignments.includes(newAssignmentName)) {
            localAssignments.push(newAssignmentName);
            localStorage.setItem(
                "localAssignments",
                JSON.stringify(localAssignments),
            );
            setAssignments(localAssignments);
        }
        // Guardar el color en localStorage
        const assignmentColorsLS = JSON.parse(
            localStorage.getItem("assignmentColors") || "{}",
        );
        assignmentColorsLS[newAssignmentName] = newAssignmentColor;
        localStorage.setItem(
            "assignmentColors",
            JSON.stringify(assignmentColorsLS),
        );
        setAssignmentColors(assignmentColorsLS);

        // Si hay usuario, guarda también en Supabase (opcional, para consistencia)
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            // Si tienes una tabla assignments, deberías guardar ahí.
            // Si no, puedes hacer un insert "dummy" en tasks para registrar la asignatura y color.
            await supabase.from("tasks").insert([
                {
                    title: "Asignatura: " + newAssignmentName,
                    description: "",
                    deadline: new Date().toISOString().slice(0, 10),
                    completed: false,
                    difficulty: "medium",
                    assignment: newAssignmentName,
                    color: newAssignmentColor,
                    user_id: user.id,
                },
            ]);
        }

        // Actualiza el estado global
        updateField("assignment", newAssignmentName);
        updateField("color", newAssignmentColor);

        setShowNewAssignment(false);
        setNewAssignmentName("");
        setNewAssignmentColor("#8888ff");
        toast.success("Asignatura creada");
    };

    return {
        newTask,
        error,
        assignments,
        assignmentColors,
        handleSubmit,
        updateField,
        setNewTask,
        showNewAssignment,
        setShowNewAssignment,
        newAssignmentName,
        setNewAssignmentName,
        newAssignmentColor,
        setNewAssignmentColor,
        handleCreateAssignment,
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
