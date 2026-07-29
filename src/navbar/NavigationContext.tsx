import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Page = 'tasks' | 'calendar' | 'session' | 'notes' | 'stats' | 'habits' | 'focusWidget' | 'admin';

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

const DEFAULT_NAV_ORDER = [
  { page: 'calendar' as Page, icon: null, label: 'Calendar' },
  { page: 'tasks' as Page, icon: null, label: 'Tasks' },
  { page: 'session' as Page, icon: null, label: 'Session' },
  { page: 'habits' as Page, icon: null, label: 'Habits' },
  { page: 'notes' as Page, icon: null, label: 'Notes' },
  { page: 'stats' as Page, icon: null, label: 'Stats' },
];

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const VALID_PAGES: Page[] = ['tasks', 'calendar', 'session', 'notes', 'stats', 'habits', 'focusWidget', 'admin'];

  const [activePage, setActivePage] = useState<Page>(() => {
    const savedPage = localStorage.getItem('lastVisitedPage') as Page | null;
    if (savedPage && VALID_PAGES.includes(savedPage)) {
      return savedPage;
    }
    localStorage.setItem('lastVisitedPage', 'session');
    return 'session';
  });

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

  // Load nav order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('navbarOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        // Validate that the saved order has the correct structure
        if (Array.isArray(parsedOrder) && parsedOrder.every(item => 
          item.page && item.label && DEFAULT_NAV_ORDER.some(defaultItem => defaultItem.page === item.page)
        )) {
          setNavOrderState(parsedOrder);
        }
      } catch (error) {
        console.error('Error parsing navbar order from localStorage:', error);
      }
    }
  }, []);

  const setNavOrder = useCallback((newOrder: Array<{ page: Page; icon: any; label: string }>) => {
    setNavOrderState(newOrder);
    localStorage.setItem('navbarOrder', JSON.stringify(newOrder));
  }, []);

  const navigateTo = useCallback((page: Page) => {
    setActivePage(page);
    // Save the current page to localStorage
    localStorage.setItem('lastVisitedPage', page);
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey) {
      const pageMap = {
        'tasks': { left: 'habits', right: 'calendar' },
        'calendar': { left: 'tasks', right: 'session' },
        'session': { left: 'calendar', right: 'notes' },
        'notes': { left: 'session', right: 'stats' },
        'stats': { left: 'notes', right: 'habits' },
        'habits': { left: 'stats', right: 'tasks' },
        'focusWidget': { left: 'session', right: 'session' },
        'admin': { left: 'stats', right: 'tasks' },
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