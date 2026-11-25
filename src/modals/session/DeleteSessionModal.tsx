import { useState } from 'react';
import BaseModal from '@/modals/shared/BaseModal';

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
        <p className="text-base text-(--text-secondary)">
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
            className={`px-4 py-2 rounded-lg border-2 border-red-500 text-red-500 transition-colors ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500/10'
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