import { Check, FolderPlus, ListTodo } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [needsWorkspace, setNeedsWorkspace] = useState(false);
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
    // The product tour already ends with a "create your first task" step — don't stack prompts
    if (!localStorage.getItem('hasSeenTour')) return;
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
      setNeedsWorkspace(workspaces ? workspaces.length === 0 : false);

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
    // If the tour was skipped without creating a task, nudge once afterwards
    const handleTourFinished = (e: Event) => {
      const created = (e as CustomEvent<{ createdTask?: boolean }>).detail?.createdTask;
      if (!created) setTimeout(() => checkShouldShow(), 800);
    };
    window.addEventListener('userModalClosed', handleUserModalClosed);
    window.addEventListener('tourFinished', handleTourFinished);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('userModalClosed', handleUserModalClosed);
      window.removeEventListener('tourFinished', handleTourFinished);
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

  const steps = [
    { icon: FolderPlus, title: t('firstTask.step1'), desc: t('firstTask.step1Desc'), done: !needsWorkspace },
    { icon: ListTodo, title: t('firstTask.step2'), desc: t('firstTask.step2Desc'), done: false },
  ];
  const activeStep = needsWorkspace ? 0 : 1;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleDismiss}
      title={t('firstTask.title')}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t('firstTask.body')}</p>
        <ol className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                i === activeStep
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border-primary)]/30 bg-[var(--bg-secondary)]/30 opacity-70'
              }`}
            >
              <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-[var(--accent-primary)]/15 flex items-center justify-center">
                {step.done ? (
                  <Check className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={3} />
                ) : (
                  <step.icon className="w-4 h-4 text-[var(--accent-primary)]" />
                )}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {i + 1}. {step.title}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{step.desc}</div>
              </div>
            </li>
          ))}
        </ol>
        <button
          className="w-full rounded-xl border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold py-2.5 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 transition-colors"
          onClick={handleCreate}
          autoFocus
        >
          {needsWorkspace ? t('firstTask.startWorkspace') : t('firstTask.startTask')}
        </button>
        <button
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          onClick={handleDismiss}
        >
          {t('firstTask.later')}
        </button>
      </div>
    </BaseModal>
  );
};

export default FirstTaskPrompt;
