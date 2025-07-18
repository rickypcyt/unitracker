import React, { useState } from 'react';

import Tour from './Tour';
import WelcomeModal from '@/modals/WelcomeModal';
import { useAuth } from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';

const TourManager = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const { showWelcomeModal, handleCloseWelcome, currentTheme, handleThemeChange } = useTheme();
  const [showTour, setShowTour] = useState(false);

  // Cuando se cierra el WelcomeModal, lanzar el tour si no está logueado
  const handleCloseWelcomeAndStartTour = () => {
    handleCloseWelcome();
    if (!isLoggedIn) setShowTour(true);
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
        <WelcomeModal onClose={handleCloseWelcomeAndStartTour} />
      )}
      {showTour && (
        <Tour
          steps={tourSteps}
          run={showTour}
          onClose={() => setShowTour(false)}
        />
      )}
    </>
  );
};

export default TourManager; 