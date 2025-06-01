import { useEffect, useState } from "react";

const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Default to dark mode if no theme is set
    return localStorage.getItem("theme") || "dark";
  });
  
  const [showWelcomeModal, setShowWelcomeModal] = useState(
    !localStorage.getItem("hasSeenWelcomeModal")
  );

  const [accentPalette, setAccentPalette] = useState(
    localStorage.getItem("accentPalette") || "#0A84FF"
  );

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleCloseWelcome();
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
    // Aplicar el tema inmediatamente
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  };

  // Initialize theme class on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);
  }, []);

  // Initialize accent color
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-primary", accentPalette);
  }, [accentPalette]);

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