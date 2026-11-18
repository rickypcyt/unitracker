import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHabits } from './useHabits';

const mocks = vi.hoisted(() => ({
  fetchHabits: vi.fn(), fetchCompletions: vi.fn(), fetchJournalNotes: vi.fn(),
  createHabit: vi.fn(), toggleCompletion: vi.fn(), saveJournalNote: vi.fn(),
}));
vi.mock('@/hooks/auth/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' }, isLoggedIn: true }) }));
vi.mock('@/services/HabitService', () => ({ HabitService: mocks }));
vi.mock('posthog-js', () => ({ default: { __loaded: false, capture: vi.fn() } }));

const wrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useHabits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.fetchHabits.mockResolvedValue([{ id: 'h1', user_id: 'u1', name: 'Read', created_at: '' }]);
    mocks.fetchCompletions.mockResolvedValue([{ habit_id: 'h1', completion_date: '2030-01-01', completed: true }]);
    mocks.fetchJournalNotes.mockResolvedValue([{ note_date: '2030-01-01', note: 'Good day' }]);
  });

  it('loads habits with completions and journal notes, and caches them locally', async () => {
    const { result } = renderHook(() => useHabits(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.habits).toEqual([expect.objectContaining({ id: 'h1', completions: { '2030-01-01': true } })]);
    expect(result.current.journalNotes).toEqual({ '2030-01-01': 'Good day' });
    expect(JSON.parse(localStorage.getItem('habits-cache:u1')!).habits).toHaveLength(1);
  });

  it('paints from the local cache without hitting the server while fresh', () => {
    localStorage.setItem('habits-cache:u1', JSON.stringify({ habits: [{ id: 'c1', name: 'Cached', completions: {} }], dailyNotes: {}, savedAt: Date.now() }));
    const { result } = renderHook(() => useHabits(), { wrapper: wrapper() });
    expect(result.current.loading).toBe(false);
    expect(result.current.habits[0]?.name).toBe('Cached');
    expect(mocks.fetchHabits).not.toHaveBeenCalled();
  });

  it('updates the cache after create, toggle and journal mutations', async () => {
    mocks.createHabit.mockResolvedValue({ id: 'h2', user_id: 'u1', name: 'Run', created_at: '' });
    mocks.toggleCompletion.mockResolvedValue(true);
    const { result } = renderHook(() => useHabits(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.createHabit('Run'));
    await act(() => result.current.toggleHabitCompletion('h2', new Date(2030, 0, 2)));
    await act(() => result.current.saveJournalNote(new Date(2030, 0, 1), '  '));

    // Query notifies subscribers on a timer, so wait for the re-render
    await waitFor(() => expect(result.current.journalNotes).toEqual({}));
    expect(result.current.habits.find(h => h.id === 'h2')?.completions).toEqual({ '2030-01-02': true });
  });
});
