import React, { useState, useEffect, useRef } from "react";
import { useTaskForm } from "../../redux/useTaskForm";
import { Rows4, Circle, CheckCircle2 } from "lucide-react";

const TaskForm = () => {
    const {
        newTask,
        error,
        assignments,
        handleSubmit,
        updateField,
        handleSetToday,
        handleSetTomorrow,
    } = useTaskForm();

    // Estado para asignaturas locales (offline)
    const [localAssignments, setLocalAssignments] = useState([]);

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

    // Detectar accentPalette para color de texto del botón
    const accentPalette =
        typeof window !== "undefined"
            ? localStorage.getItem("accentPalette") || "blue"
            : "blue";
    const buttonTextColor =
        accentPalette === "white" ? "#222" : "var(--text-primary)";

    // ----------- AUTOCOMPLETE LOGIC -----------
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredAssignments, setFilteredAssignments] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const suggestionsRef = useRef(null);

    useEffect(() => {
        if (newTask.assignment) {
            const filtered = allAssignments.filter((a) =>
                a.toLowerCase().includes(newTask.assignment.toLowerCase()),
            );
            setFilteredAssignments(filtered);
            setSelectedIndex(filtered.length > 0 ? 0 : -1);
        } else {
            setFilteredAssignments(allAssignments);
            setSelectedIndex(-1);
        }
    }, [newTask.assignment, allAssignments]);

    const handleAssignmentChange = (e) => {
        updateField("assignment", e.target.value);
        setShowSuggestions(true);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) =>
                prev < filteredAssignments.length - 1 ? prev + 1 : prev,
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter" || e.key === "Tab") {
            if (selectedIndex >= 0 && filteredAssignments[selectedIndex]) {
                e.preventDefault();
                handleSuggestionClick(filteredAssignments[selectedIndex]);
            } else if (
                newTask.assignment &&
                !filteredAssignments.includes(newTask.assignment)
            ) {
                e.preventDefault();
                handleSuggestionClick(newTask.assignment);
            }
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        updateField("assignment", suggestion);
        setShowSuggestions(false);
    };
    // ----------- END AUTOCOMPLETE LOGIC -----------

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

                <div className="flex gap-4">
                    {/* Assignment */}
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="assignment" className="card-text-lg">
                            Assignment
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="assignment"
                                className="textinput hover:bg-neutral-800 transition-colors duration-1000"
                                value={newTask.assignment}
                                onChange={handleAssignmentChange}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => {
                                    setTimeout(() => setShowSuggestions(false), 500);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Choose an assignment"
                            />
                            {showSuggestions && filteredAssignments.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute w-full mt-1 bg-neutral-900 rounded-lg shadow-lg z-10 border border-neutral-800"
                                >
                                    {filteredAssignments.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`w-full px-4 py-2 text-left hover:bg-neutral-800 transition-colors duration-200 ${index === selectedIndex ? "bg-neutral-800" : ""}`}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="title" className="card-text-lg">
                            Title
                        </label>
                        <input
                            id="title"
                            className="textinput"
                            value={newTask.title}
                            onChange={(e) => updateField("title", e.target.value)}
                            placeholder="Task title"
                        />
                    </div>
                </div>

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
