import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PendingTasks, { getPendingTasks } from './PendingTasks';
import type { Task } from '../../schemas/task';

const mocks = vi.hoisted(() => ({
  state: { tasks: [] as Task[], loading: false, error: null as string | null },
  fetchTasks: vi.fn(),
  navigateTo: vi.fn(),
  save: vi.fn(), remove: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn(),
  currentWorkspace: null as { id: string } | null,
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isLoggedIn: true, isAuthLoading: false }) }));
vi.mock('@/store/appStore', () => ({
  useAppStore: { getState: () => ({ updateTask: mocks.updateTask, deleteTask: mocks.deleteTask }) },
  useTasks: () => mocks.state,
  useFetchTasks: () => mocks.fetchTasks,
  useWorkspace: () => ({ workspaces: [], currentWorkspace: mocks.currentWorkspace }),
}));
vi.mock('@/navbar/NavigationContext', () => ({ useNavigation: () => ({ navigateTo: mocks.navigateTo }) }));
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
vi.mock('@/services/TaskService', () => ({ TaskService: { updateTask: mocks.save, deleteTask: mocks.remove } }));
vi.mock('@/pages/tasks/TaskFormManager', () => ({ default: ({ initialTask }: { initialTask: Task | null }) => <div>{initialTask ? `Editing ${initialTask.title}` : 'Creating new task'}</div> }));
vi.mock('@/modals/DeleteTasksPop', () => ({ default: ({ onConfirm }: { onConfirm: () => void }) => <button onClick={onConfirm}>Confirm deletion</button> }));
vi.mock('@/modals/LoginPromptModal', () => ({ default: () => null }));

const task = (id: string, fields: Partial<Task> = {}): Task => ({ id, title: id, completed: false, completed_at: null, ...fields });

describe('PendingTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.save.mockResolvedValue(task('Physics exam', { completed: true }));
    mocks.currentWorkspace = null;
    mocks.state = { tasks: [], loading: false, error: null };
  });

  it('opens the creation form from New task even when the list is empty', () => {
    render(<PendingTasks />);
    fireEvent.click(screen.getByRole('button', { name: 'New task' }));
    expect(screen.getByText('Creating new task')).toBeInTheDocument();
  });

  it('includes overdue tasks, exams and undated tasks, excluding completed tasks', () => {
    const input = [task('Undated'), task('Future exam', { due_date: '2030-02-01' }),
      task('Overdue', { deadline: '2020-01-01' }), task('Done', { completed: true }),
      task('Done status', { status: 'completed' }), task('Invalid date', { deadline: 'invalid' })];
    expect(getPendingTasks(input).map(item => item.id)).toEqual(['Overdue', 'Future exam', 'Invalid date', 'Undated']);
    expect(input[0]?.id).toBe('Undated');
  });

  it('explains actions on hover and keyboard focus', () => {
    mocks.state.tasks = [task('Physics exam')];
    render(<PendingTasks />);
    const ignore = screen.getByRole('button', { name: 'Ignore Physics exam' });
    fireEvent.mouseEnter(ignore);
    expect(screen.getByRole('tooltip')).toHaveTextContent('It is not deleted or completed');
    expect(ignore).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
    fireEvent.mouseLeave(ignore);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.focus(screen.getByRole('button', { name: 'Edit Physics exam' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Modify the task title');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit Physics exam' }), { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('fetches all workspaces and displays pending tasks', () => {
    mocks.state.tasks = [task('Physics exam', { deadline: '2030-02-01' }), task('Essay')];
    render(<PendingTasks />);
    expect(mocks.fetchTasks).toHaveBeenCalledWith(undefined, true);
    expect(screen.getByText('Physics exam')).toBeInTheDocument();
    expect(screen.getByText('No due date')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View all tasks' }));
    expect(mocks.navigateTo).toHaveBeenCalledWith('tasks');
  });

  it('only shows the active workspace and updates when switching', () => {
    mocks.currentWorkspace = { id: 'ws-1' };
    mocks.state.tasks = [task('First workspace', { workspace_id: 'ws-1' }), task('Second workspace', { workspace_id: 'ws-2' })];
    const { rerender } = render(<PendingTasks />);
    expect(screen.getByText('First workspace')).toBeInTheDocument();
    expect(screen.queryByText('Second workspace')).not.toBeInTheDocument();
    mocks.currentWorkspace = { id: 'ws-2' };
    rerender(<PendingTasks />);
    expect(screen.getByText('Second workspace')).toBeInTheDocument();
    expect(screen.queryByText('First workspace')).not.toBeInTheDocument();
  });

  it('completes tasks and opens the existing editor', async () => {
    mocks.state.tasks = [task('Physics exam')];
    render(<PendingTasks />);
    fireEvent.click(screen.getByRole('button', { name: 'Complete Physics exam' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith('Physics exam', expect.objectContaining({ completed: true })));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit Physics exam' })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: 'Edit Physics exam' }));
    expect(screen.getByText('Editing Physics exam')).toBeInTheDocument();
  });

  it('restores the original state if completion fails', async () => {
    mocks.state.tasks = [task('Physics exam')];
    mocks.save.mockRejectedValueOnce(new Error('Offline'));
    render(<PendingTasks />);
    fireEvent.click(screen.getByRole('button', { name: 'Complete Physics exam' }));
    await waitFor(() => expect(mocks.updateTask).toHaveBeenLastCalledWith('Physics exam', expect.objectContaining({ completed: false, status: 'todo' })));
  });

  it('ignores without deleting or completing, persists, and restores', () => {
    mocks.state.tasks = [task('Physics exam')];
    const { unmount } = render(<PendingTasks />);
    fireEvent.click(screen.getByRole('button', { name: 'Ignore Physics exam' }));
    expect(screen.queryByText('Physics exam')).not.toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    unmount();
    render(<PendingTasks />);
    expect(screen.queryByText('Physics exam')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore ignored (1)' }));
    expect(screen.getByText('Physics exam')).toBeInTheDocument();
  });

  it('requires confirmation before deleting a pending task', async () => {
    mocks.state.tasks = [task('Physics exam')];
    render(<PendingTasks />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Physics exam' }));
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('Physics exam'));
  });

  it('renders an empty state', () => {
    render(<PendingTasks />);
    expect(screen.getByText(/No pending tasks/)).toBeInTheDocument();
  });

  it('keeps cached tasks visible and offers retry on fetch errors', () => {
    mocks.state.tasks = [task('Cached task')];
    mocks.state.error = 'Offline';
    render(<PendingTasks />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Cached task')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading tasks' }));
    expect(mocks.fetchTasks).toHaveBeenCalledTimes(2);
  });

  it('renders a loading state', () => {
    mocks.state.loading = true;
    render(<PendingTasks />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading tasks');
  });
});
