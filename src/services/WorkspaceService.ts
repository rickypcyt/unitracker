import { supabase } from '@/utils/supabaseClient';
import type { Workspace, CreateWorkspaceInput } from '@/schemas/workspace';

export class WorkspaceService {
  static async fetchWorkspaces(userId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Workspace[];
  }

  static async createWorkspace(input: CreateWorkspaceInput & { user_id: string }): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data as Workspace;
  }

  static async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Workspace;
  }

  static async deleteWorkspace(id: string): Promise<void> {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) throw error;
  }
}

export class SharedWorkspaceService {
  static async fetchSharedWorkspaces(userId: string) {
    const { error: updateError } = await supabase
      .from('shared_workspaces')
      .update({ user_id: userId })
      .is('user_id', null)
      .eq('received_by', userId);

    if (updateError) throw updateError;

    const { data, error } = await supabase
      .from('shared_workspaces')
      .select('id, workspace_id, shared_by, received_by, user_id, created_at, workspace_name, workspace_icon')
      .or(`shared_by.eq.${userId},received_by.eq.${userId},user_id.eq.${userId}`);

    if (error) throw error;
    return data ?? [];
  }

  static async shareWorkspace(workspaceId: string, sharedBy: string, receivedBy: string, workspaceName?: string, workspaceIcon?: string): Promise<void> {
    const { error } = await supabase
      .from('shared_workspaces')
      .insert([{
        workspace_id: workspaceId,
        shared_by: sharedBy,
        received_by: receivedBy,
        user_id: receivedBy,
        workspace_name: workspaceName || 'Shared workspace',
        workspace_icon: workspaceIcon || 'Briefcase'
      }]);

    if (error) throw error;
  }

  static async unshareWorkspace(shareId: string): Promise<void> {
    const { error } = await supabase.from('shared_workspaces').delete().eq('id', shareId);
    if (error) throw error;
  }

  static async cleanupSharedWorkspaces(filter: string): Promise<void> {
    const { error } = await supabase.from('shared_workspaces').delete().or(filter);
    if (error) throw error;
  }
}
