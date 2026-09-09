import { supabase } from '@/utils/supabaseClient';
import type { Task } from '@/schemas/task';

const TASK_FIELDS = 'id, title, description, completed, completed_at, created_at, updated_at, user_id, assignment, subject_id, difficulty, activetask, deadline, workspace_id, status, recurrence_type, recurrence_weekdays, start_at, end_at';
const TASK_FIELDS_FALLBACK = 'id, title, description, completed, completed_at, created_at, updated_at, user_id, assignment, difficulty, activetask, deadline, workspace_id';

const ALL_WORKSPACE_ID = 'all';

export class TaskService {
  static async fetchTasks(workspaceId?: string): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: sharedRecords, error: sharedWorkspaceError } = await supabase
      .from('shared_workspaces')
      .select('workspace_id, shared_by, received_by, user_id')
      .or(`shared_by.eq.${user.id},received_by.eq.${user.id},user_id.eq.${user.id}`);

    if (sharedWorkspaceError) {
      console.error('fetchTasks: error fetching shared workspaces', sharedWorkspaceError);
    }

    const sharedWorkspaceIds = Array.from(new Set(
      (sharedRecords ?? [])
        .filter(record => {
          const wsId = record.workspace_id;
          if (!wsId) return false;
          const isOwner = record.shared_by === user.id;
          const isRecipient = record.received_by === user.id || record.user_id === user.id;
          return isOwner ? isRecipient : !!wsId;
        })
        .map(record => record.workspace_id)
    ));

    const isAllWorkspace = workspaceId === ALL_WORKSPACE_ID;
    const buildOwnedQuery = (fields: string) => {
      let query = supabase.from('tasks').select(fields).eq('user_id', user.id);
      if (workspaceId && !isAllWorkspace) {
        query = query.eq('workspace_id', workspaceId);
      }
      return query.order('assignment');
    };

    const ownedQueryResult = await buildOwnedQuery(TASK_FIELDS);
    let ownedTasksData = ownedQueryResult.data as Task[] | null;
    let ownedTasksError = ownedQueryResult.error;
    if (ownedTasksError) {
      console.warn('fetchTasks: retrying with legacy task fields', ownedTasksError.message);
      const fallbackResult = await buildOwnedQuery(TASK_FIELDS_FALLBACK);
      ownedTasksData = fallbackResult.data as Task[] | null;
      ownedTasksError = fallbackResult.error;
    }
    if (ownedTasksError) throw ownedTasksError;
    const ownedTasks: Task[] = ownedTasksData ?? [];

    const relevantSharedIds = workspaceId && !isAllWorkspace
      ? sharedWorkspaceIds.filter(id => id === workspaceId)
      : sharedWorkspaceIds;

    let sharedTasks: Task[] = [];
    if (relevantSharedIds.length > 0) {
      const sharedQuery = await supabase
        .from('tasks')
        .select(TASK_FIELDS)
        .in('workspace_id', relevantSharedIds)
        .order('assignment');
      let sharedTasksData = sharedQuery.data as Task[] | null;
      let sharedTasksError = sharedQuery.error;
      if (sharedTasksError) {
        console.warn('fetchTasks: retrying shared tasks with legacy fields', sharedTasksError.message);
        const fallbackQuery = await supabase
          .from('tasks')
          .select(TASK_FIELDS_FALLBACK)
          .in('workspace_id', relevantSharedIds)
          .order('assignment');
        sharedTasksData = fallbackQuery.data as Task[] | null;
        sharedTasksError = fallbackQuery.error;
      }
      if (sharedTasksError) {
        console.error('fetchTasks: error fetching tasks from shared workspaces', sharedTasksError);
      } else {
        sharedTasks = (sharedTasksData ?? []).filter(task => task.user_id !== user.id);
      }
    }

    const taskMap = new Map<string, Task>();
    [...ownedTasks, ...sharedTasks].forEach(task => {
      if (task?.id) taskMap.set(String(task.id), task as Task);
    });

    return Array.from(taskMap.values()).sort((a, b) => {
      const aName = (a?.assignment ?? '').toLowerCase();
      const bName = (b?.assignment ?? '').toLowerCase();
      return aName.localeCompare(bName);
    });
  }

  static async createTask(taskData: Record<string, any>): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...taskData,
        user_id: user.id,
        completed: false,
        activetask: false,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  }

  static async updateTask(id: string, updates: Record<string, any>): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', id)
      .single();
    if (taskError) throw taskError;
    if (!taskData || taskData.user_id !== user.id) {
      throw new Error('No tienes permiso para editar esta tarea');
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0] as Task;
  }

  static async toggleComplete(id: string, completed: boolean): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  }

  static async deleteTask(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  }

  static async setTaskActive(id: string, active: boolean): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({ activetask: active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  }

  static async getCompletedTasksInRange(userId: string, startISO: string, endISO: string): Promise<Partial<Task>[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', startISO)
      .lte('completed_at', endISO);

    if (error) throw error;
    return data ?? [];
  }

  static async batchUpdateTasks(taskIds: string[], updates: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .in('id', taskIds);

    if (error) throw error;
  }
}
