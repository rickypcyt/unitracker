import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { storeState, TaskService, mockGetUser } = vi.hoisted(() => {
  const storeState: any = {
    tasks: { tasks: [] as any[], loading: false, error: null, isCached: false, lastFetch: 0 },
    workspace: { currentWorkspace: { id: 'ws-1' } },
  };
  storeState.addTask = (t: any) => { storeState.tasks.tasks.push(t); };
  storeState.updateTask = (id: any, upd: any) => {
    storeState.tasks.tasks = storeState.tasks.tasks.map((t: any) =>
      t.id === id ? { ...t, ...upd } : t
    );
  };
  storeState.deleteTask = (id: any) => {
    storeState.tasks.tasks = storeState.tasks.tasks.filter((t: any) => t.id !== id);
  };
  const TaskService = {
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    toggleComplete: vi.fn(),
    fetchTasks: vi.fn(),
  };
  return { storeState, TaskService, mockGetUser: vi.fn() };
});

vi.mock('@/store/appStore', () => ({
  useAppStore: {
    getState: () => storeState,
    setState: (fn: any) => {
      const partial = typeof fn === 'function' ? fn(storeState) : fn;
      Object.assign(storeState, partial);
    },
  },
}));

vi.mock('@/services/TaskService', () => ({ TaskService }));

vi.mock('@/utils/supabaseClient', () => ({
  supabase: { auth: { getUser: mockGetUser } },
}));

import { addTask, deleteTask, flushOfflineTaskQueue, toggleTaskStatus, updateTaskAction } from './TaskActions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const setOnline = (v: boolean) =>
  Object.defineProperty(window.navigator, 'onLine', { value: v, configurable: true });

const readQueue = () => JSON.parse(localStorage.getItem('taskMutationQueue') || '[]');

const validTask = { title: 'Write essay', assignment: 'English', difficulty: 'medium' };

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  vi.clearAllMocks();
  storeState.tasks.tasks = [];
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  setOnline(false);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('offline task queue', () => {
  it('addTask applies optimistically and enqueues a create when offline', async () => {
    const task = await addTask({ ...validTask });

    expect(task.id).toBeLessThan(0); // negative tempId
    expect(storeState.tasks.tasks).toHaveLength(1);
    expect(TaskService.createTask).not.toHaveBeenCalled();

    const q = readQueue();
    expect(q).toHaveLength(1);
    expect(q[0].type).toBe('create');
    expect(q[0].task.title).toBe('Write essay');
    expect(q[0].userId).toBe('user-1');
  });

  it('updateTaskAction offline merges the update into a pending create', async () => {
    const task = await addTask({ ...validTask });
    await updateTaskAction({ ...task, title: 'New title' });

    const q = readQueue();
    expect(q).toHaveLength(1);
    expect(q[0].type).toBe('create');
    expect(q[0].task.title).toBe('New title');
    expect(storeState.tasks.tasks[0].title).toBe('New title');
  });

  it('deleting an offline-created task cancels the queued create', async () => {
    const task = await addTask({ ...validTask });
    await deleteTask(task.id);

    expect(readQueue()).toHaveLength(0);
    expect(storeState.tasks.tasks).toHaveLength(0);
    expect(TaskService.deleteTask).not.toHaveBeenCalled();
  });

  it('deleteTask offline removes optimistically and enqueues a delete', async () => {
    storeState.tasks.tasks = [{ id: 55, title: 'x' }];
    await deleteTask(55);

    expect(storeState.tasks.tasks).toHaveLength(0);
    const q = readQueue();
    expect(q).toHaveLength(1);
    expect(q[0]).toEqual({ type: 'delete', id: 55 });
  });

  it('toggleTaskStatus offline updates the store and enqueues a toggle', async () => {
    storeState.tasks.tasks = [{ id: 7, completed: false }];
    await toggleTaskStatus(7, true);

    expect(storeState.tasks.tasks[0].completed).toBe(true);
    const q = readQueue();
    expect(q).toHaveLength(1);
    expect(q[0]).toEqual({ type: 'toggle', id: 7, completed: true });
    expect(TaskService.toggleComplete).not.toHaveBeenCalled();
  });

  it('flush replays queued ops, mapping tempIds to real server ids', async () => {
    const task = await addTask({ ...validTask });
    await updateTaskAction({ ...task, title: 'Flushed title' });
    await toggleTaskStatus(task.id, true);

    TaskService.createTask.mockResolvedValue({ id: 101, title: 'Flushed title' });
    TaskService.updateTask.mockResolvedValue({ id: 101, title: 'Flushed title' });
    TaskService.toggleComplete.mockResolvedValue({ id: 101, completed: true });

    await flushOfflineTaskQueue();

    expect(readQueue()).toHaveLength(0);
    // create called once with merged update
    expect(TaskService.createTask).toHaveBeenCalledTimes(1);
    // toggle used the real server id, not the tempId
    expect(TaskService.toggleComplete).toHaveBeenCalledWith(101, true);
    // store holds the real task, temp entry replaced
    expect(storeState.tasks.tasks.some((t: any) => t.id === 101)).toBe(true);
    expect(storeState.tasks.tasks.some((t: any) => t.id < 0)).toBe(false);
  });

  it('flush keeps failed mutations in the queue for the next attempt', async () => {
    storeState.tasks.tasks = [{ id: 9, completed: false }];
    await toggleTaskStatus(9, true);

    TaskService.toggleComplete.mockRejectedValue(new Error('still offline'));
    await flushOfflineTaskQueue();
    expect(readQueue()).toHaveLength(1);

    TaskService.toggleComplete.mockResolvedValue({ id: 9, completed: true });
    await flushOfflineTaskQueue();
    expect(readQueue()).toHaveLength(0);
  });

  it('mutations go straight to the server when online', async () => {
    setOnline(true);
    TaskService.createTask.mockResolvedValue({ id: 200, title: 'Write essay' });

    const task = await addTask({ ...validTask });

    expect(TaskService.createTask).toHaveBeenCalledTimes(1);
    expect(task.id).toBe(200);
    expect(readQueue()).toHaveLength(0);
  });
});
