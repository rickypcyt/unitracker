import { ReactNode, useCallback } from 'react';

import AccentColorModal from '@/modals/AccentColorModal';
import EnhancedLoginModal from '@/modals/EnhancedLoginModal';
import ThemeManager from '@/components/ThemeManager';
import ThemeSelectionModal from '@/modals/ThemeSelectionModal';
import WelcomeModal from '@/modals/WelcomeModal';
import useTheme from '@/hooks/useTheme';

interface TourManagerProps {
  children: ReactNode;
}

const TourManager = ({ children }: TourManagerProps) => {
  const { 
    showWelcomeModal, 
    showThemeSelectionModal, 
    showAccentColorModal,
    showLoginModal,
    handleCloseWelcome, 
    handleCloseThemeSelection, 
    handleCloseAccentColor,
    handleCloseLogin,
    handleThemeSelection, 
    handleAccentColorSelection,
    handleLogin
  } = useTheme();

  // Handle closing welcome modal
  const handleCloseWelcomeAndMaybeLogin = useCallback(() => {
    handleCloseWelcome();
  }, [handleCloseWelcome]);

  return (
    <>
      <ThemeManager />
      {children}
      {showWelcomeModal && (
        <WelcomeModal 
          onClose={handleCloseWelcomeAndMaybeLogin} 
        />
      )}
      {/* Theme Selection Modal */}
      {showThemeSelectionModal && (
        <ThemeSelectionModal
          onClose={handleCloseThemeSelection}
          onThemeSelect={handleThemeSelection}
        />
      )}

      {/* Accent Color Modal */}
      {showAccentColorModal && (
        <AccentColorModal
          onClose={handleCloseAccentColor}
          onAccentColorSelect={handleAccentColorSelection}
        />
      )}

      {/* Enhanced Login Modal */}
      {showLoginModal && (
        <EnhancedLoginModal
          onClose={handleCloseLogin}
          onLogin={handleLogin}
        />
      )}
    </>
  );
};

export default TourManager; 