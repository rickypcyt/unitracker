import { BarChart3, BookOpen, CheckCircle2, Clock, Notebook, Settings } from 'lucide-react';
import { useNavigation } from '@/navigation/NavigationContext';
import { useTranslation } from 'react-i18next';

const navItems = [
  { page: 'tasks', key: 'tasks', icon: CheckCircle2 },
  { page: 'habits', key: 'journal', icon: Notebook },
  { page: 'session', key: 'study', icon: Clock },
  { page: 'notes', key: 'notes', icon: BookOpen },
  { page: 'analytics', key: 'analytics', icon: BarChart3 },] as const;

const Navbar = () => {
  const { activePage, navigateTo, openSettings } = useNavigation();
  const { t } = useTranslation();

  return (
    <header className="sticky top-(--demo-banner-h,0px) h-(--navbar-h) shrink-0 z-10000 bg-(--bg-primary) border-b border-(--border-primary) grid grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center page-gutter gap-2 lg:gap-6" data-tour="navbar">
      <button onClick={() => navigateTo('session')} className="justify-self-start text-lg font-bold shrink-0 select-none min-h-11 flex items-center" aria-label={t('nav.home')}>
        <span className="text-(--text-primary)">U<span className="hidden lg:inline">ni</span></span>
        <span className="text-(--accent-primary)">T<span className="hidden lg:inline">racker</span></span>
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
                ? 'bg-(--accent-primary)/10 text-(--accent-primary)'
                : 'text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)'
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
        className="justify-self-end shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-primary) hover:text-(--text-primary) transition-colors"
        title={t('nav.settings')}
        aria-label={t('nav.settings')}
      >
        <Settings size={20} />
      </button>
    </header>
  );
};

export default Navbar;
