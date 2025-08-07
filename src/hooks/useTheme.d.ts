declare type Theme = 'light' | 'dark';

declare const useTheme: () => {
  currentTheme: Theme;
  handleThemeChange: (theme: Theme) => void;
  accentPalette: string;
  setAccentPalette: (color: string) => void;
  showWelcomeModal: boolean;
  handleCloseWelcome: () => void;
  handleOverlayClick: (e: React.MouseEvent) => void;
  // Add other methods if they exist in the hook
};

export default useTheme;
