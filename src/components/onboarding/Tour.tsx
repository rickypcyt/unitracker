import { ArrowLeft, ArrowRight, ListTodo, X } from 'lucide-react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNavigation } from '@/navigation/NavigationContext';

type TourPage = 'session' | 'tasks';

interface TourStep {
  id: string;
  target?: string;
  page: TourPage;
}

interface TourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS: TourStep[] = [
  { id: 'welcome', page: 'session' },
  { id: 'timer', target: '[data-tour="session-timer"]', page: 'session' },
  { id: 'board', target: '[data-tour="tasks-board"]', page: 'tasks' },
  { id: 'add', target: '[data-tour="add-task"]', page: 'tasks' },
  { id: 'done', page: 'tasks' },
];

const SPOT_PADDING = 8;
const MARGIN = 16;
const TOOLTIP_MAX_WIDTH = 384;

export const TOUR_FINISHED_EVENT = 'tourFinished';

const STEP_KEY = 'tourStep';
const readSavedStep = (): number => {
  const saved = Number(localStorage.getItem(STEP_KEY));
  return Number.isInteger(saved) && saved >= 0 && saved < STEPS.length ? saved : 0;
};

const Tour: React.FC<TourProps> = ({ isOpen, onClose, onComplete }) => {
  const { t } = useTranslation();
  const { navigateTo } = useNavigation();
  const [currentStep, setCurrentStep] = useState(readSavedStep);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  const step = STEPS[currentStep]!;
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;
  const isCentered = !step.target || !rect;

  const finish = useCallback((createdTask: boolean) => {
    try {
      localStorage.setItem('hasSeenTour', 'true');
      localStorage.removeItem(STEP_KEY);
    } catch {}
    window.dispatchEvent(new CustomEvent(TOUR_FINISHED_EVENT, { detail: { createdTask } }));
  }, []);

  const handleSkip = useCallback(() => {
    finish(false);
    onClose();
  }, [finish, onClose]);

  const handleCreateTask = useCallback(() => {
    finish(true);
    onComplete();
    onClose();
    navigateTo('tasks');
    setTimeout(() => window.dispatchEvent(new Event('quickAddTask')), 60);
  }, [finish, navigateTo, onClose, onComplete]);

  const handleNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  // Restore progress when reopened (e.g. after a refresh mid-tour)
  useEffect(() => {
    if (isOpen) setCurrentStep(readSavedStep());
  }, [isOpen]);

  // Persist progress so a refresh doesn't restart the tour
  useEffect(() => {
    if (isOpen) localStorage.setItem(STEP_KEY, String(currentStep));
  }, [isOpen, currentStep]);

  // Navigate to the step's page and wait for its target to mount
  useEffect(() => {
    if (!isOpen) return;
    setRect(null);
    navigateTo(step.page);
    if (!step.target) return;

    let cancelled = false;
    let attempts = 0;
    let raf = 0;

    const locate = () => {
      if (cancelled) return;
      const el = document.querySelector(step.target!) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: 'center' });
        setRect(el.getBoundingClientRect());
      } else if (attempts++ < 90) {
        raf = requestAnimationFrame(locate); // ~1.5s max, then centered fallback
      }
    };
    raf = requestAnimationFrame(locate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [isOpen, currentStep, navigateTo, step.page, step.target]);

  // Keep spotlight aligned on resize
  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      if (step.target) {
        const el = document.querySelector(step.target);
        if (el) setRect(el.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, step.target]);

  // Keyboard: Esc skips, arrows navigate
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      else if (e.key === 'ArrowRight' && !isLast) handleNext();
      else if (e.key === 'ArrowLeft' && !isFirst) handleBack();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isFirst, isLast, handleSkip, handleNext, handleBack]);

  useLayoutEffect(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
  }, [isOpen]);

  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(240);
  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [currentStep, isOpen, viewport.w]);

  const tooltipStyle = useMemo<React.CSSProperties>(() => {
    const width = Math.min(TOOLTIP_MAX_WIDTH, viewport.w - MARGIN * 2);
    if (isCentered || !rect) {
      return { top: '50%', left: '50%', width, transform: 'translate(-50%, -50%)' };
    }
    const isMobile = viewport.w < 640;
    const targetCenterY = rect.top + rect.height / 2;
    // Place the card on the opposite half of the screen from the target so it never covers it
    const placeBelow = isMobile ? targetCenterY < viewport.h / 2 : rect.bottom + SPOT_PADDING + MARGIN + cardH < viewport.h;
    const left = Math.max(
      MARGIN,
      Math.min(rect.left + rect.width / 2 - width / 2, viewport.w - width - MARGIN),
    );
    if (isMobile) {
      return { top: placeBelow ? viewport.h - cardH - MARGIN : MARGIN, left: MARGIN, width };
    }
    return placeBelow
      ? { top: rect.bottom + SPOT_PADDING + MARGIN, left, width }
      : { top: Math.max(MARGIN, rect.top - SPOT_PADDING - MARGIN - cardH), left, width };
  }, [isCentered, rect, viewport, cardH]);

  if (!isOpen) return null;

  const title = t(`tour.${step.id}.title`);
  const body = t(`tour.${step.id}.body`);

  return (
    <div className="fixed inset-0 z-[100000]" role="dialog" aria-modal="true" aria-label={title}>
      {/* Click shield + dim layer (spotlight cut-out when a target is known) */}
      <div
        className="absolute inset-0"
        style={isCentered ? { backgroundColor: 'rgba(0,0,0,0.65)' } : undefined}
      />
      {!isCentered && rect && (
        <div
          className="absolute rounded-xl border-2 border-[var(--accent-primary)] pointer-events-none"
          style={{
            top: rect.top - SPOT_PADDING,
            left: rect.left - SPOT_PADDING,
            width: rect.width + SPOT_PADDING * 2,
            height: rect.height + SPOT_PADDING * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 24px var(--accent-primary)',
            transition: 'top .12s ease-out, left .12s ease-out, width .12s ease-out, height .12s ease-out',
          }}
        />
      )}

      <div
        ref={cardRef}
        className="absolute rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-5 shadow-2xl"
        style={tooltipStyle}
      >
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label={t('tour.skip')}
        >
          <X className="w-4 h-4" />
        </button>

        {step.id === 'done' && (
          <div className="mb-3 inline-flex rounded-xl bg-[var(--accent-primary)]/10 p-3">
            <ListTodo className="w-7 h-7 text-[var(--accent-primary)]" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1.5 pr-6">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{body}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4" aria-label={t('tour.step', { current: currentStep + 1, total: STEPS.length })}>
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-100 ${
                i === currentStep
                  ? 'w-6 bg-[var(--accent-primary)]'
                  : i < currentStep
                    ? 'w-1.5 bg-[var(--accent-primary)]/50'
                    : 'w-1.5 bg-[var(--border-primary)]'
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleCreateTask}
              className="w-full rounded-xl border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold py-2.5 text-sm hover:bg-[var(--accent-primary)]/10 transition-colors"
              autoFocus
            >
              {t('tour.createTask')}
            </button>
            <button
              onClick={handleSkip}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-1"
            >
              {t('tour.later')}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {isFirst ? (
              <button
                onClick={handleSkip}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {t('tour.skip')}
              </button>
            ) : (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('tour.back')}
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] px-4 py-2 text-sm font-semibold hover:bg-[var(--accent-primary)]/10 transition-colors"
              autoFocus
            >
              {t('tour.next')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tour;
