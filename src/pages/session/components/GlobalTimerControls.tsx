import { Pause, Play } from 'lucide-react';
import { useAppStore, useTimerActions } from '@/store/appStore';

const GlobalTimerControls = () => {
  const isSynced = useAppStore((state) => state.ui.isSynced);
  const studyTimerState = useAppStore((state) => state.ui.studyTimerState);
  const pomodoroState = useAppStore((state) => state.ui.pomodoroState);
  const countdownState = useAppStore((state) => state.ui.countdownState);
  const { setStudyTimerState, setPomodoroTimerState, setCountdownTimerState } = useTimerActions();

  if (!isSynced) return null;

  const anyTimerRunning = studyTimerState === 'running' || pomodoroState === 'running' || countdownState === 'running';

  const handlePlayPause = () => {
    const newRunningState = !anyTimerRunning;
    setStudyTimerState(newRunningState ? 'running' : 'stopped');
    setPomodoroTimerState(newRunningState ? 'running' : 'stopped');
    setCountdownTimerState(newRunningState ? 'running' : 'stopped');
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
          className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent hover:bg-[var(--accent-primary)]/10 transition-colors font-semibold"
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
      </div>
    </div>
  );
};

export default GlobalTimerControls; 