import BaseModal from '../common/BaseModal';
import React from 'react';

const DeleteSessionModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Delete Session</h2>
        </div>
        
        <p className="text-sm text-neutral-400 mb-4">
          Are you sure you want to delete this session? This action cannot be undone.
        </p>

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
    </BaseModal>
  );
};

export default DeleteSessionModal; 