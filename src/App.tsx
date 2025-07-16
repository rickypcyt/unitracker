import { NavigationProvider, useNavigation } from '@/navbar/NavigationContext';
import React, { useEffect, useState } from 'react';
import { clearUser, setUser } from '@/store/slices/authSlice';

import type { AppDispatch } from '@/store/store';
import { AuthProvider } from '@/hooks/useAuth';
import CalendarPage from '@/pages/calendar/CalendarPage';
import Navbar from '@/navbar/Navbar';
import { NoiseProvider } from '@/utils/NoiseContext';
import Notes from './Notes';
import SessionPage from '@/pages/session/SessionPage';
import Settings from '@/modals/Settings';
import StatsPage from '@/pages/stats/StatsPage';
import TasksPage from '@/pages/tasks/TasksPage';
import WelcomeModal from '@/modals/WelcomeModal';
import { fetchWorkspaces } from '@/store/slices/workspaceSlice';
import { hydrateTasksFromLocalStorage } from '@/store/slices/TaskSlice';
import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import useTheme from '@/hooks/useTheme';

interface PageContentProps {
  onOpenSettings: () => void;
}

const PageContent: React.FC<PageContentProps> = ({ onOpenSettings }) => {
  const { activePage } = useNavigation();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full">
      <Navbar onOpenSettings={onOpenSettings} />
      <div className="pt-12">
        {activePage === 'session' && <SessionPage />}
        {activePage === 'tasks' && <TasksPage />}
        {activePage === 'calendar' && <CalendarPage />}
        {activePage === 'stats' && <StatsPage />}
        {activePage === 'notes' && <Notes />}
      </div>
    </div>
  );
};

function useSupabaseAuthSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Al cargar, setea el usuario si hay sesión
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) dispatch(setUser(user));
      else dispatch(clearUser());
    });

    // Suscríbete a cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) dispatch(setUser(session.user));
      else dispatch(clearUser());
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [dispatch]);
}

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const { showWelcomeModal, handleCloseWelcome, currentTheme, handleThemeChange } = useTheme();
  const dispatch: AppDispatch = useDispatch();

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  useEffect(() => {
    const checkNotificationPermission = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = Notification.permission;
        if (permission === 'default') {
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

  useEffect(() => {
    dispatch(hydrateTasksFromLocalStorage());
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useSupabaseAuthSync();

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