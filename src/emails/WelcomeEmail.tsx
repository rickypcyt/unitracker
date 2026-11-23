import { Section, Text } from '@react-email/components';
import React from 'react';

import {
  EmailButton,
  EmailHero,
  EmailLayout,
  EmailListItem,
  EmailListSection,
  emailText,
  emailTheme,
  type EmailConfig,
} from './EmailLayout';

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
  <EmailLayout preview={`Welcome to ${config.appName}, ${userName}!`} config={config}>
    <EmailHero
      title={`Welcome to ${config.appName}`}
      cta={<EmailButton href={loginUrl} label="Start studying" color={config.primaryColor} />}
    >
      <Text style={emailText.body}>Thanks for joining, {userName}.</Text>
      <Text style={emailText.body}>
        Your timer, tasks, habits and stats now live in one place, so you can spend less time organizing and more time
        studying.
      </Text>
    </EmailHero>

    <EmailListSection title="Get started">
      <EmailListItem title="Track your sessions">Start the Pomodoro timer and log every study session.</EmailListItem>
      <EmailListItem title="Organize your tasks">Plan work on a Kanban board, grouped by workspace.</EmailListItem>
      <EmailListItem title="Build habits">Keep daily routines and watch your streaks grow.</EmailListItem>
    </EmailListSection>

    <Section style={{ padding: '0 24px 56px' }}>
      <Text style={{ margin: 0, fontSize: 15, color: emailTheme.fg }}>Didn't sign up?</Text>
      <Text style={{ margin: '2px 0 0', fontSize: 13, color: emailTheme.fg2 }}>
        If you didn't create an account, you can safely ignore this email.
      </Text>
    </Section>
  </EmailLayout>
);

export default WelcomeEmail;
