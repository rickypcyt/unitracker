import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial value when key is not set', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should return stored value when key exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    act(() => {
      result.current[1]('new-value');
    });
    expect(result.current[0]).toBe('new-value');
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('new-value');
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    expect(result.current[0]).toBe(1);
    expect(JSON.parse(localStorage.getItem('counter')!)).toBe(1);
  });

  it('should handle JSON objects', () => {
    const initial = { name: 'test', count: 0 };
    const { result } = renderHook(() => useLocalStorage('obj-key', initial));
    act(() => {
      result.current[1]({ name: 'updated', count: 5 });
    });
    expect(result.current[0]).toEqual({ name: 'updated', count: 5 });
    expect(JSON.parse(localStorage.getItem('obj-key')!)).toEqual({ name: 'updated', count: 5 });
  });

  it('should handle invalid JSON gracefully', () => {
    localStorage.setItem('bad-key', '{invalid json');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useLocalStorage('bad-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    consoleSpy.mockRestore();
  });
});
