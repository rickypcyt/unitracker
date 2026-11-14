import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { LogIn } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/auth/useAuth';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { loginWithGoogle } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-white/60 dark:bg-black/70 flex items-center justify-center z-[10001] backdrop-blur-xl">
      <div ref={modalRef} className="bg-[var(--bg-primary)] rounded-lg p-6 max-w-md w-full mx-4 border-2 border-[var(--border-primary)] shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-center text-[var(--text-primary)]">{t('auth.login.required')}</h2>
        <p className="text-[var(--text-secondary)] mb-6 text-center">
          {t('auth.login.syncNote')}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={async () => {
              const ok = await loginWithGoogle();
              if (ok) onClose();
            }}
            className="w-full px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            {t('auth.login.logInGoogle')}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-[var(--text-primary)] rounded-lg transition-colors border-2 border-[var(--border-primary)]"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LoginPromptModal; 