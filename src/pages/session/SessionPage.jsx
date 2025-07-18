import React, { memo } from 'react';

import Countdown from './Countdown'; // Lo crearemos
import NoiseGenerator from '@/pages/session/NoiseGenerator';
import Pomodoro from '@/pages/session/Pomodoro';
import StudyTimer from '@/pages/session/StudyTimer';
import { useLocation } from 'react-router-dom';

const SessionPage = memo(() => {
  const location = useLocation();

  return (
    <div className="w-full pt-10 px-2 md:px-2">
      <div className="flex flex-col gap-4 md:gap-8 w-full max-w-6xl mx-auto items-stretch justify-center">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full">
          {/* Pomodoro */}
          <div className="maincard w-full md:w-1/3 flex-1 mx-auto">
            <Pomodoro />
          </div>
          {/* Study Timer */}
          <div className="maincard w-full md:w-1/3 flex-1 mx-auto">
            <StudyTimer />
          </div>
          {/* Countdown */}
          <div className="maincard w-full md:w-1/3 flex-1 mx-auto">
            <Countdown />
          </div>
        </div>
        {/* Noise Generator abajo ocupando todo el ancho */}
        <div className="maincard w-full mx-auto">
          <NoiseGenerator />
        </div>
      </div>
    </div>
  );
});

SessionPage.displayName = 'SessionPage';

export default SessionPage; 