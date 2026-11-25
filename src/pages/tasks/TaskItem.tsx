import { CheckCircle2, Circle, Pencil, Trash2, Zap } from "lucide-react";
import { formatDateShort, getTimeRemainingString, parseDateFromString } from '@/utils/dateUtils';

import React from 'react';
import { Task } from '@/types/taskStorage';
import TaskStatusPicker from '@/pages/tasks/TaskStatusPicker';
import { normalizeTaskStatus } from '@/constants/taskStatus';
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
    if (!dateStr) return 'text-(--text-secondary)'; // No deadline

    const date = parseDateFromString(dateStr);
    if (!date) return 'text-(--text-secondary)';
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
        return 'text-(--text-secondary)';
    } else {
        // Between end of this week and start of next week (shouldn't happen but fallback)
        return 'text-(--text-secondary)';
    }
};

interface TaskItemProps {
    task: Task;
    onToggleCompletion: (id: string) => void;
    onDelete?: (id: string) => void;
    onEditTask: (task: Task) => void;
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
                if (type === 'bg') return 'bg-(--bg-secondary)';
                if (type === 'border') return 'border-(--border-primary)';
                return 'text-(--text-secondary)';
        }
    };

    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onToggleCompletion(task.id);
    };


    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling to parent
        onEditTask(task);
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

    
    const chip = "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-(length:--t-meta,12px) font-medium leading-none whitespace-nowrap";
    const deadlineColor = task.deadline && task.deadline !== ''
        ? (isTaskForToday(task.deadline) ? 'text-green-500' : getDeadlineColor(task.deadline))
        : 'text-(--text-secondary)';

    return (
        <div
            className={`group relative grid grid-cols-[auto_minmax(0,1fr)] px-2 py-1.5 rounded-lg cursor-pointer gap-2 items-center overflow-hidden
                bg-(--bg-primary) border border-(--border-primary)
                focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-primary)/40
                ${task.completed ? 'opacity-50' : ''}
            `}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => onContextMenu(e, task)}
            tabIndex={0}
            role="listitem"
        >
            {/* Left side: complete toggle */}
            <div className="col-start-1 row-start-1 flex items-center self-stretch shrink-0">
                <button
                    onClick={handleToggleClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="bg-transparent border-none cursor-pointer flex items-center justify-center focus:outline-none rounded-full h-6 w-6"
                    aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    {task.completed ? (
                        <CheckCircle2 className="text-(--accent-primary)" size={18} strokeWidth={2.2} />
                    ) : (
                        <Circle className={getDifficultyColor(task.difficulty || 'medium')} size={18} strokeWidth={2.2} />
                    )}
                </button>
            </div>

            {/* Contenido principal */}
            <div className="col-start-2 row-start-1 min-w-0 flex flex-col justify-center gap-1">
                {/* Row 1: Assignment + Title + actions */}
                <div className="w-full flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        {showAssignment && task.assignment && (
                            <span className="shrink-0 truncate text-(--accent-primary) text-(length:--t-meta,12px) font-semibold uppercase tracking-wide max-w-[40%]">
                                {task.assignment}
                            </span>
                        )}
                        <span
                            className={`min-w-0 flex-1 font-medium text-(length:--t-title,14px) leading-snug overflow-hidden text-ellipsis line-clamp-2 ${
                                task.completed
                                    ? "line-through text-(--text-secondary)"
                                    : "text-(--text-primary)"
                            }`}
                            title={task.title}
                        >
                            {task.title}
                        </span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 opacity-70">
                        <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEditTask(task); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="p-0.5 rounded-md text-(--text-secondary)"
                            title="Edit task"
                            aria-label="Edit task"
                        >
                            <Pencil size={13} />
                        </button>
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(task.id); }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="p-0.5 rounded-md text-(--text-secondary)"
                                title="Delete task"
                                aria-label="Delete task"
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Row 2: meta chips — deadline / recurrence / time */}
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1 min-w-0">
                {task.recurrence_type === 'weekly' && task.recurrence_weekdays && task.recurrence_weekdays.length > 0 ? (
                    <>
                        <span className={`${chip} text-(--accent-primary)`} style={{ backgroundColor: 'color-mix(in srgb, currentColor 10%, transparent)' }}>
                            <Zap size={11} className="shrink-0" />
                            <span className="truncate max-w-48">{formatRecurrenceText(task.recurrence_weekdays)}</span>
                        </span>
                        {task.start_at && (
                            <span className={`${chip} text-(--text-secondary) bg-(--bg-secondary)`}>
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
                            <span className={`${chip} text-(--text-secondary) bg-(--bg-secondary)`}>
                                {formatTimeRange(task.start_at, task.end_at)}
                            </span>
                        )}
                    </>
                ) : (
                    <span className={`${chip} text-(--text-secondary) opacity-50`}>No deadline</span>
                )}
                {/* Plain "To Do" is the default, so it isn't shown; In Progress / On Hold are */}
                {!task.completed && normalizeTaskStatus(task.status) !== 'todo' && (
                    <span className="ml-auto">
                        <TaskStatusPicker task={task} />
                    </span>
                )}
                </div>

            </div>

        </div>
    );
};