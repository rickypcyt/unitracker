import { Edit2, Trash2 } from 'lucide-react';
import { FormActions, FormButton, FormInput, FormTextarea } from '@/modals/FormElements';
import { useState } from 'react';

import BaseModal from '@/modals/BaseModal';
import { deleteLap, updateLap } from '@/store/LapActions';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';

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
        <BaseModal
            isOpen={true}
            onClose={onClose}
            title="Session Details"
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                {isEditing ? (
                    <div className="space-y-4">
                        <FormInput
                            id="name"
                            label="Session Title"
                            value={editedSession.name}
                            onChange={(value) => handleEditChange('name', value)}
                            placeholder="Enter session title"
                        />
                        <FormTextarea
                            id="description"
                            label="Description"
                            value={editedSession.description || ''}
                            onChange={(value) => handleEditChange('description', value)}
                            placeholder="Enter session description"
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-medium text-[var(--text-secondary)]">Session Title</h3>
                            <p className="mt-1 text-[var(--text-primary)]">{session.name}</p>
                        </div>
                        {session.description && (
                            <div>
                                <h3 className="text-base font-medium text-[var(--text-secondary)]">Description</h3>
                                <p className="mt-1 text-[var(--text-primary)] whitespace-pre-wrap">{session.description}</p>
                            </div>
                        )}
                        <div>
                            <h3 className="text-base font-medium text-[var(--text-secondary)]">Duration</h3>
                            <p className="mt-1 text-[var(--text-primary)]">{moment.duration(session.duration, 'minutes').humanize()}</p>
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-[var(--text-secondary)]">Started</h3>
                            <p className="mt-1 text-[var(--text-primary)]">{moment(session.started_at).format('MMMM D, YYYY h:mm A')}</p>
                        </div>
                    </div>
                )}

                <FormActions>
                    {isEditing ? (
                        <>
                            <FormButton
                                type="button"
                                variant="secondary"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </FormButton>
                            <FormButton
                                type="button"
                                variant="primary"
                                onClick={handleSaveEdit}
                            >
                                Save Changes
                            </FormButton>
                        </>
                    ) : (
                        <>
                            <FormButton
                                type="button"
                                variant="secondary"
                                onClick={handleStartEditing}
                            >
                                <Edit2 size={16} className="mr-2" />
                                Edit
                            </FormButton>
                            <FormButton
                                type="button"
                                variant="danger"
                                onClick={handleDelete}
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </FormButton>
                        </>
                    )}
                </FormActions>
            </div>
        </BaseModal>
    );
};

export default SessionDetailsModal; 