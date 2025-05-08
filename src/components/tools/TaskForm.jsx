import React, { useState, useEffect } from "react";
import { useTaskForm } from "../../redux/useTaskForm";
import { Rows4, Circle, CheckCircle2 } from "lucide-react";
import { supabase } from "../../utils/supabaseClient";
import { toast } from "react-toastify";

const TaskForm = () => {
    const {
        newTask,
        error,
        assignments,
        assignmentColors,
        handleSubmit,
        updateField,
        handleSetToday,
        handleSetTomorrow,
    } = useTaskForm();

    // Estado para asignaturas locales (offline)
    const [localAssignments, setLocalAssignments] = useState([]);

    // Estado para el color temporal y para mostrar el picker
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [tempColor, setTempColor] = useState("#8888ff");

    // Cargar assignments del localStorage
    useEffect(() => {
        const savedTasks = localStorage.getItem("localTasks");
        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);
            const uniqueAssignments = [
                ...new Set(tasks.map((task) => task.assignment).filter(Boolean)),
            ];
            setLocalAssignments(uniqueAssignments);
        }
    }, []);

    // Unifica asignaturas de Supabase y localStorage
    const allAssignments = Array.from(
        new Set([...assignments, ...localAssignments]),
    );

    // Cuando cambia la asignatura, si no tiene color, pide uno
    useEffect(() => {
        if (newTask.assignment && !assignmentColors[newTask.assignment]) {
            setShowColorPicker(true);
            setTempColor("#8888ff");
        } else {
            setShowColorPicker(false);
        }
    }, [newTask.assignment, assignmentColors]);

    // Guardar color para la asignatura seleccionada
    const handleSaveAssignmentColor = () => {
        // Actualiza en localStorage
        const assignmentColorsLS = JSON.parse(
            localStorage.getItem("assignmentColors") || "{}",
        );
        assignmentColorsLS[newTask.assignment] = tempColor;
        localStorage.setItem(
            "assignmentColors",
            JSON.stringify(assignmentColorsLS),
        );
        // Actualiza en el estado global (si tienes acción para ello)
        updateField("color", tempColor);
        setShowColorPicker(false);
        toast.success("Assignment color saved");
    };

    // Detectar accentPalette para color de texto del botón
    const accentPalette =
        typeof window !== "undefined"
            ? localStorage.getItem("accentPalette") || "blue"
            : "blue";
    const buttonTextColor =
        accentPalette === "white" ? "#222" : "var(--text-primary)";

    return (
        <div className="maincard relative">
            <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
                    <Rows4 size={24} className="mr-2" />
                    Add New Task
                </h2>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {error && (
                    <div className="text-accent-secondary card-text-lg mb-3 text-left bg-bg-surface p-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="flex gap-4 items-center">
                    {/* Assignment select + color */}
                    <div className="relative flex-1 flex items-center gap-2">
                        <select
                            className="textinput pr-10 flex-1"
                            value={newTask.assignment || ""}
                            onChange={(e) => updateField("assignment", e.target.value)}
                        >
                            <option value="">Assignment</option>
                            {allAssignments.map((assignment) => (
                                <option key={assignment} value={assignment}>
                                    {assignment}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Título */}
                    <div className="flex-1">
                        <input
                            id="title"
                            className={`textinput`}
                            value={newTask.title}
                            onChange={(e) => updateField("title", e.target.value)}
                            placeholder="Task title"
                        />
                    </div>
                </div>

                {/* Si la asignatura no tiene color, muestra el picker */}
                {showColorPicker && newTask.assignment && (
                    <div className="flex gap-2 items-center mt-2 text-base">
                        <label className="teext-base">
                            Choose a color for <b>{newTask.assignment}</b>:
                        </label>
                        <input
                            type="color"
                            value={tempColor}
                            onChange={(e) => setTempColor(e.target.value)}
                        />
                        <button
                            type="button"
                            className="btn btn-primary border rounded-xl p-2 ml-5"
                            onClick={handleSaveAssignmentColor}
                        >
                            Save Color
                        </button>
                    </div>
                )}

                {/* Campo Descripción */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="description" className="card-text-lg">
                        Description
                    </label>
                    <textarea
                        id="description"
                        className="textinput"
                        value={newTask.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        placeholder="Enter task description"
                    />
                </div>

                {/* Dificultad y Deadline */}
                <div className="flex gap-4 items-end">
                    {/* Difficulty */}
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="difficulty" className="card-text-lg">
                            Difficulty
                        </label>
                        <div className="flex justify-start gap-8 items-center">
                            {/* Easy */}
                            <button
                                type="button"
                                onClick={() => updateField("difficulty", "easy")}
                                className={`flex flex-col items-center gap-1 rounded-full group`}
                                aria-label="Set Easy Difficulty"
                            >
                                {newTask.difficulty === "easy" ? (
                                    <CheckCircle2 className="text-green-500" size={24} />
                                ) : (
                                    <Circle className="text-green-500" size={24} />
                                )}
                                <span className="text-green-500 text-md">Easy</span>
                            </button>
                            {/* Medium */}
                            <button
                                type="button"
                                onClick={() => updateField("difficulty", "medium")}
                                className={`flex flex-col items-center gap-1 rounded-full group`}
                                aria-label="Set Medium Difficulty"
                            >
                                {newTask.difficulty === "medium" ? (
                                    <CheckCircle2 className="text-blue-500" size={24} />
                                ) : (
                                    <Circle className="text-blue-500" size={24} />
                                )}
                                <span className="text-blue-500 text-md">Medium</span>
                            </button>
                            {/* Hard */}
                            <button
                                type="button"
                                onClick={() => updateField("difficulty", "hard")}
                                className={`flex flex-col items-center gap-1 rounded-full group`}
                                aria-label="Set Hard Difficulty"
                            >
                                {newTask.difficulty === "hard" ? (
                                    <CheckCircle2 className="text-red-500" size={24} />
                                ) : (
                                    <Circle className="text-red-500" size={24} />
                                )}
                                <span className="text-red-500 text-md">Hard</span>
                            </button>
                        </div>
                    </div>

                    {/* Deadline */}
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="difficulty" className="card-text-lg">
                            Deadline
                        </label>
                        <input
                            id="date"
                            className={`textinput w-full text-center cursor-pointer`}
                            type="date"
                            value={newTask.deadline}
                            onChange={(e) => updateField("deadline", e.target.value)}
                            onClick={(e) => e.target.showPicker()}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full mt-2 p-3 rounded-lg card-text font-semibold cursor-pointer transition-all duration-200 hover:shadow-lg active:translate-y-0.5"
                    style={{
                        backgroundColor: "var(--accent-primary)",
                        color: buttonTextColor,
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--accent-hover)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--accent-primary)")
                    }
                >
                    Add Task
                </button>
            </form>
        </div>
    );
};

export default TaskForm;
