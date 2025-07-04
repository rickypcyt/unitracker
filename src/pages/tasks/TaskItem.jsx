import { Calendar, CheckCircle2, Circle, Clock, Trash2 } from "lucide-react";
import { formatDate, formatDateShort, isToday, isTomorrow } from '@/utils/dateUtils';

import React from "react";

// Helper para saber si la fecha es pasada
const isPast = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < now;
};

export const TaskItem = ({
    task,
    onToggleCompletion,
    onDelete,
    onEditTask,
    onContextMenu,
    assignmentId,
    isSelected = false,
    showAssignment = false,
    assignmentLeftOfDate = false
}) => {
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

    const handleToggleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggleCompletion(task.id);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        onDelete(task.id);
    };

    const handleDoubleClick = () => {
        onEditTask(task);
    };

    // Helper para el label de hoy/mañana
    const renderDateLabel = (deadline) => {
        if (isToday(deadline)) {
            return <span className="text-green-500 ml-1">(Today)</span>;
        }
        if (isTomorrow(deadline)) {
            return <span className="text-blue-500 ml-1">(Tomorrow)</span>;
        }
        return null;
    };

    return (
        <div
            className="relative flex p-3 py-4 pr-10 md:pr-12 rounded-lg bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] hover:border-[#444] dark:hover:border-[#444] transition-colors cursor-pointer gap-3"
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => onContextMenu(e, task)}
            tabIndex={0}
            role="listitem"
        >
            {/* Botón de eliminar en la esquina superior derecha */}
            <button
                onClick={handleDeleteClick}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 md:top-3 md:right-3 hover:text-red-500 text-[var(--text-secondary)] transition-colors duration-200 z-20 bg-transparent border-none p-1 rounded-full"
                aria-label="Delete task"
            >
                <Trash2 size={22} />
            </button>
            <div className="flex flex-col justify-between items-center py-0.5">
                <button
                    onClick={handleToggleClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="bg-transparent border-none cursor-pointer flex items-center mr-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 rounded-full transition-transform duration-200 hover:scale-110"
                    aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    {task.completed ? (
                        <CheckCircle2 className="text-[var(--accent-primary)]" size={22} strokeWidth={2.2} />
                    ) : (
                        <Circle className={getDifficultyColor(task.difficulty)} size={22} strokeWidth={2.2} />
                    )}
                </button>
            </div>
            {/* Contenido principal */}
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
                        <span className="text-[var(--text-secondary)] text-md mt-0.5">
                            {task.description}
                        </span>
                    )}
                </div>
                {/* Prioridad, assignment, fecha abajo */}
                <div className="flex items-center gap-2 mt-1 w-full">
                    {task.priority && (
                        <div className={`flex items-center gap-1 text-md ${getPriorityColor(task.priority)}`}> 
                            <Clock size={11} />
                            <span className="capitalize">{task.priority}</span>
                        </div>
                    )}
                    {!assignmentLeftOfDate && showAssignment && task.assignment && (
                        <div className="text-[var(--accent-primary)] text-md font-semibold capitalize text-right">
                            {task.assignment}
                        </div>
                    )}
                    <div className="text-base text-[var(--text-secondary)]">
                        <span>
                          {task.deadline && task.deadline !== '' ? (
                            <>
                              <span className={isPast(task.deadline) ? 'text-red-500' : ''}>
                                {formatDateShort(task.deadline)}
                              </span>
                              {renderDateLabel(task.deadline)}
                            </>
                          ) : 'No Deadline'}
                        </span>
                    </div>
                    <div className="flex-1" />
                </div>
            </div>
        </div>
    );
};
