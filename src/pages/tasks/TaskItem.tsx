import { CheckCircle2, Circle, Pencil, Trash2, Zap } from "lucide-react";
import { formatDateShort, getTimeRemainingString, parseDateFromString } from '@/utils/dateUtils';

import React from 'react';
import { Task } from '@/types/taskStorage';
import TaskStatusPicker from '@/pages/tasks/TaskStatusPicker';
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

// Helper para formatear rangos de tiempo de forma compacta: "8–9 AM" en vez de "08:00 AM - 09:00 AM"
const formatTimeRange = (startStr: string | undefined | null, endStr: string | undefined | null) => {
    if (!startStr) return '';
    const start12 = to12Hour(startStr);
    if (!endStr) return start12;
    const end12 = to12Hour(endStr);
    const startPeriod = start12.split(' ')[1] || '';
    const endPeriod = end12.split(' ')[1] || '';
    const startHM = start12.split(' ')[0] || '';
    const endHM = end12.split(' ')[0] || '';
    const startHour = startHM.split(':')[0] || '';
    const startMin = startHM.split(':')[1] || '';
    const endHour = endHM.split(':')[0] || '';
    const endMin = endHM.split(':')[1] || '';
    if (startPeriod === endPeriod) {
        const startLabel = startMin === '00' ? startHour : `${startHour}:${startMin}`;
        const endLabel = endMin === '00' ? endHour : `${endHour}:${endMin}`;
        return `${startLabel}\u2013${endLabel} ${startPeriod}`;
    }
    const startLabel = startMin === '00' ? `${startHour} ${startPeriod}` : `${startHM} ${startPeriod}`;
    const endLabel = endMin === '00' ? `${endHour} ${endPeriod}` : `${endHM} ${endPeriod}`;
    return `${startLabel} \u2013 ${endLabel}`;
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

    // Helper para extraer YYYY-MM-DD de un date string sin conversión de zona horaria
    const getDateOnlyString = (dateStr: string): string | null => {
        if (!dateStr) return null;
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
        // DD/MM/YYYY format
        const slashMatch = dateStr.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
        if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[3]) {
            return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
        }
        return null;
    };

    // Helper para verificar si la tarea es para hoy (sin importar la hora)
    const isTaskForToday = (dateStr: string) => {
        if (!dateStr) return false;
        const dateOnly = getDateOnlyString(dateStr);
        if (!dateOnly) return false;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return dateOnly === todayStr;
    };

    
    const chip = "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-medium whitespace-nowrap";
    const deadlineColor = task.deadline && task.deadline !== ''
        ? (isTaskForToday(task.deadline) ? 'text-green-500' : getDeadlineColor(task.deadline))
        : 'text-[var(--text-secondary)]';

    return (
        <div
            className={`group relative grid grid-cols-[auto_minmax(0,1fr)] p-2.5 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer gap-2.5 sm:gap-3 items-stretch
                bg-[var(--bg-primary)] border border-[var(--border-primary)]
                ${task.completed ? 'opacity-50' : ''}
            `}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => onContextMenu(e, task)}
            tabIndex={0}
            role="listitem"
        >
            {/* Left side: complete toggle */}
            <div className="col-start-1 row-start-1 flex items-center self-stretch flex-shrink-0">
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

            {/* Contenido principal */}
            <div className="col-start-2 row-start-1 min-w-0 flex flex-col justify-center gap-1.5">
                {/* Assignment above title when showAssignment is true (calendar view) */}
                {showAssignment && task.assignment && (
                    <div className="text-[var(--accent-primary)] text-sm font-semibold uppercase tracking-wide truncate">
                        {task.assignment}
                    </div>
                )}

                {/* Row 1: Title + actions */}
                <div className="w-full flex items-center justify-between gap-2">
                    <span
                        className={`min-w-0 flex-1 font-semibold text-base leading-snug transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-1 ${
                            task.completed
                                ? "line-through text-[var(--text-secondary)]"
                                : "text-[var(--text-primary)]"
                        }`}
                        title={task.title}
                    >
                        {task.title}
                    </span>
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-40 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEditTask(task); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="p-1 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            title="Edit task"
                            aria-label="Edit task"
                        >
                            <Pencil size={14} />
                        </button>
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(task.id); }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="p-1 rounded-md hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                                title="Delete task"
                                aria-label="Delete task"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Row 2: meta chips — deadline / recurrence / time */}
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0">
                {task.recurrence_type === 'weekly' && task.recurrence_weekdays && task.recurrence_weekdays.length > 0 ? (
                    <>
                        <span className={`${chip} text-[var(--accent-primary)]`} style={{ backgroundColor: 'color-mix(in srgb, currentColor 10%, transparent)' }}>
                            <Zap size={13} className="flex-shrink-0" />
                            <span className="truncate max-w-[12rem]">{formatRecurrenceText(task.recurrence_weekdays)}</span>
                        </span>
                        {task.start_at && (
                            <span className={`${chip} text-[var(--text-secondary)] bg-[var(--bg-secondary)]`}>
                                {formatTimeRange(task.start_at, task.end_at)}
                            </span>
                        )}
                    </>
                ) : task.deadline && task.deadline !== '' ? (
                    <>
                        <span className={`${chip} ${deadlineColor}`} style={{ backgroundColor: 'color-mix(in srgb, currentColor 10%, transparent)' }}>
                            <span className="truncate">{formatDateShort(task.deadline)}</span>
                            <span className="opacity-70">· {getTimeRemainingString(task.deadline)}</span>
                        </span>
                        {task.start_at && (
                            <span className={`${chip} text-[var(--text-secondary)] bg-[var(--bg-secondary)]`}>
                                {formatTimeRange(task.start_at, task.end_at)}
                            </span>
                        )}
                    </>
                ) : (
                    <span className={`${chip} text-[var(--text-secondary)] opacity-50`}>No deadline</span>
                )}
                </div>

            </div>

            {/* Row 3: Status selector (hidden once completed) */}
            {!task.completed && <TaskStatusPicker task={task} />}
        </div>
    );
};