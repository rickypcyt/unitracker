import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PendingTasks from './PendingTasks';
import { useAppStore } from '../../store/appStore';

vi.mock('@/utils/supabaseClient', () => ({ supabase: {} }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isLoggedIn: true, isAuthLoading: false, user: { id: 'user-1' } }) }));
vi.mock('@/navbar/NavigationContext', () => ({ useNavigation: () => ({ navigateTo: vi.fn() }) }));
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
vi.mock('@/hooks/useSessionTaskActions', () => ({ useSessionTaskActions: () => ({ busy: null, editTask: vi.fn(), toggleTask: vi.fn(), requestDelete: vi.fn(), modals: null }) }));

const original = { id: 'task-1', title: 'Physics exam', completed: false, completed_at: null, deadline: '2030-02-01', workspace_id: 'ws-1' };

describe('PendingTasks live store synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      fetchTasks: vi.fn().mockResolvedValue(undefined),
      tasks: { tasks: [original], loading: false, error: null, isCached: true, lastFetch: Date.now() },
      workspace: { currentWorkspace: { id: 'ws-1', name: 'School' }, workspaces: [{ id: 'ws-1', name: 'School' }], loading: false },
    });
  });

  it('updates title and deadline immediately when the editor saves to the shared store', () => {
    render(<PendingTasks />);
    act(() => useAppStore.getState().updateTaskSuccess({ ...original, title: 'Updated physics exam', deadline: '2030-03-02' }));
    expect(screen.getByText('Updated physics exam')).toBeInTheDocument();
    expect(screen.queryByText('Physics exam')).not.toBeInTheDocument();
    expect(screen.getByText('Mar 2, 2030')).toBeInTheDocument();
  });

  it('removes tasks immediately when marked completed or moved to another workspace', () => {
    render(<PendingTasks />);
    act(() => useAppStore.getState().updateTaskSuccess({ ...original, status: 'completed' }));
    expect(screen.queryByText('Physics exam')).not.toBeInTheDocument();
    act(() => useAppStore.getState().updateTaskSuccess({ ...original, status: 'todo', workspace_id: 'ws-2' }));
    expect(screen.queryByText('Physics exam')).not.toBeInTheDocument();
  });
});
