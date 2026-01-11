import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { Habit } from '../types/common';

interface HabitEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitId: string, newName: string) => void;
  onDelete: (habitId: string) => void;
  habit: Habit | null;
}

const HabitEditModal: React.FC<HabitEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  habit
}) => {
  const [habitName, setHabitName] = useState('');

  useEffect(() => {
    if (habit) {
      setHabitName(habit.name);
    }
  }, [habit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habitName.trim() && habit) {
      onSave(habit.id, habitName.trim());
      onClose();
    }
  };

  const handleDelete = () => {
    if (habit) {
      onDelete(habit.id);
      onClose();
    }
  };

  const handleClose = () => {
    setHabitName('');
    onClose();
  };

  if (!habit) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Habit"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="editHabitName"
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            Habit Name
          </label>
          <input
            id="editHabitName"
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="Enter habit name..."
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            autoFocus
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-transparent border border-red-500 text-red-500 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-3 flex-1">
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
              className="flex-1 px-4 py-2 bg-transparent border border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-primary)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </BaseModal>
  );
};

export default HabitEditModal;