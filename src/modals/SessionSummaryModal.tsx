import BaseModal from './BaseModal';
import React from 'react';

type SessionSummaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  durationFormatted: string; // HH:MM:SS
  completedTasksCount: number;
  pomodorosCompleted?: number;
};

const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  title,
  durationFormatted,
  completedTasksCount,
  pomodorosCompleted,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Summary"
      maxWidth="max-w-md"
      className=""
    >
      <div className="space-y-4 text-[var(--text-primary)]">
        <div>
          <div className="text-sm text-[var(--text-secondary)]">Title</div>
          <div className="font-semibold">{title || 'Untitled Session'}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="text-sm text-[var(--text-secondary)]">Duration</div>
            <div className="text-lg font-mono">{durationFormatted}</div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="text-sm text-[var(--text-secondary)]">Tasks Completed</div>
            <div className="text-lg font-semibold">{completedTasksCount}</div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] col-span-2">
            <div className="text-sm text-[var(--text-secondary)]">Pomodoros</div>
            <div className="text-lg font-semibold">{pomodorosCompleted ?? 0}</div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default SessionSummaryModal;
