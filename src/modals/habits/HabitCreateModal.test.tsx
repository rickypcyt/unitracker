import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HabitCreateModal from './HabitCreateModal';

describe('HabitCreateModal (react-hook-form + zod)', () => {
  it('keeps submit disabled until the name is valid, then submits it trimmed', async () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<HabitCreateModal isOpen onClose={onClose} onAdd={onAdd} />);
    const input = screen.getByRole('textbox');
    const submit = document.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(submit).toBeDisabled();
    fireEvent.change(input, { target: { value: '   ' } });
    await waitFor(() => expect(submit).toBeDisabled());

    fireEvent.change(input, { target: { value: '  Read 20 pages  ' } });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: 'Read 20 pages' }));
    expect(onClose).toHaveBeenCalled();
  });
});
