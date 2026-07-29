import { Heading, Section, Text } from '@react-email/components';
import React from 'react';

import { EmailButton, EmailLayout, type EmailConfig } from './EmailLayout';

interface TaskReminderEmailProps {
  userName: string;
  tasks: { title: string; dueDate?: string; workspace?: string }[];
  config: EmailConfig;
  tasksUrl?: string;
}

export const TaskReminderEmail: React.FC<TaskReminderEmailProps> = ({
  userName,
  tasks,
  config,
  tasksUrl = 'https://unitracker.me',
}) => (
  <EmailLayout preview={`You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due soon`} config={config}>
    <Heading style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
      Hi {userName}, don't forget your tasks! 📋
    </Heading>
    <Text style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.6 }}>
      You have {tasks.length} task{tasks.length > 1 ? 's' : ''} coming up. Here's a quick reminder:
    </Text>
    <Section style={{ margin: '20px 0' }}>
      {tasks.map((task, i) => (
        <div
          key={i}
          style={{
            padding: '12px 16px',
            backgroundColor: '#f9fafb',
            borderRadius: 8,
            marginBottom: 8,
            borderLeft: `3px solid ${config.primaryColor}`,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>
            {task.title}
          </Text>
          {task.dueDate && (
            <Text style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
              Due: {task.dueDate}
            </Text>
          )}
          {task.workspace && (
            <Text style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
              {task.workspace}
            </Text>
          )}
        </div>
      ))}
    </Section>
    <Text style={{ fontSize: 15, color: '#4b5563' }}>
      Stay on top of your deadlines — open your tasks board:
    </Text>
    <EmailButton href={tasksUrl} label="View Tasks" color={config.primaryColor} />
  </EmailLayout>
);

export default TaskReminderEmail;
