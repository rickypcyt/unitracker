import { z } from 'zod';

export const noteSchema = z.object({
  id: z.string().optional(),
  title: z.string().default(''),
  assignment: z.string().nullable().optional(),
  description: z.string().default(''),
  date: z.string().optional(),
  user_id: z.string().optional(),
  created_at: z.string().optional(),
  last_edited: z.string().optional(),
});

export type Note = z.infer<typeof noteSchema>;

export const createNoteSchema = noteSchema.omit({
  id: true,
  created_at: true,
  last_edited: true,
  user_id: true,
}).extend({
  title: z.string().default(''),
  description: z.string().default(''),
  assignment: z.string().nullable().optional(),
  date: z.string().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = noteSchema.partial().required({ id: true });
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
