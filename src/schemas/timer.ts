import { z } from 'zod';

export const pomodoroModeTypeSchema = z.enum(['work', 'break', 'longBreak']);
export type PomodoroModeType = z.infer<typeof pomodoroModeTypeSchema>;

export const pomodoroModeSchema = z.object({
  label: z.string(),
  work: z.number().positive(),
  break: z.number().positive(),
  longBreak: z.number().positive(),
  description: z.string().optional(),
});

export type PomodoroMode = z.infer<typeof pomodoroModeSchema>;

export const pomodoroSettingsSchema = z.object({
  autoStartBreak: z.boolean().default(false),
  autoStartWork: z.boolean().default(false),
  soundEnabled: z.boolean().default(true),
  notificationEnabled: z.boolean().default(true),
  dailyGoal: z.number().min(1).default(8),
  volume: z.number().min(0).max(1).default(0.7),
});

export type PomodoroSettings = z.infer<typeof pomodoroSettingsSchema>;

export const pomoStateSchema = z.object({
  timeLeft: z.number(),
  isRunning: z.boolean(),
  currentMode: pomodoroModeTypeSchema,
  modeIndex: z.number(),
  workSessionsCompleted: z.number(),
  workSessionsBeforeLongBreak: z.number(),
  longBreakDuration: z.number(),
  startTime: z.number(),
  pausedTime: z.number(),
  work: z.number(),
  break: z.number(),
  longBreak: z.number(),
});

export type PomoState = z.infer<typeof pomoStateSchema>;

export const countdownTimeSchema = z.object({
  hours: z.number().min(0),
  minutes: z.number().min(0).max(59),
  seconds: z.number().min(0).max(59),
});

export type CountdownTime = z.infer<typeof countdownTimeSchema>;

export const countdownStateSchema = z.object({
  status: z.enum(['running', 'paused', 'stopped']),
  endTimestamp: z.number().nullable(),
  pausedSecondsLeft: z.number().nullable(),
  lastTime: countdownTimeSchema,
});

export type CountdownState = z.infer<typeof countdownStateSchema>;

export const studyStateSchema = z.object({
  time: z.number(),
  isRunning: z.boolean(),
  lastStart: z.number().nullable(),
  timeAtStart: z.number(),
  sessionStatus: z.enum(['inactive', 'active', 'paused']),
  sessionTitle: z.string().optional(),
  sessionDescription: z.string().optional(),
  lastPausedAt: z.number().nullable(),
});

export type StudyState = z.infer<typeof studyStateSchema>;

export const syncSettingsSchema = z.object({
  syncPomodoroWithTimer: z.boolean().default(false),
  syncCountdownWithTimer: z.boolean().default(false),
  isSyncedWithStudyTimer: z.boolean().default(false),
});

export type SyncSettings = z.infer<typeof syncSettingsSchema>;

export const timerStateSchema = z.enum(['running', 'paused', 'stopped']);
export type TimerState = z.infer<typeof timerStateSchema>;
