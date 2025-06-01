import React, { useEffect, useRef } from 'react';

const BaseMenu = ({
  x,
  y,
  onClose,
  children,
  className = '',
  zIndex = 'z-50',
  maxWidth = 'max-w-md',
  minWidth = 'min-w-[200px]',
  role = 'menu',
  'aria-label': ariaLabel = 'Menu options'
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
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

  const menuStyle = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 1000,
    backgroundColor: '#262626', // Neutral 800
    border: '1px solid #404040', // Neutral 700
    borderRadius: '0.5rem', // rounded-lg
    padding: '0.5rem 0', // Padding top/bottom, none left/right for list items
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    minWidth: minWidth,
    maxWidth: maxWidth,
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