import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useChangelog } from '@/hooks/useChangelog';

describe('useChangelog', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should detect new changes when hash is not stored', () => {
    const { result } = renderHook(() => useChangelog());
    expect(result.current.hasNewChanges).toBe(true);
  });

  it('should not detect new changes when hash matches', () => {
    // First render to get the hash
    const { result } = renderHook(() => useChangelog());
    act(() => {
      result.current.markAsSeen();
    });
    expect(result.current.hasNewChanges).toBe(false);

    // Second render should also show no new changes
    const { result: result2 } = renderHook(() => useChangelog());
    expect(result2.current.hasNewChanges).toBe(false);
  });

  it('should mark changes as seen', () => {
    const { result } = renderHook(() => useChangelog());
    expect(result.current.hasNewChanges).toBe(true);
    act(() => {
      result.current.markAsSeen();
    });
    expect(result.current.hasNewChanges).toBe(false);
    expect(localStorage.getItem('newFeaturesSeenHash')).not.toBeNull();
  });
});
