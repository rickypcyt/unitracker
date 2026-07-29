import { BarChart3, BookOpen, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, Notebook, Settings } from 'lucide-react';
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
  isNavCollapsed: boolean;
  toggleNavCollapse: () => void;
  activePage: string;
  navigateTo: (page: any) => void;
  openSettings: () => void;
}

const SidebarContent = ({ isNavCollapsed, toggleNavCollapse, activePage, navigateTo, openSettings }: SidebarContentProps) => {
  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
        {!isNavCollapsed && (
          <span className="font-bold text-[var(--text-primary)] text-lg">UniTracker</span>
        )}
        <button
          onClick={toggleNavCollapse}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] flex-shrink-0"
        >
          {isNavCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ page, label, icon: Icon }) => {
          const isActive = activePage === page;

          return (
            <button
              key={page}
              onClick={() => navigateTo(page)}
              className={`flex items-center justify-center px-3 py-2.5 rounded-lg ${
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

      <div className="p-2 border-t border-[var(--border-primary)]">
        <button
          onClick={openSettings}
          className={`flex items-center justify-center px-3 py-2.5 rounded-lg text-[var(--text-secondary)] w-full`}
          title="Settings"
        >
          <Settings size={20} className="flex-shrink-0" />
        </button>
      </div>
    </>
  );
};

const Sidebar = () => {
  const { activePage, navigateTo, isNavCollapsed, toggleNavCollapse, openSettings } = useNavigation();

  return (
    <>
      {!isNavCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={toggleNavCollapse}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col transition-all duration-300 lg:hidden ${
          isNavCollapsed ? '-translate-x-full w-56' : 'translate-x-0 w-56'
        }`}
      >
        <SidebarContent
          isNavCollapsed={false}
          toggleNavCollapse={toggleNavCollapse}
          activePage={activePage}
          navigateTo={navigateTo}
          openSettings={openSettings}
        />
      </aside>

      <aside
        className={`hidden lg:flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex-shrink-0 transition-all duration-300 sticky top-0 min-h-screen self-stretch ${
          isNavCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <SidebarContent
          isNavCollapsed={isNavCollapsed}
          toggleNavCollapse={toggleNavCollapse}
          activePage={activePage}
          navigateTo={navigateTo}
          openSettings={openSettings}
        />
      </aside>
    </>
  );
};

export default Sidebar;
