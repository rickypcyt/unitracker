import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useAuth - Initial session:', session);
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      console.log('useAuth - isLoggedIn set to:', !!session);
      if (session?.user) ensureProfile(session.user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('useAuth - Auth state changed:', { event: _event, session });
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      console.log('useAuth - isLoggedIn updated to:', !!session);
      if (session?.user) ensureProfile(session.user);
      
      if (session) {
        // Dismiss any existing toasts first
        toast.dismiss();
        // Show new toast
        toast.success('🔑 You have successfully logged in!', {
          containerId: 'main-toast-container',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error instanceof Error ? error.message : 'Unknown error');
      toast.error('Error logging in with Google', {
        containerId: 'main-toast-container',
        position: 'top-center'
      });
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all caches and local storage
      clearAllCaches();
      
      toast.success('Successfully logged out', {
        containerId: 'main-toast-container',
        position: 'top-center'
      });
    } catch (error) {
      console.error('Error logging out:', error instanceof Error ? error.message : 'Unknown error');
      toast.error('Error logging out', {
        containerId: 'main-toast-container',
        position: 'top-center'
      });
    }
  };

  // Function to clear all caches and local storage
  const clearAllCaches = () => {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear Zustand persist storage specifically
      localStorage.removeItem('uni-tracker-storage');
      
      // Clear any remaining app-specific keys
      const appKeys = [
        'localTasks',
        'tasksHydrated',
        'pomodoroModes',
        'activeWorkspace',
        'activeWorkspaceId',
        'userPreferences',
        'theme',
        'accentColor'
      ];
      
      appKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Could not remove ${key} from storage:`, e);
        }
      });
      
      // Clear any noise generator settings
      const noiseKeys = Object.keys(localStorage).filter(key => 
        key.includes('Volume') || key.includes('IsPlaying')
      );
      
      noiseKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Could not remove noise key ${key}:`, e);
        }
      });
      
      // Clear any remaining workspace-related keys
      const workspaceKeys = Object.keys(localStorage).filter(key => 
        key.toLowerCase().includes('workspace') || 
        key.toLowerCase().includes('workspaces')
      );
      
      workspaceKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Could not remove workspace key ${key}:`, e);
        }
      });
      
      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  };

  // Asegura que el perfil existe en la tabla profiles
  async function ensureProfile(user: User) {
    if (!user?.id || !user?.email) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    if (!data && !error) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
      });
    }
  }

  const value: AuthContextType = {
    user,
    isLoggedIn,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 