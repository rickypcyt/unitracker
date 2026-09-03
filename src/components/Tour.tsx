import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigation } from '@/navbar/NavigationContext';
interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  page?: string;
  action?: () => void;
}
interface TourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}
const Tour: React.FC<TourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const {
    navigateTo,
    openSettings
  } = useNavigation();
  const tourSteps: TourStep[] = [{
    id: 'welcome',
    title: 'Welcome to UniTracker! 🎉',
    content: 'Let\'s take a quick tour to help you get started with your new study companion. I\'ll show you the main features and how to use them effectively.',
    target: '',
    page: 'session'
  }, {
    id: 'session-timer',
    title: 'Study Session Timer',
    content: 'This is your core study timer. Track your study sessions, use Pomodoro technique, and monitor your productivity with detailed analytics.',
    target: '[data-tour="session-timer"]',
    page: 'session'
  }, {
    id: 'tasks-board',
    title: 'Tasks Management',
    content: 'Organize your tasks with our Kanban-style board. Create, edit, and track all your assignments and deadlines in one place.',
    target: '[data-tour="tasks-board"]',
    page: 'tasks'
  }, {
    id: 'add-task',
    title: 'Create New Task',
    content: 'Click here to create new tasks. You can add descriptions, due dates, difficulty levels, and even use AI to help you generate tasks!',
    target: '[data-tour="add-task"]',
    page: 'tasks'
  }, {
    id: 'calendar',
    title: 'Calendar Planning',
    content: 'See all your tasks and deadlines in a beautiful calendar view. Perfect for planning your week and visualizing your schedule!',
    target: '[data-tour="calendar"]',
    page: 'calendar'
  }, {
    id: 'stats',
    title: 'Statistics Dashboard',
    content: 'Track your productivity with detailed stats and charts. See your study patterns, progress, and achievements!',
    target: '[data-tour="stats"]',
    page: 'stats'
  }, {
    id: 'habits',
    title: 'Habits Tracker',
    content: 'Build and maintain good study habits. Track daily routines and build streaks to improve your productivity!',
    target: '[data-tour="habits"]',
    page: 'habits'
  }, {
    id: 'login-prompt',
    title: 'Ready to Get Started? 🔐',
    content: 'To save your progress and sync across devices, create a free account. You can continue in demo mode, but signing up gives you the full experience!',
    target: '[data-tour="login-button"]',
    page: 'session',
    action: () => {
      setTimeout(() => {
        const loginBtn = document.querySelector('[data-tour="login-button"]') as HTMLButtonElement;
        if (loginBtn) {
          loginBtn.click();
        }
      }, 500);
    }
  }];

  const TOOLTIP_WIDTH = 384;
  const TOOLTIP_HEIGHT_ESTIMATE = 220;
  const MARGIN = 16;

  const calculateTooltipPosition = useCallback((element: HTMLElement | null) => {
    if (!element) {
      return { top: window.innerHeight / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2, left: window.innerWidth / 2 - TOOLTIP_WIDTH / 2 };
    }

    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;

    let top: number;
    let left: number;

    if (spaceBelow >= TOOLTIP_HEIGHT_ESTIMATE + MARGIN) {
      top = rect.bottom + MARGIN;
    } else if (spaceAbove >= TOOLTIP_HEIGHT_ESTIMATE + MARGIN) {
      top = rect.top - TOOLTIP_HEIGHT_ESTIMATE - MARGIN;
    } else if (spaceBelow >= spaceAbove) {
      top = Math.max(MARGIN, rect.bottom + MARGIN);
    } else {
      top = Math.max(MARGIN, rect.top - TOOLTIP_HEIGHT_ESTIMATE - MARGIN);
    }

    if (spaceRight >= TOOLTIP_WIDTH + MARGIN) {
      left = rect.right + MARGIN;
    } else if (spaceLeft >= TOOLTIP_WIDTH + MARGIN) {
      left = rect.left - TOOLTIP_WIDTH - MARGIN;
    } else {
      left = rect.left + (rect.width - TOOLTIP_WIDTH) / 2;
    }

    left = Math.max(MARGIN, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - MARGIN));
    top = Math.max(MARGIN, Math.min(top, window.innerHeight - TOOLTIP_HEIGHT_ESTIMATE - MARGIN));

    return { top, left };
  }, []);

  const highlightElement = useCallback(() => {
    removeHighlight();
    const step = tourSteps[currentStep];
    if (!step) return;

    if (step.target) {
      const tryHighlight = (attempts: number) => {
        const element = document.querySelector(step.target) as HTMLElement;
        if (element) {
          element.style.setProperty('--tour-original-border', element.style.border);
          element.style.setProperty('--tour-original-box-shadow', element.style.boxShadow);
          element.style.border = '3px solid #3B82F6';
          element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
          element.style.transition = 'all 0.3s ease';
          element.style.borderRadius = element.style.borderRadius || '8px';
          setHighlightedElement(element);

          element.scrollIntoView({ behavior: 'smooth', block: 'center' });

          setTimeout(() => {
            setTooltipPos(calculateTooltipPosition(element));
          }, 350);
        } else if (attempts > 0) {
          setTimeout(() => tryHighlight(attempts - 1), 200);
        } else {
          setTooltipPos(calculateTooltipPosition(null));
        }
      };
      tryHighlight(5);
    } else {
      setTooltipPos(calculateTooltipPosition(null));
    }
  }, [currentStep, calculateTooltipPosition]);

  useEffect(() => {
    if (isOpen) {
      const step = tourSteps[currentStep];
      if (step?.page) {
        navigateTo(step.page as any);
      }
      if (step?.id === 'login-prompt') {
        openSettings();
        setTimeout(() => highlightElement(), 600);
      } else {
        setTimeout(() => highlightElement(), 300);
      }
    } else {
      removeHighlight();
      setTooltipPos(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (highlightedElement) {
        setTooltipPos(calculateTooltipPosition(highlightedElement));
      } else {
        setTooltipPos(calculateTooltipPosition(null));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, highlightedElement, calculateTooltipPosition]);

  const removeHighlight = () => {
    if (highlightedElement) {
      const originalBorder = highlightedElement.style.getPropertyValue('--tour-original-border');
      const originalBoxShadow = highlightedElement.style.getPropertyValue('--tour-original-box-shadow');
      highlightedElement.style.border = originalBorder;
      highlightedElement.style.boxShadow = originalBoxShadow;
      highlightedElement.style.transition = '';
      setHighlightedElement(null);
    }
  };
  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleComplete = () => {
    localStorage.setItem('hasSeenTour', 'true');
    removeHighlight();
    onComplete();
    onClose();
  };
  const handleSkip = () => {
    localStorage.setItem('hasSeenTour', 'true');
    removeHighlight();
    onClose();
  };
  if (!isOpen) return null;
  const step = tourSteps[currentStep];
  if (!step) return null;
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;
  const progressPercent = ((currentStep + 1) / tourSteps.length) * 100;

  const tooltipStyle: React.CSSProperties = tooltipPos
    ? { position: 'fixed', top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px`, transition: 'top 0.3s ease, left 0.3s ease' }
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return <>
      {/* Tour Tooltip */}
      <div className="fixed z-[99999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-96 border-2 border-gray-200 dark:border-gray-700" style={tooltipStyle}>
        
        {/* Close Button */}
        <button onClick={handleSkip} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Tour Content */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {step.content}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div className="bg-blue-500 h-1 rounded-full transition-all duration-300" style={{
              width: progressPercent + '%'
            }} />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentStep + 1} / {tourSteps.length}
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          {!isFirstStep && <button onClick={handlePrevious} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>}
          
          {/* Spacer to maintain button alignment */}
          {isFirstStep && <div></div>}

          <button onClick={handleNext} className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-500 rounded-md hover:border-blue-600 hover:text-blue-600 transition-colors text-sm font-medium">
            {isLastStep ? 'Complete' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overlay */}
      <div className="fixed inset-0 z-[99997] pointer-events-none" style={{
      backgroundColor: 'transparent'
    }} />
    </>;
};
export default Tour;