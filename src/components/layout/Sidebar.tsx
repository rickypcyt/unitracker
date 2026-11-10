import { BarChart3, BookOpen, Calendar, CheckCircle2, Clock, Notebook, Settings } from 'lucide-react';
import { useNavigation } from '@/navigation/NavigationContext';
import { useTranslation } from 'react-i18next';

const navItems = [
  { page: 'calendar', key: 'planning', icon: Calendar },
  { page: 'tasks', key: 'tasks', icon: CheckCircle2 },
  { page: 'session', key: 'study', icon: Clock },
  { page: 'habits', key: 'journal', icon: Notebook },
  { page: 'notes', key: 'notes', icon: BookOpen },
  { page: 'analytics', key: 'analytics', icon: BarChart3 },
] as const;

const Navbar = () => {
  const { activePage, navigateTo, openSettings } = useNavigation();
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 inset-x-0 h-14 lg:h-16 z-[10000] bg-[var(--bg-primary)] border-b border-[var(--border-primary)] grid grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-3 sm:px-6 lg:px-8 gap-2 lg:gap-6" data-tour="navbar">
      <button onClick={() => navigateTo('session')} className="justify-self-start text-lg font-bold shrink-0 select-none min-h-11 flex items-center" aria-label={t('nav.home')}>
        <span className="text-[var(--text-primary)]">U<span className="hidden lg:inline">ni</span></span>
        <span className="text-[var(--accent-primary)]">T<span className="hidden lg:inline">racker</span></span>
      </button>

      <nav aria-label="Main navigation" className="min-w-0 h-full overflow-x-auto overscroll-x-contain hide-scrollbar">
        <div className="flex w-max min-w-full h-full items-center justify-center gap-0.5 sm:gap-1">
        {navItems.map(({ page, key, icon: Icon }) => {
          const label = t(`nav.${key}`);
          return (
          <button
            key={page}
            onClick={() => navigateTo(page)}
            className={`min-w-9 min-h-11 sm:min-w-11 shrink-0 flex items-center justify-center gap-2 rounded-lg px-1.5 sm:px-2 lg:px-4 text-sm font-bold transition-colors ${
              activePage === page
                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={label}
            aria-label={label}
            aria-current={activePage === page ? 'page' : undefined}
          >
            <Icon size={20} className="shrink-0" />
            <span className="hidden min-[880px]:inline leading-none">{label}</span>
          </button>
          );
        })}
        </div>
      </nav>

      <button
        onClick={openSettings}
        className="justify-self-end shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors"
        title={t('nav.settings')}
        aria-label={t('nav.settings')}
      >
        <Settings size={20} />
      </button>
    </header>
  );
};

export default Navbar;
