import NotesForm from '../pages/notes/NotesForm';
import React from 'react';

interface Note {
  id?: string;
  title: string;
  assignment: string;
  description: string;
  date: string;
  user_id?: string;
}

interface NotesFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<Note, 'id'>) => Promise<void>;
  loading: boolean;
  initialValues: Partial<Note>; // Required prop with Partial<Note>
}

const NotesFormModal: React.FC<NotesFormModalProps> = ({ isOpen, onClose, onSave, loading, initialValues }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-white/60 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] rounded-xl p-6 w-full max-w-full shadow-lg border border-[var(--border-primary)] relative">
        <button
          className="absolute top-2 right-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-[var(--accent-primary)]">Edit Note</h2>
        <NotesForm onAdd={onSave} loading={loading} initialValues={initialValues} onCancel={onClose} isEdit />
      </div>
    </div>
  );
};

export default NotesFormModal; 