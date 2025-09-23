import { AuthProvider, useAuth } from '@/hooks/useAuth';
import type { FC, MutableRefObject } from 'react';
import { NavigationProvider, useNavigation } from '@/navbar/NavigationContext';
import { clearUser, setUser } from '@/store/slices/authSlice';
import { useEffect, useRef, useState } from 'react';

import type { AppDispatch } from '@/store/store';
import CalendarPage from '@/pages/calendar/CalendarPage';
import Navbar from '@/navbar/Navbar';
import { NoiseProvider } from '@/utils/NoiseContext';
import Notes from './pages/notes/Notes';
import SessionPage from '@/pages/session/SessionPage';
import StatsPage from '@/pages/stats/StatsPage';
import TasksPage from '@/pages/tasks/TasksPage';
import { Toaster } from 'react-hot-toast';
import TourManager from './components/TourManager';
import type { User } from '@supabase/supabase-js';
import UserModal from '@/modals/UserModal';
import { fetchWorkspaces } from '@/store/slices/workspaceSlice';
import { hydrateTasksFromLocalStorage } from '@/store/slices/TaskSlice';
import { supabase } from '@/utils/supabaseClient';
import { useDispatch } from 'react-redux';
import useTheme from '@/hooks/useTheme';

const PageContent: FC = () => {
  const { activePage } = useNavigation();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full">
      <Navbar />
      <div className="pt-16">
        {activePage === 'session' && <SessionPage />}
        {activePage === 'tasks' && <TasksPage />}
        {activePage === 'calendar' && <CalendarPage />}
        {activePage === 'stats' && <StatsPage />}
        {activePage === 'notes' && <Notes />}
      </div>
    </div>
  );
};

function useSupabaseAuthSync(): void {
  const dispatch = useDispatch();

  useEffect(() => {
    // Al cargar, setea el usuario si hay sesión
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) dispatch(setUser(user));
      else dispatch(clearUser());
    });

    // Suscríbete a cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) dispatch(setUser(session.user));
      else dispatch(clearUser());
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [dispatch]);
}

// Componente que muestra el UserModal si el usuario está logueado y no tiene username
const UserModalGate: FC = () => {
  const { user, isLoggedIn } = useAuth() as { user: User | null; isLoggedIn: boolean };
  const [showUserModal, setShowUserModal] = useState(false);
  useEffect(() => {
    const checkUsername = async (): Promise<void> => {
      if (isLoggedIn && user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (!error && (!data || !data.username)) {
          setShowUserModal(true);
        } else {
          setShowUserModal(false);
        }
      } else {
        setShowUserModal(false);
      }
    };
    checkUsername();
  }, [isLoggedIn, user]);
  return <UserModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} />;
};

const App: FC = () => {
  const { currentTheme, toggleTheme } = useTheme();
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    const checkNotificationPermission = async (): Promise<void> => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = Notification.permission;
        if (permission === 'default') {
          const hasRequestedBefore = localStorage.getItem('notificationPermissionRequested');
          if (!hasRequestedBefore) {
            try {
              await Notification.requestPermission();
              localStorage.setItem('notificationPermissionRequested', 'true');
            } catch (error) {
              console.error('Error requesting notification permission:', error);
            }
          }
        }
      }
    };
    checkNotificationPermission();

    // La lógica de handleKeyDown se ha movido fuera del componente
    const keydownListener = (e: KeyboardEvent): void => {
      handleKeyDown(e, toggleTheme);
    };
    window.addEventListener('keydown', keydownListener);

    return () => {
      window.removeEventListener('keydown', keydownListener);
    };
  }, [currentTheme, toggleTheme]);

  useEffect(() => {
    dispatch(hydrateTasksFromLocalStorage());
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useSupabaseAuthSync();

  // Swipe navigation para mobile
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  useEffect(() => {
    const touchStartListener = (e: TouchEvent): void => handleTouchStart(e, touchStartX);
    const touchEndListener = (e: TouchEvent): void => handleTouchEnd(e, touchStartX, touchEndX);

    window.addEventListener('touchstart', touchStartListener, { passive: true });
    window.addEventListener('touchend', touchEndListener, { passive: true });

    return () => {
      window.removeEventListener('touchstart', touchStartListener);
      window.removeEventListener('touchend', touchEndListener);
    };
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            border: '2px solid var(--border-primary)',
          },
        }}
      />
      <NoiseProvider>
        <AuthProvider>
          <TourManager>
            <UserModalGate />
            <NavigationProvider>
              <PageContent />
            </NavigationProvider>
          </TourManager>
        </AuthProvider>
      </NoiseProvider>
    </>
  );
}

// Helpers
const navPages = ['tasks', 'calendar', 'session', 'notes', 'stats'];

const handleKeyDown = (
  e: KeyboardEvent,
  toggleTheme: () => void
): void => {
  if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
    e.preventDefault();
    toggleTheme();
  }
};

const handleTouchStart = (e: TouchEvent, touchStartX: MutableRefObject<number>): void => {
  touchStartX.current = e.changedTouches[0]?.screenX || 0;
};

const handleTouchEnd = (
  e: TouchEvent,
  touchStartX: MutableRefObject<number>,
  touchEndX: MutableRefObject<number>
): void => {
  touchEndX.current = e.changedTouches[0]?.screenX || 0;
  const diff = touchEndX.current - touchStartX.current;
  if (Math.abs(diff) > 60) {
    const currentIdx = navPages.indexOf(window.localStorage.getItem('lastVisitedPage') || 'session');
    if (diff < 0 && currentIdx < navPages.length - 1) {
      const nextPage = navPages[currentIdx + 1];
      if (nextPage) {
        window.localStorage.setItem('lastVisitedPage', nextPage);
        window.dispatchEvent(new Event('navigationchange'));
      }
    } else if (diff > 0 && currentIdx > 0) {
      const prevPage = navPages[currentIdx - 1];
      if (prevPage) {
        window.localStorage.setItem('lastVisitedPage', prevPage);
        window.dispatchEvent(new Event('navigationchange'));
      }
    }
  }
};

export default App; 