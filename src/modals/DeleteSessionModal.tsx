import { useState } from 'react';
import BaseModal from '@/modals/BaseModal';

interface DeleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteSessionModal = ({ isOpen, onClose, onConfirm }: DeleteSessionModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Session"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-base text-[var(--text-secondary)]">
          Are you sure you want to delete this session? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="cancel-button border-2"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isDeleting ? 'Deleting...' : 'Delete Session'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteSessionModal; 