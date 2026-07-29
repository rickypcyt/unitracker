import { z } from 'zod';

export const habitSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(1, 'Habit name is required'),
  created_at: z.string(),
});

export type Habit = z.infer<typeof habitSchema>;

export const habitCompletionSchema = z.object({
  id: z.string(),
  habit_id: z.string(),
  user_id: z.string(),
  completion_date: z.string(),
  completed: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type HabitCompletion = z.infer<typeof habitCompletionSchema>;

export const journalNoteSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  note_date: z.string(),
  note: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type JournalNote = z.infer<typeof journalNoteSchema>;

export const habitWithCompletionsSchema = habitSchema.extend({
  completions: z.record(z.string(), z.boolean()),
});

export type HabitWithCompletions = z.infer<typeof habitWithCompletionsSchema>;

export const createHabitSchema = habitSchema.omit({
  id: true,
  created_at: true,
  user_id: true,
}).extend({
  name: z.string().min(1, 'Habit name is required'),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
