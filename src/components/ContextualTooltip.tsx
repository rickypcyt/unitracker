import { Info, X } from 'lucide-react';
import React, { useEffect, useId, useState } from 'react';

interface ContextualTooltipProps {
  page: string;
  targetSelector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  page,
  targetSelector,
  title,
  content,
  position = 'bottom',
}) => {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const seenKey = `tooltipSeen_${page}`;
    if (localStorage.getItem(seenKey) === 'true') return;

    const findTarget = () => {
      const el = document.querySelector(targetSelector) as HTMLElement | null;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      setTargetRect(rect);
      return true;
    };

    // Wait for element to render (page may be lazy-loaded)
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      if (findTarget() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts < maxAttempts) {
          setVisible(true);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [page, targetSelector]);

  const handleDismiss = () => {
    localStorage.setItem(`tooltipSeen_${page}`, 'true');
    setVisible(false);
  };

  if (!visible || !targetRect) return null;

  // Calculate tooltip position
  const spacing = 12;
  let style: React.CSSProperties = { position: 'fixed', zIndex: 99998 };

  if (position === 'top') {
    style = {
      ...style,
      bottom: window.innerHeight - targetRect.top + spacing,
      left: targetRect.left + targetRect.width / 2,
      transform: 'translateX(-50%)',
    };
  } else if (position === 'bottom') {
    style = {
      ...style,
      top: targetRect.bottom + spacing,
      left: targetRect.left + targetRect.width / 2,
      transform: 'translateX(-50%)',
    };
  } else if (position === 'left') {
    style = {
      ...style,
      right: window.innerWidth - targetRect.left + spacing,
      top: targetRect.top + targetRect.height / 2,
      transform: 'translateY(-50%)',
    };
  } else {
    style = {
      ...style,
      left: targetRect.right + spacing,
      top: targetRect.top + targetRect.height / 2,
      transform: 'translateY(-50%)',
    };
  }

  // Clamp to viewport
  const tooltipWidth = 280;
  if (position === 'top' || position === 'bottom') {
    const halfWidth = tooltipWidth / 2;
    const leftVal = targetRect.left + targetRect.width / 2;
    if (leftVal - halfWidth < 8) {
      style.left = halfWidth + 8;
      style.transform = 'translateX(-50%)';
    } else if (leftVal + halfWidth > window.innerWidth - 8) {
      style.left = window.innerWidth - halfWidth - 8;
      style.transform = 'translateX(-50%)';
    }
  }

  const arrowStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = { position: 'absolute' };
    if (position === 'top') {
      return { ...base, bottom: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
    } else if (position === 'bottom') {
      return { ...base, top: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
    } else if (position === 'left') {
      return { ...base, right: -6, top: '50%', transform: 'translateY(-50%) rotate(45deg)' };
    }
    return { ...base, left: -6, top: '50%', transform: 'translateY(-50%) rotate(45deg)' };
  })();

  return (
    <>
      {/* Highlight ring around target */}
      <div
        style={{
          position: 'fixed',
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          border: '2px solid var(--accent-primary)',
          borderRadius: 8,
          boxShadow: '0 0 16px rgba(0,0,0,0.2)',
          zIndex: 99997,
          pointerEvents: 'none',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Tooltip card */}
      <div
        id={tooltipId}
        style={{ ...style, width: tooltipWidth }}
        className="bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] rounded-xl shadow-xl p-4"
      >
        <div
          style={arrowStyle}
          className="w-3 h-3 bg-[var(--bg-secondary)] border-[var(--accent-primary)]"
        />

        <div className="flex items-start gap-2 mb-2">
          <Info size={16} className="text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
          <h4 className="text-sm font-bold text-[var(--text-primary)] flex-1">
            {title}
          </h4>
          <button
            onClick={handleDismiss}
            className="p-0.5 rounded-full hover:bg-[var(--bg-primary)] transition-colors flex-shrink-0"
            aria-label="Dismiss tooltip"
          >
            <X size={14} className="text-[var(--text-secondary)]" />
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {content}
        </p>
        <button
          onClick={handleDismiss}
          className="mt-3 w-full px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:opacity-90 transition-all"
        >
          Got it
        </button>
      </div>
    </>
  );
};

export default ContextualTooltip;
