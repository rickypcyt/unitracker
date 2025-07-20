import React, { useState } from 'react';

import LoginPromptModal from '@/modals/LoginPromptModal';
import Tour from './Tour';
import WelcomeModal from '@/modals/WelcomeModal';
import { useAuth } from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';

const TourManager = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const { showWelcomeModal, handleCloseWelcome, currentTheme, handleThemeChange } = useTheme();
  const [showTour, setShowTour] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Cuando se cierra el WelcomeModal, mostrar login si no está logueado
  const handleCloseWelcomeAndMaybeLogin = () => {
    handleCloseWelcome();
    if (!isLoggedIn) setShowLoginPrompt(true);
  };

  // Pasos iniciales del tour (luego se expandirá)
  const tourSteps = [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome to UniTracker!',
      content: 'We will show you how the app works with example tasks. Click Next to start.',
      disableBeacon: true,
    },
    // ...más pasos después
  ];

  return (
    <>
      {children}
      {showWelcomeModal && (
        <WelcomeModal onClose={handleCloseWelcomeAndMaybeLogin} />
      )}
      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
    </>
  );
};

export default TourManager; 