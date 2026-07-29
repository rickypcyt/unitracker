import { z } from 'zod';

export const taskDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type TaskDifficulty = z.infer<typeof taskDifficultySchema>;

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done', 'blocked']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const recurrenceTypeSchema = z.enum(['none', 'weekly']);
export type RecurrenceType = z.infer<typeof recurrenceTypeSchema>;

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  completed: z.boolean(),
  completed_at: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deadline: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  priority: z.number().optional(),
  tags: z.array(z.string()).optional(),
  user_id: z.string().optional(),
  workspace_id: z.string().nullable().optional(),
  activetask: z.boolean().optional(),
  difficulty: z.string().optional(),
  assignment: z.string().optional(),
  status: z.string().optional(),
  recurrence_type: recurrenceTypeSchema.nullable().optional(),
  recurrence_weekdays: z.array(z.number().min(0).max(6)).nullable().optional(),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
});

export type Task = z.infer<typeof taskSchema>;

export const createTaskSchema = taskSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  completed: true,
  completed_at: true,
  activetask: true,
}).extend({
  title: z.string().min(3, 'Task title must be at least 3 characters').max(100),
  assignment: z.string().min(1, 'Task assignment/subject is required'),
  difficulty: taskDifficultySchema,
  workspace_id: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  description: z.string().max(500).optional().default(''),
  status: z.string().optional(),
  recurrence_type: recurrenceTypeSchema.nullable().optional(),
  recurrence_weekdays: z.array(z.number().min(0).max(6)).nullable().optional(),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = taskSchema.partial().required({ id: true });
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
