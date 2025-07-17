import Joyride, { STATUS } from 'react-joyride';

import React from 'react';

const Tour = ({ steps, run, onClose, continuous = true }) => {
  const tourSteps = [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome to UniTracker!',
      content: 'We will show you how the app works with example tasks. Click Next to start.',
      disableBeacon: true,
    },
    {
      target: '.navbar',
      placement: 'bottom',
      title: 'Multiple Pages',
      content: 'You can switch between Tasks, Calendar, Session, Notes, and Statistics. Use Ctrl + Arrow Keys to quickly navigate between pages!',
      disableBeacon: true,
    },
    {
      target: '.workspace-dropdown',
      placement: 'bottom',
      title: 'Switch Workspace',
      content: 'You can change your workspace using the dropdown, or quickly switch up and down with Ctrl + Arrow Up/Down!',
      disableBeacon: true,
    },
    // ...add more steps here
  ];
  return (
    <Joyride
      steps={steps || tourSteps}
      run={run}
      continuous={continuous}
      showSkipButton
      showProgress
      disableScrolling={false}
      styles={{
        options: {
          zIndex: 999999,
          primaryColor: '#3b82f6', // Tailwind blue-500
          textColor: '#f3f4f6', // Tailwind gray-100
          backgroundColor: '#0a0a0a', // negro más puro
        },
        tooltip: {
          borderRadius: '0.75rem',
          boxShadow: '0 4px 32px rgba(0,0,0,0.32)',
          padding: '1.25rem',
          background: '#0a0a0a', // negro más puro
          color: '#f3f4f6', // texto claro
        },
        buttonNext: {
          background: '#3b82f6',
          borderRadius: '0.5rem',
          color: '#fff',
        },
        buttonBack: {
          color: '#3b82f6',
        },
        arrow: {
          color: '#0a0a0a',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Next', // Siempre dice Next
        next: 'Next',
        skip: 'Skip',
      }}
      callback={data => {
        if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
          onClose && onClose();
        }
      }}
    />
  );
};

export default Tour; 