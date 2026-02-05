import { Calendar, CheckCircle2, Circle, Clock, Edit, Tag, Trash2, X } from "lucide-react";

import BaseModal from "@/modals/BaseModal";
import Markdown from "react-markdown";
import React from "react";
import { formatDateTimeWithAmPm } from "@/utils/dateUtils";
import moment from "moment";

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
  deadline?: string;
  due_date?: string;
  difficulty?: string;
  assignment?: string;
  status?: string;
  recurrence_type?: 'none' | 'weekly' | null;
  recurrence_weekdays?: number[] | null;
  start_time?: string | null;
  end_time?: string | null;
  activetask?: boolean;
}

interface TaskViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onEdit: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TaskViewModal: React.FC<TaskViewModalProps> = ({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-[#00FF41]';
      case 'medium':
        return 'text-[#00BFFF]';
      case 'hard':
        return 'text-[#FF003C]';
      default:
        return 'text-[var(--text-secondary)]';
    }
  };

  const getStatusInfo = (status?: string) => {
    console.log('Task status:', status); // Debug para ver qué estado tiene la tarea
    switch (status?.toLowerCase()) {
      case 'in_progress':
      case 'in-progress':
        return { label: 'In Progress', color: 'text-blue-500 bg-blue-500/10 border-blue-500' };
      case 'on_hold':
      case 'on-hold':
        return { label: 'On Hold', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500' };
      case 'completed':
        return { label: 'Completed', color: 'text-green-500 bg-green-500/10 border-green-500' };
      case 'cancelled':
      case 'canceled':
        return { label: 'Cancelled', color: 'text-red-500 bg-red-500/10 border-red-500' };
      case 'todo':
      case 'to-do':
        return { label: 'To Do', color: 'text-gray-500 bg-gray-500/10 border-gray-500' };
      case 'pending':
        return { label: 'Pending', color: 'text-orange-500 bg-orange-500/10 border-orange-500' };
      default:
        return { label: status || 'No Status', color: 'text-[var(--text-secondary)] bg-[var(--bg-secondary)] border-[var(--border-primary)]' };
    }
  };

  const getDifficultyBgColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/20 border-green-500/30';
      case 'medium':
        return 'bg-blue-500/20 border-blue-500/30';
      case 'hard':
        return 'bg-red-500/20 border-red-500/30';
      default:
        return 'bg-[var(--bg-secondary)] border-[var(--border-primary)]';
    }
  };

  const to12Hour = (time24: string | null | undefined): string => {
    if (!time24) return '';
    const time = time24.slice(0, 5);
    const [h, m] = time.split(':').map(Number);
    const hours = h ?? 0;
    const minutes = m ?? 0;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
    return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const isRecurring = task.recurrence_type === 'weekly' && Array.isArray(task.recurrence_weekdays) && task.recurrence_weekdays.length > 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-3xl"
      className="!p-0"
      showHeader={false}
    >
      <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Task Details</h2>
            <div className="flex items-center gap-3">
              {task.completed ? (
                <div className="px-3 py-1 rounded-full text-sm font-medium border bg-green-500/20 text-green-400 border-green-500/30">
                  Completed
                </div>
              ) : task.status ? (
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusInfo(task.status).color}`}>
                  {getStatusInfo(task.status).label}
                </div>
              ) : (
                <div className="px-3 py-1 rounded-full text-sm font-medium border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Pending
                </div>
              )}
              {task.activetask && (
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Active
                </div>
              )}
              {isRecurring && (
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Recurring
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Created {task.created_at ? moment(task.created_at).fromNow() : 'Unknown'}</span>
            </div>
            {(task.deadline || task.due_date) && (
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Due {moment(task.deadline || task.due_date).fromNow()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="bg-[var(--bg-primary)] rounded-xl p-5 border border-[var(--border-primary)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Tag size={18} className="text-[var(--accent-primary)]" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {/* First Row: Title and Assignment */}
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Title</label>
                <p className="text-[var(--text-primary)] text-lg font-medium">{task.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Assignment</label>
                <p className="text-[var(--text-primary)] font-semibold capitalize">{task.assignment || 'No assignment'}</p>
              </div>
              
              {/* Second Row: Difficulty and Status */}
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Difficulty</label>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getDifficultyBgColor(task.difficulty || 'medium')}`}>
                  <Circle size={16} className={getDifficultyColor(task.difficulty || 'medium')} />
                  <span className={`font-medium capitalize ${getDifficultyColor(task.difficulty || 'medium')}`}>
                    {task.difficulty || 'Medium'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Status</label>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusInfo(task.status).color}`}>
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  <span className="font-medium">
                    {getStatusInfo(task.status).label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="bg-[var(--bg-primary)] rounded-xl p-5 border border-[var(--border-primary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Description</h3>
              <div className="prose prose-invert max-w-none">
                <Markdown className="text-[var(--text-primary)]">{task.description}</Markdown>
              </div>
            </div>
          )}

          {/* Schedule Info */}
          <div className="bg-[var(--bg-primary)] rounded-xl p-5 border border-[var(--border-primary)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Clock size={18} className="text-[var(--accent-primary)]" />
              Schedule
            </h3>
            <div className="space-y-3">
              {isRecurring ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Recurrence</label>
                    <p className="text-[var(--text-primary)]">
                      Every {task.recurrence_weekdays?.map(d => WEEKDAY_LABELS[d ?? 0]).join(', ')}
                    </p>
                  </div>
                  {task.start_time && task.end_time && (
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Time</label>
                      <p className="text-[var(--text-primary)]">
                        {to12Hour(task.start_time)} - {to12Hour(task.end_time)}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Deadline</label>
                  <p className="text-[var(--text-primary)]">
                    {task.deadline || task.due_date 
                      ? formatDateTimeWithAmPm(task.deadline || task.due_date)
                      : 'No deadline'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Completion Info */}
          {task.completed && task.completed_at && (
            <div className="bg-[var(--bg-primary)] rounded-xl p-5 border border-[var(--border-primary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-400" />
                Completed
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Completed on {moment(task.completed_at).format('MMMM D, YYYY [at] h:mm A')}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between gap-3">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(task);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onEdit(task);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors flex items-center gap-2"
              >
                <Edit size={18} />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default TaskViewModal;
