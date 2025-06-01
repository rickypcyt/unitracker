import React from 'react';
import { X } from 'lucide-react';

const DeleteSessionModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-xl" onClick={onClose}>
      <div 
        className="bg-neutral-900 rounded-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title and Close Icon on the same row */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Delete Session</h2>
          <button
            className="text-neutral-400 hover:text-white"
            onClick={onClose}
            aria-label="Close delete session modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <p className="text-sm text-neutral-400 mb-4">
          Are you sure you want to delete this session? This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-neutral-400 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            Delete Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSessionModal; 