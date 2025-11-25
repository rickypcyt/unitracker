import type { MouseEvent } from 'react';

declare type Theme = 'light' | 'dark';
declare type ThemePreference = 'light' | 'dark' | 'auto';

declare const useTheme: () => {
  currentTheme: Theme;
  themePreference: ThemePreference;
  handleThemeChange: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  accentPalette: string;
  setAccentPalette: (color: string) => void;
  showWelcomeModal: boolean;
  showThemeSelectionModal: boolean;
  showAccentColorModal: boolean;
  showLoginModal: boolean;
  handleCloseWelcome: () => void;
  handleCloseThemeSelection: () => void;
  handleCloseAccentColor: () => void;
  handleCloseLogin: () => void;
  handleThemeSelection: (theme: ThemePreference) => void;
  handleAccentColorSelection: (color: string) => void;
  handleLogin: () => void;
  handleOverlayClick: (e: MouseEvent) => void;
};

export default useTheme;
