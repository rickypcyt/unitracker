import { Heading, Hr, Section, Text } from '@react-email/components';
import React from 'react';

import { EmailButton, EmailLayout, type EmailConfig } from './EmailLayout';

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
  const statItems = [
    { label: 'Study Time', value: stats.studyTime, icon: '⏱️' },
    { label: 'Pomodoros', value: `${stats.pomodorosCompleted}`, icon: '🍅' },
    { label: 'Tasks Done', value: `${stats.tasksCompleted}`, icon: '✅' },
    { label: 'Habits Done', value: `${stats.habitsCompleted}`, icon: '🔥' },
  ];

  return (
    <EmailLayout preview={`Your weekly summary is here, ${userName}!`} config={config}>
      <Heading style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
        Your Week in Review, {userName} 📊
      </Heading>
      <Text style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.6 }}>
        Here's how your past week went. Keep up the great work!
      </Text>

      <Section style={{ margin: '24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {statItems.map((item) => (
            <div
              key={item.label}
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 10,
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <Text style={{ fontSize: 24, margin: 0 }}>{item.icon}</Text>
              <Text style={{ fontSize: 20, fontWeight: 700, color: config.primaryColor, margin: '4px 0 0' }}>
                {item.value}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                {item.label}
              </Text>
            </div>
          ))}
        </div>
      </Section>

      {stats.longestStreak > 0 && (
        <>
          <Hr style={{ border: 'none', borderTop: '1px solid #e4e7eb', margin: '16px 0' }} />
          <Text style={{ fontSize: 15, color: '#4b5563', textAlign: 'center' }}>
            🔥 Longest habit streak: <strong>{stats.longestStreak} days</strong>
          </Text>
        </>
      )}

      <Text style={{ fontSize: 15, color: '#4b5563' }}>
        Want to see more details? Check your full statistics:
      </Text>
      <EmailButton href={statsUrl} label="View Full Stats" color={config.primaryColor} />
    </EmailLayout>
  );
};

export default WeeklyStatsEmail;
