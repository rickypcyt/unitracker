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
    <div className="w-full pt-4 px-2 md:px-10 session-page">
      <div className="flex flex-col gap-2 md:gap-4 w-full max-w-6xl mx-auto items-stretch justify-center">
        {/* Header removido: SyncToggle y botón de Settings */}
        
        {/* Controles globales (solo visibles cuando está sincronizado) */}
        <GlobalTimerControls />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 w-full">
          {/* Pomodoro */}
          <div className="maincard w-full mx-auto">
            <Pomodoro isSynced={isSynced} isRunning={isRunning} resetKey={resetKey} />
          </div>
          {/* Study Timer */}
          <div className="maincard w-full mx-auto">
            <StudyTimer isSynced={isSynced} isRunning={isRunning} resetKey={resetKey} />
          </div>
          {/* Countdown */}
          <div className="maincard w-full mx-auto">
            <Countdown isSynced={isSynced} isRunning={isRunning} resetKey={resetKey} />
          </div>
        </div>
        {/* Noise Generator abajo ocupando todo el ancho */}
        <div className="maincard w-full mx-auto noise-generator">
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