import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * SectionTitle - Componente reutilizable para títulos de sección con tooltip informativo
 *
 * @example
 * // Título simple con tooltip
 * <SectionTitle
 *   title="Study Timer"
 *   tooltip="A customizable timer for focused study sessions"
 * />
 *
 * // Título con tamaño personalizado
 * <SectionTitle
 *   title="Pomodoro"
 *   tooltip="Time management technique with work/break cycles"
 *   size="lg"
 * />
 *
 * // Título con clases CSS adicionales
 * <SectionTitle
 *   title="Countdown"
 *   tooltip="Timer that counts down from a set time"
 *   className="text-center mb-6"
 * />
 */
interface SectionTitleProps {
  title: string;
  tooltip: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  tooltip,
  className = '',
  size = 'md'
}) => {
  const tooltipId = useId();
  const [anchor, setAnchor] = useState<{ left: number; top: number; below: boolean } | null>(null);

  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold'
  };

  const show = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8));
    const below = rect.bottom + 140 < window.innerHeight;
    setAnchor({ left, top: below ? rect.bottom + 10 : rect.top - 10, below });
  };

  useEffect(() => {
    if (!anchor) return;
    const close = () => setAnchor(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [anchor]);

  return (
    <div className="relative inline-block">
      <div
        className="group cursor-help inline-block"
        onMouseEnter={event => show(event.currentTarget)}
        onMouseLeave={() => setAnchor(null)}
        onFocus={event => show(event.currentTarget)}
        onBlur={() => setAnchor(null)}
        tabIndex={0}
        aria-describedby={anchor ? tooltipId : undefined}
      >
        <h2 className={`${sizeClasses[size]} text-[var(--text-primary)] ${className}`}>
          {title}
        </h2>
      </div>

      {anchor && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          className="fixed z-[100000] pointer-events-none rounded-lg border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)] p-3 shadow-xl"
          style={{
            left: anchor.left,
            top: anchor.top,
            width: 'min(320px, calc(100vw - 16px))',
            transform: anchor.below ? undefined : 'translateY(-100%)'
          }}
        >
          {anchor.below
            ? <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-transparent border-b-[var(--accent-primary)]" />
            : <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-transparent border-t-[var(--accent-primary)]" />}
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {tooltip}
          </p>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SectionTitle;
