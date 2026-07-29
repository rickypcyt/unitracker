import { z } from 'zod';

export const subjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Subject name is required'),
  color: z.string().nullable().optional(),
  workspace_id: z.string().nullable().optional(),
  user_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  description: z.string().optional(),
  archived: z.boolean().optional().default(false),
});

export type Subject = z.infer<typeof subjectSchema>;

export const createSubjectSchema = subjectSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, 'Subject name is required'),
  color: z.string().nullable().optional(),
  workspace_id: z.string().nullable().optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = subjectSchema.partial().required({ id: true });
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;

export const SUBJECT_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#64748b',
];

export function getSubjectColor(subject: Subject | null | undefined): string {
  return subject?.color ?? '#64748b';
}
