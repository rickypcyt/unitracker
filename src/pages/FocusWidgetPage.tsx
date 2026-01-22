import { Pause, Play, Plus, X } from "lucide-react";
import { formatStudyTime, useStudyTimer } from "@/hooks/useTimers";
import { useEffect, useState } from "react";

import SessionsModal from "@/modals/TodaysSessionsModal";
import StartSessionModal from "@/modals/StartSessionModal";
import { formatDateShort } from "@/utils/dateUtils";
import { supabase } from "@/utils/supabaseClient";
import { useAppStore } from "@/store/appStore";
import { useNavigation } from "@/navbar/NavigationContext";
import { useNoise } from "@/utils/NoiseContext";
import { useStudyTimerState } from "@/hooks/study-timer/useStudyTimerState";

const FocusWidgetPage = () => {
  const { navigateTo } = useNavigation();
  const [studyState, updateStudyState] = useStudyTimerState();
  const { syncSettings, setStudyRunning } = useAppStore();
  const { toggleAllSounds, sounds } = useNoise();
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isStartSessionModalOpen, setIsStartSessionModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);

  // Sync study running state with Zustand on mount/when studyState changes
  useEffect(() => {
    if (studyState.isRunning && studyState.sessionStatus === 'active') {
      setStudyRunning(true);
    }
  }, [studyState.isRunning, studyState.sessionStatus, setStudyRunning]);

  // Fetch active task on mount
  useEffect(() => {
    const fetchActiveTask = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('tasks')
          .select('title')
          .eq('user_id', user.id)
          .eq('activetask', true)
          .eq('completed', false)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching active task:', error);
          return;
        }

        setActiveTask(data?.title || null);
      } catch (error) {
        console.error('Error fetching active task:', error);
      }
    };

    fetchActiveTask();
  }, []);

  // Real-time timer updates
  useStudyTimer(
    (elapsed: number) => {
      // Update the timer state in real-time
      updateStudyState({ time: elapsed });
    },
    studyState.timeAtStart,
    studyState.lastStart
  );

  const handleClose = () => {
    // Navigate back to session page
    navigateTo('session');
  };

  const handleStartSession = () => {
    // Navigate back to session page and start the session
    navigateTo('session');
    // Here you could pass the session parameters to the session page
    // For now, just navigate back
  };

  const handlePlayPause = () => {
    if (studyState.sessionStatus === 'active') {
      // Pause the session
      updateStudyState({
        isRunning: false,
        sessionStatus: 'paused',
        lastPausedAt: Date.now(),
      });
      setStudyRunning(false);
    } else if (studyState.sessionStatus === 'paused') {
      // Resume the session
      updateStudyState({
        isRunning: true,
        sessionStatus: 'active',
        lastStart: Date.now(),
      });
      setStudyRunning(true);
    }
  };

  const todaysDate = new Date();

  return (
    <div className="h-screen w-screen bg-black relative">
      {/* Close button - X in top left corner */}
      <button
        onClick={handleClose}
        className="absolute top-4 left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors duration-200 z-10"
        aria-label="Close focus widget mode"
      >
        <X size={20} />
      </button>

      {/* Play/Pause button - top right corner */}
      {(studyState.sessionStatus === 'active' || studyState.sessionStatus === 'paused') && (
        <button
          onClick={handlePlayPause}
          className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors duration-200 z-10"
          aria-label={studyState.sessionStatus === 'active' ? 'Pause session' : 'Resume session'}
        >
          {studyState.sessionStatus === 'active' ? (
            <Pause size={18} />
          ) : (
            <Play size={18} />
          )}
        </button>
      )}

      {/* Date and time display at same height as X button (top center) */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-center flex items-center justify-center h-10">
        <span className="text-white text-lg font-medium">
          {formatDateShort(todaysDate.toISOString())} • {todaysDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Session status indicator below date/time */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 text-center space-y-1">
        <div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            studyState.sessionStatus === 'active'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : studyState.sessionStatus === 'paused'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {studyState.sessionStatus === 'active' ? 'In Session' :
             studyState.sessionStatus === 'paused' ? 'Session Paused' :
             'No Active Session'}
          </span>
        </div>
        {/* Session title */}
        {studyState.sessionStatus === 'active' && studyState.sessionTitle && (
          <div className="text-white text-base font-medium max-w-xs truncate mt-2">
            {studyState.sessionTitle}
          </div>
        )}
      </div>

      {/* Timer display in center - show when in active or paused session */}
      {(studyState.sessionStatus === 'active' || studyState.sessionStatus === 'paused') && studyState.time > 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center space-y-4">
          <div className="text-white font-mono text-4xl font-bold">
            {formatStudyTime(studyState.time)}
          </div>
          
          {/* Sync settings display */}
          <div className="text-white/80 text-sm space-y-1">
            <div>Pomo Sync: <span className={syncSettings.syncPomodoroWithTimer ? 'text-green-400' : 'text-red-400'}>
              {syncSettings.syncPomodoroWithTimer ? 'Yes' : 'No'}
            </span></div>
            <div>Countdown Sync: <span className={syncSettings.syncCountdownWithTimer ? 'text-green-400' : 'text-red-400'}>
              {syncSettings.syncCountdownWithTimer ? 'Yes' : 'No'}
            </span></div>
          </div>
        </div>
      )}

      {/* Plus button to open Today's Sessions modal - only show when not in active or paused session */}
      {studyState.sessionStatus !== 'active' && studyState.sessionStatus !== 'paused' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => setIsSessionsModalOpen(true)}
          className="relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          aria-label="Open Today's Sessions"
        >
          {/* Accent primary ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'transparent',
              border: '2px solid var(--accent-primary)',
              opacity: '0.3'
            }}
          ></div>
          <div className="relative z-10">
            <Plus size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
        </button>
        </div>
      )}


      {/* Main content area - for now just empty black space */}
      <div className="w-full h-full text-white">
        {/* This space is intentionally left blank for future focus widget content */}
      </div>

      {/* Footer with active task and sound control */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-4 max-w-md">
        <div className="text-white/70 text-sm whitespace-nowrap">
          Active Task: <span className="text-white font-medium">
            {activeTask || 'None'}
          </span>
        </div>

        {/* Sound control button */}
        <button
          onClick={toggleAllSounds}
          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors duration-200 text-white text-sm font-medium whitespace-nowrap"
          aria-label={sounds.some(sound => sound.isPlaying) ? 'Pause relaxing sounds' : 'Play relaxing sounds'}
        >
          {sounds.some(sound => sound.isPlaying) ? 'Pause relaxing sounds' : 'Play relaxing sounds'}
        </button>
      </div>

      {/* Today's Sessions Modal */}
      <SessionsModal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        onSessionSelected={() => {}}
        onStartNewSession={() => {
          setIsSessionsModalOpen(false);
          setIsStartSessionModalOpen(true);
        }}
      />

      {/* Start Session Modal */}
      <StartSessionModal
        isOpen={isStartSessionModalOpen}
        onClose={() => setIsStartSessionModalOpen(false)}
        onStart={handleStartSession}
      />
    </div>
  );
};

export default FocusWidgetPage;