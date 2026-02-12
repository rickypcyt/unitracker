import { FormActions, FormButton, FormInput } from "../../modals/FormElements";
import React, { useEffect, useMemo, useState } from "react";

interface Note {
  id?: string;
  title: string;
  assignment: string | null;
  description: string;
  date: string;
  user_id?: string;
  created_at?: string;
  last_edited?: string;
}

interface NotesFormProps {
  onAdd: (note: Omit<Note, "id">) => Promise<void>;
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
  isEdit,
}) => {
  // Ensure initialValues is always defined with default values
  const safeInitialValues = useMemo(
    () => ({
      title: "",
      assignment: "",
      description: "",
      date: getToday(),
      ...initialValues,
    }),
    [initialValues]
  );

  const [form, setForm] = useState<{ title: string; assignment: string }>({
    title: safeInitialValues.title,
    assignment: safeInitialValues.assignment || "",
  });

  // Update form when initialValues change
  useEffect(() => {
    setForm({
      title: safeInitialValues.title,
      assignment: safeInitialValues.assignment || "",
    });
  }, [safeInitialValues]);

  const handleTitleChange = (value: string) => {
    setForm({ ...form, title: value });
  };

  const handleAssignmentChange = (value: string) => {
    setForm({ ...form, assignment: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;

    const today = getToday();
    const trimmedAssign = form.assignment.trim();
    
    console.log('Form data being saved:', { title, assignment: trimmedAssign });
    
    const noteData: Omit<Note, "id"> = {
      title,
      assignment: trimmedAssign ? trimmedAssign : null,
      description: "",
      date: today,
    };

    console.log('Note data being sent:', noteData);

    try {
      await onAdd(noteData);
      setForm({ title: "", assignment: "" });
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      <div className="space-y-2">
        <div className="overflow-hidden">
          <FormInput
            id="title"
            label="Title"
            value={form.title}
            onChange={handleTitleChange}
            placeholder="Enter note title..."
            required
          />
          <div className="mt-4">
            <FormInput
              id="assignment"
              label="Assignment (optional)"
              value={form.assignment}
              onChange={handleAssignmentChange}
              placeholder="Enter assignment name..."
            />
          </div>
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
            Cancel
          </FormButton>
        )}
        <FormButton 
        type="submit" 
        variant="custom"
        className="border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)]"
        disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Note"}
        </FormButton>
      </FormActions>
    </form>
  );
};

function getToday(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default NotesForm;
