import React, { ReactNode } from 'react';

import AccentColorModal from '@/modals/AccentColorModal';
import EnhancedLoginModal from '@/modals/EnhancedLoginModal';
import ThemeManager from '@/components/ThemeManager';
import WelcomeModal from '@/modals/WelcomeModal';
import useTheme from '@/hooks/useTheme';

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