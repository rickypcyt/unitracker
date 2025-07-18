import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { NavigationProvider, useNavigation } from '@/navbar/NavigationContext';
import React, { useEffect, useRef, useState } from 'react';
import { clearUser, setUser } from '@/store/slices/authSlice';

import type { AppDispatch } from '@/store/store';
import CalendarPage from '@/pages/calendar/CalendarPage';
import Navbar from '@/navbar/Navbar';
import { NoiseProvider } from '@/utils/NoiseContext';
import Notes from './Notes';
import SessionPage from '@/pages/session/SessionPage';
import Settings from '@/modals/Settings';
import StatsPage from '@/pages/stats/StatsPage';
import TasksPage from '@/pages/tasks/TasksPage';
import Tour from './components/Tour';
import TourManager from './components/TourManager';
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
  const { currentTheme, handleThemeChange } = useTheme();
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
            } catch (error) {
              console.error('Error requesting notification permission:', error);
            }
          }
        }
      }
    };
    checkNotificationPermission();

    // Ctrl+N para cambiar entre light y dark mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        handleThemeChange(currentTheme === 'dark' ? 'light' : 'dark');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTheme, handleThemeChange]);

  useEffect(() => {
    dispatch(hydrateTasksFromLocalStorage());
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useSupabaseAuthSync();

  // Swipe navigation para mobile
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const navPages = ['tasks', 'calendar', 'session', 'notes', 'stats'];
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.changedTouches[0].screenX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].screenX;
      const diff = touchEndX.current - touchStartX.current;
      if (Math.abs(diff) > 60) {
        // Detecta swipe
        const currentIdx = navPages.indexOf(window.localStorage.getItem('lastVisitedPage') || 'session');
        if (diff < 0 && currentIdx < navPages.length - 1) {
          // Swipe left: siguiente página
          window.localStorage.setItem('lastVisitedPage', navPages[currentIdx + 1]);
          window.dispatchEvent(new Event('navigationchange'));
        } else if (diff > 0 && currentIdx > 0) {
          // Swipe right: página anterior
          window.localStorage.setItem('lastVisitedPage', navPages[currentIdx - 1]);
          window.dispatchEvent(new Event('navigationchange'));
        }
      }
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <NoiseProvider>
      <AuthProvider>
        <TourManager>
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
          </NavigationProvider>
        </TourManager>
      </AuthProvider>
    </NoiseProvider>
  );
}

export default App; 