import React from 'react';
import BaseModal from './BaseModal';

type ExitSessionChoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onJustExit: () => void;
  onExitAndDelete: () => void;
};

const ExitSessionChoiceModal: React.FC<ExitSessionChoiceModalProps> = ({
  isOpen,
  onClose,
  onJustExit,
  onExitAndDelete,
}) => {
  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Exit Session"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-[var(--text-primary)]">
        <p className="text-[var(--text-secondary)]">
          Do you want to exit this session and keep it for later, or exit and delete it permanently?
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
          <button
            onClick={onJustExit}
            className="px-4 py-2 rounded-lg border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
          >
            Just Exit
          </button>
          <button
            onClick={onExitAndDelete}
            className="px-4 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors"
          >
            Exit and Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ExitSessionChoiceModal;
