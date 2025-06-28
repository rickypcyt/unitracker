import React, { memo } from 'react';

import NoiseGenerator from '@/pages/session/NoiseGenerator';
import Pomodoro from '@/pages/session/Pomodoro';
import StudyTimer from '@/pages/session/StudyTimer';
import { useLocation } from 'react-router-dom';

const SessionPage = memo(() => {
  const location = useLocation();

  return (
    <div className="w-full pt-14">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-3/4 mx-auto">
        {/* Pomodoro */}
        <div className="maincard max-w-md w-full mx-auto">
          <Pomodoro />
        </div>

        {/* Study Timer */}
        <div className="maincard max-w-md w-full mx-auto">
          <StudyTimer />
        </div>
        
        {/* Noise Generator */}
        <div className="maincard max-w-md w-full mx-auto">
          <NoiseGenerator />
        </div>
      </div>
    </div>
  );
});

SessionPage.displayName = 'SessionPage';

export default SessionPage; 