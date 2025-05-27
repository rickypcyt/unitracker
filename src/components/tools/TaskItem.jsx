import React from "react";
import { CheckCircle2, Circle, Calendar, Trash2 } from "lucide-react";

export const TaskItem = ({
    task,
    onToggleCompletion,
    onDelete,
    onDoubleClick,
    onContextMenu,
}) => (
    <div
        className={`relative
            ml-2
            mr-2
            p-2
            rounded-lg
            shadow-sm
            transition-all
            duration-200
            border
            hover:shadow-md ${task.activetask
                ? task.difficulty === "easy"
                    ? "border-green-500"
                    : task.difficulty === "medium"
                        ? "border-blue-500"
                        : "border-red-500"
                : "border-border-primary"
            }`}
        onDoubleClick={() => onDoubleClick(task)}
        onContextMenu={(e) => onContextMenu(e, task)}
        tabIndex={0}
        role="listitem"
    >
        <div className="flex flex-col gap-1">
            {/* First row: Checkbox and Title */}
            <div className="flex items-center">
                <button
                    onClick={() => onToggleCompletion(task)}
                    className="bg-transparent border-none cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full group"
                    aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    {task.completed ? (
                        <CheckCircle2 className="text-accent-primary" size={20} />
                    ) : (
                        <Circle
                            className={
                                task.difficulty === "easy"
                                    ? "text-green-500"
                                    : task.difficulty === "medium"
                                        ? "text-[var(--accent-primary)]"
                                        : "text-red-500"
                            }
                            size={20}
                        />
                    )}
                </button>
                <button
                    onClick={() => onDoubleClick(task)}
                    className="flex items-center focus:outline-none flex-1"
                >
                    <span
                        className={`text-left ml-2 font-medium text-sm transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-1 ${task.completed
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
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Second row: Description */}
            {task.description && (
                <div
                    className="text-left ml-1 text-sm text-text-secondary line-clamp-1 group relative min-h-[0.5rem]"
                    title={task.description}
                >
                    {task.description}
                </div>
            )}

            {/* Third row: Assignment + Date */}
            <div className="flex items-center ml-1 gap-2 flex-wrap justify-between w-full text-xs">
                {/* Assignment */}
                <span
                    className="text-text-secondary"
                    style={{
                        borderRadius: "0.5rem",
                        display: "inline-block",
                        minWidth: "20px",
                        textAlign: "left",
                    }}
                >
                    {task.assignment || "No assignment"}
                </span>

                {/* Date */}
                <span className="flex items-center gap-1 ml-auto">
                    {!task.completed ? (
                        <span className="text-text-secondary">
                            {new Date(task.deadline).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    ) : (
                        task.completed_at && (
                            <span className="text-green-400">
                                {new Date(task.completed_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                        )
                    )}
                    <Calendar size={14} className="text-text-secondary" />
                </span>
            </div>
        </div>
    </div>
);
