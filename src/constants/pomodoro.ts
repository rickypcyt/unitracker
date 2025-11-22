export const POMODORO_CONFIG = {
  STORAGE_KEYS: {
    POMODORO_STATE: 'pomodoroState',
    POMODORO_MODES: 'pomodoroModes',
    POMODORO_ALARM_ENABLED: 'pomodoroAlarmEnabled',
    LAST_POMODORO_RESET: 'lastPomodoroReset',
    POMODOROS_THIS_SESSION: 'pomodorosThisSession',
    SESSIONS_TODAY_COUNT: 'sessionsTodayCount',
    LAST_SESSIONS_RESET: 'lastSessionsReset',
    ACTIVE_SESSION_ID: 'activeSessionId'
  }
} as const;

export const POMODORO_SOUNDS = {
  WORK: '/sounds/break-end.mp3',
  BREAK: '/sounds/countdownend.mp3',
  LONG_BREAK: '/sounds/countdownend2.mp3',
  BREAK_END: '/sounds/break-end.mp3',
  COUNTDOWN_END: '/sounds/countdownend.mp3',
  COUNTDOWN_END2: '/sounds/countdownend2.mp3'
} as const;

export default {
  POMODORO_CONFIG,
  POMODORO_SOUNDS
};
