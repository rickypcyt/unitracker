import {
  demoAssignments,
  demoNotes,
  demoSessions,
  demoStats,
  demoTasks,
  demoWorkspaces
} from './demoData';
import { useEffect, useState } from 'react';
import { useWorkspace, useWorkspaceActions } from '@/store/appStore';

import { useAuth } from '@/hooks/useAuth';

// Hook para detectar demo mode y proveer datos demo
export default function useDemoMode() {
  const { isLoggedIn } = useAuth();
  const isDemo = !isLoggedIn;
  console.log('useDemoMode - isLoggedIn:', isLoggedIn, 'isDemo:', isDemo);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceActions();
  const { currentWorkspace, workspaces } = useWorkspace();

  // Setup demo workspaces when in demo mode
  useEffect(() => {
    if (isDemo && workspaces.length === 0) {
      // Set demo workspaces
      setWorkspaces(demoWorkspaces);
      // Set first demo workspace as current
      setCurrentWorkspace(demoWorkspaces[0]);
    }
  }, [isDemo, workspaces.length, setWorkspaces, setCurrentWorkspace]);

  // Clear demo workspaces when user logs in
  useEffect(() => {
    if (!isDemo && workspaces.length > 0) {
      // Check if current workspaces are demo workspaces
      const hasDemoWorkspaces = workspaces.some(ws => 
        demoWorkspaces.some(demoWs => demoWs.id === ws.id)
      );
      if (hasDemoWorkspaces) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
      }
    }
  }, [isDemo, workspaces, setWorkspaces, setCurrentWorkspace]);

  // Handler para bloquear acciones y mostrar el modal
  function showLoginPrompt() {
    setLoginPromptOpen(true);
  }
  function closeLoginPrompt() {
    setLoginPromptOpen(false);
  }

  return {
    isDemo,
    demoWorkspaces,
    demoAssignments,
    demoTasks,
    demoNotes,
    demoSessions,
    demoStats,
    loginPromptOpen,
    showLoginPrompt,
    closeLoginPrompt,
  };
} 