import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BaseModal from './BaseModal';

const setPhone = (isPhone: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isPhone && query.includes('max-width'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
};

describe('BaseModal', () => {
  afterEach(() => setPhone(false));

  it('renders the centered dialog on desktop', () => {
    setPhone(false);
    render(<BaseModal isOpen onClose={vi.fn()} title="Edit">Body</BaseModal>);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(document.querySelector('[data-vaul-drawer]')).toBeNull();
  });

  it('renders a bottom sheet on phones and closes from the header button', () => {
    setPhone(true);
    const onClose = vi.fn();
    render(<BaseModal isOpen onClose={onClose} title="Edit">Body</BaseModal>);
    expect(document.querySelector('[data-vaul-drawer]')).not.toBeNull();
    expect(screen.getByText('Body')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps the centered dialog on phones when mobileSheet is false', () => {
    setPhone(true);
    render(<BaseModal isOpen onClose={vi.fn()} title="Edit" mobileSheet={false}>Body</BaseModal>);
    expect(document.querySelector('[data-vaul-drawer]')).toBeNull();
  });
});
