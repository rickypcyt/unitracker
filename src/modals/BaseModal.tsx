import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

import { X } from "lucide-react";

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  hasUnsavedChanges?: boolean;
  showCloseButton?: boolean;
  maxWidth?: string;
  zIndex?: string;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  showHeader?: boolean;
  fullWidthOnMd?: boolean; // New prop to control width on medium screens
};

// Constants
const DEFAULT_OVERLAY_CLASS = "bg-white/60 dark:bg-black/70";
const FOCUSABLE_SELECTOR = 'input, textarea, select, button, [tabindex="0"]';
const AUTOFOCUS_SELECTOR = '[autofocus], [data-autofocus="true"]';
const CONFIRM_MESSAGE = "You have unsaved changes. Are you sure you want to close?";

// Utility functions
const isTouch = () => "ontouchstart" in window || (navigator as any).maxTouchPoints > 0;

const isFocusable = (element: HTMLElement | null): element is HTMLElement => 
  element && typeof element.focus === "function";

const findFocusableElement = (container: string, selector: string): HTMLElement | null =>
  document.querySelector(`${container} ${selector}`) as HTMLElement | null;

const BaseModal = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  overlayClassName,
  hasUnsavedChanges = false,
  showCloseButton = true,
  maxWidth = "max-w-md",
  zIndex = "z-[10001]",
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showHeader = true,
  fullWidthOnMd = false,
}: BaseModalProps) => {
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  // Keep refs updated without causing re-renders
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Stable close handler
  const handleClose = useCallback(() => {
    const shouldConfirm = hasUnsavedChangesRef.current;
    const shouldClose = !shouldConfirm || window.confirm(CONFIRM_MESSAGE);
    
    if (shouldClose) {
      onCloseRef.current();
    }
  }, []);

  // Focus management
  const manageFocus = useCallback(() => {
    if (!isOpen) return;

    // Store the previously focused element
    lastActiveElement.current = document.activeElement as HTMLElement | null;

    // Don't steal focus on touch devices
    if (isTouch()) return;

    setTimeout(() => {
      const modalContainer = '.BaseModal [role="dialog"]';
      const dialogElement = document.querySelector(modalContainer) as HTMLElement | null;
      const currentActive = document.activeElement as HTMLElement | null;

      // Don't change focus if an element inside modal is already focused (autofocus)
      if (dialogElement && currentActive && dialogElement.contains(currentActive)) {
        return;
      }

      // Find autofocus element first, then fallback to first focusable element
      const autoFocusElement = findFocusableElement('.BaseModal', AUTOFOCUS_SELECTOR);
      const firstFocusableElement = autoFocusElement || 
        findFocusableElement('.BaseModal', FOCUSABLE_SELECTOR);

      if (isFocusable(firstFocusableElement)) {
        firstFocusableElement.focus();
      }
    }, 0);
  }, [isOpen]);

  // Restore focus when modal closes
  const restoreFocus = useCallback(() => {
    const previousElement = lastActiveElement.current;
    if (isFocusable(previousElement)) {
      previousElement.focus();
    }
  }, []);

  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && closeOnEsc) {
      handleClose();
    }
  }, [closeOnEsc, handleClose]);

  // Overlay click handler
  const handleOverlayClick = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      handleClose();
    }
  }, [closeOnOverlayClick, handleClose]);

  // Modal lifecycle effects
  useEffect(() => {
    if (isOpen) {
      manageFocus();
      document.addEventListener("keydown", handleKeyDown);
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      restoreFocus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen, handleKeyDown, manageFocus, restoreFocus]);

  // Don't render if modal is closed
  if (!isOpen) return null;

  const overlayClasses = `
    BaseModal fixed inset-0 w-screen h-screen 
    ${overlayClassName ?? DEFAULT_OVERLAY_CLASS} 
    flex items-center justify-center ${zIndex} 
    backdrop-blur-md w-full px-2 overflow-hidden
  `.trim();

  const dialogClasses = `
    bg-[var(--bg-primary)] border border-[var(--border-primary)] 
    sm:border-2 rounded-lg sm:rounded-xl p-3 sm:p-5 
    w-full ${maxWidth} mx-0 sm:mx-4 ${className} 
    shadow-xl max-h-[85vh] h-auto overflow-y-auto 
    pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] 
    flex flex-col
    ${fullWidthOnMd ? 'md:max-w-[95%] md:w-[95%]' : ''}
  `.trim();

  const headerClasses = `
    relative bg-[var(--bg-primary)] flex items-center 
    justify-end p-4 pt-4 mt-2 pb-0 lg:mt-0 mb-4 lg:pt-0
  `.trim();

  const titleClasses = `
    absolute left-1/2 -translate-x-1/2 text-lg font-semibold 
    text-[var(--text-primary)] truncate
  `.trim();

  const closeButtonClasses = `
    shrink-0 -mr-1 p-2 sm:p-2.5 rounded-md 
    text-[var(--text-secondary)] hover:text-[var(--text-primary)] 
    hover:bg-[var(--bg-secondary)]
  `.trim();

  return (
    <div
      data-overlay="BaseModal-v2"
      className={overlayClasses}
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={dialogClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
          <header className={headerClasses}>
            {title && (
              <h2 id="modal-title" className={titleClasses}>
                {title}
              </h2>
            )}

            {showCloseButton && (
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close modal"
                title="Close"
                className={closeButtonClasses}
              >
                <X size={22} />
              </button>
            )}
          </header>
        )}

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default BaseModal;