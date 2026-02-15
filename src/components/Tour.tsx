import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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

const Tour: React.FC<TourProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const { navigateTo } = useNavigation();

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to UniTracker! 🎉',
      content: 'Let\'s take a quick tour to help you get started with your new study companion. I\'ll show you the main features and how to use them effectively.',
      target: '',
      page: 'session'
    },
    {
      id: 'session-timer',
      title: 'Study Session Timer',
      content: 'This is your core study timer. Track your study sessions, use Pomodoro technique, and monitor your productivity with detailed analytics.',
      target: '[data-tour="session-timer"]',
      page: 'session'
    },
    {
      id: 'tasks-board',
      title: 'Tasks Management',
      content: 'Organize your tasks with our Kanban-style board. Create, edit, and track all your assignments and deadlines in one place.',
      target: '[data-tour="tasks-board"]',
      page: 'tasks'
    },
    {
      id: 'add-task',
      title: 'Create New Task',
      content: 'Click here to create new tasks. You can add descriptions, due dates, difficulty levels, and even use AI to help you generate tasks!',
      target: '[data-tour="add-task"]',
      page: 'tasks'
    },
    {
      id: 'calendar',
      title: 'Calendar Planning',
      content: 'See all your tasks and deadlines in a beautiful calendar view. Perfect for planning your week and visualizing your schedule!',
      target: '[data-tour="calendar"]',
      page: 'calendar'
    },
    {
      id: 'stats',
      title: 'Statistics Dashboard',
      content: 'Track your productivity with detailed stats and charts. See your study patterns, progress, and achievements!',
      target: '[data-tour="stats"]',
      page: 'stats'
    },
    {
      id: 'habits',
      title: 'Habits Tracker',
      content: 'Build and maintain good study habits. Track daily routines and build streaks to improve your productivity!',
      target: '[data-tour="habits"]',
      page: 'habits'
    },
    {
      id: 'login-prompt',
      title: 'Ready to Get Started? 🔐',
      content: 'To save your progress and sync across devices, create a free account. You can continue in demo mode, but signing up gives you the full experience!',
      target: '[data-tour="login-button"]',
      page: 'tasks',
      action: () => {
        // Trigger login modal after tour completes
        setTimeout(() => {
          const loginBtn = document.querySelector('[data-tour="login-button"]') as HTMLButtonElement;
          if (loginBtn) {
            loginBtn.click();
          }
        }, 500);
      }
    }
  ];

  useEffect(() => {
    if (isOpen) {
      const step = tourSteps[currentStep];
      if (step?.page) {
        navigateTo(step.page as any);
      }
      setTimeout(() => highlightElement(), 300); // Wait for page navigation
    } else {
      removeHighlight();
    }
  }, [isOpen, currentStep]);

  const highlightElement = () => {
    removeHighlight();
    const step = tourSteps[currentStep];
    if (!step) return;
    
    // Add border highlighting to target element
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        // Store original styles
        element.style.setProperty('--tour-original-border', element.style.border);
        element.style.setProperty('--tour-original-box-shadow', element.style.boxShadow);
        
        // Apply tour highlighting
        element.style.border = '3px solid #3B82F6';
        element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
        element.style.transition = 'all 0.3s ease';
        
        setHighlightedElement(element);
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        console.warn(`Tour target element not found: ${step.target}`);
      }
    }
    
    console.log(`Tour step ${currentStep + 1}: ${step.title}`);
  };

  const removeHighlight = () => {
    if (highlightedElement) {
      // Restore original styles
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
    
    // Close tour immediately
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

  return (
    <>
      {/* Tour Tooltip */}
      <div className="fixed z-[99999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-sm border border-gray-200 dark:border-gray-700"
           style={{
             position: 'fixed',
             top: '50%',
             left: '50%',
             transform: 'translate(-50%, -50%)',
           }}>
        
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
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
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentStep + 1} / {tourSteps.length}
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          {!isFirstStep && (
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
          )}
          
          {/* Spacer to maintain button alignment */}
          {isFirstStep && <div></div>}

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-500 rounded-md hover:border-blue-600 hover:text-blue-600 transition-colors text-sm font-medium"
          >
            {isLastStep ? 'Complete' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[99997] pointer-events-none"
        style={{ backgroundColor: 'transparent' }}
      />
    </>
  );
};

export default Tour;
