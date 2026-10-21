import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useTheme from './useTheme';

const auth = vi.hoisted(() => ({ isLoggedIn: false, isAuthLoading: true }));
vi.mock('./useAuth', () => ({ useAuth: () => auth }));

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    auth.isLoggedIn = false;
    auth.isAuthLoading = true;
  });

  it('hides onboarding while restoring auth and for authenticated users', () => {
    const { result, rerender } = renderHook(() => useTheme());
    expect(result.current.showWelcomeModal).toBe(false);
    auth.isLoggedIn = true;
    auth.isAuthLoading = false;
    rerender();
    expect(result.current.showWelcomeModal).toBe(false);
    expect(result.current.showLoginModal).toBe(false);
  });

  it('shows welcome for a new guest after auth resolves', () => {
    const { result, rerender } = renderHook(() => useTheme());
    auth.isAuthLoading = false;
    rerender();
    expect(result.current.showWelcomeModal).toBe(true);
  });

  it('shares and persists accent changes across hook instances', () => {
    const { result } = renderHook(() => ({ first: useTheme(), second: useTheme() }));
    act(() => result.current.first.setAccentPalette('#BF5AF2'));
    expect(result.current.second.accentPalette).toBe('#BF5AF2');
    expect(localStorage.getItem('accentPalette')).toBe('#BF5AF2');
  });
});
