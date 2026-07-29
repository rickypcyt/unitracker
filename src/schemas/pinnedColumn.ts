import { z } from 'zod';

export const pinnedColumnSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  workspace_id: z.string(),
  assignment: z.string(),
  is_pinned: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PinnedColumn = z.infer<typeof pinnedColumnSchema>;

export const togglePinnedColumnSchema = z.object({
  workspace_id: z.string(),
  assignment: z.string().min(1, 'Assignment is required'),
  is_pinned: z.boolean(),
});

export type TogglePinnedColumnInput = z.infer<typeof togglePinnedColumnSchema>;
