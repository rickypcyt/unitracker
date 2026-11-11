import BaseModal from '@/modals/shared/BaseModal';
import { useTranslation } from 'react-i18next';

interface DeleteNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  noteTitle?: string;
}

const DeleteNoteModal = ({ isOpen, onClose, onConfirm, noteTitle = '' }: DeleteNoteModalProps) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('notes.deleteTitle')}
      maxWidth="max-w-xs"
      fullWidthOnMd={true}
    >
      <div className="space-y-6 p-2 sm:p-0">
        <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
          {t('notes.deleteConfirm', { title: noteTitle || t('notes.untitled') })}
          <br />
          <span className="text-red-500 font-medium">{t('notes.deleteWarning')}</span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="cancel-button border-2"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-3 sm:py-2 border-2 border-red-500 text-red-500 bg-transparent rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium"
          >
            {t('notes.deleteTitle')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteNoteModal;
