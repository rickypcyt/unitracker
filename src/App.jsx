import React, { useState } from 'react';
import { NavigationProvider, useNavigation } from './features/navigation/NavigationContext';
import Navbar from './components/layout/Navbar';
import SessionPage from './pages/SessionPage';
import TasksPage from './pages/TasksPage';
import StatsPage from './pages/StatsPage';
import CalendarPage from './pages/CalendarPage';
import Settings from './components/modals/Settings';
import WelcomeModal from './components/modals/WelcomeModal';
import { AuthProvider } from "./hooks/useAuth.jsx";
import { NoiseProvider } from "./features/noise/NoiseContext";
import useTheme from './hooks/useTheme';

const PageContent = ({ onOpenSettings }) => {
  const { activePage } = useNavigation();

  return (
    <div className="min-h-screen bg-black w-full">
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
  const { showWelcomeModal, handleCloseWelcome } = useTheme();

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
              onClose={handleCloseSettings}
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