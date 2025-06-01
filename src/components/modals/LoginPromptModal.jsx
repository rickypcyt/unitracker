import { LogIn } from 'lucide-react';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const LoginPromptModal = ({ isOpen, onClose }) => {
  const { loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border border-neutral-200 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-center text-neutral-900">Login Required</h2>
        <p className="text-neutral-600 mb-6 text-center">
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
            className="w-full px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors border border-neutral-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal; 