import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, Save, Edit2, Trash2 } from 'lucide-react';
import moment from 'moment';
import { updateLap, deleteLap } from '../../redux/LapActions';
import { toast } from 'react-toastify';

const SessionDetailsModal = ({ session, onClose }) => {
    const dispatch = useDispatch();
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
            await dispatch(updateLap(editedSession.id, updateData));
            setIsEditing(false);
            toast.success("Session updated successfully");
        } catch (error) {
            console.error("Error updating session:", error);
            toast.error("Failed to update session");
        }
    };

    const handleDelete = async () => {
        try {
            await dispatch(deleteLap(session.id));
            toast.success("Session deleted successfully");
            onClose();
        } catch (error) {
            console.error("Error deleting session:", error);
            toast.error("Failed to delete session");
        }
    };

    const handleEditChange = (field, value) => {
        setEditedSession(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Session details"
        >
            <div 
                className="maincard max-w-2xl w-full mx-4 transform transition-transform duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                    <h3 className="text-2xl font-bold text-center flex-1 truncate min-w-0">
                        Session Details
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                            <button
                                onClick={handleSaveEdit}
                                className="text-green-500 hover:text-green-600 transition duration-200 flex items-center gap-2"
                                aria-label="Save changes"
                            >
                                <Save size={20} />
                                Save
                            </button>
                        ) : (
                            <button
                                onClick={handleStartEditing}
                                className="text-accent-primary hover:text-accent-secondary transition duration-200 flex items-center gap-2"
                                aria-label="Edit session details"
                            >
                                <Edit2 size={20} />
                                Edit
                            </button>
                        )}
                        <button
                            className="text-gray-400 hover:text-white transition duration-200"
                            onClick={onClose}
                            aria-label="Close session details"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-2">
                            Title
                        </h4>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedSession.name}
                                onChange={(e) => handleEditChange("name", e.target.value)}
                                className="w-full bg-bg-surface border border-border-primary rounded px-3 py-2 text-text-primary"
                                aria-label="Session title"
                            />
                        ) : (
                            <p className="text-text-secondary">
                                {session.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-2">
                            Description
                        </h4>
                        {isEditing ? (
                            <textarea
                                value={editedSession.description || ""}
                                onChange={(e) => handleEditChange("description", e.target.value)}
                                className="w-full bg-bg-surface border border-border-primary rounded px-3 py-2 text-text-primary min-h-[100px]"
                                placeholder="Add a description..."
                                aria-label="Session description"
                            />
                        ) : (
                            <p className="text-text-secondary whitespace-pre-wrap">
                                {session.description || "No description"}
                            </p>
                        )}
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-2">
                            Duration
                        </h4>
                        <p className="text-text-secondary">
                            {session.duration}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-2">
                            Created At
                        </h4>
                        <p className="text-text-secondary">
                            {moment(session.created_at).format("MMMM D, YYYY h:mm A")}
                        </p>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            onClick={handleDelete}
                            className="text-red-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
                            aria-label="Delete session"
                        >
                            <Trash2 size={20} />
                            Delete Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionDetailsModal; 