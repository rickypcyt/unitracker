import React, { useState } from 'react';

import BaseModal from './BaseModal';
import { Habit } from '../types/common';

interface HabitCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
}

const HabitCreateModal: React.FC<HabitCreateModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [habitName, setHabitName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habitName.trim()) {
      onAdd({ name: habitName.trim() });
      setHabitName('');
      onClose();
    }
  };

  const handleClose = () => {
    setHabitName('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Habit"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="habitName"
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            Habit Name
          </label>
          <input
            id="habitName"
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="E.g: Exercise, Read 30 minutes..."
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            autoFocus
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Cancel
          </button>
            <button
              type="submit"
              disabled={!habitName.trim()}
              className="flex-1 px-4 py-2 bg-transparent border border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
            Create
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default HabitCreateModal;