import { useEffect } from 'react';
import { useFetchTasks, useWorkspace, useWorkspaceActions } from '@/store/appStore';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { WorkspaceService } from '@/services/WorkspaceService';

export const useWorkspaceLoader = () => {
  const { isLoggedIn } = useAuth();
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceActions();
  const fetchTasks = useFetchTasks();
  const { isDemo } = useDemoMode();

  // Load workspaces from Supabase on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('useWorkspaceLoader: Error getting user:', userError);
      }

      if (!user) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
        localStorage.removeItem('activeWorkspaceId');
        localStorage.removeItem('workspacesHydrated');
        return;
      }

      const data = await WorkspaceService.fetchWorkspaces(user.id);
      setWorkspaces(data);
      const savedId = localStorage.getItem('activeWorkspaceId');
      const isStale = activeWorkspace && !data.some((ws: any) => ws.id === activeWorkspace.id);
      if (savedId) {
        const found = data.find((ws: any) => ws.id === savedId);
        if (found) {
          setCurrentWorkspace(found);
        } else if (data.length > 0) {
          setCurrentWorkspace(data[0]!);
          localStorage.setItem('activeWorkspaceId', data[0]!.id);
        }
      } else if (data.length > 0 && (!activeWorkspace || isStale)) {
        setCurrentWorkspace(data[0]!);
        localStorage.setItem('activeWorkspaceId', data[0]!.id);
      }
    };
    fetchWorkspaces();
  }, [setWorkspaces, setCurrentWorkspace, isLoggedIn]);

  // Fetch tasks for all workspaces to get accurate counts
  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        await fetchTasks(undefined, true);
      } catch (error) {
        console.error('Error fetching all tasks for workspace counts:', error);
      }
    };

    if (workspaces.length > 0) {
      void fetchAllTasks();
    }
  }, [workspaces.length, fetchTasks]);

  // Clear workspaces if not logged in (but not in demo mode)
  useEffect(() => {
    if (!isLoggedIn && !isDemo) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      localStorage.removeItem('activeWorkspaceId');
      localStorage.removeItem('workspacesHydrated');
    }
  }, [isLoggedIn, isDemo, setWorkspaces, setCurrentWorkspace]);
};
