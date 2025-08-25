import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useEffect, useState } from 'react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRun(true);
    }
  }, [isOpen]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      onClose();
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      content: 'Welcome to UniTracker! 🎓 We\'ll show you all the app features step by step. Let\'s start with study sessions.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.navbar',
      content: 'This is your main navigation bar. Here you can switch between different sections of the app.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-page="session"]',
      content: 'First, let\'s go to the Sessions section. Here you can use different types of timers for your study sessions.',
      placement: 'bottom',
    },
    {
      target: '.maincard',
      content: 'Here you have three types of timers: Pomodoro (25 min), Study Timer (customizable), and Countdown (countdown timer). You can start a session by clicking Start!',
      placement: 'top',
    },
    {
      target: '.maincard:last-child',
      content: 'And here you have the white noise generator to help you focus during your study sessions.',
      placement: 'top',
    },
    {
      target: '[data-page="tasks"]',
      content: 'Now let\'s go to the Tasks section. Here you can organize and manage all your study tasks.',
      placement: 'bottom',
    },
    {
      target: '.kanban-board',
      content: 'This is your Kanban board. You can create tasks, move them between columns (To Do, In Progress, Done) and organize your work.',
      placement: 'right',
    },
    {
      target: 'button[aria-label="Add new task"]',
      content: 'This floating button allows you to create new tasks. Click to start organizing your work!',
      placement: 'left',
    },
    {
      target: '[data-page="calendar"]',
      content: 'Now let\'s go to the Calendar. Here you can plan your tasks and see your study schedule.',
      placement: 'bottom',
    },
    {
      target: '.calendar-view',
      content: 'In the calendar you can drag and drop tasks to reschedule them, see your daily progress and plan your week.',
      placement: 'left',
    },
    {
      target: '[data-page="notes"]',
      content: 'The Notes section allows you to create and organize notes, ideas and important reminders.',
      placement: 'bottom',
    },
    {
      target: '.notes-panel',
      content: 'Here you can create notes, organize them by categories and keep all your study information in one place.',
      placement: 'right',
    },
    {
      target: '[data-page="stats"]',
      content: 'Finally, the Statistics section shows your study progress and performance.',
      placement: 'bottom',
    },
    {
      target: '.stats-panel',
      content: 'Here you can see charts of your productivity, study time, completed tasks and more. Perfect for motivation!',
      placement: 'top',
    },
    {
      target: '.workspace-dropdown',
      content: 'Bonus: You can switch between different work areas using this dropdown. Each area can have its own tasks and settings.',
      placement: 'bottom',
    },
    {
      target: 'body',
      content: 'Perfect! 🎉 You now know all the main features of UniTracker. You can start organizing your studies efficiently. Good luck with your studies!',
      placement: 'center',
    },
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      callback={handleJoyrideCallback}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      scrollToFirstStep={true}
      scrollOffset={100}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: 'var(--accent-primary)',
          textColor: 'var(--text-primary)',
          backgroundColor: 'var(--bg-primary)',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          arrowColor: 'var(--bg-primary)',
        },
        tooltip: {
          borderRadius: '16px',
          padding: '16px sm:20px md:24px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          border: '2px solid var(--border-primary)',
          maxWidth: '90vw sm:500px md:500px',
          minWidth: '300px sm:350px md:400px',
        },
        tooltipTitle: {
          fontSize: '18px sm:19px md:20px',
          fontWeight: '700',
          marginBottom: '10px sm:11px md:12px',
          lineHeight: '1.4',
        },
        tooltipContent: {
          fontSize: '14px sm:15px md:16px',
          lineHeight: '1.6',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
        buttonClose: {
          display: 'none',
        },
        buttonNext: {
          backgroundColor: 'var(--accent-primary)',
          color: 'white',
          borderRadius: '10px sm:11px md:12px',
          padding: '10px 16px sm:11px 20px md:12px 24px',
          fontSize: '14px sm:15px md:16px',
          fontWeight: '600',
          minWidth: '100px sm:110px md:120px',
          marginLeft: '8px sm:9px md:10px',
        },
        buttonBack: {
          color: 'var(--accent-primary)',
          borderRadius: '10px sm:11px md:12px',
          padding: '10px 16px sm:11px 20px md:12px 24px',
          fontSize: '14px sm:15px md:16px',
          fontWeight: '600',
          minWidth: '100px sm:110px md:120px',
        },
        buttonSkip: {
          color: 'var(--text-secondary)',
          borderRadius: '10px sm:11px md:12px',
          padding: '10px 16px sm:11px 20px md:12px 24px',
          fontSize: '14px sm:15px md:16px',
          minWidth: '100px sm:110px md:120px',
          marginRight: '8px sm:9px md:10px',
        },
      }}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default OnboardingTour;
