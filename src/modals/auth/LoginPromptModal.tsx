import { LogIn } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import BaseModal from '@/modals/shared/BaseModal';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('auth.login.required')} showCloseButton={false}>
        <p className="text-(--text-secondary) mb-6 text-center">
          {t('auth.login.syncNote')}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
              navigate('/login');
            }}
            className="w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border-2 border-(--accent-primary) text-(--accent-primary) hover:bg-(--accent-primary)/10"
          >
            <LogIn size={20} />
            {t('settings.account.logIn')}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-(--text-primary) rounded-lg transition-colors border-2 border-(--border-primary) hover:bg-(--bg-secondary)"
          >
            {t('common.cancel')}
          </button>
        </div>
    </BaseModal>
  );
};

export default LoginPromptModal; 