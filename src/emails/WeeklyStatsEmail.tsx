import { Column, Row, Section, Text } from '@react-email/components';
import React from 'react';

import {
  EmailButton,
  EmailHero,
  EmailLayout,
  emailText,
  emailTheme,
  type EmailConfig,
} from './EmailLayout';

interface WeeklyStatsEmailProps {
  userName: string;
  stats: {
    studyTime: string;
    pomodorosCompleted: number;
    tasksCompleted: number;
    habitsCompleted: number;
    longestStreak: number;
  };
  config: EmailConfig;
  statsUrl?: string;
}

export const WeeklyStatsEmail: React.FC<WeeklyStatsEmailProps> = ({
  userName,
  stats,
  config,
  statsUrl = 'https://unitracker.me',
}) => {
  const items = [
    { label: 'Study time', value: stats.studyTime },
    { label: 'Pomodoros', value: `${stats.pomodorosCompleted}` },
    { label: 'Tasks done', value: `${stats.tasksCompleted}` },
    { label: 'Habits done', value: `${stats.habitsCompleted}` },
  ];

  const cell = (item: { label: string; value: string }, withRightBorder: boolean) => (
    <Column
      key={item.label}
      style={{
        width: '50%',
        padding: '28px 0 28px 0',
        borderBottom: `1px solid ${emailTheme.stroke}`,
        borderRight: withRightBorder ? `1px solid ${emailTheme.stroke}` : undefined,
        paddingLeft: withRightBorder ? 0 : 24,
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: emailTheme.condensed,
          fontSize: 40,
          fontWeight: 600,
          lineHeight: 1,
          color: config.primaryColor,
        }}
      >
        {item.value}
      </Text>
      <Text
        style={{
          margin: '10px 0 0',
          fontFamily: emailTheme.mono,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: emailTheme.faint,
        }}
      >
        {item.label}
      </Text>
    </Column>
  );

  return (
    <EmailLayout preview={`Your weekly summary is here, ${userName}!`} config={config}>
      <EmailHero
        title="Your week in review"
        cta={<EmailButton href={statsUrl} label="View full stats" color={config.primaryColor} />}
      >
        <Text style={emailText.body}>Hi {userName}, here's how the past seven days went. Keep it going.</Text>
      </EmailHero>

      <Section style={{ padding: '0 24px 48px' }}>
        <Row style={{ borderTop: `1px solid ${emailTheme.stroke}` }}>
          {cell(items[0]!, true)}
          {cell(items[1]!, false)}
        </Row>
        <Row>
          {cell(items[2]!, true)}
          {cell(items[3]!, false)}
        </Row>
        {stats.longestStreak > 0 && (
          <Text style={{ ...emailText.body, margin: '24px 0 0' }}>
            Longest habit streak:{' '}
            <span style={{ color: emailTheme.fg, fontWeight: 600 }}>{stats.longestStreak} days</span>
          </Text>
        )}
      </Section>
    </EmailLayout>
  );
};

export default WeeklyStatsEmail;
