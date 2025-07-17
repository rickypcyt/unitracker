import { FileText, Save, X } from 'lucide-react';
import { FormActions, FormButton, FormInput } from './modals/FormElements';
import React, { useEffect, useState } from 'react';

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
    assignment: '',
  });
  const [wysiwyg, setWysiwyg] = useState({
    title: initialValues?.title || '',
    body: initialValues?.description || '',
  });

  useEffect(() => {
    if (initialValues) {
      setForm({
        assignment: initialValues.assignment || '',
      });
      setWysiwyg({
        title: initialValues.title || '',
        body: initialValues.description || '',
      });
    }
  }, [initialValues]);

  const handleAssignmentChange = (value: string) => {
    setForm({ ...form, assignment: value });
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
    setForm({ assignment: '' });
    setWysiwyg({ title: '', body: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormInput
        id="assignment"
        label="Assignment (optional)"
        value={form.assignment}
        onChange={handleAssignmentChange}
        placeholder="Enter assignment name..."
        error={null}
      />
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-base font-medium text-[var(--text-primary)]">
          <FileText size={16} className="text-[var(--accent-primary)]" />
          Note Content
        </label>
        <div className="overflow-hidden">
          <MarkdownWysiwyg
            initialTitle={wysiwyg.title}
            initialBody={wysiwyg.body}
            onChange={handleWysiwygChange}
            className="min-h-[300px]"
          />
        </div>
      </div>
      <FormActions className="pt-4">
        {onCancel && (
          <FormButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            <X size={18} className="mr-2" />
            Cancel
          </FormButton>
        )}
        <FormButton
          type="submit"
          variant="primary"
          disabled={loading}
        >
          <Save size={18} className="mr-2" />
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Note'}
        </FormButton>
      </FormActions>
    </form>
  );
};

function getToday() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export default NotesForm; 