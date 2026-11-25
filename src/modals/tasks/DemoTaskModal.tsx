import { Cloud, Database, LogIn, Rocket, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/auth/useAuth';
import BaseModal from '@/modals/shared/BaseModal';
import { addDemoUserTask } from '@/utils/demoExplore';
import { getDemoAssignments } from '@/utils/demoData';

interface DemoTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

const DemoTaskModal: React.FC<DemoTaskModalProps> = ({ isOpen, onClose, workspaceId }) => {
  const { t } = useTranslation();
  const { loginWithGoogle, prepareGoogleLogin } = useAuth();
  const [phase, setPhase] = useState<'form' | 'signin'>('form');
  const [title, setTitle] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhase('form');
      setTitle('');
      setIsLoggingIn(false);
      prepareGoogleLogin?.();
    }
  }, [isOpen]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    const assignment =
      getDemoAssignments().find((a) => a.workspace_id === workspaceId)?.id ?? 'demo-assignment-a';
    addDemoUserTask({ title: clean, workspace_id: workspaceId, assignment });
    setPhase('signin');
  };

  const handleGoogle = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const ok = await loginWithGoogle();
    if (!ok) setIsLoggingIn(false);
  };

  const benefits = [
    { icon: Cloud, label: t('auth.login.cloudTitle') },
    { icon: Database, label: t('auth.login.secureTitle') },
    { icon: Users, label: t('auth.login.crossTitle') },
    { icon: Rocket, label: t('auth.login.realtimeTitle') },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={phase === 'form' ? t('demoTask.title') : t('demoTask.doneTitle')}
      maxWidth="max-w-md"
    >
      {phase === 'form' ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-4 py-2">
          <p className="text-sm text-(--text-secondary)">{t('demoTask.subtitle')}</p>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder={t('demoTask.placeholder')}
            className="w-full rounded-xl border-2 border-(--border-primary) bg-(--bg-secondary)/40 px-4 py-2.5 text-(--text-primary) outline-none focus:border-(--accent-primary)"
          />
          <p className="text-xs text-(--text-secondary)">{t('demoTask.temp')}</p>
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full rounded-xl border-2 border-(--accent-primary) text-(--accent-primary) font-bold py-2.5 bg-(--accent-primary)/10 hover:bg-(--accent-primary)/20 disabled:opacity-50 transition-colors"
          >
            {t('demoTask.create')}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm text-(--text-secondary) leading-relaxed">{t('demoTask.doneBody')}</p>
          <ul className="grid grid-cols-2 gap-2">
            {benefits.map((b) => (
              <li
                key={b.label}
                className="flex items-center gap-2 rounded-xl border-2 border-(--border-primary)/30 bg-(--bg-secondary)/30 p-3 text-sm font-medium text-(--text-primary)"
              >
                <b.icon className="w-4 h-4 shrink-0 text-(--accent-primary)" />
                {b.label}
              </li>
            ))}
          </ul>
          <button
            onClick={handleGoogle}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold py-2.5 disabled:opacity-60 transition-opacity border-2 border-(--accent-primary) text-(--accent-primary) hover:bg-(--accent-primary)/10"
          >
            <LogIn size={18} />
            {isLoggingIn ? t('auth.login.redirecting') : t('auth.login.signInGoogle')}
          </button>
          <button
            onClick={onClose}
            className="text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors"
          >
            {t('demoTask.keepExploring')}
          </button>
        </div>
      )}
    </BaseModal>
  );
};

export default DemoTaskModal;
