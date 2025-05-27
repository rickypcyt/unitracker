import React, { memo, useEffect } from 'react';
import StudyTimer from '../../components/tools/StudyTimer';
import Pomodoro from '../../components/tools/Pomodoro';
import NoiseGenerator from '../../components/tools/NoiseGenerator';
import { useLocation } from 'react-router-dom';

const HomePage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/';

  // Pausar timers cuando la página no está visible
  useEffect(() => {
    if (!isVisible) {
      window.dispatchEvent(new CustomEvent('pauseTimerSync'));
    }
  }, [isVisible]);

  return (
    <div className="container mx-auto px-4 pt-20">

      <div className="grid grid-cols-3 gap-6">
        {/* Study Timer */}
        <div>
          <StudyTimer />
        </div>
        
        {/* Pomodoro Timer */}
        <div>
          <Pomodoro />
        </div>
        
        {/* Noise Generator */}
        <div>
          <NoiseGenerator />
        </div>
      </div>
    </div>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage; 