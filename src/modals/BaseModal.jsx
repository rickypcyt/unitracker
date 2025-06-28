import React, { useEffect } from 'react';

import { X } from 'lucide-react';

const BaseModal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  hasUnsavedChanges = false,
  showCloseButton = true,
  maxWidth = 'max-w-md',
  zIndex = 'z-50'
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center ${zIndex} backdrop-blur-sm`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`bg-[var(--bg-primary)] rounded-lg p-6 w-full ${maxWidth} mx-4 ${className} shadow-xl border-2 border-[var(--border-primary)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={22} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default BaseModal; 