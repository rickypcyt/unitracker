import { useEffect, useRef, type ReactNode } from 'react';

interface BaseMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  zIndex?: string;
  maxWidth?: string;
  role?: string;
  'aria-label'?: string;
}

const BaseMenu = ({
  x,
  y,
  onClose,
  children,
  className = '',
  zIndex = 'z-50',
  maxWidth = 'max-w-md',
  role = 'menu',
  'aria-label': ariaLabel = 'Menu options'
}: BaseMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 9999,
    backgroundColor: 'var(--bg-secondary)',
    border: '2px solid var(--border-primary)',
    borderRadius: '0.75rem',
    padding: '0.75rem 0.5rem',
    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25), 0 1.5px 6px 0 rgba(30,144,255,0.10)',
    minWidth: '220px',
    maxWidth: maxWidth,
    color: 'var(--text-primary)',
  };

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className={`${className} ${zIndex}`}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};

export default BaseMenu; 