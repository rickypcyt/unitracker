import { cloneElement, useEffect, useId, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  content: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
}

const ActionTooltip = ({ content, children }: Props) => {
  const id = useId();
  const [anchor, setAnchor] = useState<{ left: number; top: number; below: boolean } | null>(null);

  const show = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const width = Math.min(240, window.innerWidth - 16);
    const below = rect.top < 160;
    setAnchor({ left: Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8)), top: below ? rect.bottom + 8 : rect.top - 8, below });
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
    <span className="inline-flex" onMouseEnter={event => show(event.currentTarget)} onMouseLeave={() => setAnchor(null)} onFocusCapture={event => show(event.currentTarget)} onBlurCapture={() => setAnchor(null)} onClickCapture={() => setAnchor(null)} onKeyDown={event => { if (event.key === 'Escape') setAnchor(null); }}>
      {cloneElement(children, { 'aria-describedby': anchor ? [children.props['aria-describedby'], id].filter(Boolean).join(' ') : children.props['aria-describedby'] })}
      {anchor && createPortal(
        <span id={id} role="tooltip" className="fixed z-[100000] pointer-events-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-xs leading-relaxed text-[var(--text-primary)] shadow-lg" style={{ left: anchor.left, top: anchor.top, width: 'min(240px, calc(100vw - 16px))', transform: anchor.below ? undefined : 'translateY(-100%)' }}>{content}</span>,
        document.body,
      )}
    </span>
  );
};

export default ActionTooltip;
