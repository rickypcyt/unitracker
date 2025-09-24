import { useEffect, useRef } from 'react';

import { LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const LoginPromptModal = ({ isOpen, onClose }) => {
  const { loginWithGoogle } = useAuth();
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
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

  return (
    <div className="fixed inset-0 bg-white/60 dark:bg-black/70 flex items-center justify-center z-[10001] backdrop-blur-xl">
      <div ref={modalRef} className="bg-[var(--bg-primary)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--border-primary)] shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-center text-[var(--text-primary)]">Login Required</h2>
        <p className="text-[var(--text-secondary)] mb-6 text-center">
          Signing in will save and sync your tasks to the cloud database.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              loginWithGoogle();
              onClose();
            }}
            className="w-full px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Log in with Google
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-primary)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal; 