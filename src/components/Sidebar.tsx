import { BarChart3, BookOpen, Calendar, CheckCircle2, Clock, Menu, Notebook, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigation } from '@/navbar/NavigationContext';

const navItems = [
  { page: 'session', label: 'Study', icon: Clock },
  { page: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  { page: 'calendar', label: 'Planning', icon: Calendar },
  { page: 'analytics', label: 'Analytics', icon: BarChart3 },
  { page: 'habits', label: 'Journal', icon: Notebook },
  { page: 'notes', label: 'Notes', icon: BookOpen },
] as const;

interface SidebarContentProps {
  activePage: string;
  navigateTo: (page: any) => void;
  openSettings: () => void;
}

const SidebarContent = ({ activePage, navigateTo, openSettings }: SidebarContentProps) => {
  return (
    <>
      <div className="flex h-16 items-center justify-center border-b border-[var(--border-primary)]">
        <span className="text-lg font-bold" aria-label="UniTracker">
          <span className="text-[var(--text-primary)]">U</span>
          <span className="text-[var(--accent-primary)]">T</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
        {navItems.map(({ page, label, icon: Icon }) => {
          const isActive = activePage === page;

          return (
            <button
              key={page}
              onClick={() => navigateTo(page)}
              className={`flex items-center justify-center rounded-lg px-3 py-2.5 ${
                isActive
                  ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)]'
              }`}
              title={label}
            >
              <Icon size={20} className="flex-shrink-0" />
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border-primary)] p-2">
        <button
          onClick={openSettings}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-[var(--text-secondary)]"
          title="Settings"
        >
          <Settings size={20} className="flex-shrink-0" />
        </button>
      </div>
    </>
  );
};

const TopBar = () => {
  const { activePage, navigateTo, openSettings } = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleNavigate = (page: any) => {
    navigateTo(page);
    setMenuOpen(false);
  };

  return (
    <div className="lg:hidden fixed top-0 inset-x-0 h-14 z-[10000] bg-[var(--bg-primary)] border-b border-[var(--border-primary)] flex items-center px-3 gap-2">
      <span className="text-lg font-bold shrink-0 select-none" aria-label="UniTracker">
        <span className="text-[var(--text-primary)]">U</span>
        <span className="text-[var(--accent-primary)]">T</span>
      </span>

      {/* md: centered section nav */}
      <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
        {navItems.map(({ page, label, icon: Icon }) => (
          <button
            key={page}
            onClick={() => handleNavigate(page)}
            className={`flex items-center gap-1.5 rounded-lg p-2 text-sm font-medium transition-colors ${
              activePage === page
                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={label}
            aria-label={label}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className="hidden min-[880px]:inline leading-none">{label}</span>
          </button>
        ))}
      </nav>

      <div className="ml-auto md:ml-0 flex items-center gap-1">
        {/* md: settings icon */}
        <button
          onClick={openSettings}
          className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors"
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>

        {/* sm: hamburger -> dropdown */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* sm dropdown menu */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-14 z-[9999] bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden absolute left-0 right-0 top-full z-[10001] border-b border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 py-2 shadow-xl">
            <nav className="flex flex-col gap-1">
              {navItems.map(({ page, label, icon: Icon }) => (
                <button
                  key={page}
                  onClick={() => handleNavigate(page)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activePage === page
                      ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  openSettings();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              >
                <Settings size={20} className="flex-shrink-0" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
};

const Sidebar = () => {
  const { activePage, navigateTo, openSettings } = useNavigation();

  return (
    <>
      <TopBar />
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-16 flex-col overflow-hidden border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] lg:flex">
        <SidebarContent
          activePage={activePage}
          navigateTo={navigateTo}
          openSettings={openSettings}
        />
      </aside>
    </>
  );
};

export default Sidebar;
