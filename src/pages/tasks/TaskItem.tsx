import { CheckCircle2, Circle, Clock, Trash2 } from "lucide-react";
import { formatDateShort, isToday, isTomorrow } from '@/utils/dateUtils';

// Helper para saber si la fecha es pasada
const isPast = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < now;
};

// Helper para determinar el color del deadline
const getDeadlineColor = (dateStr) => {
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
        // This week (Monday-Sunday) - Green
        return 'text-green-500';
    } else if (date >= startOfNextWeek) {
        // Next week or later - Blue
        return 'text-blue-500';
    } else {
        // Between end of this week and start of next week (shouldn't happen but fallback)
        return 'text-[var(--text-secondary)]';
    }
};

export const TaskItem = ({
    task,
    onToggleCompletion,
    onDelete,
    onEditTask,
    onContextMenu,
    // assignmentId (unused)
    // isSelected (unused)
    showAssignment = false,
    assignmentLeftOfDate = false,
    active = false
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

    const getDifficultyColor = (difficulty, type = 'text') => {
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
            return <span className="text-green-500 ml-1">(Tomorrow)</span>;
        }
        return null;
    };

    return (
        <div
            className={`relative flex p-2 rounded-lg transition-colors cursor-pointer gap-3 
                bg-[var(--bg-secondary)] 
                ${active ? `${getDifficultyColor(task.difficulty, 'border')} border-2` : 'border-2 border-[var(--border-primary)] hover:border-[#444] dark:hover:border-[#444]'}
            `}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => onContextMenu(e, task)}
            tabIndex={0}
            role="listitem"
        >
            {/* Botón de eliminar en la esquina superior derecha */}
            {/* Move delete button to bottom right, next to date */}
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
                    {task.description ? (
                        <div
                            className="text-md mt-0.5 prose prose-sm prose-invert max-w-none"
                            style={{ color: 'var(--muted-strong)' }}
                            dangerouslySetInnerHTML={{ __html: task.description }}
                        />
                    ) : (
                        <span className="text-md mt-0.5 italic" style={{ color: 'var(--muted-strong)' }}>
                            No description
                        </span>
                    )}
                </div>
                {/* Prioridad, assignment, fecha y tacho abajo */}
                <div className={`flex items-center gap-2 w-full${task.description ? ' ' : ''}`}>
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
                    <div className="flex-1" />
                    {/* Fecha y tacho alineados a la derecha */}
                    <div className="flex items-center gap-2">
                        <div className="text-base" style={{ color: 'var(--muted-strong)' }}>
                            <span>
                              {task.deadline && task.deadline !== '' ? (
                                <>
                                  <span className={getDeadlineColor(task.deadline)}>
                                    {formatDateShort(task.deadline)}
                                  </span>
                                  {renderDateLabel(task.deadline)}
                                </>
                              ) : 'No Deadline'}
                            </span>
                        </div>
                        <button
                            onClick={handleDeleteClick}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="transition-all duration-200 z-20 bg-transparent border-none p-1 rounded-full"
                            aria-label="Delete task"
                        >
                            <Trash2 size={22} className="text-red-500" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};