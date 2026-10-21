import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FloatingFooter from './FloatingFooter';

const mocks = vi.hoisted(() => ({ navigateTo: vi.fn(), fetchTasks: vi.fn(), isLoggedIn: true }));
vi.mock('@/navbar/NavigationContext', () => ({ useNavigation: () => ({ navigateTo: mocks.navigateTo }) }));
vi.mock('@/hooks/useTheme', () => ({ default: () => ({ currentTheme: 'dark', toggleTheme: vi.fn() }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isLoggedIn: mocks.isLoggedIn }) }));
vi.mock('@/store/appStore', () => ({
  useStudyState: () => ({ isRunning: false, time: 0 }),
  useFetchTasks: () => mocks.fetchTasks,
  useAppStore: { getState: () => ({}) },
}));
vi.mock('@/services/TaskService', () => ({ TaskService: {} }));
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
vi.mock('@/modals/WorkspaceModal', () => ({ default: () => null }));
vi.mock('@/pages/tasks/TaskFormManager', () => ({ default: () => <div role="dialog">New task form</div> }));
vi.mock('@/modals/LoginPromptModal', () => ({ default: () => <div role="dialog">Login required</div> }));
vi.mock('@/modals/DeleteTasksPop', () => ({ default: () => null }));

describe('FloatingFooter quick add', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.isLoggedIn = true; });

  it('opens the task creation modal without navigating', () => {
    render(<FloatingFooter />);
    fireEvent.click(screen.getByRole('button', { name: 'Quick add task' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('New task form');
    expect(mocks.navigateTo).not.toHaveBeenCalled();
  });

  it('prompts demo users to log in without navigating', () => {
    mocks.isLoggedIn = false;
    render(<FloatingFooter />);
    fireEvent.click(screen.getByRole('button', { name: 'Quick add task' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Login required');
    expect(mocks.navigateTo).not.toHaveBeenCalled();
  });
});
