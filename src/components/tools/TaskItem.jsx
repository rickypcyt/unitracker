import React from "react";
import { CheckCircle2, Circle, Calendar, Trash2, Clock } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const TaskItem = ({
    task,
    onToggleCompletion,
    onDelete,
    onDoubleClick,
    onContextMenu,
    onEditTask,
    assignmentId,
    isSelected = false
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: task.id,
        data: {
            type: 'task',
            task: task,
            assignment: assignmentId,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'text-red-500';
            case 'medium':
                return 'text-yellow-500';
            case 'low':
                return 'text-green-500';
            default:
                return 'text-neutral-400';
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                return 'text-green-500';
            case 'medium':
                return 'text-[var(--accent-primary)]';
            case 'hard':
                return 'text-red-500';
            default:
                return 'text-neutral-400';
        }
    };

    return (
        <div
            className={`relative
                p-3
                rounded-lg
                transition-all
                duration-200
                border
                hover:shadow-lg
                backdrop-blur-sm
                cursor-pointer
                group
                ${isSelected 
                    ? "bg-blue-500/20 border-blue-500/50 hover:border-blue-500/70"
                    : task.activetask
                        ? task.difficulty === "easy"
                            ? "bg-green-500/10 border-green-500/30 hover:border-green-500/50"
                            : task.difficulty === "medium"
                                ? "bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50"
                                : "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                        : "bg-neutral-800/20 border-neutral-700/30 hover:border-neutral-700/50"
                }`}
            onDoubleClick={() => onDoubleClick(task)}
            onContextMenu={(e) => onContextMenu(e, task)}
            tabIndex={0}
            role="listitem"
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <div className="flex flex-col gap-3">
                {/* First row: Checkbox and Title */}
                <div className="flex items-start gap-3">
                    <button
                        onClick={() => onToggleCompletion(task)}
                        className="bg-transparent border-none cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full group-hover:scale-110 transition-transform duration-200"
                        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                        {task.completed ? (
                            <CheckCircle2 className="text-accent-primary" size={20} />
                        ) : (
                            <Circle
                                className={getDifficultyColor(task.difficulty)}
                                size={20}
                            />
                        )}
                    </button>
                    <div className="flex-1 min-w-0">
                        <span
                            className={`block font-medium text-base transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-2 ${
                                task.completed
                                    ? "line-through text-neutral-400"
                                    : "text-neutral-200"
                            }`}
                            title={task.title}
                        >
                            {task.title}
                        </span>
                    </div>
                </div>

                {/* Second row: Metadata */}
                <div className="flex items-center justify-between text-base text-neutral-400">
                    <div className="flex items-center gap-3">
                        {task.deadline && (
                            <div className="flex items-center gap-1">
                                <Calendar size={18} />
                                <span>{new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                        )}
                        {task.priority && (
                            <div className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                <Clock size={14} />
                                <span className="capitalize">{task.priority}</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => onDelete(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-red-500"
                        aria-label="Delete task"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
