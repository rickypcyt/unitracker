import { NavigationProvider, useNavigation } from './features/navigation/NavigationContext';
import React, { useEffect, useState } from 'react';

import { AuthProvider } from "./hooks/useAuth.jsx";
import CalendarPage from './pages/CalendarPage';
import Navbar from './components/layout/Navbar';
import { NoiseProvider } from "./features/noise/NoiseContext";
import SessionPage from './pages/SessionPage';
import Settings from './components/modals/Settings';
import StatsPage from './pages/StatsPage';
import TasksPage from './pages/TasksPage';
import WelcomeModal from './components/modals/WelcomeModal';
import useTheme from './hooks/useTheme';

const PageContent = ({ onOpenSettings }) => {
  const { activePage } = useNavigation();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full">
      <Navbar onOpenSettings={onOpenSettings} />
      <div className="pt-12">
        {activePage === 'session' && <SessionPage />}
        {activePage === 'tasks' && <TasksPage />}
        {activePage === 'calendar' && <CalendarPage />}
        {activePage === 'stats' && <StatsPage />}
      </div>
    </div>
  );
};

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const { showWelcomeModal, handleCloseWelcome, currentTheme, handleThemeChange } = useTheme();

  // Asegurar que el tema oscuro se aplique desde el inicio
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    handleThemeChange(savedTheme);
  }, []);

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <NoiseProvider>
      <AuthProvider>
        <NavigationProvider>
          <PageContent onOpenSettings={handleOpenSettings} />
          {showSettings && (
            <Settings
              isOpen={showSettings}
              onClose={handleCloseSettings}
              currentTheme={currentTheme}
              handleThemeChange={handleThemeChange}
            />
          )}
          {showWelcomeModal && (
            <WelcomeModal
              onClose={handleCloseWelcome}
            />
          )}
        </NavigationProvider>
      </AuthProvider>
    </NoiseProvider>
  );
}

export default App; 