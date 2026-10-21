import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}));
vi.mock('@/utils/supabaseClient', () => ({ supabase: { auth: mocks } }));

describe('AuthProvider', () => {
  it('does not overwrite a restored session with a stale initial response', async () => {
    let resolveSession!: (value: { data: { session: null } }) => void;
    let onAuthChange!: (event: string, session: unknown) => void;
    mocks.getSession.mockReturnValue(new Promise(resolve => { resolveSession = resolve; }));
    mocks.onAuthStateChange.mockImplementation(callback => {
      onAuthChange = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.isAuthLoading).toBe(true);
    act(() => onAuthChange('SIGNED_IN', { user: { id: 'user-1' } }));
    expect(result.current.isLoggedIn).toBe(true);
    await act(async () => resolveSession({ data: { session: null } }));
    await waitFor(() => expect(result.current.isAuthLoading).toBe(false));
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user?.id).toBe('user-1');
  });
});
