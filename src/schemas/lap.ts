import { z } from 'zod';

export const moodSchema = z.enum(['great', 'good', 'neutral', 'bad', 'terrible']);
export type SessionMood = z.infer<typeof moodSchema>;

export const energySchema = z.enum(['high', 'medium', 'low']);
export type SessionEnergy = z.infer<typeof energySchema>;

export const lapSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  created_at: z.string(),
  started_at: z.string().nullable().optional(),
  ended_at: z.string().nullable().optional(),
  duration: z.string(),
  session_number: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  tasks_completed: z.number(),
  pomodoros_completed: z.number().optional(),
  session_assignment: z.string().nullable().optional(),
  focus_score: z.number().nullable().optional(),
  productivity_rating: z.number().nullable().optional(),
  type: z.string().optional(),
  subject_id: z.string().nullable().optional(),
  subject_name: z.string().nullable().optional(),
  subject_color: z.string().nullable().optional(),
  // Rich metadata for pattern detection
  mood: moodSchema.nullable().optional(),
  energy: energySchema.nullable().optional(),
  location: z.string().nullable().optional(),
  noise_level: z.string().nullable().optional(),
  pauses_count: z.number().nullable().optional(),
  interruptions_count: z.number().nullable().optional(),
  objective: z.string().nullable().optional(),
  result: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
  workspace_id: z.string().nullable().optional(),
  task_id: z.string().nullable().optional(),
});

export type Lap = z.infer<typeof lapSchema>;

export const createLapSchema = lapSchema.omit({
  id: true,
  created_at: true,
  user_id: true,
}).extend({
  name: z.string().min(1, 'Session name is required'),
  duration: z.string(),
  session_number: z.number(),
  tasks_completed: z.number().default(0),
});

export type CreateLapInput = z.infer<typeof createLapSchema>;

export const updateLapSchema = lapSchema.partial().required({ id: true });
export type UpdateLapInput = z.infer<typeof updateLapSchema>;
