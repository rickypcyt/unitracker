import { BarChart3, BookOpen, Calendar, CheckCircle2, Clock, Notebook, Settings } from 'lucide-react';
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

const Sidebar = () => {
  const { activePage, navigateTo, openSettings } = useNavigation();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-16 flex-col overflow-hidden border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] lg:flex">
      <SidebarContent
        activePage={activePage}
        navigateTo={navigateTo}
        openSettings={openSettings}
      />
    </aside>
  );
};

export default Sidebar;
