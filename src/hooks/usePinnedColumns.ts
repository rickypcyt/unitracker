import { useEffect, useState } from 'react';

import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

// Constant for the "All" workspace
const ALL_WORKSPACE_ID = 'all';

export interface PinnedColumn {
  id: number;
  user_id: string;
  workspace_id: string;
  assignment: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export const usePinnedColumns = (workspaceId: string | null) => {
  const { user } = useAuth();
  const [pinnedColumns, setPinnedColumns] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pinned columns for current workspace
  const fetchPinnedColumns = async () => {
    if (!user || !workspaceId) {
      setPinnedColumns({});
      setLoading(false);
      return;
    }

    // For "All" workspace, fetch all pinned columns across all workspaces
    if (workspaceId === ALL_WORKSPACE_ID) {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('pinned_columns')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        // For "All" workspace, show an assignment as pinned if it's pinned in ANY workspace
        const pinsRecord: Record<string, boolean> = {};
        data?.forEach((pin: PinnedColumn) => {
          // If assignment is pinned in any workspace, mark it as pinned
          if (pin.is_pinned) {
            pinsRecord[pin.assignment] = true;
          }
        });

        setPinnedColumns(pinsRecord);
      } catch (err) {
        console.error('Error fetching pinned columns for "All" workspace:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pinned columns');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('pinned_columns')
        .select('*')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // Convert to Record<string, boolean> format
      const pinsRecord: Record<string, boolean> = {};
      data?.forEach((pin: PinnedColumn) => {
        pinsRecord[pin.assignment] = pin.is_pinned;
      });

      setPinnedColumns(pinsRecord);
    } catch (err) {
      console.error('Error fetching pinned columns:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pinned columns');
    } finally {
      setLoading(false);
    }
  };

  // Toggle pin status for an assignment
  const togglePin = async (assignment: string) => {
    if (!user || !workspaceId) return;

    try {
      setError(null);
      const currentPinState = pinnedColumns[assignment] ?? false;
      const newPinState = !currentPinState;

      // For "All" workspace, toggle pin in ALL workspaces where this assignment exists
      if (workspaceId === ALL_WORKSPACE_ID) {
        // First, get all tasks to find which workspaces contain this assignment
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('workspace_id')
          .eq('user_id', user.id)
          .eq('assignment', assignment)
          .not('workspace_id', 'is', null);

        if (tasksError) throw tasksError;

        // Get unique workspace IDs
        const workspaceIds = [...new Set(tasks?.map(t => t.workspace_id))];

        // Update pin status in each workspace
        for (const wsId of workspaceIds) {
          // Check if record exists for this workspace
          const { data: existingRecord } = await supabase
            .from('pinned_columns')
            .select('*')
            .eq('user_id', user.id)
            .eq('workspace_id', wsId)
            .eq('assignment', assignment)
            .single();

          if (existingRecord) {
            // Update existing record
            await supabase
              .from('pinned_columns')
              .update({ 
                is_pinned: newPinState,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingRecord.id);
          } else {
            // Insert new record
            await supabase
              .from('pinned_columns')
              .insert({
                user_id: user.id,
                workspace_id: wsId,
                assignment: assignment,
                is_pinned: newPinState
              });
          }
        }
      } else {
        // Normal workspace - toggle pin only in this workspace
        const { data: existingRecord } = await supabase
          .from('pinned_columns')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', workspaceId)
          .eq('assignment', assignment)
          .single();

        if (existingRecord) {
          // Update existing record
          const { error } = await supabase
            .from('pinned_columns')
            .update({ 
              is_pinned: newPinState,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRecord.id);

          if (error) throw error;
        } else {
          // Insert new record
          const { error } = await supabase
            .from('pinned_columns')
            .insert({
              user_id: user.id,
              workspace_id: workspaceId,
              assignment: assignment,
              is_pinned: newPinState
            });

          if (error) throw error;
        }
      }

      // Update local state
      setPinnedColumns(prev => ({
        ...prev,
        [assignment]: newPinState
      }));
    } catch (err) {
      console.error('Error toggling pin:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle pin');
    }
  };

  // Check if an assignment is pinned
  const isPinned = (assignment: string): boolean => {
    return pinnedColumns[assignment] ?? false;
  };

  // Set multiple pins at once
  const setPins = async (pins: Record<string, boolean>) => {
    if (!user || !workspaceId) return;

    try {
      setError(null);
      const operations = [];

      for (const [assignment, isPinned] of Object.entries(pins)) {
        const currentPinState = pinnedColumns[assignment] ?? false;
        
        if (currentPinState !== isPinned) {
          operations.push({ assignment, isPinned });
        }
      }

      if (operations.length === 0) return;

      // For "All" workspace, update pins in all relevant workspaces
      if (workspaceId === ALL_WORKSPACE_ID) {
        for (const operation of operations) {
          // Get all workspaces that contain this assignment
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('workspace_id')
            .eq('user_id', user.id)
            .eq('assignment', operation.assignment)
            .not('workspace_id', 'is', null);

          if (tasksError) throw tasksError;

          const workspaceIds = [...new Set(tasks?.map(t => t.workspace_id))];

          // Update in each workspace
          for (const wsId of workspaceIds) {
            const { data: existingRecord } = await supabase
              .from('pinned_columns')
              .select('*')
              .eq('user_id', user.id)
              .eq('workspace_id', wsId)
              .eq('assignment', operation.assignment)
              .single();

            if (existingRecord) {
              await supabase
                .from('pinned_columns')
                .update({ 
                  is_pinned: operation.isPinned,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingRecord.id);
            } else {
              await supabase
                .from('pinned_columns')
                .insert({
                  user_id: user.id,
                  workspace_id: wsId,
                  assignment: operation.assignment,
                  is_pinned: operation.isPinned
                });
            }
          }
        }
      } else {
        // Normal workspace - process operations in batches
        for (const operation of operations) {
          const { data: existingRecord } = await supabase
            .from('pinned_columns')
            .select('*')
            .eq('user_id', user.id)
            .eq('workspace_id', workspaceId)
            .eq('assignment', operation.assignment)
            .single();

          if (existingRecord) {
            await supabase
              .from('pinned_columns')
              .update({ 
                is_pinned: operation.isPinned,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingRecord.id);
          } else {
            await supabase
              .from('pinned_columns')
              .insert({
                user_id: user.id,
                workspace_id: workspaceId,
                assignment: operation.assignment,
                is_pinned: operation.isPinned
              });
          }
        }
      }

      // Update local state
      setPinnedColumns(prev => ({ ...prev, ...pins }));
    } catch (err) {
      console.error('Error setting pins:', err);
      setError(err instanceof Error ? err.message : 'Failed to set pins');
    }
  };

  // Clear all pins for current workspace
  const clearPins = async () => {
    if (!user || !workspaceId) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('pinned_columns')
        .delete()
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      setPinnedColumns({});
    } catch (err) {
      console.error('Error clearing pins:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear pins');
    }
  };

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchPinnedColumns();
  }, [user, workspaceId]);

  return {
    pinnedColumns,
    loading,
    error,
    togglePin,
    isPinned,
    setPins,
    clearPins,
    refetch: fetchPinnedColumns
  };
};
