import {
  Check,
  MoreVertical,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { SYNC_EVENTS, useEmitSyncEvents } from "@/hooks/study-timer/useStudySync";
import { formatStudyTime, useStudyTimer } from "@/hooks/useTimers";
import { useUiActions } from "@/store/appStore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useObjectStorage, useStorage } from "@/hooks/useStorage";

import DeleteSessionModal from "@/modals/DeleteSessionModal";
import EditSessionModal from "@/modals/EditSessionModal";
import ExitSessionChoiceModal from "@/modals/ExitSessionChoiceModal";
import FinishSessionModal from "@/modals/FinishSessionModal";
import LoginPromptModal from "@/modals/LoginPromptModal";
import SectionTitle from "@/components/SectionTitle";
import SessionSummaryModal from "@/modals/SessionSummaryModal";
import StartSessionModal from "@/modals/StartSessionModal";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import useEventListener from "@/hooks/useEventListener";
import { useSessionId } from "@/hooks/study-timer/useSessionId";
import { useStudyTimerState, type StudyState } from "@/hooks/study-timer/useStudyTimerState";

// Constantes

// Validador para StudyState
const isStudyState = (obj: any): obj is StudyState => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.time === 'number' &&
    typeof obj.isRunning === 'boolean' &&
    (obj.lastStart === null || typeof obj.lastStart === 'number') &&
    typeof obj.timeAtStart === 'number' &&
    ['inactive', 'active', 'paused'].includes(obj.sessionStatus) &&
    (obj.lastPausedAt === null || typeof obj.lastPausedAt === 'number') &&
    (obj.sessionTitle === undefined || typeof obj.sessionTitle === 'string') &&
    (obj.sessionDescription === undefined || typeof obj.sessionDescription === 'string')
  );
};

const DEFAULT_STUDY_STATE: StudyState = {
  time: 0,
  isRunning: false,
  lastStart: null,
  timeAtStart: 0,
  sessionStatus: 'inactive',
  lastPausedAt: null,
};

const StudyTimer = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  
  // 🎯 STORAGE HOOKS - Centralizado y tipado
  const { value: studyState, setValue: setStudyState, isLoading: isLoadingState } = useObjectStorage<StudyState>(
    'studyTimerState',
    { defaultValue: DEFAULT_STUDY_STATE, validator: isStudyState }
  );

  const { value: activeSessionId, setValue: setActiveSessionId } = useStorage('activeSessionId', {
    defaultValue: null as string | null,
  });

  const { value: studyTimerStartedAt, setValue: setStudyTimerStartedAt } = useStorage('studyTimerStartedAt', {
    defaultValue: null as number | null,
  });


  const { value: isSyncedWithStudyTimer, setValue: setIsSyncedWithStudyTimer } = useStorage(
    'isSyncedWithStudyTimer',
    { defaultValue: false }
  );

  const { value: sessionsTodayCount, setValue: setSessionsTodayCount } = useStorage('sessionsTodayCount', {
    defaultValue: 0,
  });


  // 🎯 CUSTOM HOOKS (existentes)
  const { time: currentTime, controls: timerControls } = useStudyTimer();
  const [currentSessionId, updateSessionId] = useSessionId();
  const { emitSyncEvent } = useEmitSyncEvents();
  const [hookStudyState, updateStudyState] = useStudyTimerState();

  // 🎯 REDUX STATE
  const syncPomodoroWithTimer = useSelector((state: any) => state.ui.syncPomodoroWithTimer);
  const syncCountdownWithTimer = useSelector((state: any) => state.ui.syncCountdownWithTimer);

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
  const isPomodoroSync = syncPomodoroWithTimer;
  const isCountdownSync = syncCountdownWithTimer;

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
      setStudyState({
        time: 0,
        isRunning: true,
        lastStart: Date.now(),
        timeAtStart: 0,
        sessionStatus: 'active',
        lastPausedAt: null,
      });
      setStudyTimerStartedAt(Date.now());
      dispatch(setStudyRunning(true));
      dispatch(setStudyTimerState('running'));

      if (!isCountdownSync && !isPomodoroSync) {
        emitSyncEvent(SYNC_EVENTS.PLAY_TIMER, now);
      }
    },

    pause: () => {
      setStudyState(prev => ({
        ...prev!,
        isRunning: false,
      }));
      dispatch(setStudyRunning(false));
      dispatch(setStudyTimerState('paused'));

      if (!isCountdownSync && !isPomodoroSync) {
        emitSyncEvent(SYNC_EVENTS.PAUSE_TIMER, Date.now());
      }
    },

    reset: (fromSync = false) => {
      setStudyState(DEFAULT_STUDY_STATE);
      setActiveSessionId(null);
      setStudyTimerStartedAt(null);
      dispatch(setStudyRunning(false));
      dispatch(setStudyTimerState('stopped'));
      dispatch(resetTimerState());

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
  }), [isCountdownSync, isPomodoroSync, emitSyncEvent, dispatch]);

  // 🎯 SESSION MANAGEMENT
  const handleStartSession = useCallback(async (sessionData: any) => {
    try {
      if (!user) {
        updateModal('login', true);
        return;
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .insert([{
          user_id: user.id,
          title: sessionData.title,
          description: sessionData.description,
          workspace_id: sessionData.workspaceId,
        }])
        .select()
        .single();

      if (error) throw error;

      updateSessionId(data.id);
      setActiveSessionId(data.id);
      setStudyState(prev => ({
        ...prev!,
        sessionTitle: sessionData.title,
        sessionDescription: sessionData.description,
      }));

      updateModal('start', false);
      toast.success('Session started successfully!');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    }
  }, [user, updateSessionId, setActiveSessionId, setStudyState, updateModal]);

  const handleFinishSession = useCallback(async () => {
    try {
      if (!currentSessionId || !user) return;

      const endTime = Date.now();
      const duration = studyState?.time ?? 0;
      const pomodorosCompleted = calculatePomodorosFromDuration(duration);

      await supabase
        .from('study_sessions')
        .update({
          end_time: new Date(endTime).toISOString(),
          duration_seconds: duration,
          pomodoros_completed: pomodorosCompleted,
        })
        .eq('id', currentSessionId);

      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.FINISH_SESSION));

      studyControls.reset();
      updateSessionId(null);
      dispatch(setCurrentSession(null));
      
      const { sessionTitle, sessionDescription, ...resetState } = studyState ?? DEFAULT_STUDY_STATE;
      setStudyState(resetState);
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
  }, [currentSessionId, user, studyState, studyControls, updateSessionId, dispatch, setStudyState, setStudyTimerStartedAt, isPomodoroSync, emitSyncEvent, updateModal]);

  // 🎯 SYNC EVENT HANDLERS
  const handleSyncStart = useCallback((event: CustomEvent) => {
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
  useEventListener(SYNC_EVENTS.START_TIMER, handleSyncStart);
  useEventListener(SYNC_EVENTS.PAUSE_TIMER, handleSyncPause);
  useEventListener(SYNC_EVENTS.RESET_TIMER, handleSyncReset);

  // 🎯 TIMER EFFECT
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setStudyState(prev => ({
        ...prev!,
        time: (prev?.time ?? 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // 🎯 DAILY RESET EFFECT
  useEffect(() => {
    const today = new Date().toDateString();
    if (sessionsTodayCount === 0) {
      setSessionsTodayCount(0);
    }
  }, [sessionsTodayCount, setSessionsTodayCount]);

  // 🎯 RENDER
  if (isLoadingState) {
    return <div className="animate-pulse">Loading...</div>;
  }

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

      <div className="sync-status">
        <label>
          <input
            type="checkbox"
            checked={isSyncedWithStudyTimer ?? false}
            onChange={(e) => setIsSyncedWithStudyTimer(e.target.checked)}
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
          sessionId={currentSessionId}
        />
      )}

      {modalStates.edit && currentSessionId && (
        <EditSessionModal
          isOpen={modalStates.edit}
          onClose={() => updateModal('edit', false)}
          sessionId={currentSessionId}
        />
      )}

      {modalStates.delete && currentSessionId && (
        <DeleteSessionModal
          isOpen={modalStates.delete}
          onClose={() => updateModal('delete', false)}
          sessionId={currentSessionId}
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

export default StudyTimer;
