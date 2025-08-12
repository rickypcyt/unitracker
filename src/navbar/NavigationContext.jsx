import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [activePage, setActivePage] = useState(() => {
    // Try to get the last visited page from localStorage
    const savedPage = localStorage.getItem('lastVisitedPage');
    // If it's the first visit or no saved page, default to 'session'
    return savedPage || 'session';
  });

  const navigateTo = useCallback((page) => {
    setActivePage(page);
    // Save the current page to localStorage
    localStorage.setItem('lastVisitedPage', page);
  }, []);

  const handleKeyPress = useCallback((event) => {
    if (event.ctrlKey) {
      const pageMap = {
        'tasks': { left: 'stats', right: 'calendar' },
        'calendar': { left: 'tasks', right: 'session' },
        'session': { left: 'calendar', right: 'notes' },
        'notes': { left: 'session', right: 'stats' },
        'stats': { left: 'notes', right: 'tasks' },
      };

      const routes = pageMap[activePage] || pageMap['session'];
      
      if (event.key === 'ArrowLeft') {
        navigateTo(routes.left);
      } else if (event.key === 'ArrowRight') {
        navigateTo(routes.right);
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