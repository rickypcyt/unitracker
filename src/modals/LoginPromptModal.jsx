import { LogIn } from 'lucide-react';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const LoginPromptModal = ({ isOpen, onClose }) => {
  const { loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-xl">
      <div className="bg-[var(--bg-primary)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--border-primary)] shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-center text-[var(--text-primary)]">Login Required</h2>
        <p className="text-[var(--text-secondary)] mb-6 text-center">
          Please log in to start a study session and track your progress.
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