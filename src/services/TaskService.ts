import { supabase } from '@/utils/supabaseClient';
import type { Task } from '@/schemas/task';

const TASK_FIELDS = 'id, title, description, completed, completed_at, created_at, updated_at, user_id, assignment, subject_id, difficulty, activetask, deadline, workspace_id, status, recurrence_type, recurrence_weekdays, start_at, end_at';

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
    let ownedQuery = supabase.from('tasks').select(TASK_FIELDS).eq('user_id', user.id);
    if (workspaceId && !isAllWorkspace) {
      ownedQuery = ownedQuery.eq('workspace_id', workspaceId);
    }
    ownedQuery = ownedQuery.order('assignment');
    const { data: ownedTasksData, error: ownedTasksError } = await ownedQuery;
    if (ownedTasksError) throw ownedTasksError;
    const ownedTasks = ownedTasksData ?? [];

    const relevantSharedIds = workspaceId && !isAllWorkspace
      ? sharedWorkspaceIds.filter(id => id === workspaceId)
      : sharedWorkspaceIds;

    let sharedTasks: Task[] = [];
    if (relevantSharedIds.length > 0) {
      const { data: sharedTasksData, error: sharedTasksError } = await supabase
        .from('tasks')
        .select(TASK_FIELDS)
        .in('workspace_id', relevantSharedIds)
        .order('assignment');
      if (sharedTasksError) {
        console.error('fetchTasks: error fetching tasks from shared workspaces', sharedTasksError);
      } else {
        sharedTasks = (sharedTasksData ?? []).filter(task => task.user_id !== user.id) as Task[];
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
