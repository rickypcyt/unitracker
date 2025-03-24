// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        toast.error(`Error: ${error.message}`, {
          position: toast.POSITION.TOP_RIGHT
        });
        throw error;
      }

      toast.success('You have successfully logged in!', {
        position: toast.POSITION.TOP_RIGHT
      });
    } catch (error) {
      console.error('Google Login Error:', error);
    }
  };

  return { isLoggedIn, loginWithGoogle };
};