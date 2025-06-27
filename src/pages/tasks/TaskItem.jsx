import { Calendar, CheckCircle2, Circle, Clock, Trash2 } from "lucide-react";
import { formatDate, formatDateShort } from '@/utils/dateUtils';

import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";

export const TaskItem = ({
    task,
    onToggleCompletion,
    onDelete,
    onDoubleClick,
    onContextMenu,
    onEditTask,
    assignmentId,
    isSelected = false,
    showAssignment = false
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
        <div
            className="flex p-1.5 rounded-lg bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] hover:border-[var(--border-primary)]/70 transition-colors cursor-pointer gap-1"
            onDoubleClick={() => onDoubleClick(task)}
            onContextMenu={(e) => onContextMenu(e, task)}
            tabIndex={0}
            role="listitem"
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <div className="flex flex-col justify-between items-center py-0.5">
                <button
                    onClick={e => { e.stopPropagation(); onToggleCompletion(task.id); }}
                    className="bg-transparent border-none cursor-pointer flex items-center mr-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 rounded-full transition-transform duration-200"
                    aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    {task.completed ? (
                        <CheckCircle2 className="text-[var(--accent-primary)]" size={18} strokeWidth={2.2} />
                    ) : (
                        <Circle className={getDifficultyColor(task.difficulty)} size={18} strokeWidth={2.2} />
                    )}
                </button>
            </div>
            {/* Contenido principal y trash juntos */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                {/* Título y descripción arriba */}
                <div>
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
                    {task.description && (
                        <span className="text-[var(--text-secondary)] text-md mt-0.5 truncate">
                            {task.description}
                        </span>
                    )}
                </div>
                {/* Prioridad, assignment, fecha y trash abajo */}
                <div className="flex items-center gap-2 mt-1 w-full">
                    <div className="text-sm text-[var(--text-secondary)]">
                        {task.deadline && (
                            <span>{formatDateShort(task.deadline)}</span>
                        )}
                    </div>
                    {task.priority && (
                        <div className={`flex items-center gap-1 text-md ${getPriorityColor(task.priority)}`}> 
                            <Clock size={11} />
                            <span className="capitalize">{task.priority}</span>
                        </div>
                    )}
                    {showAssignment && task.assignment && (
                        <div className="text-[var(--accent-primary)] text-md font-semibold capitalize text-right">
                            {task.assignment}
                        </div>
                    )}
                    <div className="flex-1" />
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(task.id); }}
                        className="hover:text-red-500 text-[var(--text-secondary)]"
                        aria-label="Delete task"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
