import { render } from '@react-email/render';
import React from 'react';

import AnniversaryEmail from '../src/emails/AnniversaryEmail';
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

type EmailType = 'welcome' | 'task-reminder' | 'weekly-stats' | 'friend-notification' | 'anniversary';

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
  anniversary: () => 'UniTracker turns 2 soon — come take a look',
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
    case 'anniversary':
      return render(React.createElement(AnniversaryEmail, { userName: req.data.userName, config, appUrl: req.data.appUrl }));
    default:
      throw new Error(`Unknown email type: ${req.type}`);
  }
}

interface AuthUser {
  id: string;
  email: string;
}

/** Validates the Supabase access token and returns the user, or null. */
async function getAuthUser(authHeader: string | undefined): Promise<AuthUser | null> {
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!r.ok) return null;
    const user = (await r.json()) as { id?: string; email?: string };
    if (!user.id || !user.email) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

// Non-admin users may only trigger emails about themselves, to themselves.
// friend-notification targets another person, so it is admin-only.
const USER_ALLOWED_TYPES: EmailType[] = ['welcome', 'task-reminder', 'weekly-stats'];
const USER_RATE_LIMIT_MAX = 10;
const USER_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  if (record && now < record.resetTime) {
    if (record.count >= USER_RATE_LIMIT_MAX) return true;
    record.count++;
    return false;
  }
  rateLimitMap.set(userId, { count: 1, resetTime: now + USER_RATE_LIMIT_WINDOW_MS });
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUser(req.headers?.['authorization'] ?? req.headers?.['Authorization']);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '').toLowerCase();
  const isAdmin = !!adminEmail && user.email.toLowerCase() === adminEmail;

  try {
    const { type, to, config: requestedConfig, data } = req.body as SendEmailRequest;

    if (!type || !to || !data) {
      return res.status(400).json({ error: 'Missing required fields: type, to, data' });
    }

    if (!(type in EMAIL_SUBJECTS)) {
      return res.status(400).json({ error: 'Invalid email type' });
    }

    if (!isAdmin) {
      if (!USER_ALLOWED_TYPES.includes(type)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (to.trim().toLowerCase() !== user.email.toLowerCase()) {
        return res.status(403).json({ error: 'You can only send emails to your own address' });
      }
      if (isRateLimited(user.id)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
    }

    // Only the admin may customize branding (it also feeds the "from" name).
    const config = isAdmin ? requestedConfig : undefined;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const html = await renderEmail({ type, to, config, data });
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
        to: to.trim(),
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
