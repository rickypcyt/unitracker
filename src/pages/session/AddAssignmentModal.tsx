import { BookOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import BaseModal from '@/modals/BaseModal';

interface AddAssignmentModalProps {
  existingAssignments: string[];
  onClose: () => void;
  onSubmit: (assignmentName: string) => void;
}

const AddAssignmentModal = ({
  existingAssignments,
  onClose,
  onSubmit,
}: AddAssignmentModalProps) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter an assignment name');
      return;
    }
    if (existingAssignments.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      setError('An assignment with this name already exists');
      return;
    }
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Add Assignment"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
            <BookOpen size={20} className="text-[var(--accent-primary)]" />
          </div>
          <p className="text-sm">
            Create a new assignment (subject). You'll be able to add tasks to it next.
          </p>
        </div>

        <div>
          <label
            htmlFor="assignment-name"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Assignment name
          </label>
          <input
            ref={inputRef}
            id="assignment-name"
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Calculus, Physics, History..."
            className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            autoFocus
          />
          {error && (
            <p className="mt-1.5 text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Create & Add Task
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default AddAssignmentModal;
