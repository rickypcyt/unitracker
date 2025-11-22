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
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      if (session?.user) ensureProfile(session.user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
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