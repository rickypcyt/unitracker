import { Check, Columns3, Focus, LayoutGrid, ListTodo } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getSessionLayout,
  SESSION_LAYOUT_EVENT,
  setSessionLayout,
  type SessionLayoutId,
} from '@/pages/session/sessionLayouts';

interface SessionLayoutButtonProps {
  menuDirection?: 'up' | 'down';
}

const LAYOUT_ICONS: Record<SessionLayoutId, typeof LayoutGrid> = {
  default: LayoutGrid,
  planning: ListTodo,
  focus: Focus,
  compact: Columns3,
};

const LAYOUT_ORDER: SessionLayoutId[] = ['default', 'planning', 'focus', 'compact'];

const SessionLayoutButton = ({ menuDirection = 'down' }: SessionLayoutButtonProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<SessionLayoutId>(getSessionLayout);

  useEffect(() => {
    const handler = () => setLayout(getSessionLayout());
    window.addEventListener(SESSION_LAYOUT_EVENT, handler);
    return () => window.removeEventListener(SESSION_LAYOUT_EVENT, handler);
  }, []);

  const selectLayout = (id: SessionLayoutId) => {
    setSessionLayout(id);
    setOpen(false);
  };

  const menuPosition =
    menuDirection === 'up'
      ? 'bottom-full mb-1 left-0'
      : 'top-full mt-1 right-0';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-[1.02] active:scale-95 antialiased"
        title={t('session.layout.button')}
        aria-label={t('session.layout.button')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <LayoutGrid className="w-5 h-5 flex-shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={`absolute z-50 w-60 py-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg ${menuPosition}`}
            role="menu"
          >
            {LAYOUT_ORDER.map(id => {
              const Icon = LAYOUT_ICONS[id];
              const isActive = layout === id;
              return (
                <button
                  key={id}
                  onClick={() => selectLayout(id)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--bg-secondary)] ${
                    isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                  }`}
                  role="menuitemradio"
                  aria-checked={isActive}
                >
                  <Icon size={16} className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-tight">
                      {t(`session.layout.options.${id}.label`)}
                    </span>
                    <span className="block text-xs text-[var(--text-secondary)] leading-snug mt-0.5">
                      {t(`session.layout.options.${id}.description`)}
                    </span>
                  </span>
                  {isActive && <Check size={15} className="mt-0.5 flex-shrink-0 text-[var(--accent-primary)]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SessionLayoutButton;
