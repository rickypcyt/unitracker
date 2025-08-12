import { createContext, useContext, useEffect, useState } from 'react';

import { supabase } from '@/utils/supabaseClient';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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
      console.error('Error logging in:', error.message);
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
      console.error('Error logging out:', error.message);
      toast.error('Error logging out', {
        containerId: 'main-toast-container',
        position: 'top-center'
      });
    }
  };

  // Asegura que el perfil existe en la tabla profiles
  async function ensureProfile(user) {
    if (!user?.id || !user?.email) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    if (!data) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
      });
    }
  }

  const value = {
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