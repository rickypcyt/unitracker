// Sync events for inter-component communication
export const SYNC_EVENTS = {
  // Timer events
  PLAY_TIMER: 'playTimer',
  PAUSE_TIMER: 'pauseTimer',
  RESET_TIMER: 'resetTimer',
  FINISH_SESSION: 'finishSession',
  
  // Pomodoro events
  PLAY_POMODORO: 'playPomodoro',
  PAUSE_POMODORO: 'pausePomodoro',
  RESET_POMODORO: 'resetPomodoro',
  
  // Countdown events
  PLAY_COUNTDOWN: 'playCountdown',
  PAUSE_COUNTDOWN: 'pauseCountdown',
  RESET_COUNTDOWN: 'resetCountdown',
  
  // Other sync events
  REFRESH_STATS: 'refreshStats',
  GLOBAL_TIMER_SYNC: 'globalTimerSync',
  GLOBAL_RESET_SYNC: 'globalResetSync',
  RESET_COUNTDOWN_SYNC: 'resetCountdownSync',
  STUDY_TIMER_STATE_CHANGED: 'studyTimerStateChanged'
} as const;

export default {
  SYNC_EVENTS
};
