import type React from 'react';
import type { User } from '@supabase/supabase-js';

declare type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // Add other methods from useAuth if needed
};

export declare const useAuth: () => AuthContextType;
export declare const AuthProvider: React.FC<{ children: React.ReactNode }>;
