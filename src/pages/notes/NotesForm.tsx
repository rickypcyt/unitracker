import { FileText, Save, X } from 'lucide-react';
import { FormActions, FormButton, FormInput } from '../../modals/FormElements';
import React, { useEffect, useMemo, useState } from 'react';

import MarkdownWysiwyg from '../../MarkdownWysiwyg';

interface Note {
  id?: string;
  title: string;
  assignment: string | null;
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

const NotesForm: React.FC<NotesFormProps> = ({ 
  onAdd, 
  loading, 
  initialValues, 
  onCancel, 
  isEdit 
}) => {
  // Ensure initialValues is always defined with default values
  const safeInitialValues = useMemo(() => ({
    title: '',
    assignment: '',
    description: '',
    date: getToday(),
    ...initialValues
  }), [initialValues]);

  const [form, setForm] = useState<{ assignment: string }>({
    assignment: (safeInitialValues.assignment ?? '') as string,
  });

  const [wysiwyg, setWysiwyg] = useState<{ title: string; body: string }>({
    title: safeInitialValues.title,
    body: safeInitialValues.description,
  });

  // Update form when initialValues change
  useEffect(() => {
    setForm({
      assignment: (safeInitialValues.assignment ?? '') as string,
    });
    setWysiwyg({
      title: safeInitialValues.title,
      body: safeInitialValues.description,
    });
  }, [safeInitialValues]);

  const handleAssignmentChange = (value: string) => {
    setForm({ ...form, assignment: value });
  };

  const handleWysiwygChange = (data: { title: string; body: string }) => {
    setWysiwyg(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = wysiwyg.title.trim();
    if (!title) return;
    
    const today = getToday();
    const trimmedAssign = form.assignment.trim();
    const noteData: Omit<Note, 'id'> = {
      title,
      assignment: trimmedAssign ? trimmedAssign : null,
      description: wysiwyg.body || '',
      date: today,
    };
    
    try {
      await onAdd(noteData);
      setForm({ assignment: '' });
      setWysiwyg({ title: '', body: '' });
    } catch (error) {
      console.error('Error saving note:', error);
    }
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

function getToday(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default NotesForm; 