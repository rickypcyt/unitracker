import { Heading, Section, Text } from '@react-email/components';
import React from 'react';

import { EmailButton, EmailLayout, type EmailConfig } from './EmailLayout';

interface WelcomeEmailProps {
  userName: string;
  config: EmailConfig;
  loginUrl?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
  config,
  loginUrl = 'https://unitracker.me',
}) => (
  <EmailLayout preview={`Welcome to ${config.appName}! Let's start studying smarter.`} config={config}>
    <Heading style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
      Welcome to {config.appName}, {userName}! 🎉
    </Heading>
    <Text style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.6 }}>
      Thanks for joining {config.appName}! You're now part of a community of students who are taking
      control of their study time and boosting their productivity.
    </Text>
    <Section style={{ margin: '24px 0' }}>
      <Text style={{ fontSize: 15, color: '#4b5563', fontWeight: 600, marginBottom: 8 }}>
        Here's what you can do:
      </Text>
      <ul style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
        <li>Track study sessions with the Pomodoro timer</li>
        <li>Organize tasks with a Kanban-style board</li>
        <li>Build daily habits and track streaks</li>
        <li>View detailed stats and progress charts</li>
        <li>Plan your schedule with the calendar view</li>
      </ul>
    </Section>
    <Text style={{ fontSize: 15, color: '#4b5563' }}>
      Ready to get started? Click below to jump in:
    </Text>
    <EmailButton href={loginUrl} label="Start Studying" color={config.primaryColor} />
    <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 24 }}>
      If you didn't create an account, you can safely ignore this email.
    </Text>
  </EmailLayout>
);

export default WelcomeEmail;
