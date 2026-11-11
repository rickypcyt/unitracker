import {
  demoStats,
  getDemoAssignments,
  getDemoHabits,
  getDemoNotes,
  getDemoSessions,
  getDemoTasks,
  getDemoWorkspaces
} from './demoData';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspace, useWorkspaceActions } from '@/store/appStore';

import { useAuth } from '@/hooks/auth/useAuth';

// Hook para detectar demo mode y proveer datos demo
export default function useDemoMode() {
  const { i18n } = useTranslation();
  const { isLoggedIn } = useAuth();
  const isDemo = !isLoggedIn;
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceActions();
  const { workspaces, currentWorkspace } = useWorkspace();

  const demoWorkspaces = useMemo(() => getDemoWorkspaces(), [i18n.language]);
  const demoAssignments = useMemo(() => getDemoAssignments(), [i18n.language]);
  const demoTasks = useMemo(() => getDemoTasks(), [i18n.language]);
  const demoHabits = useMemo(() => getDemoHabits(), [i18n.language]);
  const demoNotes = useMemo(() => getDemoNotes(), [i18n.language]);
  const demoSessions = useMemo(() => getDemoSessions(), [i18n.language]);

  // Setup demo workspaces when in demo mode (and re-localize on language change)
  useEffect(() => {
    if (!isDemo) return;
    const allDemo = workspaces.every(ws => ws.id.startsWith('demo-ws-'));
    if (workspaces.length === 0 || allDemo) {
      setWorkspaces(demoWorkspaces);
      if (!currentWorkspace || currentWorkspace.id.startsWith('demo-ws-')) {
        const match = demoWorkspaces.find(ws => ws.id === currentWorkspace?.id) || demoWorkspaces[0];
        setCurrentWorkspace(match);
      }
    }
  }, [isDemo, demoWorkspaces]); // Remove setWorkspaces and setCurrentWorkspace from dependencies

  // Clear demo workspaces when user logs in
  useEffect(() => {
    if (!isDemo && workspaces.length > 0) {
      // Check if current workspaces are demo workspaces
      const hasDemoWorkspaces = workspaces.some(ws => ws.id.startsWith('demo-ws-'));
      if (hasDemoWorkspaces) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
      }
    }
  }, [isDemo, workspaces]); // Remove setWorkspaces and setCurrentWorkspace from dependencies

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
    demoHabits,
    demoNotes,
    demoSessions,
    demoStats,
    loginPromptOpen,
    showLoginPrompt,
    closeLoginPrompt,
  };
}
