import { CheckCircle2, Circle, Clock, GripVertical, Trash2 } from 'lucide-react';
import { formatDateShort, isToday, isTomorrow } from '@/utils/dateUtils';
import { useDrag, useDrop } from 'react-dnd';

import { useState } from 'react';

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    completed: boolean;
    due_date?: string;
    priority?: string;
    difficulty?: string;
    assignment?: string;
    subject?: string;
  };
  onToggleCompletion: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEditTask: (task: any) => void;
  onContextMenu: (e: React.MouseEvent, task: any) => void;
  showAssignment?: boolean;
  assignmentLeftOfDate?: boolean;
  active?: boolean;
  isDragging?: boolean;
  assignmentId?: string;
  onMoveTask?: (taskId: string, newAssignmentId: string) => void;
}

// Helper to check if a date is in the past
const isPast = (dateStr: string | undefined): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < now;
};

// Helper to determine the deadline color
const getDeadlineColor = (dateStr: string | undefined): string => {
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
  showAssignment = false,
  assignmentLeftOfDate = false,
  active = false,
  isDragging = false,
  assignmentId,
  onMoveTask,
}: TaskItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Define the drag source
  const [{ isDragging: dragIsDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id, assignmentId: assignmentId || '', task },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  // Define the drop target
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string; assignmentId: string; task: any }) => {
      if (item.id !== task.id && item.assignmentId !== assignmentId && onMoveTask) {
        onMoveTask(item.id, assignmentId);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const getPriorityColor = (priority: string | undefined): string => {
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

  const getDifficultyColor = (difficulty: string | undefined, type: 'text' | 'bg' | 'border' = 'text'): string => {
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
    onToggleCompletion(task.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  const renderDateLabel = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    
    const date = new Date(dateStr);
    const isPastDue = isPast(dateStr);
    const isDueToday = isToday(date);
    const isDueTomorrow = isTomorrow(date);
    
    let dateText = formatDateShort(dateStr);
    if (isDueToday) dateText = 'Today';
    else if (isDueTomorrow) dateText = 'Tomorrow';
    
    return (
      <div className={`flex items-center text-sm ${isPastDue ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
        <Clock size={12} className="mr-1" />
        {dateText}
      </div>
    );
  };

  return (
    <div
      ref={(node) => {
        drag(drop(node));
      }}
      className={`relative flex p-2 rounded-lg transition-colors cursor-pointer gap-3 
        bg-[var(--bg-secondary)] 
        ${active ? `${getDifficultyColor(task.difficulty, 'border')} border-2` : 'border-2 border-[var(--border-primary)] hover:border-[#444] dark:hover:border-[#444]'}
        ${isDragging || dragIsDragging ? 'opacity-50' : ''}
        ${isOver ? 'border-blue-500 bg-blue-900/20' : ''}
      `}
      onContextMenu={(e) => onContextMenu(e, task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag handle */}
      <div 
        className="flex items-center justify-center p-1 -ml-1 -my-1 mr-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-secondary)] transition-colors cursor-grab active:cursor-grabbing"
        style={{ opacity: isHovered ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </div>

      {/* Checkbox */}
      <div className="flex items-start pt-1">
        <button
          onClick={handleToggleClick}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.completed ? (
            <CheckCircle2 size={20} className="text-green-500" />
          ) : (
            <Circle size={20} className="opacity-60 hover:opacity-100" />
          )}
        </button>
      </div>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-medium ${task.completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
            {task.title}
          </h3>
          
          <div className="flex items-center gap-2">
            {task.priority && (
              <span className={`text-sm px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)} bg-opacity-20`}>
                {task.priority}
              </span>
            )}
            
            <button
              onClick={handleDeleteClick}
              className="text-[var(--text-secondary)] hover:text-red-500 transition-colors p-1"
              aria-label="Delete task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {(task.due_date || task.assignment) && (
          <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-secondary)]">
            {task.due_date && renderDateLabel(task.due_date)}
            {task.assignment && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--bg-primary)]">
                {task.assignment}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
