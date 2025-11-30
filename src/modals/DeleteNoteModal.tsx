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
      fullWidthOnMd={true}
    >
      <div className="space-y-6 p-2 sm:p-0">
        <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
          Are you sure you want to delete the note "{noteTitle || 'Untitled'}"? 
          <br />
          <span className="text-red-500 font-medium">This action cannot be undone.</span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="cancel-button border-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-3 sm:py-2 border-2 border-red-500 text-red-500 bg-transparent rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium"
          >
            Delete Note
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteNoteModal;
