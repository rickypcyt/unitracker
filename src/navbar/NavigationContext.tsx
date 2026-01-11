import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Page = 'tasks' | 'calendar' | 'session' | 'notes' | 'stats' | 'habits';

interface NavigationContextType {
  activePage: Page;
  navigateTo: (page: Page) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [activePage, setActivePage] = useState<Page>(() => {
    // Try to get the last visited page from localStorage
    const savedPage = localStorage.getItem('lastVisitedPage');
    // If it's the first visit or no saved page, default to 'session'
    return (savedPage as Page) || 'session';
  });

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
    <NavigationContext.Provider value={{ activePage, navigateTo }}>
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