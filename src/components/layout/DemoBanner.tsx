import { FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAuth } from '@/hooks/auth/useAuth';

/** Slim bar above the navbar telling signed-out visitors they are looking at a demo. */
const DemoBanner: FC = () => {
  const { t } = useTranslation();
  const { isLoggedIn, isAuthLoading } = useAuth();
  const visible = !isAuthLoading && !isLoggedIn;

  // Pages that size themselves against the viewport read this to leave room for the bar
  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.style.setProperty('--demo-banner-h', '2.5rem');
    else root.style.removeProperty('--demo-banner-h');
    return () => {
      root.style.removeProperty('--demo-banner-h');
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[10001] flex h-10 items-center justify-center gap-3 border-b border-[var(--accent-primary)]/30 bg-[var(--bg-primary)] px-3 text-xs sm:text-sm"
    >
      <span className="min-w-0 truncate text-[var(--text-secondary)]">{t('demo.banner.text')}</span>
      <Link
        to="/login"
        className="shrink-0 rounded-full border-2 border-[var(--accent-primary)] px-3 py-0.5 font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/10"
      >
        {t('demo.banner.cta')}
      </Link>
    </div>
  );
};

export default DemoBanner;
