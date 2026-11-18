import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabaseClient';
import { getStoredReferral } from '@/utils/referral';
import { toast } from 'sonner';
import { track } from '@vercel/analytics';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<boolean>;
  /** Warms up the Google OAuth redirect so the click feels instant. */
  prepareGoogleLogin: () => void;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || authEventReceived) return;
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      setIsAuthLoading(false);
      if (session?.user) ensureProfile(session.user);
    }).catch(() => {
      if (active && !authEventReceived) setIsAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      authEventReceived = true;
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      setIsAuthLoading(false);
      if (session?.user) ensureProfile(session.user);
      

    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Pre-built OAuth URL (PKCE verifier already stored) so the click only has to redirect
  const oauthUrlRef = useRef<{ url: string; at: number } | null>(null);
  const OAUTH_URL_TTL_MS = 5 * 60 * 1000;

  const buildGoogleUrl = async (): Promise<string> => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, skipBrowserRedirect: true },
    });
    if (error || !data?.url) throw error ?? new Error('Missing OAuth URL');
    return data.url;
  };

  const prepareGoogleLogin = () => {
    const cached = oauthUrlRef.current;
    if (cached && Date.now() - cached.at < OAUTH_URL_TTL_MS) return;
    // Open connections to the auth host and Google ahead of the redirect
    const hosts = [(import.meta.env as Record<string, string>)['VITE_SUPABASE_URL'], 'https://accounts.google.com'];
    hosts.forEach((href) => {
      if (!href || document.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      link.crossOrigin = '';
      document.head.appendChild(link);
    });
    buildGoogleUrl()
      .then((url) => { oauthUrlRef.current = { url, at: Date.now() }; })
      .catch(() => { oauthUrlRef.current = null; });
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const cached = oauthUrlRef.current;
      oauthUrlRef.current = null; // single use
      const url =
        cached && Date.now() - cached.at < OAUTH_URL_TTL_MS ? cached.url : await buildGoogleUrl();
      window.location.assign(url);
      return true;
    } catch (error) {
      console.error('Error logging in:', error instanceof Error ? error.message : 'Unknown error');
      toast.error('Error logging in with Google');
      return false;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all caches and local storage
      clearAllCaches();

      // Redirect to demo/landing with full reload
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error logging out:', error instanceof Error ? error.message : 'Unknown error');
      toast.error('Error logging out');
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
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  };

  // Asegura que el perfil existe en la tabla profiles
  async function ensureProfile(user: User) {
    if (!user?.id || !user?.email) return;
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (!data) {
      // Ignora el error: el perfil puede ya existir por un trigger de DB
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
      });
    }

    // Signup attribution — fires once per session, only for fresh accounts
    const isNewUser =
      Date.now() - new Date(user.created_at).getTime() < 15 * 60 * 1000;
    const trackedKey = `signup_tracked_${user.id}`;
    if (!isNewUser || sessionStorage.getItem(trackedKey)) return;
    sessionStorage.setItem(trackedKey, '1');

    const referral = getStoredReferral();
    track('signup', {
      ref: referral?.ref ?? 'direct',
      utm_source: referral?.utm_source ?? '',
    });

    // Persists only if the `referrer` column exists:
    //   alter table public.profiles add column if not exists referrer text;
    const referrer = referral?.ref ?? referral?.utm_source;
    if (referrer) {
      await supabase
        .from('profiles')
        .update({ referrer })
        .eq('id', user.id);
    }
  }

  const value: AuthContextType = {
    user,
    isLoggedIn,
    isAuthLoading,
    loginWithGoogle,
    prepareGoogleLogin,
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