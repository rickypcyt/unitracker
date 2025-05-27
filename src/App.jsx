import React, { useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/Home/HomePage';
import TasksPage from './pages/Tasks/TasksPage';
import StatsPage from './pages/Stats/StatsPage';
import CalendarPage from './pages/Calendar/CalendarPage';

// Layout component that keeps components mounted
const Layout = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div style={{ display: currentPath === '/' ? 'block' : 'none' }}>
        <HomePage />
      </div>
      <div style={{ display: currentPath === '/tasks' ? 'block' : 'none' }}>
        <TasksPage />
      </div>
      <div style={{ display: currentPath === '/stats' ? 'block' : 'none' }}>
        <StatsPage />
      </div>
      <div style={{ display: currentPath === '/calendar' ? 'block' : 'none' }}>
        <CalendarPage />
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Mapeo de rutas para navegación
  const routeMap = {
    '/': { left: '/tasks', right: '/calendar' },
    '/tasks': { left: '/stats', right: '/' },
    '/calendar': { left: '/', right: '/stats' },
    '/stats': { left: '/calendar', right: '/tasks' }
  };

  const handleKeyPress = useCallback((event) => {
    if (event.ctrlKey) {
      const currentPath = location.pathname;
      const routes = routeMap[currentPath] || routeMap['/'];
      
      if (event.key === 'ArrowLeft') {
        navigate(routes.left);
      } else if (event.key === 'ArrowRight') {
        navigate(routes.right);
      }
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <Routes>
      <Route path="/*" element={<Layout />} />
    </Routes>
  );
}

export default App; 