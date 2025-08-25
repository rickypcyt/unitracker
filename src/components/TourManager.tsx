import { ReactNode, useCallback, useState } from 'react';

import OnboardingTour from './OnboardingTour';
import WelcomeModal from '@/modals/WelcomeModal';
import useTheme from '@/hooks/useTheme';

interface TourManagerProps {
  children: ReactNode;
}

const TourManager = ({ children }: TourManagerProps) => {
  const { showWelcomeModal, handleCloseWelcome } = useTheme();
  const [startTour, setStartTour] = useState(false);

  // Handle closing welcome modal and starting tour
  const handleCloseWelcomeAndMaybeLogin = useCallback(() => {
    handleCloseWelcome();
    // Start tour directly instead of showing login prompt
    setStartTour(true);
  }, [handleCloseWelcome]);

  // Handle starting the tour
  const handleStartTour = useCallback(() => {
    handleCloseWelcome();
    setStartTour(true);
  }, [handleCloseWelcome]);

  return (
    <>
      {children}
      {showWelcomeModal && (
        <WelcomeModal 
          onClose={handleCloseWelcomeAndMaybeLogin} 
          onStartTour={handleStartTour} 
        />
      )}
      <OnboardingTour isOpen={startTour} onClose={() => setStartTour(false)} />
    </>
  );
};

export default TourManager; 