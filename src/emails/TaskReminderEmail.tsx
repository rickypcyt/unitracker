import { Text } from '@react-email/components';
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
  <EmailLayout
    preview={`You have ${tasks.length} task${tasks.length === 1 ? '' : 's'} due soon`}
    config={config}
  >
    <EmailHero
      title={`${tasks.length} task${tasks.length === 1 ? '' : 's'} due soon`}
      cta={<EmailButton href={tasksUrl} label="Open tasks" color={config.primaryColor} />}
    >
      <Text style={emailText.body}>
        Hi {userName}, a quick heads-up so nothing slips past its deadline.
      </Text>
    </EmailHero>

    <EmailListSection title="Coming up">
      {tasks.map((task, i) => (
        <EmailListItem key={i} title={task.title}>
          <span style={{ fontFamily: emailTheme.mono, fontSize: 12 }}>
            {[task.dueDate && `Due ${task.dueDate}`, task.workspace].filter(Boolean).join('  /  ')}
          </span>
        </EmailListItem>
      ))}
    </EmailListSection>
  </EmailLayout>
);

export default TaskReminderEmail;
