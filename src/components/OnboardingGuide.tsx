import { CheckCircle2, ClipboardList, FolderPlus, PlayCircle, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/navbar/NavigationContext';
import { useLaps, useTasksOnly, useWorkspace } from '@/store/appStore';

type OnboardingStep = 'workspace' | 'task' | 'session' | 'done';

interface StepConfig {
  id: OnboardingStep;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  ctaLabel: string;
  page: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'workspace',
    icon: FolderPlus,
    title: 'Create your first workspace',
    description: 'Workspaces help you organize tasks by subject, project, or category. Create one to get started.',
    ctaLabel: 'Go to Tasks',
    page: 'tasks',
  },
  {
    id: 'task',
    icon: ClipboardList,
    title: 'Add your first task',
    description: 'Click the + button on the Tasks page to create a task. Add a title, assignment, difficulty, and deadline.',
    ctaLabel: 'Go to Tasks',
    page: 'tasks',
  },
  {
    id: 'session',
    icon: PlayCircle,
    title: 'Start a study session',
    description: 'Head to the Session page and start a timed study session. Track your focus time and completed pomodoros.',
    ctaLabel: 'Go to Session',
    page: 'session',
  },
];

const OnboardingGuide: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const { navigateTo } = useNavigation();
  const { workspaces } = useWorkspace();
  const tasks = useTasksOnly();
  const { laps } = useLaps();

  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setVisible(false);
      return;
    }

    const stored = localStorage.getItem('onboardingDismissed');
    if (stored === 'true') {
      setVisible(false);
      return;
    }

    // Show onboarding if user has no workspaces, no tasks, or no sessions
    const hasWorkspaces = workspaces && workspaces.length > 0;
    const hasTasks = tasks && tasks.length > 0;
    const hasLaps = laps && laps.length > 0;

    if (!hasWorkspaces || !hasTasks || !hasLaps) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isLoggedIn, workspaces, tasks, laps]);

  const currentStep: OnboardingStep = (() => {
    if (!workspaces || workspaces.length === 0) return 'workspace';
    if (!tasks || tasks.length === 0) return 'task';
    if (!laps || laps.length === 0) return 'session';
    return 'done';
  })();

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    localStorage.setItem('onboardingDismissed', 'true');
  };

  const handleCTA = () => {
    const step = STEPS.find(s => s.id === currentStep);
    if (step) {
      navigateTo(step.page as any);
    }
  };

  if (!visible || dismissed || currentStep === 'done') return null;

  const stepConfig = STEPS.find(s => s.id === currentStep);
  if (!stepConfig) return null;

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const Icon = stepConfig.icon;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md">
      <div className="bg-[var(--bg-secondary)] border border-[var(--accent-primary)] rounded-2xl shadow-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 flex items-center justify-center">
            <Icon size={20} className="text-[var(--accent-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
              {stepConfig.title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
              {stepConfig.description}
            </p>

            {/* Step indicators */}
            <div className="flex items-center gap-1.5 mb-3">
              {STEPS.map((step, idx) => {
                const isComplete = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isComplete
                        ? 'bg-[var(--accent-primary)] w-6'
                        : isCurrent
                        ? 'bg-[var(--accent-primary)] w-8'
                        : 'bg-[var(--border-primary)] w-6'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCTA}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                {stepConfig.ctaLabel}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-lg text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--bg-primary)] transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-[var(--bg-primary)] transition-colors"
            aria-label="Dismiss onboarding"
          >
            <X size={16} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Completed steps summary */}
        {currentStepIndex > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border-primary)]">
            {STEPS.slice(0, currentStepIndex).map(step => {
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex items-center gap-1 text-[var(--accent-primary)]">
                  <CheckCircle2 size={14} />
                  <span className="text-xs font-medium">{step.title.replace('Create your first ', '').replace('Add your first ', '').replace('Start a ', '')}</span>
                  <StepIcon size={0} className="hidden" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingGuide;
