import { z } from 'zod';

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
