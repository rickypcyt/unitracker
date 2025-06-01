import React from "react";
import { X } from "lucide-react";

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
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999999]"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Confirmation</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default DeleteCompletedModal;
