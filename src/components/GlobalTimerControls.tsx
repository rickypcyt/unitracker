import { Pause, Play, RotateCcw } from 'lucide-react';
import { useAppStore, useUiActions } from '@/store/appStore';

const GlobalTimerControls = () => {
  const isSynced = useAppStore((state) => state.ui.isSynced);
  const studyTimerState = useAppStore((state) => state.ui.studyTimerState);
  const pomodoroState = useAppStore((state) => state.ui.pomodoroState);
  const countdownState = useAppStore((state) => state.ui.countdownState);
  const { setStudyRunning, setPomoRunning, setTimerState } = useUiActions();

  if (!isSynced) return null;

  const anyTimerRunning = studyTimerState === 'running' || pomodoroState === 'running' || countdownState === 'running';

  const handlePlayPause = () => {
    const newRunningState = !anyTimerRunning;
    setStudyRunning(newRunningState);
    setPomoRunning(newRunningState);
    setTimerState('study', newRunningState ? 'running' : 'stopped');
    setTimerState('pomodoro', newRunningState ? 'running' : 'stopped');
    setTimerState('countdown', newRunningState ? 'running' : 'stopped');
  };

  const handleReset = () => {
    // Emitir inmediatamente el reset específico de Countdown para máxima robustez
    try {
      const now = Date.now();
      window.dispatchEvent(new CustomEvent('resetCountdownSync', { detail: { baseTimestamp: now } }));
    } catch {}
    // Resetear todos los timers via Zustand
    setTimerState('study', 'stopped');
    setTimerState('pomodoro', 'stopped');
    setTimerState('countdown', 'stopped');
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
          Study: <span>{studyTimerState}</span>
        </div>
        <div className={`px-3 py-1 rounded-full ${
          pomodoroState === 'running' 
            ? 'bg-green-500 text-white' 
            : pomodoroState === 'paused' 
            ? 'bg-yellow-500 text-white' 
            : 'bg-gray-300 text-gray-700'
        }`}>
          Pomodoro: <span>{pomodoroState}</span>
        </div>
        <div className={`px-3 py-1 rounded-full ${
          countdownState === 'running' 
            ? 'bg-green-500 text-white' 
            : countdownState === 'paused' 
            ? 'bg-yellow-500 text-white' 
            : 'bg-gray-300 text-gray-700'
        }`}>
          Countdown: <span>{countdownState}</span>
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