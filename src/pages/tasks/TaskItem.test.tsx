import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskItem } from './TaskItem';

const mocks = vi.hoisted(() => ({ update: vi.fn(), edit: vi.fn(), remove: vi.fn(), toggle: vi.fn() }));
vi.mock('@/hooks/auth/useAuth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/utils/supabaseClient', () => ({ supabase: {} }));
vi.mock('@/store/appStore', () => ({ useUpdateTaskSuccess: () => mocks.update }));

const task = { id: 'task-1', title: 'Physics exam', completed: false, completed_at: null, status: 'todo' };
const renderTask = (completed = false) => render(<TaskItem task={{ ...task, completed }} onToggleCompletion={mocks.toggle} onEditTask={mocks.edit} onDelete={mocks.remove} onContextMenu={vi.fn()} />);

describe('TaskItem layout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a single status pill that cycles to the next status', () => {
    renderTask();
    const pill = screen.getByRole('button', { name: /^Status: To Do/ });
    fireEvent.click(pill);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ id: task.id, status: 'in_progress', activetask: true, completed: false }));
  });

  it('keeps completion, edit and delete working', () => {
    renderTask();
    fireEvent.click(screen.getByRole('button', { name: 'Mark as complete' }));
    expect(mocks.toggle).toHaveBeenCalledWith(task.id);
    fireEvent.click(screen.getByRole('button', { name: 'Edit task' }));
    expect(mocks.edit).toHaveBeenCalledWith(task);
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }));
    expect(mocks.remove).toHaveBeenCalledWith(task.id);
  });

  it('puts the checkbox on the left and keeps edit/delete visible beside the title', () => {
    renderTask();
    const complete = screen.getByRole('button', { name: 'Mark as complete' });
    const edit = screen.getByRole('button', { name: 'Edit task' });
    const del = screen.getByRole('button', { name: 'Delete task' });
    expect(complete.parentElement).toHaveClass('col-start-1', 'row-start-1');
    expect(edit.parentElement).toBe(del.parentElement);
    expect(edit.parentElement).not.toHaveClass('opacity-0');
    expect(complete.compareDocumentPosition(edit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('listitem')).toHaveClass('grid-cols-[auto_minmax(0,1fr)]');
  });

  it.each(['2020-01-01', '2099-01-01'])('shows the deadline chip with relative time for %s', (date) => {
    render(<TaskItem task={{ ...task, deadline: date }} onToggleCompletion={mocks.toggle} onEditTask={mocks.edit} onContextMenu={vi.fn()} />);
    const relative = screen.getByText(/^· .+/);
    expect(relative.previousElementSibling).toHaveClass('truncate');
    expect(relative.parentElement).toHaveClass('whitespace-nowrap');
  });

  it('hides the status pill for completed tasks', () => {
    renderTask(true);
    expect(screen.queryByRole('button', { name: /^Status:/ })).not.toBeInTheDocument();
  });
});
