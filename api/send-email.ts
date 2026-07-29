import { render } from '@react-email/render';
import React from 'react';

import FriendNotificationEmail from '../src/emails/FriendNotificationEmail';
import TaskReminderEmail from '../src/emails/TaskReminderEmail';
import WeeklyStatsEmail from '../src/emails/WeeklyStatsEmail';
import WelcomeEmail from '../src/emails/WelcomeEmail';
import { defaultEmailConfig, type EmailConfig } from '../src/emails/EmailLayout';

interface VercelRequest {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): void;
  send(data?: any): void;
}

type EmailType = 'welcome' | 'task-reminder' | 'weekly-stats' | 'friend-notification';

interface SendEmailRequest {
  type: EmailType;
  to: string;
  config?: Partial<EmailConfig>;
  data: {
    userName: string;
    // welcome
    loginUrl?: string;
    // task-reminder
    tasks?: { title: string; dueDate?: string; workspace?: string }[];
    tasksUrl?: string;
    // weekly-stats
    stats?: {
      studyTime: string;
      pomodorosCompleted: number;
      tasksCompleted: number;
      habitsCompleted: number;
      longestStreak: number;
    };
    statsUrl?: string;
    // friend-notification
    friendName?: string;
    action?: 'added' | 'request' | 'accepted';
    appUrl?: string;
  };
}

const EMAIL_SUBJECTS: Record<EmailType, (data: SendEmailRequest['data']) => string> = {
  welcome: (d) => `Welcome to UniTracker, ${d.userName}! 🎉`,
  'task-reminder': (d) => `You have ${d.tasks?.length || 0} task(s) due soon 📋`,
  'weekly-stats': (d) => `Your weekly summary, ${d.userName} 📊`,
  'friend-notification': (d) => `${d.friendName} ${d.action === 'request' ? 'sent you a friend request' : d.action === 'accepted' ? 'accepted your friend request' : 'added you as a friend'} 👥`,
};

async function renderEmail(req: SendEmailRequest): Promise<string> {
  const config = { ...defaultEmailConfig, ...req.config };

  switch (req.type) {
    case 'welcome':
      return render(React.createElement(WelcomeEmail, { userName: req.data.userName, config, loginUrl: req.data.loginUrl }));
    case 'task-reminder':
      return render(React.createElement(TaskReminderEmail, { userName: req.data.userName, tasks: req.data.tasks || [], config, tasksUrl: req.data.tasksUrl }));
    case 'weekly-stats':
      return render(React.createElement(WeeklyStatsEmail, { userName: req.data.userName, stats: req.data.stats!, config, statsUrl: req.data.statsUrl }));
    case 'friend-notification':
      return render(React.createElement(FriendNotificationEmail, { userName: req.data.userName, friendName: req.data.friendName!, action: req.data.action!, config, appUrl: req.data.appUrl }));
    default:
      throw new Error(`Unknown email type: ${req.type}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, to, config, data } = req.body as SendEmailRequest;

    if (!type || !to || !data) {
      return res.status(400).json({ error: 'Missing required fields: type, to, data' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const html = renderEmail({ type, to, config, data });
    const subject = EMAIL_SUBJECTS[type](data);

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = config?.appName || 'UniTracker';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      return res.status(response.status).json({
        error: `Resend API error: ${response.status}`,
        details: errorText,
      });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, id: result.id });
  } catch (error) {
    console.error('Email handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
