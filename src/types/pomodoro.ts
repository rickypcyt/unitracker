export type PomodoroModeType = 'work' | 'break' | 'longBreak';

export interface PomodoroMode {
  work: number;
  break: number;
  longBreak: number;
}

export interface PomodoroState {
  modeIndex: number;
  currentMode: PomodoroModeType;
  timeLeft: number;
  isRunning: boolean;
  pomodoroToday: number;
  workSessionsBeforeLongBreak: number;
  workSessionsCompleted: number;
  startTime: number;
  pausedTime: number;
  lastManualAdjustment: number;
  pomodorosThisSession: number;
  longBreakDuration?: number;
}

export default {};
