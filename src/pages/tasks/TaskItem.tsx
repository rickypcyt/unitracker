import { CheckCircle2, Circle } from "lucide-react";
import { formatDateShort, getTimeRemainingString, isToday, isTomorrow } from '@/utils/dateUtils';

import React from 'react';
import { Task } from '@/types/taskStorage';

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

// Helper para formatear tiempo - ahora maneja timestamptz
const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return '';
    
    // Si es timestamptz, extraer solo la hora
    if (timeStr.includes(' ')) {
        // Formato: '2026-02-09 10:00:00+00'
        const timePart = timeStr.split(' ')[1]; // '10:00:00+00'
        if (!timePart) return '';
        
        const [hours, minutes] = timePart.split(':');
        const hour = parseInt(hours || '0');
        const minute = parseInt(minutes || '0');
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    } else {
        // Formato antiguo: '10:00'
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours || '0');
        const minute = parseInt(minutes || '0');
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    }
};

// Helper para determinar el color del deadline
const getDeadlineColor = (dateStr: string) => {
    if (!dateStr) return 'text-[var(--text-secondary)]'; // No deadline

    const date = new Date(dateStr);
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
        // Next week or later - Blue
        return 'text-[#00BFFF]';
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
    onViewTask?: (task: Task) => void; // New: for viewing task details
    onContextMenu: (e: React.MouseEvent, task: Task) => void;
    showAssignment?: boolean;
    assignmentLeftOfDate?: boolean;
    active?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
    task,
    onToggleCompletion,
    onEditTask,
    onViewTask,
    onContextMenu,
    showAssignment = false,
    assignmentLeftOfDate = false,
    active = false
}) => {
    const getDifficultyColor = (difficulty: string, type: 'text' | 'bg' | 'border' = 'text') => {
        // type: 'text' | 'bg' | 'border'
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                if (type === 'bg') return 'bg-green-900/60';
                if (type === 'border') return 'border-green-500';
                return 'text-[#00FF41]';
            case 'medium':
                if (type === 'bg') return 'bg-blue-900/60';
                if (type === 'border') return 'border-blue-500';
                return 'text-[#00BFFF]';
            case 'hard':
                if (type === 'bg') return 'bg-red-900/60';
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


    const handleDoubleClick = () => {
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
            return <span className="text-yellow-500 ml-1">(Today)</span>;
        }
        if (isTomorrow(deadline)) {
            return <span className="text-yellow-500 ml-1">(Tomorrow)</span>;
        }
        return null;
    };

    
    return (
        <div
            className={`relative flex p-2 rounded-lg transition-colors cursor-pointer gap-2 items-center
                bg-[var(--bg-secondary)] 
                ${active ? `${getDifficultyColor(task.difficulty || 'medium', 'border')} border` : 'border border-[var(--border-primary)] hover:border-[#444] dark:hover:border-[#444]'}
            `}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => onContextMenu(e, task)}
            tabIndex={0}
            role="listitem"
        >
            {/* Contenido principal */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                {/* Assignment above title when showAssignment is true (calendar view) */}
                {showAssignment && task.assignment && (
                    <div className="text-[var(--accent-primary)] text-sm font-semibold capitalize mb-0.5">
                        {task.assignment}
                    </div>
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
                
                {/* Date/Recurrence */}
                <div className="text-sm mt-0.5" style={{ color: 'var(--muted-strong)' }}>
                    {task.recurrence_type === 'weekly' && task.recurrence_weekdays && task.recurrence_weekdays.length > 0 ? (
                        <span className="text-[var(--text-secondary)]">
                            {formatRecurrenceText(task.recurrence_weekdays)}
                            {task.start_at && (
                                <span className="ml-1">
                                    {formatTime(task.start_at)}
                                    {task.end_at && ` - ${formatTime(task.end_at)}`}
                                </span>
                            )}
                        </span>
                    ) : task.deadline && task.deadline !== '' ? (
                        <>
                            <span className={getDeadlineColor(task.deadline)}>
                                {formatDateShort(task.deadline)}
                                {new Date(task.deadline) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                                    <span className="ml-1">({getTimeRemainingString(task.deadline)})</span>
                                )}
                            </span>
                            {renderDateLabel(task.deadline)}
                        </>
                    ) : 'No Deadline'}
                </div>
            </div>
            
            {/* Botón de completar a la derecha */}
            <div className="flex items-center justify-center h-full">
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