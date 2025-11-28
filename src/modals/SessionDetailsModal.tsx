import { Calendar, Clock, Edit2, Flame, Target, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { deleteLap, updateLap } from '@/store/LapActions';

import BaseModal from '@/modals/BaseModal';
import moment from 'moment';
import { toast } from 'react-toastify';

// Lap interface defined locally until we create a types file
interface Lap {
  id: string;
  created_at: string;
  started_at?: string;
  duration: string;
  session_number: number;
  name: string;
  description?: string;
  tasks_completed: number;
  type: string;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  pomodoros_completed?: number;
  focus_score?: number;
  productivity_rating?: number;
}

interface SessionDetailsModalProps {
  session: Lap;
  onClose: () => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ session, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedSession, setEditedSession] = useState(session);

    const handleStartEditing = () => {
        setIsEditing(true);
        setEditedSession({ ...session });
    };

    const handleSaveEdit = async () => {
        try {
            const updateData = {
                name: editedSession.name,
                description: editedSession.description || "",
                session_number: editedSession.session_number,
                duration: editedSession.duration,
            };
            await updateLap(editedSession.id, updateData);
            setIsEditing(false);
            toast.success("Session updated successfully");
        } catch (error) {
            console.error("Error updating session:", error);
            toast.error("Failed to update session");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteLap(session.id);
            toast.success("Session deleted successfully");
            onClose();
        } catch (error) {
            console.error("Error deleting session:", error);
            toast.error("Failed to delete session");
        }
    };

    const handleEditChange = (field: keyof Lap, value: any) => {
        setEditedSession((prev: Lap) => ({
            ...prev,
            [field]: value,
        }));
    };

    const formatDuration = (duration: string) => {
        // Check if duration is in HH:MM:SS format
        if (duration && duration.includes(':')) {
            const parts = duration.split(':');
            const hours = parseInt(parts[0] || '0') || 0;
            const minutes = parseInt(parts[1] || '0') || 0;
            
            if (hours === 0) {
                return `${minutes} minutes`;
            } else if (minutes === 0) {
                return `${hours} hours`;
            } else {
                return `${hours} hours and ${minutes} minutes`;
            }
        }
        
        // Fallback for original format (total minutes)
        const totalMinutes = parseInt(duration || '0');
        if (totalMinutes < 60) return `${totalMinutes} minutes`;
        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        return remainingMinutes > 0 ? `${hours} hours and ${remainingMinutes} minutes` : `${hours} hours`;
    };

    const formatDate = (dateString: string) => {
        return moment(dateString).format('MMMM D, YYYY');
    };

    const formatTime = (dateString: string) => {
        return moment(dateString).format('h:mm A');
    };

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            title="Session Details"
            maxWidth="max-w-2xl"
            className="overflow-visible"
        >
            <div className="text-[var(--text-primary)]">
                {/* Header */}
                <div className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] p-4 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                    Session #{session.session_number}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold mb-1">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedSession.name}
                                        onChange={(e) => handleEditChange('name', e.target.value)}
                                        className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-white placeholder-white/70 w-full max-w-md"
                                        placeholder="Session title"
                                    />
                                ) : (
                                    session.name || 'Untitled Session'
                                )}
                            </h2>
                            <div className="flex items-center gap-2 mb-1">
                                <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: session.subject_color || '#9CA3AF' }}
                                />
                                <span className="text-white/90 text-sm font-medium">
                                    {session.subject_name || 'No assignment'}
                                </span>
                            </div>
                            <p className="text-white/90 text-sm">
                                {formatDate(session.created_at)} • {formatTime(session.created_at)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="bg-white text-[var(--accent-primary)] hover:bg-white/90 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleStartEditing}
                                        className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="bg-red-500/80 hover:bg-red-500 rounded-lg p-2 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    {isEditing ? (
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Description
                            </label>
                            <textarea
                                value={editedSession.description || ''}
                                onChange={(e) => handleEditChange('description', e.target.value)}
                                className="w-full p-3 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] resize-none"
                                rows={3}
                                placeholder="Add session description..."
                            />
                        </div>
                    ) : (
                        session.description && (
                            <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Description</h3>
                                <p className="text-[var(--text-primary)] whitespace-pre-wrap">{session.description}</p>
                            </div>
                        )
                    )}

                    {/* Session Information List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 lg:col-span-2">Session Information</h3>
                        
                        {/* Duration */}
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-[var(--text-primary)]">Duration</div>
                                    <div className="text-sm text-[var(--text-secondary)]">Total session time</div>
                                </div>
                            </div>
                            <div className="text-lg font-semibold text-[var(--text-primary)]">
                                {formatDuration(session.duration)}
                            </div>
                        </div>

                        {/* Tasks Completed */}
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-[var(--text-primary)]">Tasks Completed</div>
                                    <div className="text-sm text-[var(--text-secondary)]">Tasks finished during session</div>
                                </div>
                            </div>
                            <div className="text-lg font-semibold text-[var(--text-primary)]">
                                {session.tasks_completed}
                            </div>
                        </div>

                        {/* Pomodoros */}
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                                    <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-[var(--text-primary)]">Pomodoros Completed</div>
                                    <div className="text-sm text-[var(--text-secondary)]">Focus sessions completed</div>
                                </div>
                            </div>
                            <div className="text-lg font-semibold text-[var(--text-primary)]">
                                {session.pomodoros_completed || 0}
                            </div>
                        </div>

                        {/* Session Date */}
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                                    <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-[var(--text-primary)]">Session Date</div>
                                    <div className="text-sm text-[var(--text-secondary)]">When the session took place</div>
                                </div>
                            </div>
                            <div className="text-lg font-semibold text-[var(--text-primary)]">
                                {formatDate(session.created_at)}
                            </div>
                        </div>

                        </div>
                </div>
            </div>
        </BaseModal>
    );
};

export default SessionDetailsModal; 