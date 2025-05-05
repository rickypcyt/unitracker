import { useState, useEffect } from "react";

const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("theme") || "default";
  });
  
  const [showWelcomeModal, setShowWelcomeModal] = useState(
    !localStorage.getItem("hasSeenWelcomeModal")
  );

  const [accentPalette, setAccentPalette] = useState(
    localStorage.getItem("accentPalette") || "blue"
  );

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleCloseWelcome();
  };

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  return {
    currentTheme,
    accentPalette,
    showWelcomeModal,
    handleCloseWelcome,
    handleOverlayClick,
    handleThemeChange,
    setAccentPalette
  };
};

export default useTheme;