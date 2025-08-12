import { useCallback, useEffect, useState } from "react";

const useTheme = () => {
  // Función para obtener el tema inicial
  const getInitialTheme = () => {
    // Si estamos en el servidor, retornar un valor por defecto
    if (typeof window === 'undefined') return 'light';
    
    // Intentar obtener el tema guardado
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    
    // Si no hay tema guardado, usar la preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return "dark";
    }
    return "light";
  };

  const [currentTheme, setCurrentTheme] = useState(getInitialTheme);
  const [showWelcomeModal, setShowWelcomeModal] = useState(
    !localStorage.getItem("hasSeenWelcomeModal")
  );

  const [accentPalette, setAccentPalette] = useState(
    localStorage.getItem("accentPalette") || "#0A84FF"
  );

  // Función para aplicar el tema
  const applyTheme = useCallback((theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    // Actualizar el color-scheme meta tag
    document.documentElement.style.colorScheme = theme;
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleCloseWelcome();
  };

  const handleThemeChange = useCallback((theme) => {
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  }, [applyTheme]);

  // Efecto para manejar cambios en el tema
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

  // Efecto para manejar cambios en el color de acento
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-primary", accentPalette);
  }, [accentPalette]);

  // Efecto para escuchar cambios en la preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Solo actualizar si no hay un tema guardado
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        handleThemeChange(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [handleThemeChange]);

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