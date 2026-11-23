import React, { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import AccentColorModal from '@/modals/settings/AccentColorModal';
import FirstTaskPrompt from '@/components/onboarding/FirstTaskPrompt';
import ThemeManager from '@/components/settings/ThemeManager';
import useTheme from '@/hooks/settings/useTheme';

interface TourManagerProps {
  children: ReactNode;
}

const TourManager: React.FC<TourManagerProps> = ({ children }) => {
  const { 
    showWelcomeModal, 
    showAccentColorModal, 
    showLoginModal,
    showTour,
    handleTourComplete,
    handleCloseWelcome,
    handleCloseAccentColor,
    handleCloseLogin,
    handleAccentColorSelection,
  } = useTheme();
  const navigate = useNavigate();

  // The welcome modal was removed: skip straight to the next onboarding step
  useEffect(() => {
    if (showWelcomeModal) handleCloseWelcome();
  }, [showWelcomeModal]);

  // The "Unlock Your Full Potential" modal was replaced by the /login page
  useEffect(() => {
    if (!showLoginModal) return;
    handleCloseLogin();
    navigate('/login');
  }, [showLoginModal]);

  // The product tour was removed. Mark it as done right away: FirstTaskPrompt waits for
  // the "hasSeenTour" flag before it can nudge new users to create their first task.
  useEffect(() => {
    if (showTour) handleTourComplete();
  }, [showTour]);

  return (
    <>
      <ThemeManager />
      {children}
      {showAccentColorModal && (
        <AccentColorModal 
          onClose={handleCloseAccentColor}
          onAccentColorSelect={handleAccentColorSelection}
        />
      )}
      <FirstTaskPrompt />
    </>
  );
};

export default TourManager; 