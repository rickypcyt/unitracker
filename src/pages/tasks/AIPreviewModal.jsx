import React, { useState } from 'react';

import BaseModal from '@/modals/BaseModal';

const AIPreviewModal = ({ isOpen, tasks = [], onAccept, onEdit, onCancel }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const hasMultiple = tasks.length > 1;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={hasMultiple ? 'Select a Task' : 'AI Task Preview'}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {tasks.length === 0 && (
          <div className="text-center text-[var(--text-secondary)]">No tasks to preview.</div>
        )}
        {tasks.map((task, idx) => (
          <label
            key={idx}
            className={`block border rounded-lg p-4 cursor-pointer transition-colors ${selectedIdx === idx ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]'}`}
          >
            {hasMultiple && (
              <input
                type="radio"
                name="ai-task-select"
                checked={selectedIdx === idx}
                onChange={() => setSelectedIdx(idx)}
                className="mr-2 accent-[var(--accent-primary)]"
              />
            )}
            <div className="font-bold text-lg text-[var(--text-primary)] mb-1">{task.task}</div>
            {task.description && (
              <div className="text-base text-[var(--text-secondary)] mb-1">
                <span className="font-semibold">Descripción:</span> {task.description}
              </div>
            )}
            <div className="text-base text-[var(--text-secondary)] mb-1">
              <span className="font-semibold">Subject:</span> {task.subject || <span className="italic">None</span>}
            </div>
            <div className="text-base text-[var(--text-secondary)] mb-1">
              <span className="font-semibold">Date:</span> {task.date || <span className="italic">None</span>}
            </div>
            {task.difficulty && (
              <div className="text-base text-[var(--text-secondary)]">
                <span className="font-semibold">Dificultad:</span> {task.difficulty}
              </div>
            )}
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-md border-2 border-[var(--border-primary)] text-[var(--text-secondary)] font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => onEdit(tasks[selectedIdx])}
          className="px-4 py-2 rounded-md border-2 border-[var(--border-primary)] text-[var(--text-secondary)] font-semibold"
          disabled={tasks.length === 0}
        >
          Edit
        </button>
        <button
          onClick={() => onAccept(tasks[selectedIdx])}
          className="px-4 py-2 rounded-md border-2 border-[var(--border-primary)] text-[var(--text-secondary)] font-semibold"
          disabled={tasks.length === 0}
        >
          Accept
        </button>
      </div>
    </BaseModal>
  );
};

export default AIPreviewModal; 