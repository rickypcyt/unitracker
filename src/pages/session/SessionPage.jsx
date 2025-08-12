import { memo, useEffect, useState } from 'react';
import { } from '@/store/slices/uiSlice';
import { useSelector } from 'react-redux';

import Countdown from './Countdown';
import GlobalTimerControls from '@/components/GlobalTimerControls';
import NoiseGenerator from '@/pages/session/NoiseGenerator';
import Pomodoro from '@/pages/session/Pomodoro';
import StudyTimer from '@/pages/session/StudyTimer';
import TimerSettings from '@/components/TimerSettings';
 

const SessionPage = memo(() => {
  const isSynced = useSelector(state => state.ui.isSynced);
  const isRunning = useSelector(state => state.ui.isRunning);
  const resetKey = useSelector(state => state.ui.resetKey);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Escuchar cambios en el estado global de sincronización
  useEffect(() => {
    if (isSynced) {
      // Cuando se activa la sincronización, emitir eventos para todos los timers
      const now = Date.now();
      window.dispatchEvent(new CustomEvent("globalTimerSync", { 
        detail: { 
          isRunning, 
          resetKey,
          timestamp: now 
        } 
      }));
    }
  }, [isSynced, isRunning, resetKey]);

  // Emitir evento de reset global cuando cambia resetKey
  useEffect(() => {
    if (isSynced && resetKey > 0) {
      const now = Date.now();
      console.log('[SessionPage] Emitiendo globalResetSync:', { resetKey, timestamp: now });
      window.dispatchEvent(new CustomEvent("globalResetSync", { 
        detail: { 
          resetKey,
          timestamp: now 
        } 
      }));
    }
  }, [isSynced, resetKey]);

  return (
    <div className="w-full pt-10 px-2 md:px-8">
      <div className="flex flex-col gap-4 md:gap-8 w-full max-w-6xl mx-auto items-stretch justify-center">
        {/* Header removido: SyncToggle y botón de Settings */}
        
        {/* Controles globales (solo visibles cuando está sincronizado) */}
        <GlobalTimerControls />
        
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8 w-full">
          {/* Pomodoro */}
          <div className="maincard w-full lg:w-1/3 flex-1 mx-auto">
            <Pomodoro isSynced={isSynced} isRunning={isRunning} resetKey={resetKey} />
          </div>
          {/* Study Timer */}
          <div className="maincard w-full lg:w-1/3 flex-1 mx-auto">
            <StudyTimer isSynced={isSynced} isRunning={isRunning} resetKey={resetKey} />
          </div>
          {/* Countdown */}
          <div className="maincard w-full lg:w-1/3 flex-1 mx-auto">
            <Countdown isSynced={isSynced} isRunning={isRunning} resetKey={resetKey} />
          </div>
        </div>
        {/* Noise Generator abajo ocupando todo el ancho */}
        <div className="maincard w-full mx-auto">
          <NoiseGenerator />
        </div>
      </div>

      {/* Modal de configuración */}
      <TimerSettings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
});

SessionPage.displayName = 'SessionPage';

export default SessionPage; 