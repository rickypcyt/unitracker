import { Calendar, CheckCircle2, Circle, Clock, Trash2 } from "lucide-react";

import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { formatDate } from '../../utils/dateUtils';
import { useSortable } from "@dnd-kit/sortable";

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
                return 'text-[#FF003C]'; /* Neon red */
            case 'medium':
                return 'text-[#FFD700]'; /* Neon yellow */
            case 'low':
                return 'text-[#00FF41]'; /* Matrix green */
            default:
                return 'text-[var(--text-secondary)]';
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                return 'text-[#00FF41]'; /* Matrix green */
            case 'medium':
                return 'text-[#1E90FF]'; /* Electric neon blue */
            case 'hard':
                return 'text-[#FF003C]'; /* Neon red */
            default:
                return 'text-[var(--text-secondary)]';
        }
    };

    return (
        <div className="relative">
            {/* Draggable Area */}
            <div
                className={`relative
                    p-3
                    rounded-lg
                    transition-all
                    duration-200
                    border-2
                    backdrop-blur-sm
                    cursor-pointer
                    group
                    ${isSelected 
                        ? "bg-[var(--bg-secondary)] border-[var(--accent-primary)]/50 hover:bg-[var(--bg-secondary)]/80"
                        : task.activetask
                            ? "task-item-active hover:bg-[var(--bg-secondary)]/80"
                            : "bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/80"
                    }`}
                data-difficulty={task.activetask ? task.difficulty?.toLowerCase() : undefined}
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
                    {/* First row: Title */}
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5" /> {/* Spacer for the toggle button */}
                        <div className="flex-1 min-w-0">
                            <span
                                className={`block font-medium text-base transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-2 ${
                                    task.completed
                                        ? "line-through text-[var(--text-secondary)]"
                                        : "text-[var(--text-primary)]"
                                }`}
                                title={task.title}
                            >
                                {task.title}
                            </span>
                        </div>
                    </div>

                    {/* Second row: Metadata */}
                    <div className="flex items-center justify-between text-base text-[var(--text-secondary)]">
                        <div className="flex items-center gap-3">
                            {task.deadline && (
                                <div className="flex items-center gap-1">
                                    <Calendar size={18} className="text-[var(--text-secondary)]" />
                                    <span>{formatDate(task.deadline)}</span>
                                </div>
                            )}
                            {task.priority && (
                                <div className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                    <Clock size={14} />
                                    <span className="capitalize">{task.priority}</span>
                                </div>
                            )}
                        </div>
                        <div className="w-5 h-5" /> {/* Spacer for the delete button */}
                    </div>
                </div>
            </div>

            {/* Action Buttons (rendered on top) */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="flex flex-col h-full">
                    {/* Toggle Button */}
                    <div className="flex items-start p-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onToggleCompletion(task.id);
                            }}
                            className="bg-transparent border-none cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 rounded-full group-hover:scale-110 transition-transform duration-200 pointer-events-auto"
                            aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                            {task.completed ? (
                                <CheckCircle2 className="text-[var(--accent-primary)]" size={20} strokeWidth={2.5} />
                            ) : (
                                <Circle
                                    className={getDifficultyColor(task.difficulty)}
                                    size={20}
                                    strokeWidth={2.5}
                                />
                            )}
                        </button>
                    </div>

                    {/* Delete Button */}
                    <div className="flex-1 flex items-end justify-end p-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onDelete(task.id);
                            }}
                            className="hover:text-red-500 pointer-events-auto text-[var(--text-secondary)]"
                            aria-label="Delete task"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
