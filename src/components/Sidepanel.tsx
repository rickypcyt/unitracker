import { ChevronFirst, ChevronLast } from 'lucide-react';

import React from 'react';

interface SidepanelProps {
  position?: 'left' | 'right';
  isCollapsed: boolean;
  onToggle: () => void;
  width?: number; // tailwind rem units like 80
  collapsedWidth?: number; // tailwind rem units like 12
  topOffsetClass?: string; // e.g., top-16
  children: React.ReactNode;
  toggleTitle?: { expand: string; collapse: string };
  className?: string;
  title?: React.ReactNode;
}

const Sidepanel: React.FC<SidepanelProps> = ({
  position = 'left',
  isCollapsed,
  onToggle,
  width = 80,
  collapsedWidth = 12,
  topOffsetClass = 'top-16',
  children,
  toggleTitle = { expand: 'Expand panel', collapse: 'Collapse panel' },
  className = '',
  title,
}) => {
  const sideClass = position === 'left' ? 'left-0 border-r' : 'right-0 border-l';
  const panelWidth = isCollapsed ? `w-${collapsedWidth}` : `w-${width}`;

  return (
    <div
      className={`fixed ${sideClass} ${topOffsetClass} h-[calc(100vh-7rem)] bg-[var(--bg-secondary)] border-[var(--border-primary)] z-10 transition-all duration-300 md:block hidden ${panelWidth} ${className} overflow-y-auto`}
    >
      {/* Header with Title and Toggle Button */}
      {!isCollapsed && title && (
        <div className="p-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center justify-between">
            {position === 'right' ? (
              <>
                <button
                  onClick={onToggle}
                  className="w-8 h-8 text-[var(--accent-primary)] flex items-center justify-center rounded hover:bg-[var(--accent-primary)]/10 transition-colors focus:outline-none"
                  title={toggleTitle.collapse}
                >
                  <ChevronLast size={24} />
                </button>
                <div className="flex-1 flex justify-center">
                  {title}
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 flex justify-center">
                  {title}
                </div>
                <button
                  onClick={onToggle}
                  className="w-8 h-8 text-[var(--accent-primary)] flex items-center justify-center rounded hover:bg-[var(--accent-primary)]/10 transition-colors focus:outline-none"
                  title={toggleTitle.collapse}
                >
                  <ChevronFirst size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toggle Button for collapsed state */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          className={`absolute ${position === 'left' ? 'right-2' : 'left-2'} top-4 w-8 h-8 text-[var(--accent-primary)] flex items-center justify-center rounded hover:bg-[var(--accent-primary)]/10 transition-colors focus:outline-none z-20`}
          title={toggleTitle.expand}
        >
          {position === 'left' ? (
            <ChevronLast size={24} />
          ) : (
            <ChevronFirst size={24} />
          )}
        </button>
      )}

      {!isCollapsed && (
        <div className="w-full h-full">
          {children}
        </div>
      )}
    </div>
  );
};

export default Sidepanel;
