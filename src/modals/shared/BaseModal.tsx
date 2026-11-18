import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { X } from "lucide-react";
import { Drawer } from "vaul";

import { useMediaQuery } from "@/hooks/common/useMediaQuery";

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  hasUnsavedChanges?: boolean;
  showCloseButton?: boolean;
  maxWidth?: string;
  zIndex?: string;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  showHeader?: boolean;
  fullWidthOnMd?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | string;
  maxHeight?: string;
  height?: string;
  backdropBlur?: boolean;
  /** On phones, render as a draggable bottom sheet (vaul). Set false to keep the centered modal. */
  mobileSheet?: boolean;
};

// Constants
const DEFAULT_OVERLAY_CLASS = "bg-white/60 dark:bg-black/70";
const FOCUSABLE_SELECTOR = 'input, textarea, select, button, [tabindex="0"]';
const AUTOFOCUS_SELECTOR = '[autofocus], [data-autofocus="true"]';
const CONFIRM_MESSAGE = "You have unsaved changes. Are you sure you want to close?";

// Utility functions
const isTouch = () => "ontouchstart" in window || (navigator as any).maxTouchPoints > 0;

const isFocusable = (element: HTMLElement | null): element is HTMLElement => 
  element !== null && typeof element.focus === "function";

const findFocusableElement = (container: string, selector: string): HTMLElement | null =>
  document.querySelector(`${container} ${selector}`) as HTMLElement | null;

const BaseModal = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  overlayClassName,
  contentClassName = "",
  hasUnsavedChanges = false,
  showCloseButton = true,
  maxWidth = "max-w-md",
  zIndex = "z-[10001]",
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showHeader = true,
  fullWidthOnMd = false,
  padding = "md",
  maxHeight = "max-h-[90vh]",
  height = "h-auto",
  backdropBlur = true,
  mobileSheet = true,
}: BaseModalProps) => {
  const isPhone = useMediaQuery("(max-width: 639px)");
  const asSheet = mobileSheet && isPhone;
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
    if (asSheet) return; // vaul handles focus, Escape and scroll lock
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
  }, [asSheet, isOpen, handleKeyDown, manageFocus, restoreFocus]);

  if (asSheet) {
    const sheetPadding = {
      none: '',
      sm: 'px-3 pb-3',
      md: 'px-4 pb-4',
      lg: 'px-5 pb-5',
    }[padding as string] ?? padding;

    return (
      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => { if (!open) handleClose(); }}
        dismissible={closeOnOverlayClick}
        repositionInputs={false}
      >
        <Drawer.Portal>
          <Drawer.Overlay
            className={`BaseModal fixed inset-0 ${zIndex} ${overlayClassName ?? DEFAULT_OVERLAY_CLASS} ${backdropBlur ? 'backdrop-blur-sm' : ''}`}
          />
          <Drawer.Content
            aria-describedby={undefined}
            onEscapeKeyDown={(e) => { if (!closeOnEsc) e.preventDefault(); }}
            className={`BaseModal fixed inset-x-0 bottom-0 ${zIndex} flex max-h-[92dvh] ${height !== "h-auto" ? height : ""} flex-col rounded-t-2xl border-t-2 border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl outline-none pb-[env(safe-area-inset-bottom)] ${className}`}
          >
            <div aria-hidden className="mx-auto mt-2.5 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-[var(--border-primary)]" />
            {showHeader ? (
              <header className="flex items-center justify-between px-2 pb-2">
                <div className="shrink-0 w-9" />
                <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)] truncate flex-1 text-center">
                  {title ?? ''}
                </Drawer.Title>
                {showCloseButton ? (
                  <button type="button" onClick={handleClose} aria-label="Close modal" title="Close" className="shrink-0 p-2 rounded-md text-[var(--text-secondary)]">
                    <X size={22} />
                  </button>
                ) : <div className="shrink-0 w-9" />}
              </header>
            ) : (
              <Drawer.Title className="sr-only">{title ?? 'Dialog'}</Drawer.Title>
            )}
            <main className={`flex-1 min-h-0 overflow-y-auto ${sheetPadding} ${contentClassName}`.trim()}>
              {children}
            </main>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Don't render if modal is closed
  if (!isOpen) return null;

  const paddingClass = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  }[padding as string] ?? padding;

  const overlayClasses = `
    BaseModal fixed inset-0 w-screen h-screen 
    ${overlayClassName ?? DEFAULT_OVERLAY_CLASS} 
    flex items-center justify-center ${zIndex} 
    ${backdropBlur ? 'backdrop-blur-md' : ''} w-full px-3 sm:px-4 overflow-hidden
  `.trim();

  const modalClasses = `
    bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] 
    sm:border-2 rounded-lg sm:rounded-xl 
    ${paddingClass} w-full ${maxWidth} mx-auto ${className} 
    shadow-xl ${maxHeight} ${height}
    pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] 
    flex flex-col
    ${fullWidthOnMd ? 'md:max-w-[85%]' : ''}
  `.trim();

  const headerClasses = `
    relative bg-[var(--bg-primary)] flex items-center 
    justify-between p-0 mt-3 sm:mt-0 mb-2 sm:mb-4
  `.trim();

  const titleClasses = `
    text-lg font-semibold 
    text-[var(--text-primary)] truncate flex-1 text-center
  `.trim();

  const closeButtonClasses = `
    shrink-0 mr-3 p-2 sm:p-2.5 rounded-md 
    text-[var(--text-secondary)] hover:text-[var(--text-primary)] 
    hover:bg-[var(--bg-secondary)]
  `.trim();

  return createPortal(
    <div
      data-overlay="BaseModal-v2"
      className={overlayClasses}
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={modalClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
          <header className={headerClasses}>
            <div className="shrink-0 w-9"></div>
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

        <main className={`flex-1 min-h-0 overflow-y-auto ${contentClassName}`.trim()}>
          {children}
        </main>
      </div>
    </div>,
    document.body
  );
};

export default BaseModal;