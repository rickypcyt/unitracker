import { z } from 'zod';

export const sessionTaskSchema = z.object({
  id: z.string().optional(),
  session_id: z.string(),
  task_id: z.string(),
  created_at: z.string().optional(),
});

export type SessionTask = z.infer<typeof sessionTaskSchema>;

export const createSessionTaskSchema = sessionTaskSchema.omit({
  id: true,
  created_at: true,
});

export type CreateSessionTaskInput = z.infer<typeof createSessionTaskSchema>;
