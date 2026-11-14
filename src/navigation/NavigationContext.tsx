import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type Page = 'tasks' | 'session' | 'notes' | 'analytics' | 'habits' | 'focusWidget' | 'admin';

interface NavigationContextType {
  activePage: Page;
  navigateTo: (page: Page) => void;
  navOrder: Array<{ page: Page; icon: any; label: string }>;
  setNavOrder: (order: Array<{ page: Page; icon: any; label: string }>) => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  isNavCollapsed: boolean;
  toggleNavCollapse: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const PAGE_PATHS: Record<Page, string> = {
  session: '/session',
  tasks: '/tasks',
  notes: '/notes',
  analytics: '/analytics',
  habits: '/habits',
  focusWidget: '/focus',
  admin: '/admin',
};

const PATH_PAGES: Record<string, Page> = Object.entries(PAGE_PATHS).reduce(
  (pages, [page, path]) => ({ ...pages, [path]: page as Page }),
  {},
);

const DEFAULT_NAV_ORDER = [
  { page: 'tasks' as Page, icon: null, label: 'Tasks' },
  { page: 'habits' as Page, icon: null, label: 'Journal' },
  { page: 'session' as Page, icon: null, label: 'Study' },
  { page: 'notes' as Page, icon: null, label: 'Notes' },
  { page: 'analytics' as Page, icon: null, label: 'Analytics' },
];

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = PATH_PAGES[location.pathname] || 'session';
  const [navOrder, setNavOrderState] = useState<Array<{ page: Page; icon: any; label: string }>>(DEFAULT_NAV_ORDER);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(() => {
    const saved = localStorage.getItem('navbarCollapsed');
    return saved ? saved === 'true' : true;
  });

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const toggleNavCollapse = useCallback(() => {
    setIsNavCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('navbarCollapsed', String(next));
      return next;
    });
  }, []);

  // Nav order is fixed — clean up the legacy persisted custom order
  useEffect(() => {
    localStorage.removeItem('navbarOrder');
  }, []);

  const setNavOrder = useCallback((newOrder: Array<{ page: Page; icon: any; label: string }>) => {
    setNavOrderState(newOrder);
  }, []);

  const navigateTo = useCallback((page: Page) => {
    localStorage.setItem('lastVisitedPage', page);
    navigate(PAGE_PATHS[page]);
  }, [navigate]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey) {
      const pageMap = {
        'session': { left: 'habits', right: 'notes' },
        'tasks': { left: 'analytics', right: 'habits' },
        'analytics': { left: 'notes', right: 'tasks' },
        'habits': { left: 'tasks', right: 'session' },
        'notes': { left: 'session', right: 'analytics' },
        'focusWidget': { left: 'session', right: 'session' },
        'admin': { left: 'analytics', right: 'tasks' },
      };

      const routes = pageMap[activePage] || pageMap['session'];
      
      if (event.key === 'ArrowLeft') {
        navigateTo(routes.left as Page);
      } else if (event.key === 'ArrowRight') {
        navigateTo(routes.right as Page);
      }
    }
  }, [activePage, navigateTo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <NavigationContext.Provider value={{ activePage, navigateTo, navOrder, setNavOrder, isSettingsOpen, openSettings, closeSettings, isNavCollapsed, toggleNavCollapse }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}; 