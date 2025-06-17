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
import toast from 'react-hot-toast';
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

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  // Handle notification permissions
  useEffect(() => {
    const checkNotificationPermission = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = Notification.permission;
        
        if (permission === 'default') {
          // Only request permission if it hasn't been requested before
          const hasRequestedBefore = localStorage.getItem('notificationPermissionRequested');
          if (!hasRequestedBefore) {
            try {
              const newPermission = await Notification.requestPermission();
              localStorage.setItem('notificationPermissionRequested', 'true');
              
              if (newPermission === 'granted') {
                toast.success('Notifications enabled! You will be notified about your study sessions.', {
                  duration: 4000,
                  position: 'top-center',
                });
              }
            } catch (error) {
              console.error('Error requesting notification permission:', error);
            }
          }
        }
      }
    };

    checkNotificationPermission();
  }, []);

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