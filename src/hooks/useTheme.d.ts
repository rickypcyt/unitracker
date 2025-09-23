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
  handleCloseWelcome: () => void;
  handleOverlayClick: (e: MouseEvent) => void;
};

export default useTheme;
