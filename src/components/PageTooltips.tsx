import React from 'react';

import ContextualTooltip from '@/components/ContextualTooltip';
import { useNavigation } from '@/navbar/NavigationContext';

const PageTooltips: React.FC = () => {
  const { activePage } = useNavigation();

  const tooltips: Record<string, React.ReactNode> = {
    session: (
      <ContextualTooltip
        page="session"
        targetSelector="[data-tour='session-timer']"
        title="Study Timer"
        content="Start a study session here to track your focus time. Use Pomodoro mode for structured work/break intervals."
        position="bottom"
      />
    ),
    tasks: (
      <ContextualTooltip
        page="tasks"
        targetSelector="[data-tour='add-task']"
        title="Create Tasks"
        content="Click the + button to add a new task. Organize by assignment, set deadlines, and track difficulty levels."
        position="top"
      />
    ),
    calendar: (
      <ContextualTooltip
        page="calendar"
        targetSelector="[data-tour='calendar']"
        title="Calendar View"
        content="See all your tasks and deadlines in a calendar. Switch between month, week, and day views."
        position="bottom"
      />
    ),
    stats: (
      <ContextualTooltip
        page="stats"
        targetSelector="[data-tour='stats']"
        title="Your Statistics"
        content="Track your study time, task completion, and habit streaks. Check back regularly to monitor progress."
        position="bottom"
      />
    ),
    habits: (
      <ContextualTooltip
        page="habits"
        targetSelector="[data-tour='habits']"
        title="Habit Tracker"
        content="Create daily habits and track your streaks. Build consistency to improve your study routine."
        position="bottom"
      />
    ),
    notes: (
      <ContextualTooltip
        page="notes"
        targetSelector="[data-tour='notes']"
        title="Notes"
        content="Write and organize your study notes. Use markdown formatting for rich text editing."
        position="bottom"
      />
    ),
  };

  return <>{tooltips[activePage] ?? null}</>;
};

export default PageTooltips;
