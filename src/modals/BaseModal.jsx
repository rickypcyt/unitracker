import { useCallback, useEffect, useRef } from 'react';

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
  zIndex = 'z-[10001]',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showHeader = true,
}) => {
  const lastActiveElement = useRef(null);

  // Define handleClose before useEffect to avoid TDZ in dependency array
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEsc) {
        handleClose();
      }
    };

    if (isOpen) {
      lastActiveElement.current = document.activeElement;
      // Opcional: enfoca el primer botón del modal
      setTimeout(() => {
        const firstButton = document.querySelector('.BaseModal button, .BaseModal [tabindex="0"]');
        if (firstButton) firstButton.focus();
      }, 0);
      document.addEventListener('keydown', handleEscape);
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      // Devuelve el foco al trigger
      if (lastActiveElement.current && typeof lastActiveElement.current.focus === 'function') {
        lastActiveElement.current.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, closeOnEsc, handleClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`BaseModal fixed inset-0 w-screen h-screen bg-black bg-opacity-70 flex items-center justify-center ${zIndex} backdrop-blur-md`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl p-6 w-full ${maxWidth} mx-4 ${className} shadow-xl max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
          <div className="flex justify-between items-center mb-4 relative mt-2 sm:mt-5">
            <div className="flex-1 flex justify-center items-center absolute left-0 right-0 w-full pointer-events-none">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] pointer-events-auto w-full text-center truncate">
                {title}
              </h2>
            </div>
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-auto relative z-10 mr-2"
              >
                <X size={22} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default BaseModal; 