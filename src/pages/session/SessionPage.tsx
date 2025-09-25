import { } from '@/store/slices/uiSlice';

import { memo, useEffect, useState } from 'react';

import Countdown from './Countdown';
import GlobalTimerControls from '@/components/GlobalTimerControls';
import NoiseGenerator from '@/pages/session/NoiseGenerator';
import Pomodoro from '@/pages/session/Pomodoro';
import StudyTimer from '@/pages/session/StudyTimer';
import TimerSettings from '@/components/TimerSettings';
import { useSelector } from 'react-redux';

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
      console.warn('[SessionPage] Emitiendo globalResetSync:', { resetKey, timestamp: now });
      window.dispatchEvent(new CustomEvent("globalResetSync", { 
        detail: { 
          resetKey,
          timestamp: now 
        } 
      }));
      // Refuerzo: emitir explícitamente el reset específico de Countdown
      // para garantizar que el componente Countdown se resetea siempre
      // independientemente de flags internos de sincronización.
      window.dispatchEvent(new CustomEvent('resetCountdownSync', { detail: { baseTimestamp: now } }));
    }
  }, [isSynced, resetKey]);

  return (
    <div className="w-full  px-3 sm:px-4 md:px-3 lg:px-16 xl:px-28 session-page">
      <div className="w-full px-2 overflow-hidden">
        {/* Controles globales (solo visibles cuando está sincronizado) */}
        <div className="px-1 mb-4">
          <GlobalTimerControls />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full">
          {/* Columna derecha con los timers en vertical - primero en sm */}
          <div className="w-full md:w-1/2 md:order-2 space-y-4 order-1">
            <div className="maincard py-3 px-4 sm:px-5 w-full">
              <StudyTimer isSynced={isSynced} isRunning={isRunning} resetKey={resetKey} />
            </div>
            <div className="maincard py-3 px-4 sm:px-5 w-full">
              <Countdown isSynced={isSynced} isRunning={isRunning} resetKey={resetKey} />
            </div>
            <div className="maincard py-3 px-4 sm:px-5 w-full">
              <Pomodoro isSynced={isSynced} isRunning={isRunning} resetKey={resetKey} />
            </div>
          </div>
          
          {/* Columna izquierda con el Noise Generator - segundo en sm */}
          <div className="w-full md:w-1/2 md:order-1 order-2">
            <div className="maincard py-3 px-4 sm:px-5 h-full">
              <NoiseGenerator />
            </div>
          </div>
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