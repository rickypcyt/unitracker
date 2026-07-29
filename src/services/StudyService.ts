import { supabase } from '@/utils/supabaseClient';
import type { Lap, UpdateLapInput } from '@/schemas/lap';

export class StudyService {
  static async fetchLaps(): Promise<Lap[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error(userError?.message || 'Usuario no autenticado');

    const { data, error } = await supabase
      .from('study_laps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Lap[];
  }

  static async createLap(lapData: Record<string, any>): Promise<Lap> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('study_laps')
      .insert({ ...lapData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data as Lap;
  }

  static async updateLap(id: string, updates: Partial<UpdateLapInput>): Promise<Lap> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('study_laps')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Lap;
  }

  static async deleteLap(id: string): Promise<void> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error(authError?.message || 'User not authenticated');

    const { data: sessionTasks } = await supabase
      .from('session_tasks')
      .select('task_id')
      .eq('session_id', id);

    const { error: deleteSessionTasksError } = await supabase
      .from('session_tasks')
      .delete()
      .eq('session_id', id);

    if (deleteSessionTasksError) throw deleteSessionTasksError;

    const { error: deleteError } = await supabase
      .from('study_laps')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    if (sessionTasks && sessionTasks.length > 0) {
      const taskIds = sessionTasks.map(st => st.task_id);
      const { error: updateTasksError } = await supabase
        .from('tasks')
        .update({ activetask: false })
        .in('id', taskIds);

      if (updateTasksError) throw updateTasksError;
    }
  }

  static async getSessionsToday(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('study_laps')
      .select('id')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (error) throw error;
    return data?.length ?? 0;
  }

  static async getSessionById(id: string): Promise<Lap | null> {
    const { data, error } = await supabase
      .from('study_laps')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as Lap | null;
  }

  static async getTodaysCompletedSessions(): Promise<Partial<Lap>[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('study_laps')
      .select('id, name, created_at, started_at, ended_at, duration, session_number, description, tasks_completed, pomodoros_completed')
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  static async getUnfinishedSessions(): Promise<Partial<Lap>[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('study_laps')
      .select('id, name, created_at, started_at, duration, session_number')
      .is('ended_at', null)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  static async finishSession(id: string, duration: string, endedAt?: string): Promise<void> {
    const { error } = await supabase
      .from('study_laps')
      .update({
        ended_at: endedAt ?? new Date().toISOString(),
        duration,
      })
      .eq('id', id);

    if (error) throw error;
  }

  static async finishAllUnfinishedSessions(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sessions, error: fetchError } = await supabase
      .from('study_laps')
      .select('id, started_at, duration')
      .is('ended_at', null)
      .eq('user_id', user.id);

    if (fetchError || !sessions?.length) return;

    await Promise.all(sessions.map(s => {
      const payload: Record<string, any> = { ended_at: new Date().toISOString() };
      if (s.duration) {
        payload['duration'] = s.duration;
      } else if (s.started_at) {
        const elapsed = Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000);
        payload['duration'] = `${Math.floor(elapsed / 3600).toString().padStart(2, '0')}:${Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;
      }
      return supabase.from('study_laps').update(payload).eq('id', s.id).eq('user_id', user.id);
    }));
  }

  static async getNextSessionNumber(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 1;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('study_laps')
      .select('session_number')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('session_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return (data?.session_number ?? 0) + 1;
  }
}

export class SessionTaskService {
  static async getTasksForSession(sessionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('session_tasks')
      .select('task_id, completed_at')
      .eq('session_id', sessionId);

    if (error) throw error;
    return data ?? [];
  }

  static async addTaskToSession(sessionId: string, taskId: string): Promise<void> {
    const { error } = await supabase
      .from('session_tasks')
      .insert({
        session_id: sessionId,
        task_id: taskId,
        started_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  static async removeTaskFromSession(sessionId: string, taskId: string): Promise<void> {
    const { error } = await supabase
      .from('session_tasks')
      .delete()
      .eq('session_id', sessionId)
      .eq('task_id', taskId);

    if (error) throw error;
  }

  static async updateTaskCompletion(sessionId: string, taskId: string, completedAt: string | null): Promise<void> {
    const { error } = await supabase
      .from('session_tasks')
      .update({ completed_at: completedAt })
      .eq('session_id', sessionId)
      .eq('task_id', taskId);

    if (error) throw error;
  }
}
