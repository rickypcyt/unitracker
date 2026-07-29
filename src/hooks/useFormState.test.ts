import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useFormState } from '@/hooks/useFormState';

describe('useFormState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with provided state', () => {
    const { result } = renderHook(() =>
      useFormState({ title: 'initial', description: '' })
    );
    expect(result.current.formData.title).toBe('initial');
    expect(result.current.formData.description).toBe('');
  });

  it('should update field on handleChange', () => {
    const { result } = renderHook(() =>
      useFormState({ title: '', description: '' })
    );
    act(() => {
      result.current.handleChange('title', 'New Title');
    });
    expect(result.current.formData.title).toBe('New Title');
  });

  it('should mark form as dirty after change', () => {
    const { result } = renderHook(() =>
      useFormState({ title: '' })
    );
    expect(result.current.isDirty).toBe(false);
    act(() => {
      result.current.handleChange('title', 'changed');
    });
    expect(result.current.isDirty).toBe(true);
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() =>
      useFormState(
        { title: '' },
        { title: { required: true } }
      )
    );
    let isValid = false;
    act(() => {
      isValid = result.current.validateForm();
    });
    expect(isValid).toBe(false);
    expect(result.current.errors.title).toBe('This field is required');
  });

  it('should validate minLength', () => {
    const { result } = renderHook(() =>
      useFormState(
        { title: 'ab' },
        { title: { required: true, minLength: 3 } }
      )
    );
    let isValid = true;
    act(() => {
      isValid = result.current.validateForm();
    });
    expect(isValid).toBe(false);
    expect(result.current.errors.title).toContain('Minimum length is 3');
  });

  it('should validate maxLength', () => {
    const { result } = renderHook(() =>
      useFormState(
        { title: 'this is a very long title' },
        { title: { maxLength: 10 } }
      )
    );
    let isValid = true;
    act(() => {
      isValid = result.current.validateForm();
    });
    expect(isValid).toBe(false);
    expect(result.current.errors.title).toContain('Maximum length is 10');
  });

  it('should validate pattern', () => {
    const { result } = renderHook(() =>
      useFormState(
        { email: 'invalid-email' },
        { email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } }
      )
    );
    let isValid = true;
    act(() => {
      isValid = result.current.validateForm();
    });
    expect(isValid).toBe(false);
    expect(result.current.errors.email).toBe('Invalid email');
  });

  it('should pass validation with valid data', () => {
    const { result } = renderHook(() =>
      useFormState(
        { title: 'Valid Title' },
        { title: { required: true, minLength: 3 } }
      )
    );
    let isValid = false;
    act(() => {
      isValid = result.current.validateForm();
    });
    expect(isValid).toBe(true);
    expect(result.current.errors.title).toBeUndefined();
  });

  it('should clear error on handleChange', () => {
    const { result } = renderHook(() =>
      useFormState(
        { title: '' },
        { title: { required: true } }
      )
    );
    act(() => {
      result.current.validateForm();
    });
    expect(result.current.errors.title).toBeDefined();
    act(() => {
      result.current.handleChange('title', 'now valid');
    });
    expect(result.current.errors.title).toBeUndefined();
  });

  it('should reset form', () => {
    const initial = { title: 'initial' };
    const { result } = renderHook(() => useFormState(initial));
    act(() => {
      result.current.handleChange('title', 'changed');
    });
    expect(result.current.formData.title).toBe('changed');
    act(() => {
      result.current.resetForm();
    });
    expect(result.current.formData.title).toBe('initial');
    expect(result.current.isDirty).toBe(false);
  });
});
