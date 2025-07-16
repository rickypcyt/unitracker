import React, { useEffect, useRef, useState } from 'react';

import MarkdownWysiwyg from './MarkdownWysiwyg';

interface Note {
  id?: string;
  title: string;
  assignment: string;
  description: string;
  date: string;
  user_id?: string;
}

interface NotesFormProps {
  onAdd: (note: Omit<Note, 'id'>) => Promise<void>;
  loading: boolean;
  initialValues?: Partial<Note>;
  onCancel?: () => void;
  isEdit?: boolean;
}

const NotesForm: React.FC<NotesFormProps> = ({ onAdd, loading, initialValues, onCancel, isEdit }) => {
  const [form, setForm] = useState({
    title: '',
    assignment: '',
    description: '',
  });
  // Use a single state for the wysiwyg fields
  const [wysiwyg, setWysiwyg] = useState({
    title: initialValues?.title || '',
    body: initialValues?.description || '',
  });

  useEffect(() => {
    if (initialValues) {
      setForm({
        title: initialValues.title || '',
        assignment: initialValues.assignment || '',
        description: initialValues.description || '',
      });
      setWysiwyg({
        title: initialValues.title || '',
        body: initialValues.description || '',
      });
    }
  }, [initialValues]);

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, assignment: e.target.value });
  };

  const handleWysiwygChange = (data: { title: string; body: string }) => {
    setWysiwyg(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wysiwyg.title.trim()) return;
    await onAdd({
      title: wysiwyg.title,
      assignment: form.assignment,
      description: wysiwyg.body,
      date: getToday(),
    });
    setForm({ title: '', assignment: '', description: '' });
    setWysiwyg({ title: '', body: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <input
        name="assignment"
        value={form.assignment}
        onChange={handleAssignmentChange}
        placeholder="Assignment (opcional)"
        className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
        disabled={loading}
      />
      <div className="w-full min-h-[300px]">
        <MarkdownWysiwyg
          initialTitle={wysiwyg.title}
          initialBody={wysiwyg.body}
          onChange={handleWysiwygChange}
          className="min-h-[300px] h-[350px] md:h-[400px]"
        />
      </div>
      <div className="flex justify-between mt-4 gap-2">
        {onCancel && (
          <button
            type="button"
            className="px-3 py-1 border border-[var(--accent-primary)] text-[var(--accent-primary)] bg-black rounded text-sm font-medium hover:bg-[var(--accent-primary)] hover:text-black transition-colors"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="px-3 py-1 bg-[var(--accent-primary)] text-black rounded text-sm font-medium hover:bg-[var(--accent-secondary)] transition-colors ml-auto"
          disabled={loading}
        >
          {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
};

function getToday() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export default NotesForm; 