import { describe, expect, it } from 'vitest';
import { taskFormSchema } from './taskForm';

const base = {
  title: 'Physics exam', description: '', deadline: '', start_at: null, end_at: null,
  difficulty: 'medium', assignment: 'Physics', isRecurring: false, recurrence_weekdays: [],
};
const issues = (values: object) => {
  const result = taskFormSchema.safeParse({ ...base, ...values });
  return result.success ? {} : Object.fromEntries(result.error.issues.map(i => [i.path.join('.'), i.message]));
};

describe('taskFormSchema', () => {
  it('accepts a valid one-off task, including null times', () => {
    expect(issues({})).toEqual({});
  });

  it('keeps the previous required/length messages', () => {
    expect(issues({ title: '  ' }).title).toBe('This field is required');
    expect(issues({ title: 'ab' }).title).toBe('Minimum length is 3 characters');
    expect(issues({ title: 'x'.repeat(101) }).title).toBe('Maximum length is 100 characters');
    expect(issues({ assignment: '' }).assignment).toBe('This field is required');
    expect(issues({ description: 'x'.repeat(501) }).description).toBe('Maximum length is 500 characters');
  });

  it('validates recurring tasks under the recurrence key', () => {
    const recurring = { isRecurring: true, recurrence_weekdays: [1], start_at: '10:00 AM', end_at: '11:00 AM' };
    expect(issues(recurring)).toEqual({});
    expect(issues({ ...recurring, recurrence_weekdays: [] }).recurrence).toBe('Select at least one day');
    expect(issues({ ...recurring, start_at: '' }).recurrence).toBe('Start time is required');
    expect(issues({ ...recurring, end_at: null }).recurrence).toBe('End time is required');
    expect(issues({ ...recurring, end_at: '9:00 AM' }).recurrence).toBe('End time must be after start time');
  });
});
