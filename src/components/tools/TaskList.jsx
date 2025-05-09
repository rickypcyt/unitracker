import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    toggleTaskStatus,
    deleteTask,
    fetchTasks,
    updateTask,
} from "../../redux/TaskActions";
import { setCalendarVisibility } from "../../redux/uiSlice";
import {
    CheckCircle2,
    Circle,
    Calendar,
    Trash2,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    Download,
    X,
    Edit2,
    Save,
    Info,
    Play,
    ArrowUpDown,
} from "lucide-react";
import { supabase } from "../../utils/supabaseClient";
import { motion } from "framer-motion";
import moment from "moment";
import { toast } from "react-toastify";
import TaskDetailsModal from "../modals/TaskDetailsModal";

const TaskItem = ({
    task,
    onToggleCompletion,
    onDelete,
    onDoubleClick,
    onContextMenu,
    isEditing,
}) => (
    <div
        className={`relative p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg ${task.activetask
                ? task.difficulty === "easy"
                    ? "border-2 border-green-500"
                    : task.difficulty === "medium"
                        ? "border-2 border-blue-500"
                        : "border-2 border-red-500"
                : "border border-border-primary"
            }`}
        onDoubleClick={() => onDoubleClick(task)}
        onContextMenu={(e) => onContextMenu(e, task)}
    >
        <div className="flex flex-col gap-2">
            {/* First row: Checkbox and Title */}
            <div className="flex items-center mt-1">
                <button
                    onClick={() => onToggleCompletion(task)}
                    className="bg-transparent border-none cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full group"
                    aria-label={
                        task.completed ? "Mark as incomplete" : "Mark as complete"
                    }
                >
                    {task.completed ? (
                        <CheckCircle2 className="text-accent-primary" size={24} />
                    ) : (
                        <Circle
                            className={`${task.difficulty === "easy"
                                    ? "text-green-500"
                                    : task.difficulty === "medium"
                                        ? "text-blue-500"
                                        : "text-red-500"
                                }`}
                            size={24}
                        />
                    )}
                </button>
                <button
                    onClick={() => onDoubleClick(task)}
                    className="flex items-center focus:outline-none flex-1"
                >
                    <span
                        className={`text-left ml-2 font-medium text-lg transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-2 ${task.completed
                                ? "line-through text-text-secondary"
                                : "text-text-primary"
                            }`}
                        title={task.title}
                    >
                        {task.title}
                    </span>
                </button>
                <button
                    onClick={() => onDelete(task.id)}
                    className="text-red-500 transition-all duration-200 hover:text-red-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full p-1 ml-2"
                    aria-label="Delete task"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Second row: Description or empty space for consistent layout */}
            <div
                className="text-left ml-1 text-base text-text-secondary line-clamp-2 group relative min-h-[0.5rem]"
                title={task.description}
            >
                {task.description || "No description"}
            </div>

            {/* Assignment + Date in one row */}
            <div className="flex items-center ml-1 gap-4 flex-wrap">
                {/* Assignment */}
                <span
                    className="text-base font-semibold px-2 py-1"
                    style={{
                        color: task.color || "#bdbdbd", // Usa el color real de la tarea
                        borderRadius: "0.5rem",
                        display: "inline-block",
                        minWidth: "20px",
                        textAlign: "left",
                    }}
                >
                    {task.assignment || "No assignment"}
                </span>

                {/* Date */}
                <span className="flex items-center gap-2">
                    <Calendar size={16} className="text-text-secondary" />
                    {!task.completed ? (
                        <span className="text-xs text-blue-400">
                            Deadline:{" "}
                            {new Date(task.deadline).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    ) : (
                        task.completed_at && (
                            <span className="text-xs text-green-400">
                                Completed:{" "}
                                {new Date(task.completed_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                        )
                    )}
                </span>
            </div>
        </div>
    </div>
);

const TaskList = ({ taskDetailsEdit, setIsEditing, setTaskEditing }) => {
    const dispatch = useDispatch();
    const tasks = useSelector((state) => state.tasks.tasks);
    const [user, setUser] = useState(null);
    const [localTasks, setLocalTasks] = useState([]);
    const [showCompleted, setShowCompleted] = useState(false);
    const [showIncomplete, setShowIncomplete] = useState(true);
    const [showTaskMenu, setShowTaskMenu] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [editedTask, setEditedTask] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [sortBy, setSortBy] = useState("default");
    const [showSortMenu, setShowSortMenu] = useState(false);

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
                (payload) => {
                    dispatch(fetchTasks());
                },
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, dispatch]);

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                handleCloseTaskDetails();
            }
        };

        if (selectedTask) {
            window.addEventListener("keydown", handleEscape);
        }

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [selectedTask]);

    // Add effect to handle calendar visibility when modals are shown/hidden
    useEffect(() => {
        if (showTaskMenu || selectedTask) {
            dispatch(setCalendarVisibility(false));
        } else {
            dispatch(setCalendarVisibility(true));
        }
    }, [showTaskMenu, selectedTask, dispatch]);

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
                        : t,
                ),
            );
        } else {
            // Handle remote storage update
            dispatch(toggleTaskStatus(task.id, !task.completed));
            try {
                const { error } = await supabase
                    .from("tasks")
                    .update({ completed: !task.completed })
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
                prevTasks.map((t) => (t.id === task.id ? task : t)),
            );
        } else {
            // Handle remote storage update
            try {
                await dispatch(updateTask(task));
            } catch (error) {
                await dispatch(updateTask(selectedTask));
                console.error("Error updating task:", error);
            }
        }
    };

    const toggleCompletedTasks = () => {
        setShowCompleted(!showCompleted);
    };

    const toggleIncompleteTasks = () => {
        setShowIncomplete(!showIncomplete);
    };

    const handleTaskDoubleClick = (task) => {
        setSelectedTask(task);
        setEditedTask({
            id: task.id,
            title: task.title,
            description: task.description || "",
            deadline: task.deadline,
            completed: task.completed,
            difficulty: task.difficulty,
            assignment: task.assignment || "",
            activetask: task.activetask || false,
            user_id: task.user_id,
            color: task.color,
        });
        setTaskEditing(true);
    };

    const handleCloseTaskDetails = () => {
        setSelectedTask(null);
        setTaskEditing(false);
        setEditedTask(null);
        dispatch(setCalendarVisibility(true));
    };

    const handleOverlayClick = (e) => {
        // Only close if clicking the overlay itself, not its children
        if (e.target === e.currentTarget) {
            if (taskDetailsEdit) {
                setTaskEditing(false);
                setEditedTask(null);
            } else {
                handleCloseTaskDetails();
            }
        }
    };

    const handleStartEditing = () => {
        if (!selectedTask) return;

        setEditedTask({
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description || "",
            deadline: selectedTask.deadline,
            completed: selectedTask.completed,
            difficulty: selectedTask.difficulty,
            assignment: selectedTask.assignment || "",
            activetask: selectedTask.activetask || false,
            user_id: selectedTask.user_id,
            color: task.color,
        });
        setTaskEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            // Optimistic update
            await dispatch(updateTask(editedTask));
            setSelectedTask(editedTask);
            setTaskEditing(false);
            handleCloseTaskDetails(); // Close the modal after saving

            const { error } = await supabase
                .from("tasks")
                .update(editedTask)
                .eq("id", editedTask.id);

            if (error) throw error;
        } catch (error) {
            // Revert on error
            await dispatch(updateTask(selectedTask));
            console.error("Error updating task:", error);
        }
    };

    const handleEditChange = (field, value) => {
        setEditedTask((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleTaskContextMenu = (e, task) => {
        e.preventDefault();
        e.stopPropagation(); // <-- Esto es CLAVE
        // Aquí abres el menú contextual específico del task, si quieres
        setContextMenu({ x: e.clientX, y: e.clientY, task });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleSetActiveTask = async (task) => {
        // Optimistic update
        const updatedTask = { ...task, activetask: true };
        dispatch(updateTask(updatedTask));
        handleCloseContextMenu();

        try {
            // Deactivate other active tasks
            const otherActiveTasks = tasks.filter(
                (t) => t.id !== task.id && t.activetask,
            );
            await Promise.all(
                otherActiveTasks.map((t) =>
                    supabase.from("tasks").update({ activetask: false }).eq("id", t.id),
                ),
            );

            // Activate selected task
            const { error } = await supabase
                .from("tasks")
                .update({ activetask: true })
                .eq("id", task.id);

            if (error) throw error;
        } catch (error) {
            // Revert on error
            dispatch(updateTask(task));
            console.error("Error updating active task:", error);
        }
    };

    // Add click outside listener for context menu
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (contextMenu) {
                handleCloseContextMenu();
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [contextMenu]);

    // Add click outside listener for sort menu
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showSortMenu) {
                const sortMenu = document.querySelector(".sort-menu");
                const sortButton = document.querySelector(".sort-button");
                if (
                    sortMenu &&
                    !sortMenu.contains(e.target) &&
                    !sortButton?.contains(e.target)
                ) {
                    setShowSortMenu(false);
                }
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [showSortMenu]);

    const sortTasks = (tasks) => {
        switch (sortBy) {
            case "assignment":
                return [...tasks].sort((a, b) => {
                    if (!a.assignment && !b.assignment) return 0;
                    if (!a.assignment) return 1;
                    if (!b.assignment) return -1;
                    return a.assignment.localeCompare(b.assignment);
                });
            case "deadline":
                return [...tasks].sort(
                    (a, b) => new Date(a.deadline) - new Date(b.deadline),
                );
            case "difficulty":
                const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
                return [...tasks].sort(
                    (a, b) =>
                        difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty],
                );
            case "alphabetical":
                return [...tasks].sort((a, b) => a.title.localeCompare(b.title));
            default:
                return tasks;
        }
    };

    if (!user) {
        const localCompletedTasks = localTasks.filter((task) => task.completed);
        const localIncompleteTasks = localTasks.filter((task) => !task.completed);

        return (
            <div className="maincard">
                <h2 className="text-2xl font-bold mb-6">Your Tasks (Not syncing)</h2>
                {localIncompleteTasks.length === 0 &&
                    localCompletedTasks.length === 0 && (
                        <div className="plslogin mb-6">
                            You can add tasks but they will be stored locally. If you want to
                            sync your tasks please sign in with your google account
                        </div>
                    )}

                {localIncompleteTasks.length === 0 &&
                    localCompletedTasks.length === 0 ? (
                    <div></div>
                ) : (
                    <>
                        {/* Incomplete Tasks */}
                        {localIncompleteTasks.length > 0 && (
                            <div className="space-y-4 mb-4">
                                <button
                                    className="infomenu mb-3"
                                    onClick={toggleIncompleteTasks}
                                >
                                    <span>Incomplete Tasks ({localIncompleteTasks.length})</span>
                                    {showIncomplete ? (
                                        <ChevronUp size={20} />
                                    ) : (
                                        <ChevronDown size={20} />
                                    )}
                                </button>

                                <div
                                    className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${showIncomplete ? "visible" : "hidden"
                                        }`}
                                >
                                    {sortTasks(localIncompleteTasks).map((task) => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggleCompletion={handleToggleCompletion}
                                            onDelete={handleDeleteTask}
                                            onDoubleClick={handleTaskDoubleClick}
                                            onContextMenu={handleTaskContextMenu}
                                            isEditing={taskDetailsEdit}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Completed Tasks */}
                        {localCompletedTasks.length > 0 && (
                            <div>
                                <button
                                    className="infomenu mb-3"
                                    onClick={toggleCompletedTasks}
                                >
                                    <span>Completed Tasks ({localCompletedTasks.length})</span>
                                    {showCompleted ? (
                                        <ChevronUp size={20} />
                                    ) : (
                                        <ChevronDown size={20} />
                                    )}
                                </button>

                                <div
                                    className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${showCompleted ? "visible" : "hidden"
                                        }`}
                                >
                                    {sortTasks(localCompletedTasks).map((task) => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggleCompletion={handleToggleCompletion}
                                            onDelete={handleDeleteTask}
                                            onDoubleClick={handleTaskDoubleClick}
                                            onContextMenu={handleTaskContextMenu}
                                            isEditing={taskDetailsEdit}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    const userTasks = tasks.filter((task) => task.user_id === user.id);
    const completedTasks = userTasks.filter((task) => task.completed);
    const incompleteTasks = userTasks.filter((task) => !task.completed);

    return (
        <div className="maincard relative">
            <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardCheck size={24} />
                        Your Tasks
                    </h2>
                    <div className="relative">
                        <button
                            onClick={() => {
                                toast.dismiss();
                                setShowSortMenu(!showSortMenu);
                            }}
                            className="sort-button flex items-center gap-2 px-3 py-1.5 bg-neutral-800 text-text-secondary hover:bg-neutral-700 rounded-lg transition-colors duration-200 text-base"
                        >
                            <ArrowUpDown size={16} />
                            Sort by{" "}
                            <span style={{ color: "var(--accent-primary)" }}>
                                {sortBy === "default"
                                    ? "Default"
                                    : sortBy === "assignment"
                                        ? "Assignment"
                                        : sortBy === "deadline"
                                            ? "Deadline"
                                            : sortBy === "difficulty"
                                                ? "Difficulty"
                                                : sortBy === "alphabetical"
                                                    ? "A-Z"
                                                    : ""}
                            </span>
                        </button>
                        {showSortMenu && (
                            <div className="sort-menu absolute right-0 mt-2 w-48 bg-neutral-900 rounded-lg shadow-lg z-10 border border-neutral-800">
                                <button
                                    onClick={() => {
                                        setSortBy("default");
                                        setShowSortMenu(false);
                                    }}
                                    className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${sortBy === "default" ? "bg-neutral-800" : ""
                                        }`}
                                >
                                    Default
                                </button>
                                <button
                                    onClick={() => {
                                        setSortBy("assignment");
                                        setShowSortMenu(false);
                                    }}
                                    className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${sortBy === "assignment" ? "bg-neutral-800" : ""
                                        }`}
                                >
                                    Assignment
                                </button>
                                <button
                                    onClick={() => {
                                        setSortBy("deadline");
                                        setShowSortMenu(false);
                                    }}
                                    className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${sortBy === "deadline" ? "bg-neutral-800" : ""
                                        }`}
                                >
                                    Deadline
                                </button>
                                <button
                                    onClick={() => {
                                        setSortBy("difficulty");
                                        setShowSortMenu(false);
                                    }}
                                    className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${sortBy === "difficulty" ? "bg-neutral-800" : ""
                                        }`}
                                >
                                    Difficulty
                                </button>
                                <button
                                    onClick={() => {
                                        setSortBy("alphabetical");
                                        setShowSortMenu(false);
                                    }}
                                    className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${sortBy === "alphabetical" ? "bg-neutral-800" : ""
                                        }`}
                                >
                                    Alphabetical
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {selectedAssignment && (
                    <span className="text-lg text-gray-400">{selectedAssignment}</span>
                )}
            </div>

            {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
                <div className="plslogin">You have no tasks at the moment.</div>
            ) : (
                <>
                    {/* Incomplete Tasks */}
                    {incompleteTasks.length > 0 && (
                        <div className="space-y-4 mb-4">
                            <button className="infomenu mb-3" onClick={toggleIncompleteTasks}>
                                <span>Incomplete Tasks ({incompleteTasks.length})</span>
                                {showIncomplete ? (
                                    <ChevronUp size={20} />
                                ) : (
                                    <ChevronDown size={20} />
                                )}
                            </button>

                            <div
                                className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${showIncomplete ? "visible" : "hidden"
                                    }`}
                            >
                                {sortTasks(incompleteTasks).map((task) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onToggleCompletion={handleToggleCompletion}
                                        onDelete={handleDeleteTask}
                                        onDoubleClick={handleTaskDoubleClick}
                                        onContextMenu={handleTaskContextMenu}
                                        isEditing={taskDetailsEdit}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Tasks */}
                    {completedTasks.length > 0 && (
                        <div>
                            <button className="infomenu mb-3" onClick={toggleCompletedTasks}>
                                <span>Completed Tasks ({completedTasks.length})</span>
                                {showCompleted ? (
                                    <ChevronUp size={20} />
                                ) : (
                                    <ChevronDown size={20} />
                                )}
                            </button>

                            <div
                                className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${showCompleted ? "visible" : "hidden"
                                    }`}
                            >
                                {sortTasks(completedTasks).map((task) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onToggleCompletion={handleToggleCompletion}
                                        onDelete={handleDeleteTask}
                                        onDoubleClick={handleTaskDoubleClick}
                                        onContextMenu={handleTaskContextMenu}
                                        isEditing={taskDetailsEdit}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Task Details Modal */}
                    {selectedTask && (
                        <TaskDetailsModal
                            selectedTask={selectedTask}
                            editedTask={editedTask}
                            isEditing={true}
                            onClose={handleCloseTaskDetails}
                            onEdit={(value) => {
                                setTaskEditing(value);
                                if (!value) {
                                    setEditedTask(null);
                                }
                            }}
                            onSave={handleSaveEdit}
                            onDelete={handleDeleteTask}
                            onToggleCompletion={handleToggleCompletion}
                            onSetActiveTask={(task) => {
                                dispatch(updateTask(task));
                                handleCloseTaskDetails();
                            }}
                            onEditChange={handleEditChange}
                        />
                    )}

                    {/* Context Menu */}
                    {contextMenu && (
                        <div
                            className="fixed bg-neutral-900 p-2 rounded-lg shadow-lg z-50 border border-neutral-800"
                            style={{
                                left: contextMenu.x,
                                top: contextMenu.y,
                            }}
                        >
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        handleTaskDoubleClick(contextMenu.task);
                                        handleCloseContextMenu();
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 rounded-md flex items-center gap-2"
                                >
                                    <Info size={16} />
                                    Task Info
                                </button>
                                {contextMenu.task.activetask ? (
                                    <button
                                        onClick={() => {
                                            const updatedTask = {
                                                ...contextMenu.task,
                                                activetask: false,
                                            };
                                            dispatch(updateTask(updatedTask));
                                            handleCloseContextMenu();
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-yellow-500 hover:bg-neutral-800 rounded-md flex items-center gap-2"
                                    >
                                        <Play size={16} className="rotate-180" />
                                        Deactivate Task
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSetActiveTask(contextMenu.task)}
                                        className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 rounded-md flex items-center gap-2"
                                    >
                                        <Play size={16} />
                                        Set as Active Task
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        handleDeleteTask(contextMenu.task.id);
                                        handleCloseContextMenu();
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-neutral-800 rounded-md flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete Task
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TaskList;
