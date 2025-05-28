import React, { memo, useEffect } from 'react';
import StudyTimer from '../components/tools/StudyTimer';
import Pomodoro from '../components/tools/Pomodoro';
import NoiseGenerator from '../components/tools/NoiseGenerator';
import { useLocation } from 'react-router-dom';

const SessionPage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/';

  // Pausar timers cuando la página no está visible
  useEffect(() => {
    if (!isVisible) {
      window.dispatchEvent(new CustomEvent('pauseTimerSync'));
    }
  }, [isVisible]);

  return (
    <div className="w-full px-6 pt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pomodoro */}
        <div className="maincard">
          <Pomodoro />
        </div>

        {/* Study Timer */}
        <div className="maincard">
          <StudyTimer />
        </div>
        
        {/* Noise Generator */}
        <NoiseGenerator />
      </div>
    </div>
  );
});

SessionPage.displayName = 'SessionPage';

export default SessionPage; 