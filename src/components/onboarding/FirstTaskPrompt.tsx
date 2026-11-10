import { ListTodo } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/auth/useAuth';
import BaseModal from '@/modals/shared/BaseModal';
import { useNavigation } from '@/navigation/NavigationContext';
import { WorkspaceService } from '@/services/WorkspaceService';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/utils/supabaseClient';

const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const seenKey = (userId: string) => `firstTaskPromptSeen:${userId}`;

const FirstTaskPrompt: React.FC = () => {
  const { user, isLoggedIn, isAuthLoading } = useAuth();
  const { navigateTo } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const checkingRef = useRef(false);
  const hasWorkspacesRef = useRef<boolean | null>(null);

  const markSeen = useCallback(() => {
    if (user?.id) {
      localStorage.setItem(seenKey(user.id), String(Date.now()));
    }
  }, [user?.id]);

  const checkShouldShow = useCallback(async () => {
    if (!user?.id || checkingRef.current) return;
    const seenAt = Number(localStorage.getItem(seenKey(user.id)) || 0);
    if (seenAt && Date.now() - seenAt < REMIND_AFTER_MS) return;

    checkingRef.current = true;
    try {
      // Don't overlap with the username onboarding modal (UserModalGate)
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (!profile?.username) return;

      const workspaces = await WorkspaceService.fetchWorkspaces(user.id).catch(() => null);
      hasWorkspacesRef.current = workspaces ? workspaces.length > 0 : null;

      const { count, error } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error || (count ?? 0) > 0) return;

      setIsOpen(true);
    } finally {
      checkingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoggedIn || isAuthLoading) return;
    const timer = setTimeout(() => {
      checkShouldShow();
    }, 1500);
    const handleUserModalClosed = () => {
      setTimeout(() => {
        checkShouldShow();
      }, 400);
    };
    window.addEventListener('userModalClosed', handleUserModalClosed);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('userModalClosed', handleUserModalClosed);
    };
  }, [isLoggedIn, isAuthLoading, checkShouldShow]);

  const handleDismiss = () => {
    markSeen();
    setIsOpen(false);
  };

  const handleCreate = () => {
    markSeen();
    setIsOpen(false);
    navigateTo('tasks');

    // Wait until the workspace list is hydrated so TasksPage's guard opens
    // the task form instead of the workspace-creation modal.
    const dispatchQuickAdd = (attempts: number) => {
      const storeReady =
        hasWorkspacesRef.current !== true ||
        useAppStore.getState().workspace.workspaces.length > 0;
      if (storeReady || attempts <= 0) {
        window.dispatchEvent(new Event('quickAddTask'));
      } else {
        setTimeout(() => dispatchQuickAdd(attempts - 1), 250);
      }
    };
    setTimeout(() => dispatchQuickAdd(10), 300);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleDismiss}
      title="Create your first task"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="rounded-2xl bg-[var(--accent-primary)]/10 p-4">
          <ListTodo className="w-10 h-10 text-[var(--accent-primary)]" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Tasks are the heart of UniTracker — study sessions, stats and planning
          all revolve around them. Let's set up your first one.
        </p>
        <button
          className="w-full rounded-xl border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold py-2.5 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 transition-colors"
          onClick={handleCreate}
        >
          Create task
        </button>
        <button
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          onClick={handleDismiss}
        >
          Maybe later
        </button>
      </div>
    </BaseModal>
  );
};

export default FirstTaskPrompt;
