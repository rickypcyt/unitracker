import React from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LoginPromptModal = ({ isOpen, onClose }) => {
  const { loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg p-6 max-w-md w-full mx-4 border border-neutral-800">
        <h2 className="text-xl font-semibold mb-4 text-center">Login Required</h2>
        <p className="text-neutral-400 mb-6 text-center">
          Please log in to start a study session and track your progress.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              loginWithGoogle();
              onClose();
            }}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Log in with Google
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal; 