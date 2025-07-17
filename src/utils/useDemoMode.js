import {
  demoAssignments,
  demoNotes,
  demoSessions,
  demoStats,
  demoTasks,
  demoWorkspaces
} from './demoData';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

// Hook para detectar demo mode y proveer datos demo
export default function useDemoMode() {
  const { isLoggedIn } = useAuth();
  const isDemo = !isLoggedIn;
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

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