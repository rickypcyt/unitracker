import BaseModal from './BaseModal';
import React from "react";
import { AlertTriangle } from "lucide-react";

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
      title="Delete Confirmation"
      maxWidth="max-w-md"
      className="!p-0"
    >
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Are you sure?
            </h3>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border-primary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteCompletedModal;
