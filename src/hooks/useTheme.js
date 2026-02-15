import { useCallback, useEffect, useState } from "react";

import { useAuth } from "./useAuth";

const useTheme = () => {
  const { user, isLoggedIn } = useAuth();
  
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
  const [showThemeSelectionModal, setShowThemeSelectionModal] = useState(false);
  const [showAccentColorModal, setShowAccentColorModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const [accentPalette, setAccentPalette] = useState(
    localStorage.getItem("accentPalette") || "#0A84FF"
  );

  // Show tour for demo users after welcome modal closes
  useEffect(() => {
    if (!isLoggedIn && !showWelcomeModal && !localStorage.getItem("hasSeenTour")) {
      console.log('Activating tour for demo user');
      setTimeout(() => {
        setShowTour(true);
      }, 300);
    }
  }, [isLoggedIn, showWelcomeModal]);

  // Update login modal state when authentication changes
  useEffect(() => {
    if (isLoggedIn) {
      setShowLoginModal(false);
      localStorage.setItem("hasSeenLoginModal", "true");
      
      // Show tour for logged in users who haven't seen it
      setTimeout(() => {
        if (!localStorage.getItem("hasSeenTour")) {
          console.log('Activating tour for logged in user');
          setShowTour(true);
        }
      }, 500);
    }
  }, [isLoggedIn]);

  // Función para aplicar el tema
  const applyTheme = useCallback((theme) => {
    const root = document.documentElement;
    
    // Remover atributos de DayFlow que puedan interferir
    root.removeAttribute('data-dayflow-theme-override');
    root.removeAttribute('data-theme');
    
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;
    
    // Aplicar colores CSS a DayFlow
    const computedStyle = getComputedStyle(root);
    const accentColor = computedStyle.getPropertyValue('--accent-primary').trim();
    const bgPrimary = computedStyle.getPropertyValue('--bg-primary').trim();
    const bgSecondary = computedStyle.getPropertyValue('--bg-secondary').trim();
    const textPrimary = computedStyle.getPropertyValue('--text-primary').trim();
    const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim();
    const border = computedStyle.getPropertyValue('--border').trim();
    
    // Crear estilos personalizados para DayFlow
    const dayflowStyles = `
      .df-calendar {
        --df-bg-primary: ${bgPrimary};
        --df-bg-secondary: ${bgSecondary};
        --df-text-primary: ${textPrimary};
        --df-text-secondary: ${textSecondary};
        --df-accent: ${accentColor};
        --df-border: ${border};
        background: ${bgPrimary} !important;
        color: ${textPrimary} !important;
      }
      .df-event {
        background: ${accentColor} !important;
        color: white !important;
        border: none !important;
      }
      .df-header {
        background: ${bgSecondary} !important;
        color: ${textPrimary} !important;
      }
      .df-day {
        background: ${bgPrimary} !important;
        color: ${textPrimary} !important;
        border-color: ${border} !important;
      }
      .df-day:hover {
        background: ${bgSecondary} !important;
      }
      .df-today {
        background: ${accentColor}20 !important;
        border-color: ${accentColor} !important;
      }
      .df-selected {
        background: ${accentColor}40 !important;
        border-color: ${accentColor} !important;
      }
    `;
    
    // Eliminar estilos anteriores de DayFlow si existen
    const existingStyle = document.getElementById('dayflow-custom-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Crear y añadir nuevos estilos
    const styleTag = document.createElement('style');
    styleTag.id = 'dayflow-custom-styles';
    styleTag.textContent = dayflowStyles;
    document.head.appendChild(styleTag);
    
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
    // Automatically show theme selection modal after a short delay
    setTimeout(() => {
      if (!localStorage.getItem("hasSeenThemeSelectionModal")) {
        setShowThemeSelectionModal(true);
      }
    }, 200);
  };

  const handleCloseThemeSelection = () => {
    setShowThemeSelectionModal(false);
    localStorage.setItem("hasSeenThemeSelectionModal", "true");
    // Automatically show accent color modal after a short delay
    setTimeout(() => {
      if (!localStorage.getItem("hasSeenAccentColorModal")) {
        setShowAccentColorModal(true);
      }
    }, 200);
  };

  const handleCloseAccentColor = () => {
    setShowAccentColorModal(false);
    localStorage.setItem("hasSeenAccentColorModal", "true");
    // Automatically show login modal after a short delay, only if user is not logged in
    setTimeout(() => {
      if (!isLoggedIn && !localStorage.getItem("hasSeenLoginModal")) {
        setShowLoginModal(true);
      }
    }, 200);
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
    localStorage.setItem("hasSeenLoginModal", "true");
    // Show tour after login modal closes (or immediately if user is already logged in)
    setTimeout(() => {
      if (!localStorage.getItem("hasSeenTour")) {
        setShowTour(true);
      }
    }, 200);
  };

  const handleLogin = () => {
    setShowLoginModal(false);
    localStorage.setItem("hasSeenLoginModal", "true");
    // Show tour after successful login
    setTimeout(() => {
      if (!localStorage.getItem("hasSeenTour")) {
        setShowTour(true);
      }
    }, 200);
  };

  const handleAccentColorSelection = (color) => {
    setAccentPalette(color);
    localStorage.setItem("accentPalette", color);
    setShowAccentColorModal(false);
    localStorage.setItem("hasSeenAccentColorModal", "true");
    // Automatically show login modal after color selection, only if user is not logged in
    setTimeout(() => {
      if (!isLoggedIn && !localStorage.getItem("hasSeenLoginModal")) {
        setShowLoginModal(true);
      }
    }, 200);
  };

  const handleThemeSelection = (theme) => {
    handleThemeChange(theme);
    setShowThemeSelectionModal(false);
    localStorage.setItem("hasSeenThemeSelectionModal", "true");
    // Automatically show accent color modal after theme selection
    setTimeout(() => {
      if (!localStorage.getItem("hasSeenAccentColorModal")) {
        setShowAccentColorModal(true);
      }
    }, 200);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleCloseWelcome();
  };

  const handleCloseTour = () => {
    setShowTour(false);
    localStorage.setItem("hasSeenTour", "true");
  };

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem("hasSeenTour", "true");
    
    // Open login modal after tour completes
    setTimeout(() => {
      setShowLoginModal(true);
    }, 500);
  };

  const resetTour = () => {
    localStorage.removeItem("hasSeenTour");
    setShowTour(true);
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
    showThemeSelectionModal,
    showAccentColorModal,
    showLoginModal,
    showTour,
    handleCloseWelcome,
    handleCloseThemeSelection,
    handleCloseAccentColor,
    handleCloseLogin,
    handleCloseTour,
    handleTourComplete,
    resetTour,
    handleThemeSelection,
    handleAccentColorSelection,
    handleLogin,
    handleOverlayClick,
    handleThemeChange,
    toggleTheme, // Para compatibilidad con el código existente
    setAccentPalette
  };
};

export default useTheme;