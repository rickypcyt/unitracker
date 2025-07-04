import React, { useEffect, useState } from 'react';

interface Note {
  id?: string;
  title: string;
  assignment: string;
  description: string;
  date: string;
  user_id?: string;
}

const getToday = () => new Date().toISOString().slice(0, 10);

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

  useEffect(() => {
    if (initialValues) {
      setForm({
        title: initialValues.title || '',
        assignment: initialValues.assignment || '',
        description: initialValues.description || '',
      });
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await onAdd({
      title: form.title,
      assignment: form.assignment,
      description: form.description,
      date: getToday(),
    });
    setForm({ title: '', assignment: '', description: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
        required
        disabled={loading}
      />
      <input
        name="assignment"
        value={form.assignment}
        onChange={handleChange}
        placeholder="Assignment (opcional)"
        className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
        disabled={loading}
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description"
        className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] min-h-[80px]"
        disabled={loading}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="button w-full mt-2 bg-[var(--accent-primary)] text-white"
          style={{ background: 'var(--accent-primary)' }}
          disabled={loading}
        >
          {loading ? (isEdit ? 'Saving...' : 'Saving...') : isEdit ? 'Save' : 'Add Note'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="button w-full mt-2 bg-gray-400 text-white"
            onClick={onCancel}
            disabled={loading}
            style={{ background: '#9ca3af' }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default NotesForm; 