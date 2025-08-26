import { ReactNode, useCallback } from 'react';

import WelcomeModal from '@/modals/WelcomeModal';
import useTheme from '@/hooks/useTheme';

interface TourManagerProps {
  children: ReactNode;
}

const TourManager = ({ children }: TourManagerProps) => {
  const { showWelcomeModal, handleCloseWelcome } = useTheme();

  // Handle closing welcome modal
  const handleCloseWelcomeAndMaybeLogin = useCallback(() => {
    handleCloseWelcome();
  }, [handleCloseWelcome]);

  return (
    <>
      {children}
      {showWelcomeModal && (
        <WelcomeModal 
          onClose={handleCloseWelcomeAndMaybeLogin} 
        />
      )}
    </>
  );
};

export default TourManager; 