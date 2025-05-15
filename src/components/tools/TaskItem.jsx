import React from "react";
import { CheckCircle2, Circle, Calendar, Trash2 } from "lucide-react";

const assignmentColors = {
    "Assignment 1": "#FF5733",
    "Assignment 2": "#33FF57",
    "Assignment 3": "#3357FF",
};

export const TaskItem = ({
    task,
    onToggleCompletion,
    onDelete,
    onDoubleClick,
    onContextMenu,
}) => (
    <div
        className={`relative p-4 rounded-xl shadow-md transition-all duration-300 border-2 hover:shadow-lg ${
            task.activetask
                ? task.difficulty === "easy"
                    ? "border-2 border-green-500"
                    : task.difficulty === "medium"
                        ? "border-2 border-blue-500"
                        : "border-2 border-red-500"
                : "border border-border-primary"
        }`}
        onDoubleClick={() => onDoubleClick(task)}
        onContextMenu={(e) => onContextMenu(e, task)}
        tabIndex={0} // Para accesibilidad si quieres
        role="listitem"
    >
        <div className="flex flex-col gap-2">
            {/* First row: Checkbox and Title */}
            <div className="flex items-center mt-1">
                <button
                    onClick={() => onToggleCompletion(task)}
                    className="bg-transparent border-none cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full group"
                    aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    {task.completed ? (
                        <CheckCircle2 className="text-accent-primary" size={24} />
                    ) : (
                        <Circle
                            className={
                                task.difficulty === "easy"
                                    ? "text-green-500"
                                    : task.difficulty === "medium"
                                        ? "text-[var(--accent-primary)]"
                                        : "text-red-500"
                            }
                            size={24}
                        />
                    )}
                </button>
                <button
                    onClick={() => onDoubleClick(task)}
                    className="flex items-center focus:outline-none flex-1"
                >
                    <span
                        className={`text-left ml-2 font-medium text-lg transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-2 ${
                            task.completed
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
            <div className="flex items-center ml-1 gap-4 flex-wrap justify-between w-full">
                {/* Assignment */}
                <span
                    className="text-base font-semibold"
                    style={{
                        color: assignmentColors[task.assignment] || "#bdbdbd",
                        borderRadius: "0.5rem",
                        display: "inline-block",
                        minWidth: "20px",
                        textAlign: "left",
                    }}
                >
                    {task.assignment || "No assignment"}
                </span>

                {/* Date */}
                <span className="flex items-center gap-2 ml-auto">
                    {!task.completed ? (
                        <span className="deadline">
                            Deadline:{" "}
                            {new Date(task.deadline).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    ) : (
                        task.completed_at && (
                            <span className="text-base text-green-400">
                                Completed:{" "}
                                {new Date(task.completed_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                        )
                    )}
                    <Calendar size={16} className="text-text-secondary" />
                </span>
            </div>
        </div>
    </div>
);
