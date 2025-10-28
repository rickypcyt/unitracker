import BaseModal from '@/modals/BaseModal';

const DeleteSessionModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

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
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete Session
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteSessionModal; 