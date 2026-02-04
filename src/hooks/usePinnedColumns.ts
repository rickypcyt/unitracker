import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

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

      // Check if record exists
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

      // Process operations in batches
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
