import BaseModal from './BaseModal';
import React from "react";


interface DeleteCompletedModalProps {
  onClose: () => void;
  onConfirm: () => void;
  message?: string;
  confirmButtonText?: string;
}

const DeleteCompletedModal: React.FC<DeleteCompletedModalProps> = ({
  onClose,
  onConfirm,
  message = "Are you sure you want to proceed?",
  confirmButtonText = "Confirm",
}) => {
  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Confirmation"
      maxWidth="max-w-md"
      className="!p-0"
    >
      <div className="space-y-4 p-6">
        <p className="text-[var(--text-secondary)]">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteCompletedModal;
