import { Coffee, Plus, X } from "lucide-react";
import { formatStudyTime, useStudyTimer } from "@/hooks/useTimers";
import { useEffect, useState } from "react";

import SessionsModal from "@/modals/TodaysSessionsModal";
import StartSessionModal from "@/modals/StartSessionModal";
import { formatDateShort } from "@/utils/dateUtils";
import { motion } from "framer-motion";
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

  // Handle ESC key to exit focus widget mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
          }`}>
            {studyState.sessionStatus === 'active' ? 'In Session' :
             studyState.sessionStatus === 'paused' ? 'Session Paused' :
             'Idle Mode'}
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

      {/* Fun idle state shown when no session is running */}
      {studyState.sessionStatus !== 'active' && studyState.sessionStatus !== 'paused' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center max-w-md px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="relative flex justify-center h-32">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <Coffee size={48} className="text-[var(--accent-primary)]" />
              </motion.div>
              <motion.div
                animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.9, 1.1, 0.9] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-white/10 blur-md"
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-white text-2xl sm:text-3xl font-bold">
                Your session is on a coffee break
              </h2>
              <p className="text-white/60 text-base sm:text-lg leading-relaxed">
                It refuses to start until you bribe it with focus, caffeine, or a really interesting to-do list.
              </p>
            </div>

            <button
              onClick={() => setIsSessionsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-white text-sm font-medium hover:bg-[var(--accent-deep)] transition-colors shadow-lg hover:shadow-xl"
              aria-label="Open Today's Sessions"
            >
              <Plus size={18} />
              Start a session
            </button>
          </motion.div>
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