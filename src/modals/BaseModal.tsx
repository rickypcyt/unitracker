import { useCallback, useEffect, useRef } from 'react';
import type { ReactNode, MouseEvent as ReactMouseEvent } from 'react';

import { X } from 'lucide-react';

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  hasUnsavedChanges?: boolean;
  showCloseButton?: boolean;
  maxWidth?: string;
  zIndex?: string;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  showHeader?: boolean;
};

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
}: BaseModalProps) => {
  const lastActiveElement = useRef<HTMLElement | null>(null);

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
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        handleClose();
      }
    };

    if (isOpen) {
      lastActiveElement.current = document.activeElement as HTMLElement | null;
      // No robar el foco en móviles: si existe un elemento con autoFocus, deja que el navegador lo maneje.
      // En desktop, solo enfocamos si no hay ningún elemento con autoFocus dentro del modal.
      setTimeout(() => {
        const hasAutoFocus = document.querySelector('.BaseModal [autofocus]') as HTMLElement | null;
        const isTouch = 'ontouchstart' in window || (navigator as any).maxTouchPoints > 0;
        if (hasAutoFocus || isTouch) return;
        const firstFocusable = document.querySelector(
          '.BaseModal input, .BaseModal textarea, .BaseModal select, .BaseModal button, .BaseModal [tabindex="0"]'
        ) as HTMLElement | null;
        if (firstFocusable && typeof firstFocusable.focus === 'function') firstFocusable.focus();
      }, 0);
      document.addEventListener('keydown', handleEscape);
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      // Devuelve el foco al trigger
      const el = lastActiveElement.current as HTMLElement | null;
      if (el && typeof el.focus === 'function') {
        el.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, closeOnEsc, handleClose]);

  const handleOverlayClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`BaseModal fixed inset-0 w-screen h-screen bg-black bg-opacity-70 flex items-stretch sm:items-center justify-center ${zIndex} backdrop-blur-md`}
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-[var(--bg-primary)] border-0 sm:border-2 border-[var(--border-primary)] rounded-none sm:rounded-xl p-4 sm:p-6 w-full ${maxWidth} mx-0 sm:mx-4 ${className} shadow-xl max-h-none sm:max-h-[85vh] h-[100dvh] sm:h-auto overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
          <div className="sticky top-0 z-10 bg-[var(--bg-primary)] flex items-center justify-between gap-3 mb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 sm:pt-5">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] truncate">
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                title="Close"
                className="shrink-0 -mr-1 p-2 sm:p-2.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
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