import { CheckCircle2, Circle, Clock, Loader, Pause, Pencil, Play, Trash2, Zap } from "lucide-react";
import { formatDateShort, getTimeRemainingString, isToday, isTomorrow, parseDateFromString } from '@/utils/dateUtils';

import React from 'react';
import { Task } from '@/types/taskStorage';
import { to12Hour } from '@/utils/timeUtils';

// Helper para formatear días de recurrencia
const formatRecurrenceText = (weekdays: number[]) => {
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDays = weekdays.map(day => weekdayNames[day]);
    
    if (selectedDays.length === 0) return '';
    if (selectedDays.length === 1) return `Every ${selectedDays[0]}`;
    if (selectedDays.length === 7) return 'Every day';
    
    // Para múltiples días, mostrarlos separados por comas
    return `Every ${selectedDays.join(', ')}`;
};

// Helper para formatear tiempo reutilizando la lógica del formulario
const formatTime = (timeStr: string | undefined | null) => {
    if (!timeStr) return '';
    return to12Hour(timeStr);
};

// Helper para determinar el color del deadline
const getDeadlineColor = (dateStr: string) => {
    if (!dateStr) return 'text-[var(--text-secondary)]'; // No deadline

    const date = parseDateFromString(dateStr);
    if (!date) return 'text-[var(--text-secondary)]';
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Get start of current week (Monday)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
    startOfWeek.setDate(today.getDate() - diffToMonday);

    // Get end of current week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Get start of next week (Monday)
    const startOfNextWeek = new Date(startOfWeek);
    startOfNextWeek.setDate(startOfWeek.getDate() + 7);

    if (date < today) {
        // Overdue - Red
        return 'text-red-500';
    } else if (date >= startOfWeek && date <= endOfWeek) {
        // This week (Monday-Sunday) - Yellow
        return 'text-yellow-500';
    } else if (date >= startOfNextWeek) {
        // Next week or later - Secondary text color
        return 'text-[var(--text-secondary)]';
    } else {
        // Between end of this week and start of next week (shouldn't happen but fallback)
        return 'text-[var(--text-secondary)]';
    }
};

interface TaskItemProps {
    task: Task;
    onToggleCompletion: (id: string) => void;
    onDelete?: (id: string) => void;
    onEditTask: (task: Task) => void;
    onViewTask?: ((task: Task) => void) | undefined; // New: for viewing task details
    onContextMenu: (e: React.MouseEvent, task: Task) => void;
    showAssignment?: boolean;
    assignmentLeftOfDate?: boolean;
    active?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
    task,
    onToggleCompletion,
    onDelete,
    onEditTask,
    onViewTask,
    onContextMenu,
    showAssignment = false
}) => {
    const getDifficultyColor = (difficulty: string, type: 'text' | 'bg' | 'border' = 'text') => {
        // type: 'text' | 'bg' | 'border'
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                if (type === 'bg') return 'bg-green-500/15';
                if (type === 'border') return 'border-green-500';
                return 'text-[#00FF41]';
            case 'medium':
                if (type === 'bg') return 'bg-blue-500/15';
                if (type === 'border') return 'border-blue-500';
                return 'text-[#00BFFF]';
            case 'hard':
                if (type === 'bg') return 'bg-red-500/15';
                if (type === 'border') return 'border-red-500';
                return 'text-[#FF003C]';
            default:
                if (type === 'bg') return 'bg-[var(--bg-secondary)]';
                if (type === 'border') return 'border-[var(--border-primary)]';
                return 'text-[var(--text-secondary)]';
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'Easy';
            case 'medium': return 'Medium';
            case 'hard': return 'Hard';
            default: return '';
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'in_progress':
                return <Loader size={13} className="text-yellow-500 animate-spin" strokeWidth={2.5} />;
            case 'on_hold':
                return <Pause size={13} className="text-blue-500" strokeWidth={2.5} />;
            case 'active':
                return <Play size={13} className="text-green-500" strokeWidth={2.5} />;
            default:
                return null;
        }
    };

    const getDeadlineProgress = (deadline: string) => {
        if (!deadline) return null;
        const date = parseDateFromString(deadline);
        if (!date) return null;
        const now = new Date();
        const created = task.created_at ? new Date(task.created_at) : null;
        const totalSpan = created ? date.getTime() - created.getTime() : 14 * 24 * 60 * 60 * 1000;
        const elapsed = now.getTime() - (created ? created.getTime() : now.getTime());
        const remaining = totalSpan - elapsed;
        const pct = Math.max(0, Math.min(100, (remaining / totalSpan) * 100));
        return pct;
    };

    const getProgressBarColor = (pct: number) => {
        if (pct <= 15) return 'bg-red-500';
        if (pct <= 40) return 'bg-yellow-500';
        if (pct <= 70) return 'bg-blue-500';
        return 'bg-green-500';
    };

    const getStatusBorderColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'in_progress':
                return 'border-yellow-500';
            case 'on_hold':
                return 'border-blue-500';
            case 'active':
                return 'border-green-500';
            case 'not_started':
                return 'border-[var(--border-primary)]';
            default:
                return 'border-[var(--border-primary)]';
        }
    };

    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onToggleCompletion(task.id);
    };


    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling to parent
        // If onViewTask is provided, use it; otherwise fallback to onEditTask for backward compatibility
        if (onViewTask) {
            onViewTask(task);
        } else {
            onEditTask(task);
        }
    };

    // Helper para el label de hoy/mañana
    const renderDateLabel = (deadline: string) => {
        if (isToday(deadline)) {
            return <span className="text-green-500 ml-1">(Today)</span>;
        }
        if (isTomorrow(deadline)) {
            return <span className="text-yellow-500 ml-1">(Tomorrow)</span>;
        }
        return null;
    };
    
    // Helper para verificar si la tarea es para hoy (sin importar la hora)
    const isTaskForToday = (dateStr: string) => {
        if (!dateStr) return false;
        const taskDate = parseDateFromString(dateStr);
        if (!taskDate) return false;
        const today = new Date();
        return (
            taskDate.getDate() === today.getDate() &&
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getFullYear() === today.getFullYear()
        );
    };

    
    const deadlineProgress = task.deadline ? getDeadlineProgress(task.deadline) : null;
    const difficultyLabel = getDifficultyLabel(task.difficulty || '');
    const statusIcon = getStatusIcon(task.status);

    return (
        <div
            className={`group relative flex p-3 rounded-lg transition-all duration-200 cursor-pointer gap-2.5 items-center
                bg-[var(--bg-primary)] border border-[var(--border-primary)]
                hover:border-[var(--accent-primary)]/40 hover:shadow-md hover:shadow-black/30
                ${getStatusBorderColor(task.status)} border-l-[3px]
                ${task.completed ? 'opacity-50' : ''}
            `}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => onContextMenu(e, task)}
            tabIndex={0}
            role="listitem"
        >
            {/* Contenido principal */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                {/* Assignment above title when showAssignment is true (calendar view) */}
                {showAssignment && task.assignment && (
                    <div className="text-[var(--accent-primary)] text-base font-semibold capitalize mb-0.5">
                        {task.assignment}
                    </div>
                )}

                {/* Title row with badges */}
                <div className="flex items-center gap-1.5 min-w-0">
                    {statusIcon && !task.completed && (
                        <span className="flex-shrink-0 flex items-center justify-center">
                            {statusIcon}
                        </span>
                    )}
                    <span
                        className={`block font-medium text-base transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-1 ${
                            task.completed
                                ? "line-through text-[var(--text-secondary)]"
                                : "text-[var(--text-primary)]"
                        }`}
                        title={task.title}
                    >
                        {task.title}
                    </span>
                    {difficultyLabel && !task.completed && (
                        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${getDifficultyColor(task.difficulty || 'medium', 'bg')} ${getDifficultyColor(task.difficulty || 'medium')}`}>
                            {difficultyLabel}
                        </span>
                    )}
                </div>

                {/* Date/Recurrence + Progress bar */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--muted-strong)' }}>
                        {task.recurrence_type === 'weekly' && task.recurrence_weekdays && task.recurrence_weekdays.length > 0 ? (
                            <span className="text-[var(--text-secondary)] flex items-center gap-1">
                                <Zap size={13} className="flex-shrink-0" />
                                {formatRecurrenceText(task.recurrence_weekdays)}
                                {task.start_at && (
                                    <span className="ml-0.5">
                                        {formatTime(task.start_at)}
                                        {task.end_at && ` - ${formatTime(task.end_at)}`}
                                    </span>
                                )}
                            </span>
                        ) : task.deadline && task.deadline !== '' ? (
                            <span className={`flex items-center gap-1 ${isTaskForToday(task.deadline) ? 'text-green-500' : getDeadlineColor(task.deadline)}`}>
                                <Clock size={13} className="flex-shrink-0" />
                                {isTaskForToday(task.deadline) ? 'Today' : formatDateShort(task.deadline)}
                                {task.start_at && (
                                    <span className="ml-0.5">
                                        {formatTime(task.start_at)}
                                        {task.end_at && ` - ${formatTime(task.end_at)}`}
                                    </span>
                                )}
                                {!isTaskForToday(task.deadline) && (
                                    <span className="ml-0.5 opacity-80">({getTimeRemainingString(task.deadline)})</span>
                                )}
                                {renderDateLabel(task.deadline)}
                            </span>
                        ) : <span className="text-[var(--text-secondary)] opacity-60">No deadline</span>}
                    </div>

                    {/* Deadline progress bar */}
                    {deadlineProgress !== null && !task.completed && (
                        <div className="h-1 w-full rounded-full bg-[var(--bg-primary)] overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(deadlineProgress)}`}
                                style={{ width: `${deadlineProgress}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Right side: complete button + hover actions */}
            <div className="flex items-center justify-center gap-0.5 flex-shrink-0">
                {/* Hover quick actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEditTask(task); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Edit task"
                        aria-label="Edit task"
                    >
                        <Pencil size={16} />
                    </button>
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(task.id); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                            title="Delete task"
                            aria-label="Delete task"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Complete toggle button */}
                <button
                    onClick={handleToggleClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="bg-transparent border-none cursor-pointer flex items-center justify-center focus:outline-none rounded-full transition-transform duration-200 hover:scale-110 h-8 w-8"
                    aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    {task.completed ? (
                        <CheckCircle2 className="text-[var(--accent-primary)]" size={22} strokeWidth={2.2} />
                    ) : (
                        <Circle className={getDifficultyColor(task.difficulty || 'medium')} size={22} strokeWidth={2.2} />
                    )}
                </button>
            </div>
        </div>
    );
};