import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DayTasksPopover from './DayTasksPopover';

const mocks = vi.hoisted(() => ({
  updateTask: vi.fn(), deleteTask: vi.fn(), save: vi.fn(), remove: vi.fn(), fetch: vi.fn(),
  isLoggedIn: true,
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isLoggedIn: mocks.isLoggedIn }) }));
vi.mock('@/store/appStore', () => ({
  useAppStore: { getState: () => ({ updateTask: mocks.updateTask, deleteTask: mocks.deleteTask }) },
  useFetchTasks: () => mocks.fetch,
}));
vi.mock('@/services/TaskService', () => ({ TaskService: { updateTask: mocks.save, deleteTask: mocks.remove } }));
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
vi.mock('@/pages/tasks/TaskFormManager', () => ({ default: ({ initialDeadline }: { initialDeadline: string }) => <div role="dialog">Editor {initialDeadline}</div> }));
vi.mock('@/modals/DeleteTasksPop', () => ({ default: ({ onConfirm }: { onConfirm: () => void }) => <button onClick={onConfirm}>Confirm deletion</button> }));
vi.mock('@/modals/LoginPromptModal', () => ({ default: () => <div>Login required</div> }));

const task = { id: 'exam', title: 'Physics exam', completed: false, completed_at: null, deadline: '2026-10-21', description: 'Chapter 3' };
const props = { day: new Date(2026, 9, 21), tasks: [task], onClose: vi.fn() };

describe('DayTasksPopover', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.isLoggedIn = true; mocks.save.mockResolvedValue({ ...task, completed: true }); });

  it('shows details and completes a task through the existing service', async () => {
    render(<DayTasksPopover {...props} />);
    expect(screen.getByText('Chapter 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Complete Physics exam' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith('exam', expect.objectContaining({ completed: true, status: 'completed' })));
    expect(mocks.updateTask).toHaveBeenCalled();
  });

  it('opens the reused editor with the selected day', () => {
    render(<DayTasksPopover {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add task for this day' }));
    expect(screen.getByText('Editor 2026-10-21')).toBeInTheDocument();
  });

  it('requires confirmation before deleting', async () => {
    render(<DayTasksPopover {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Physics exam' }));
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('exam'));
  });

  it('blocks mutations for demo users', () => {
    mocks.isLoggedIn = false;
    render(<DayTasksPopover {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Complete Physics exam' }));
    expect(screen.getByText('Login required')).toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
