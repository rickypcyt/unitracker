import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '@/store/appStore';
import type { Task } from '@/types/taskStorage';
import type { Workspace } from '@/types/workspace';
import type { Lap } from '@/types/lap';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useAppStore.setState({
      tasks: {
        tasks: [],
        loading: false,
        error: null,
        isCached: false,
        lastFetch: null,
      },
      laps: {
        laps: [],
        loading: false,
        error: null,
        isCached: false,
        lastFetch: null,
      },
      workspace: {
        currentWorkspace: null,
        workspaces: [],
        loading: false,
      },
    });
  });

  describe('Task actions', () => {
    const mockTask: Task = {
      id: 'task-1',
      title: 'Test Task',
      completed: false,
      completed_at: null,
      assignment: 'Math',
      difficulty: 'easy',
    };

    it('should set tasks', () => {
      useAppStore.getState().setTasks([mockTask]);
      const { tasks } = useAppStore.getState().tasks;
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Test Task');
    });

    it('should add a task', () => {
      useAppStore.getState().addTask(mockTask);
      const { tasks } = useAppStore.getState().tasks;
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('task-1');
    });

    it('should update a task', () => {
      useAppStore.getState().addTask(mockTask);
      useAppStore.getState().updateTask('task-1', { title: 'Updated Task' });
      const { tasks } = useAppStore.getState().tasks;
      expect(tasks[0].title).toBe('Updated Task');
    });

    it('should delete a task', () => {
      useAppStore.getState().addTask(mockTask);
      useAppStore.getState().deleteTask('task-1');
      const { tasks } = useAppStore.getState().tasks;
      expect(tasks).toHaveLength(0);
    });

    it('should set loading state', () => {
      useAppStore.getState().setTasksLoading(true);
      expect(useAppStore.getState().tasks.loading).toBe(true);
    });

    it('should set error state', () => {
      useAppStore.getState().setTasksError('Something went wrong');
      expect(useAppStore.getState().tasks.error).toBe('Something went wrong');
    });

    it('should set cached state', () => {
      useAppStore.getState().setTasksCached(true);
      expect(useAppStore.getState().tasks.isCached).toBe(true);
    });
  });

  describe('Lap actions', () => {
    const mockLap: Lap = {
      id: 'lap-1',
      user_id: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
      duration: '01:00:00',
      session_number: 1,
      name: 'Study Session',
      tasks_completed: 0,
    };

    it('should set laps', () => {
      useAppStore.getState().setLaps([mockLap]);
      const { laps } = useAppStore.getState().laps;
      expect(laps).toHaveLength(1);
      expect(laps[0].name).toBe('Study Session');
    });

    it('should add a lap', () => {
      useAppStore.getState().addLap(mockLap);
      const { laps } = useAppStore.getState().laps;
      expect(laps).toHaveLength(1);
      expect(laps[0].id).toBe('lap-1');
    });

    it('should update a lap', () => {
      useAppStore.getState().addLap(mockLap);
      useAppStore.getState().updateLap('lap-1', { name: 'Updated Session' });
      const { laps } = useAppStore.getState().laps;
      expect(laps[0].name).toBe('Updated Session');
    });

    it('should delete a lap', () => {
      useAppStore.getState().addLap(mockLap);
      useAppStore.getState().deleteLap('lap-1');
      const { laps } = useAppStore.getState().laps;
      expect(laps).toHaveLength(0);
    });
  });

  describe('Workspace actions', () => {
    const mockWorkspace: Workspace = {
      id: 'ws-1',
      name: 'My Workspace',
      icon: 'Briefcase',
    };

    it('should set current workspace', () => {
      useAppStore.getState().setCurrentWorkspace(mockWorkspace);
      expect(useAppStore.getState().workspace.currentWorkspace?.id).toBe('ws-1');
    });

    it('should set workspaces list', () => {
      useAppStore.getState().setWorkspaces([mockWorkspace]);
      expect(useAppStore.getState().workspace.workspaces).toHaveLength(1);
    });

    it('should clear current workspace', () => {
      useAppStore.getState().setCurrentWorkspace(mockWorkspace);
      useAppStore.getState().setCurrentWorkspace(null);
      expect(useAppStore.getState().workspace.currentWorkspace).toBeNull();
    });
  });

  describe('Pomodoro state', () => {
    it('should update pomodoro state', () => {
      useAppStore.getState().updatePomodoroState({ timeLeft: 100 });
      expect(useAppStore.getState().pomodoroState.timeLeft).toBe(100);
    });

    it('should increment pomodoros this session', () => {
      const initial = useAppStore.getState().pomodorosThisSession;
      useAppStore.getState().incrementPomodorosThisSession();
      expect(useAppStore.getState().pomodorosThisSession).toBe(initial + 1);
    });

    it('should reset pomodoros this session', () => {
      useAppStore.getState().incrementPomodorosThisSession();
      useAppStore.getState().resetPomodorosThisSession();
      expect(useAppStore.getState().pomodorosThisSession).toBe(0);
    });
  });

  describe('Pomodoro settings', () => {
    it('should update pomodoro settings partially', () => {
      useAppStore.getState().updatePomodoroSettings({ dailyGoal: 12 });
      expect(useAppStore.getState().pomodoroSettings.dailyGoal).toBe(12);
      // Other settings should remain unchanged
      expect(useAppStore.getState().pomodoroSettings.volume).toBe(0.7);
    });
  });
});
