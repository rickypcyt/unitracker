import BaseModal from '@/modals/shared/BaseModal';
import NotesForm from '@/pages/notes/NotesForm';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface Note {
  id?: string;
  title: string;
  assignment: string | null;
  description: string;
  date?: string | undefined;
  user_id?: string;
  created_at?: string;
  last_edited?: string;
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
  const { t } = useTranslation();
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('notes.editTitle') : t('notes.createTitle')}
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