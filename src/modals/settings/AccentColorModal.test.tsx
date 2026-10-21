import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccentColorModal from './AccentColorModal';

describe('AccentColorModal', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accentPalette', '#BF5AF2');
  });

  it('selects the saved accent and previews without committing or closing', () => {
    const onClose = vi.fn();
    const onAccentColorSelect = vi.fn();
    render(<AccentColorModal onClose={onClose} onAccentColorSelect={onAccentColorSelect} />);
    expect(screen.getByRole('button', { name: /Purple/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Classic blue/ }));
    expect(document.documentElement.style.getPropertyValue('--accent-primary')).toBe('#0A84FF');
    expect(localStorage.getItem('accentPalette')).toBe('#BF5AF2');
    expect(onAccentColorSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Choose as accent color' }));
    expect(onAccentColorSelect).toHaveBeenCalledExactlyOnceWith('#0A84FF');
  });

  it('restores the saved accent when dismissed without confirmation', () => {
    const { unmount } = render(<AccentColorModal onClose={vi.fn()} onAccentColorSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Fresh green/ }));
    unmount();
    expect(document.documentElement.style.getPropertyValue('--accent-primary')).toBe('#BF5AF2');
  });
});
