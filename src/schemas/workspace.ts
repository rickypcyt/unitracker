import { z } from 'zod';

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Workspace name is required'),
  icon: z.string().nullable().optional(),
  description: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  user_id: z.string().optional(),
  is_default: z.boolean().optional(),
  isAll: z.boolean().optional(),
});

export type Workspace = z.infer<typeof workspaceSchema>;

export const createWorkspaceSchema = workspaceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  isAll: true,
}).extend({
  name: z.string().min(1, 'Workspace name is required'),
  icon: z.string().nullable().optional(),
  description: z.string().optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const sharedWorkspaceSchema = z.object({
  id: z.string().optional(),
  workspace_id: z.string(),
  shared_by: z.string(),
  received_by: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type SharedWorkspace = z.infer<typeof sharedWorkspaceSchema>;
