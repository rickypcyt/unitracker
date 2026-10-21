import React, { ReactNode } from 'react';

import AccentColorModal from '@/modals/settings/AccentColorModal';
import EnhancedLoginModal from '@/modals/auth/EnhancedLoginModal';
import ThemeManager from '@/components/settings/ThemeManager';
import WelcomeModal from '@/modals/auth/WelcomeModal';
import useTheme from '@/hooks/settings/useTheme';

interface TourManagerProps {
  children: ReactNode;
}

const TourManager: React.FC<TourManagerProps> = ({ children }) => {
  const { 
    showWelcomeModal, 
    showAccentColorModal, 
    showLoginModal,
    handleCloseWelcome,
    handleCloseAccentColor,
    handleCloseLogin,
    handleAccentColorSelection,
    handleLogin
  } = useTheme();

  return (
    <>
      <ThemeManager />
      {children}
      {showWelcomeModal && (
        <WelcomeModal 
          onClose={handleCloseWelcome} 
        />
      )}
      {showAccentColorModal && (
        <AccentColorModal 
          onClose={handleCloseAccentColor}
          onAccentColorSelect={handleAccentColorSelection}
        />
      )}
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