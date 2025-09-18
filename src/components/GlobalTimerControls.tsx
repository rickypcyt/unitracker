import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { setIsRunning, triggerReset } from '@/store/slices/uiSlice';

const GlobalTimerControls = () => {
  const dispatch = useDispatch();
  const isSynced = useSelector(state => state.ui.isSynced);
  const studyTimerState = useSelector(state => state.ui.studyTimerState);
  const pomodoroState = useSelector(state => state.ui.pomodoroState);
  const countdownState = useSelector(state => state.ui.countdownState);

  if (!isSynced) return null;

  // Determinar si algún timer está corriendo
  const anyTimerRunning = studyTimerState === 'running' || pomodoroState === 'running' || countdownState === 'running';

  const handlePlayPause = () => {
    dispatch(setIsRunning(!anyTimerRunning));
  };

  const handleReset = () => {
    // Emitir inmediatamente el reset específico de Countdown para máxima robustez
    // Esto garantiza que Countdown aplique el reset incluso si el flujo global se retrasa.
    try {
      const now = Date.now();
      window.dispatchEvent(new CustomEvent('resetCountdownSync', { detail: { baseTimestamp: now } }));
    } catch {}
    // Mantener el flujo normal de reset global vía Redux
    dispatch(triggerReset());
  };

  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      {/* Estado de los timers */}
      <div className="flex gap-4 text-sm">
        <div className={`px-3 py-1 rounded-full ${
          studyTimerState === 'running' 
            ? 'bg-green-500 text-white' 
            : studyTimerState === 'paused' 
            ? 'bg-yellow-500 text-white' 
            : 'bg-gray-300 text-gray-700'
        }`}>
          Study: {studyTimerState}
        </div>
        <div className={`px-3 py-1 rounded-full ${
          pomodoroState === 'running' 
            ? 'bg-green-500 text-white' 
            : pomodoroState === 'paused' 
            ? 'bg-yellow-500 text-white' 
            : 'bg-gray-300 text-gray-700'
        }`}>
          Pomodoro: {pomodoroState}
        </div>
        <div className={`px-3 py-1 rounded-full ${
          countdownState === 'running' 
            ? 'bg-green-500 text-white' 
            : countdownState === 'paused' 
            ? 'bg-yellow-500 text-white' 
            : 'bg-gray-300 text-gray-700'
        }`}>
          Countdown: {countdownState}
        </div>
      </div>

      {/* Controles globales */}
      <div className="flex gap-4">
        <button
          onClick={handlePlayPause}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] transition-colors font-semibold"
          aria-label={anyTimerRunning ? 'Pause all timers' : 'Start all timers'}
        >
          {anyTimerRunning ? (
            <>
              <Pause size={20} />
              Pause All
            </>
          ) : (
            <>
              <Play size={20} />
              Start All
            </>
          )}
        </button>
        
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors font-semibold border border-[var(--border-primary)]"
          aria-label="Reset all timers"
        >
          <RotateCcw size={20} />
          Reset All
        </button>
      </div>
    </div>
  );
};

export default GlobalTimerControls; 