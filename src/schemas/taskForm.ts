import { z } from 'zod';

import { to24Hour } from '@/utils/timeUtils';

const required = (message = 'This field is required') =>
  z.string().refine(value => value.trim() !== '', { message, abort: true });

const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/**
 * Validation for TaskForm (react-hook-form + zod).
 * Messages match the previous hand-rolled useFormState rules.
 * Recurrence errors are reported under the `recurrence` key.
 */
export const taskFormSchema = z
  .object({
    title: required()
      .refine(v => v.length >= 3, 'Minimum length is 3 characters')
      .refine(v => v.length <= 100, 'Maximum length is 100 characters'),
    description: z.string().max(500, 'Maximum length is 500 characters').nullish(),
    deadline: z.string().nullish(),
    start_at: z.string().nullish(),
    end_at: z.string().nullish(),
    difficulty: required(),
    assignment: required(),
    isRecurring: z.boolean(),
    recurrence_weekdays: z.array(z.number()),
  })
  .superRefine((data, ctx) => {
    if (!data.isRecurring) return;
    const fail = (message: string) => ctx.addIssue({ code: 'custom', path: ['recurrence'], message });

    if (!data.recurrence_weekdays.length) return fail('Select at least one day');
    const start = data.start_at?.trim() ?? '';
    const end = data.end_at?.trim() ?? '';
    if (!start) return fail('Start time is required');
    if (!end) return fail('End time is required');
    const start24 = to24Hour(start);
    const end24 = to24Hour(end);
    if (!start24) return fail('Invalid start time format');
    if (!end24) return fail('Invalid end time format');
    if (toMinutes(end24) <= toMinutes(start24)) return fail('End time must be after start time');
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;
