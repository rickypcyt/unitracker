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
  initialValues?: Partial<Note>;
  isEdit?: boolean;
}

const NotesCreateModal: React.FC<NotesCreateModalProps> = ({ isOpen, onClose, onAdd, loading, initialValues, isEdit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[var(--bg-primary)] rounded-xl p-4 w-full max-w-lg h-[80vh] shadow-lg border border-[var(--border-primary)] relative flex flex-col justify-start overflow-y-auto">
        <button
          className="absolute top-2 right-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-[var(--accent-primary)]">{isEdit ? 'Edit Note' : 'Add Note'}</h2>
        <NotesForm onAdd={onAdd} loading={loading} initialValues={initialValues} onCancel={onClose} isEdit={isEdit} />
      </div>
    </div>
  );
};

export default NotesCreateModal; 