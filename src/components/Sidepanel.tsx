import { ChevronFirst, ChevronLast } from 'lucide-react';

import React from 'react';

interface SidepanelProps {
  position?: 'left' | 'right';
  isCollapsed: boolean;
  onToggle: () => void;
  width?: number; // tailwind rem units like 80
  collapsedWidth?: number; // tailwind rem units like 12
  widthPx?: number; // pixel width for resizable mode
  onResizeStart?: (e: React.MouseEvent) => void;
  resizable?: boolean;
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
  widthPx,
  onResizeStart,
  resizable = false,
  topOffsetClass = 'top-0',
  children,
  toggleTitle = { expand: 'Expand panel', collapse: 'Collapse panel' },
  className = '',
  title,
}) => {
  const sideClass = position === 'left' ? 'left-0 border-r' : 'right-0 border-l';
  const panelWidth = isCollapsed ? `w-${collapsedWidth}` : `w-${width}`;
  const widthStyle = widthPx != null && !isCollapsed ? { width: `${widthPx}px` } : undefined;

  return (
    <div
      className={`fixed ${sideClass} ${topOffsetClass} h-screen bg-[var(--bg-secondary)] border-[var(--border-primary)] z-10 transition-all duration-300 md:block hidden ${widthStyle ? '' : panelWidth} ${className} overflow-y-auto`}
      style={widthStyle}
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

      {/* Resize Handle */}
      {resizable && !isCollapsed && (
        <div
          className={`absolute top-0 ${position === 'left' ? 'right-0' : 'left-0'} h-full w-1 cursor-col-resize hover:bg-[var(--accent-primary)]/30 transition-colors group z-30`}
          onMouseDown={onResizeStart}
        >
          <div className={`absolute inset-y-0 ${position === 'left' ? '-right-1 -left-1' : '-left-1 -right-1'} z-10`} />
          <div className="w-0.5 h-12 bg-[var(--border-primary)] group-hover:bg-[var(--accent-primary)] rounded-full transition-colors absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
};

export default Sidepanel;
