import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MonthView, { getDayTasks } from './MonthView';
import type { Task } from '../../schemas/task';

const mocks = vi.hoisted(() => ({ tasks: [] as Task[], currentWorkspace: null as { id: string } | null }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isLoggedIn: true }) }));
vi.mock('@/store/appStore', () => ({ useTasks: () => ({ tasks: mocks.tasks }), useWorkspace: () => ({ currentWorkspace: mocks.currentWorkspace }) }));
vi.mock('./DayTasksPopover', () => ({ default: ({ day, tasks }: { day: Date | null; tasks: Task[] }) => day ? <div role="dialog">{tasks.map(task => <span key={task.id}>{task.title}</span>)}</div> : null }));

describe('MonthView', () => {
  beforeEach(() => {
    mocks.currentWorkspace = null;
    mocks.tasks = [{ id: 'exam', title: 'Physics exam', completed: false, completed_at: null, deadline: '2026-10-21' }];
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 21, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('shows the current month and marks today', () => {
    const { container } = render(<MonthView />);
    expect(screen.getByText('October 2026')).toBeInTheDocument();
    expect(screen.getByLabelText('Wednesday, October 21, 2026')).toHaveAttribute('aria-current', 'date');
    expect(container.querySelectorAll('time')).toHaveLength(42);
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-09-28');
  });

  it('opens day tasks on hover, closes with Escape and supports touch clicks', () => {
    render(<MonthView />);
    const day = screen.getByRole('button', { name: 'Wednesday, October 21, 2026' });
    fireEvent.mouseEnter(day);
    expect(screen.getByRole('dialog')).toHaveTextContent('Physics exam');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(day);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('only includes tasks from the active workspace in the day popover', () => {
    mocks.currentWorkspace = { id: 'ws-1' };
    mocks.tasks = [
      { ...mocks.tasks[0]!, workspace_id: 'ws-1' },
      { ...mocks.tasks[0]!, id: 'other', title: 'Other workspace exam', workspace_id: 'ws-2' },
    ];
    render(<MonthView />);
    fireEvent.click(screen.getByRole('button', { name: 'Wednesday, October 21, 2026' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Physics exam');
    expect(screen.queryByText('Other workspace exam')).not.toBeInTheDocument();
  });

  it('matches the local calendar date, including completed tasks and due_date fallback', () => {
    expect(getDayTasks([
      ...mocks.tasks,
      { id: 'done', title: 'Done task', completed: true, completed_at: null, due_date: '2026-10-21T18:00:00' },
      { id: 'other', title: 'Other day', completed: false, completed_at: null, deadline: '2026-10-22' },
    ], new Date(2026, 9, 21)).map(task => task.id)).toEqual(['exam', 'done']);
  });

  it('navigates months and returns to the current month', () => {
    render(<MonthView />);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('November 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('September 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByText('October 2026')).toBeInTheDocument();
  });
});
