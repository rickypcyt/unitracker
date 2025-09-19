import BaseModal from '@/modals/BaseModal';

interface DeleteNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  noteTitle?: string;
}

const DeleteNoteModal = ({ isOpen, onClose, onConfirm, noteTitle = '' }: DeleteNoteModalProps) => {
  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Note"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-base text-[var(--text-secondary)]">
          Are you sure you want to delete the note "{noteTitle || 'Untitled'}"? This action cannot be undone.
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
            Delete Note
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteNoteModal;
