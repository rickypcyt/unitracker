import { CheckCircle2, Circle } from "lucide-react";
import { formatDateShort, getTimeRemainingString, isToday, isTomorrow } from '@/utils/dateUtils';

import React from 'react';

// Extended Task interface to include deadline field
interface Task {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    completed_at: string | null;
    created_at?: string;
    updated_at?: string;
    due_date?: string;
    priority?: number;
    tags?: string[];
    user_id?: string;
    workspace_id?: string;
    activetask?: boolean;
    difficulty?: string;
    assignment?: string;
    deadline?: string;
}

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
        return 'text-blue-500';
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
    onContextMenu: (e: React.MouseEvent, task: Task) => void;
    showAssignment?: boolean;
    assignmentLeftOfDate?: boolean;
    active?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
    task,
    onToggleCompletion,
    onEditTask,
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
                return 'text-[#1E90FF]';
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
        onEditTask(task);
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
                {/* Priority, assignment, date */}
                <div className={`flex items-center gap-2 w-full`}>
                    {/* Date on the left */}
                    <div className="text-sm" style={{ color: 'var(--muted-strong)' }}>
                        {task.deadline && task.deadline !== '' ? (
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
                    
                    <div className="flex-1" />
                    
                    {/* Assignment on the right */}
                    {!assignmentLeftOfDate && showAssignment && task.assignment && (
                        <div className="text-[var(--accent-primary)] text-md font-semibold capitalize">
                            {task.assignment}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Botón de completar a la derecha */}
            <div className="flex items-center justify-center h-full">
                <button
                    onClick={handleToggleClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="bg-transparent border-none cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 rounded-full transition-transform duration-200 hover:scale-110 h-8 w-8"
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