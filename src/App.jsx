import React, { useState } from 'react';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import Navbar from './components/Navbar';
import SessionPage from './pages/SessionPage';
import TasksPage from './pages/TasksPage';
import StatsPage from './pages/StatsPage';
import CalendarPage from './pages/CalendarPage';
import Settings from './components/modals/Settings';
import { AuthProvider } from "./hooks/useAuth.jsx";

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

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <AuthProvider>
      <NavigationProvider>
        <PageContent onOpenSettings={handleOpenSettings} />
        {showSettings && (
          <Settings
            onClose={handleCloseSettings}
          />
        )}
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App; 