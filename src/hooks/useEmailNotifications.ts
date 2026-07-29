import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './useAuth';

export type EmailType = 'welcome' | 'task-reminder' | 'weekly-stats' | 'friend-notification';

export interface EmailPreferences {
  welcome: boolean;
  taskReminder: boolean;
  weeklyStats: boolean;
  friendNotifications: boolean;
}

const DEFAULT_PREFERENCES: EmailPreferences = {
  welcome: true,
  taskReminder: true,
  weeklyStats: true,
  friendNotifications: true,
};

const STORAGE_KEY = 'emailPreferences';

export const useEmailNotifications = () => {
  const { isLoggedIn } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreferences>(DEFAULT_PREFERENCES);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      } catch {
        setPreferences(DEFAULT_PREFERENCES);
      }
    }
  }, [isLoggedIn]);

  const updatePreference = useCallback((key: keyof EmailPreferences, value: boolean) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const sendEmail = useCallback(async (
    type: EmailType,
    to: string,
    data: Record<string, unknown>,
    configOverride?: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> => {
    setSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, to, data, config: configOverride }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || `HTTP ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setSending(false);
    }
  }, []);

  const sendWelcomeEmail = useCallback(async (email: string, userName: string) => {
    if (!preferences.welcome) return { success: false, error: 'Welcome emails disabled' };
    return sendEmail('welcome', email, { userName, loginUrl: window.location.origin });
  }, [preferences.welcome, sendEmail]);

  const sendTaskReminder = useCallback(async (
    email: string,
    userName: string,
    tasks: { title: string; dueDate?: string; workspace?: string }[],
  ) => {
    if (!preferences.taskReminder) return { success: false, error: 'Task reminder emails disabled' };
    return sendEmail('task-reminder', email, { userName, tasks, tasksUrl: window.location.origin });
  }, [preferences.taskReminder, sendEmail]);

  const sendWeeklyStats = useCallback(async (
    email: string,
    userName: string,
    stats: {
      studyTime: string;
      pomodorosCompleted: number;
      tasksCompleted: number;
      habitsCompleted: number;
      longestStreak: number;
    },
  ) => {
    if (!preferences.weeklyStats) return { success: false, error: 'Weekly stats emails disabled' };
    return sendEmail('weekly-stats', email, { userName, stats, statsUrl: window.location.origin });
  }, [preferences.weeklyStats, sendEmail]);

  const sendFriendNotification = useCallback(async (
    email: string,
    userName: string,
    friendName: string,
    action: 'added' | 'request' | 'accepted',
  ) => {
    if (!preferences.friendNotifications) return { success: false, error: 'Friend notification emails disabled' };
    return sendEmail('friend-notification', email, { userName, friendName, action, appUrl: window.location.origin });
  }, [preferences.friendNotifications, sendEmail]);

  return {
    preferences,
    updatePreference,
    sending,
    sendEmail,
    sendWelcomeEmail,
    sendTaskReminder,
    sendWeeklyStats,
    sendFriendNotification,
  };
};
