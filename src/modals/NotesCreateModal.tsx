import BaseModal from './BaseModal';
import NotesForm from '../NotesForm';
import React from 'react';

interface Note {
  id?: string;
  title: string;
  assignment: string;
  description: string;
  date: string;
  user_id?: string;
}

interface NotesCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (note: Omit<Note, 'id'>) => Promise<void>;
  loading: boolean;
  initialValues: Partial<Note>; // Required prop with Partial<Note>
  isEdit?: boolean;
}

const NotesCreateModal: React.FC<NotesCreateModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  loading, 
  initialValues, 
  isEdit = false 
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Note' : 'Create Note'}
      maxWidth="max-w-lg"
    >
      <NotesForm
        onAdd={onAdd}
        loading={loading}
        initialValues={initialValues}
        onCancel={onClose}
        isEdit={isEdit}
      />
    </BaseModal>
  );
};

export default NotesCreateModal; 