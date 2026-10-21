import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskItem } from './TaskItem';

const mocks = vi.hoisted(() => ({ update: vi.fn(), edit: vi.fn(), remove: vi.fn(), toggle: vi.fn() }));
vi.mock('@/hooks/auth/useAuth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/utils/supabaseClient', () => ({ supabase: {} }));
vi.mock('@/store/appStore', () => ({ useUpdateTaskSuccess: () => mocks.update }));

const task = { id: 'task-1', title: 'Physics exam', completed: false, completed_at: null, status: 'todo' };
const renderTask = (completed = false) => render(<TaskItem task={{ ...task, completed }} onToggleCompletion={mocks.toggle} onEditTask={mocks.edit} onDelete={mocks.remove} onContextMenu={vi.fn()} />);

describe('TaskItem mobile layout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('gives statuses a full-width horizontal row without wrapping labels', () => {
    renderTask();
    const picker = screen.getByRole('group', { name: 'Task status' });
    expect(picker.parentElement).toBe(screen.getByRole('listitem'));
    expect(picker).toHaveClass('col-span-2', 'row-start-2', 'flex', 'flex-nowrap', 'overflow-x-auto');
    for (const label of ['To Do', 'In Progress', 'On Hold', 'Done']) {
      expect(screen.getByRole('button', { name: label })).toHaveClass('whitespace-nowrap', 'shrink-0');
    }
  });

  it('keeps status changes and completion working', () => {
    renderTask();
    expect(screen.getByRole('button', { name: 'To Do' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'In Progress' }));
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ id: task.id, status: 'in_progress', activetask: true, completed: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'completed', completed: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark as complete' }));
    expect(mocks.toggle).toHaveBeenCalledWith(task.id);
  });

  it('keeps edit and delete actions always visible, to the right of the checkbox', () => {
    renderTask();
    const complete = screen.getByRole('button', { name: 'Mark as complete' });
    const edit = screen.getByRole('button', { name: 'Edit task' });
    const del = screen.getByRole('button', { name: 'Delete task' });
    expect(edit.parentElement).toBe(complete.parentElement);
    expect(edit.parentElement).not.toHaveClass('opacity-0', 'sm:opacity-0');
    expect(complete.compareDocumentPosition(edit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(complete.compareDocumentPosition(del) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(edit);
    expect(mocks.edit).toHaveBeenCalledWith(task);
    fireEvent.click(del);
    expect(mocks.remove).toHaveBeenCalledWith(task.id);
  });

  it.each(['2020-01-01', '2099-01-01'])('places the relative deadline for %s in parentheses beside the date', (date) => {
    render(<TaskItem task={{ ...task, deadline: date }} onToggleCompletion={mocks.toggle} onEditTask={mocks.edit} onContextMenu={vi.fn()} />);
    const deadline = screen.getByText(/^\(.+\)$/);
    expect(deadline.previousElementSibling).toHaveClass('truncate');
    expect(deadline.parentElement?.querySelector('svg')).toHaveClass('lucide-clock');
    expect(deadline.parentElement).not.toBe(screen.getByTitle(task.title).parentElement);
    expect(deadline).toHaveClass('whitespace-nowrap');
    expect(deadline).not.toHaveClass('rounded-full');
  });

  it('keeps the checkbox and task actions on the right of the title row', () => {
    renderTask();
    expect(screen.getByRole('button', { name: 'Mark as complete' }).parentElement).toHaveClass('col-start-2', 'row-start-1');
    expect(screen.getByRole('button', { name: 'Edit task' }).parentElement).toHaveClass('col-start-2', 'row-start-1');
    expect(screen.getByRole('button', { name: 'Delete task' }).parentElement).toHaveClass('col-start-2', 'row-start-1');
    expect(screen.getByRole('listitem')).toHaveClass('grid-cols-[minmax(0,1fr)_auto]');
  });

  it('hides the status picker for completed tasks', () => {
    renderTask(true);
    expect(screen.queryByRole('group', { name: 'Task status' })).not.toBeInTheDocument();
  });
});
