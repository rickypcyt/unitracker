import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, MoreVertical, Pause, Play, RotateCcw, X } from 'lucide-react';

import { SYNC_EVENTS, useEmitSyncEvents } from '@/hooks/study-timer/useStudySync';
import { formatStudyTime } from '@/hooks/useTimers';
import DeleteSessionModal from '@/modals/DeleteSessionModal';
import EditSessionModal from '@/modals/EditSessionModal';
import ExitSessionChoiceModal from '@/modals/ExitSessionChoiceModal';
import FinishSessionModal from '@/modals/FinishSessionModal';
import LoginPromptModal from '@/modals/LoginPromptModal';
import SectionTitle from '@/components/SectionTitle';
import SessionSummaryModal from '@/modals/SessionSummaryModal';
import StartSessionModal from '@/modals/StartSessionModal';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'react-hot-toast';
import useEventListener from '@/hooks/useEventListener';
import {
  useStudyState,
  useStudySession,
  useSyncSettings,
  useTimerActions,
  type StudyState,
} from '@/store/appStore';


const DEFAULT_STUDY_STATE: StudyState = {
  time: 0,
  isRunning: false,
  lastStart: null,
  timeAtStart: 0,
  sessionStatus: 'inactive',
  lastPausedAt: null,
};

const StudyTimerZustand = () => {
  // 🎯 Zustand Hooks - Centralizado y optimizado
  const studyState = useStudyState();
  const { activeId: currentSessionId, setActiveId: updateSessionId, setStartedAt: setStudyTimerStartedAt } = useStudySession();
  const syncSettings = useSyncSettings();
  const timerActions = useTimerActions();

  // 🎯 CUSTOM HOOKS (existentes)
  const { emitSyncEvent } = useEmitSyncEvents();

  // 🎯 LOCAL STATE
  const [modalStates, setModalStates] = useState({
    start: false,
    finish: false,
    edit: false,
    delete: false,
    exit: false,
    login: false,
    summary: false,
  });

  // 🎯 DERIVED STATE
  const isRunning = studyState?.isRunning ?? false;
  const isPomodoroSync = syncSettings.syncPomodoroWithTimer;
  const isCountdownSync = syncSettings.syncCountdownWithTimer;

  // 🎯 UTILITIES
  const calculatePomodorosFromDuration = (seconds: number): number => {
    return Math.floor(seconds / 1500); // 25 minutes per pomodoro
  };

  const updateModal = useCallback((modal: keyof typeof modalStates, isOpen: boolean) => {
    setModalStates(prev => ({ ...prev, [modal]: isOpen }));
  }, []);

  // 🎯 TIMER CONTROLS
  const studyControls = useMemo(() => ({
    start: (baseTimestamp?: number) => {
      const now = baseTimestamp ?? Date.now();
      timerActions.updateStudyState({
        time: 0,
        isRunning: true,
        lastStart: Date.now(),
        timeAtStart: 0,
        sessionStatus: 'active',
        lastPausedAt: null,
      });
      setStudyTimerStartedAt(Date.now());

      if (!isCountdownSync && !isPomodoroSync) {
        emitSyncEvent(SYNC_EVENTS.PLAY_TIMER, now);
      }
    },

    pause: () => {
      timerActions.updateStudyState({
        isRunning: false,
        lastPausedAt: Date.now(),
      });

      if (!isCountdownSync && !isPomodoroSync) {
        emitSyncEvent(SYNC_EVENTS.PAUSE_TIMER, Date.now());
      }
    },

    reset: (fromSync = false) => {
      timerActions.setStudyState(DEFAULT_STUDY_STATE);
      updateSessionId(null);
      setStudyTimerStartedAt(null);

      if (!fromSync) {
        const emitTs = Date.now();
        emitSyncEvent(SYNC_EVENTS.RESET_TIMER, emitTs);

        if (isPomodoroSync) {
          emitSyncEvent(SYNC_EVENTS.RESET_POMODORO, emitTs);
        }

        if (isCountdownSync) {
          emitSyncEvent(SYNC_EVENTS.RESET_COUNTDOWN, emitTs);
        }
      }
    },
  }), [syncSettings, timerActions, updateSessionId, setStudyTimerStartedAt, emitSyncEvent]);

  // 🎯 SYNC EVENT HANDLERS
  const handleSyncPlay = useCallback((event: CustomEvent) => {
    if (isCountdownSync || isPomodoroSync) {
      const baseTimestamp = event?.detail?.baseTimestamp;
      studyControls.start(baseTimestamp);
    }
  }, [isCountdownSync, isPomodoroSync, studyControls.start]);

  const handleSyncPause = useCallback(() => {
    if (isCountdownSync || isPomodoroSync) {
      studyControls.pause();
    }
  }, [isCountdownSync, isPomodoroSync, studyControls.pause]);

  const handleSyncReset = useCallback(() => {
    if (isCountdownSync || isPomodoroSync) {
      studyControls.reset(true);
    }
  }, [isCountdownSync, isPomodoroSync, studyControls.reset]);

  // 🎯 EVENT LISTENERS
  useEventListener('playStudyTimer', handleSyncPlay);
  useEventListener('pauseStudyTimer', handleSyncPause);
  useEventListener('resetStudyTimer', handleSyncReset);

  // 🎯 TIMER EFFECT
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      timerActions.updateStudyState({ time: (studyState?.time ?? 0) + 1 });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, timerActions, studyState]);

  // 🎯 SESSION HANDLERS
  const handleStartSession = useCallback(async (sessionData: any) => {
    try {
      const { title, description } = sessionData;
      
      timerActions.updateStudyState({
        sessionTitle: title,
        sessionDescription: description,
      });

      studyControls.start();
      updateModal('start', false);
      
      toast.success('Study session started!');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    }
  }, [studyControls.start, timerActions, updateModal]);

  const handleFinishSession = useCallback(async () => {
    try {
      if (!currentSessionId || !studyState?.time) return;

      const duration = studyState.time;
      const pomodoros = calculatePomodorosFromDuration(duration);

      await supabase
        .from('study_sessions')
        .update({
          duration,
          pomodoros,
          completed_at: new Date().toISOString(),
        })
        .eq('id', currentSessionId || '');

      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.FINISH_SESSION));

      studyControls.reset();
      updateSessionId(null);
      
      const { sessionTitle, sessionDescription, ...resetState } = studyState ?? DEFAULT_STUDY_STATE;
      timerActions.setStudyState(resetState);
      setStudyTimerStartedAt(null);

      const emitTs = Date.now();
      if (isPomodoroSync) {
        emitSyncEvent(SYNC_EVENTS.RESET_POMODORO, emitTs);
      }
      emitSyncEvent(SYNC_EVENTS.RESET_COUNTDOWN, emitTs);

      updateModal('finish', false);
      toast.success('Session completed successfully!');
    } catch (error) {
      console.error('Error finishing session:', error);
      toast.error('An error occurred while finishing the session.');
    }
  }, [currentSessionId, studyState, studyControls.reset, updateSessionId, timerActions, setStudyTimerStartedAt, isPomodoroSync, emitSyncEvent, updateModal]);

  // 🎯 RENDER
  return (
    <div className="study-timer-container">
      <SectionTitle title="Study Timer" tooltip="Track your study sessions" />
      
      <div className="timer-display">
        <div className="time-text">{formatStudyTime(studyState?.time ?? 0)}</div>
        <div className="session-info">
          {studyState?.sessionTitle && (
            <div className="session-title">{studyState.sessionTitle}</div>
          )}
        </div>
      </div>

      <div className="timer-controls">
        <button onClick={() => isRunning ? studyControls.pause() : studyControls.start()}>
          {isRunning ? <Pause /> : <Play />}
        </button>
        <button onClick={() => studyControls.reset()}>
          <RotateCcw />
        </button>
        <button onClick={() => updateModal('start', true)} disabled={!!currentSessionId}>
          <Check />
        </button>
        <button onClick={() => updateModal('finish', true)} disabled={!currentSessionId}>
          <X />
        </button>
        <button onClick={() => updateModal('edit', true)} disabled={!currentSessionId}>
          <MoreVertical />
        </button>
      </div>

      <div className="sync-settings">
        <label>
          <input
            type="checkbox"
            checked={syncSettings.isSyncedWithStudyTimer}
            onChange={(e) => timerActions.updateSyncSettings({ isSyncedWithStudyTimer: e.target.checked })}
          />
          Sync with other timers
        </label>
      </div>

      {/* Modals */}
      {modalStates.start && (
        <StartSessionModal
          isOpen={modalStates.start}
          onClose={() => updateModal('start', false)}
          onStart={handleStartSession}
        />
      )}

      {modalStates.finish && (
        <FinishSessionModal
          isOpen={modalStates.finish}
          onClose={() => updateModal('finish', false)}
          onFinish={handleFinishSession}
          sessionId={currentSessionId || ''}
        />
      )}

      {modalStates.edit && currentSessionId && (
        <EditSessionModal
          isOpen={modalStates.edit}
          onClose={() => updateModal('edit', false)}
          sessionId={currentSessionId || ''}
        />
      )}

      {modalStates.delete && currentSessionId && (
        <DeleteSessionModal
          isOpen={modalStates.delete}
          onClose={() => updateModal('delete', false)}
          onConfirm={async () => {
            // Handle delete confirmation
            updateModal('delete', false);
          }}
        />
      )}

      {modalStates.exit && currentSessionId && (
        <ExitSessionChoiceModal
          isOpen={modalStates.exit}
          onClose={() => updateModal('exit', false)}
          onJustExit={() => {
            studyControls.reset();
            updateModal('exit', false);
          }}
          onExitAndDelete={handleFinishSession}
        />
      )}

      {modalStates.login && (
        <LoginPromptModal
          isOpen={modalStates.login}
          onClose={() => updateModal('login', false)}
        />
      )}

      {modalStates.summary && (
        <SessionSummaryModal
          isOpen={modalStates.summary}
          onClose={() => updateModal('summary', false)}
          durationFormatted={formatStudyTime(studyState?.time ?? 0)}
          completedTasksCount={0}
        />
      )}
    </div>
  );
};

export default StudyTimerZustand;
