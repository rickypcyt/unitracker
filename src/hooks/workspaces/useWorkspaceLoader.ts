import { useEffect, useRef } from 'react';
import { useFetchTasks, useWorkspace, useWorkspaceActions } from '@/store/appStore';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/auth/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { WorkspaceService } from '@/services/WorkspaceService';

export const useWorkspaceLoader = () => {
  const { isLoggedIn } = useAuth();
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceActions();
  const fetchTasks = useFetchTasks();
  const { isDemo } = useDemoMode();
  const hasFetchedTasksRef = useRef(false);

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
        if (savedId === 'all') {
          // "All" is a synthetic workspace, not part of the fetched list
          setCurrentWorkspace({ id: 'all', name: 'All', icon: 'Workflow', isAll: true });
        } else if (found) {
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

  // Fetch tasks for all workspaces only once on mount (not on every workspace change)
  useEffect(() => {
    const fetchAllTasks = async () => {
      if (hasFetchedTasksRef.current) return;
      hasFetchedTasksRef.current = true;

      try {
        await fetchTasks(undefined, true);
      } catch (error) {
        console.error('Error fetching all tasks for workspace counts:', error);
      }
    };

    if (workspaces.length > 0 && !hasFetchedTasksRef.current) {
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
      hasFetchedTasksRef.current = false;
    }
  }, [isLoggedIn, isDemo, setWorkspaces, setCurrentWorkspace]);
};
