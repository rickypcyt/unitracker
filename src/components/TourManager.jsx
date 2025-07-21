import React, { useState } from 'react';

import LoginPromptModal from '@/modals/LoginPromptModal';
import WelcomeModal from '@/modals/WelcomeModal';
import { useAuth } from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';

const TourManager = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const { showWelcomeModal, handleCloseWelcome, currentTheme, handleThemeChange } = useTheme();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Cuando se cierra el WelcomeModal, mostrar login si no está logueado
  const handleCloseWelcomeAndMaybeLogin = () => {
    handleCloseWelcome();
    if (!isLoggedIn) setShowLoginPrompt(true);
  };

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