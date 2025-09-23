import { useCallback, useEffect, useState } from "react";

const useTheme = () => {
  // Función para detectar el tema del sistema
  const getSystemTheme = () => {
    if (typeof window === 'undefined') return 'light';
    
    // Detectar tema del sistema en browser
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return "dark";
    }
    
    return "light";
  };

  // Función para obtener la preferencia de tema del usuario
  const getThemePreference = () => {
    if (typeof window === 'undefined') return 'auto';
    
    const savedPreference = localStorage.getItem("themePreference");
    return savedPreference || 'auto'; // Por defecto 'auto' (seguir sistema)
  };

  // Función para obtener el tema actual basado en la preferencia
  const getCurrentTheme = () => {
    const preference = getThemePreference();
    if (preference === 'auto') {
      return getSystemTheme();
    }
    return preference;
  };

  const [themePreference, setThemePreference] = useState(getThemePreference);
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme);
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
    
    // Para Capacitor: actualizar la barra de estado si está disponible
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      // Importar dinámicamente el plugin de status bar si está disponible
      import('@capacitor/status-bar').then(({ StatusBar }) => {
        if (theme === 'dark') {
          StatusBar.setStyle({ style: 'DARK' }).catch(() => {
            // Silenciosamente fallar si no está disponible
          });
        } else {
          StatusBar.setStyle({ style: 'LIGHT' }).catch(() => {
            // Silenciosamente fallar si no está disponible
          });
        }
      }).catch(() => {
        // Plugin no disponible, continuar sin error
      });
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleCloseWelcome();
  };

  // Función para cambiar la preferencia de tema
  const handleThemeChange = useCallback((newPreference) => {
    setThemePreference(newPreference);
    localStorage.setItem("themePreference", newPreference);
    
    // Calcular el tema actual basado en la nueva preferencia
    const actualTheme = newPreference === 'auto' ? getSystemTheme() : newPreference;
    setCurrentTheme(actualTheme);
    applyTheme(actualTheme);
  }, [applyTheme]);

  // Función para alternar entre light y dark (manteniendo compatibilidad)
  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    handleThemeChange(newTheme);
  }, [currentTheme, handleThemeChange]);

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
    
    const handleSystemThemeChange = (e) => {
      // Solo actualizar si la preferencia está en 'auto'
      if (themePreference === 'auto') {
        const newTheme = e.matches ? "dark" : "light";
        setCurrentTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // También escuchar cambios en Capacitor si está disponible
    let capacitorListener;
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      // Para dispositivos móviles, también podemos escuchar cambios del sistema
      const checkSystemTheme = () => {
        if (themePreference === 'auto') {
          const systemTheme = getSystemTheme();
          if (systemTheme !== currentTheme) {
            setCurrentTheme(systemTheme);
            applyTheme(systemTheme);
          }
        }
      };
      
      // Verificar cada vez que la app vuelve al foreground
      document.addEventListener('resume', checkSystemTheme);
      capacitorListener = () => document.removeEventListener('resume', checkSystemTheme);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      if (capacitorListener) capacitorListener();
    };
  }, [themePreference, currentTheme, applyTheme]);

  return {
    currentTheme,
    themePreference,
    accentPalette,
    showWelcomeModal,
    handleCloseWelcome,
    handleOverlayClick,
    handleThemeChange,
    toggleTheme, // Para compatibilidad con el código existente
    setAccentPalette
  };
};

export default useTheme;