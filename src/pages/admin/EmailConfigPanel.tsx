import { Mail, Send, Settings, Eye } from 'lucide-react';
import React, { useState } from 'react';

import { defaultEmailConfig, type EmailConfig } from '@/emails/EmailLayout';
import FriendNotificationEmail from '@/emails/FriendNotificationEmail';
import TaskReminderEmail from '@/emails/TaskReminderEmail';
import WeeklyStatsEmail from '@/emails/WeeklyStatsEmail';
import WelcomeEmail from '@/emails/WelcomeEmail';

type EmailType = 'welcome' | 'task-reminder' | 'weekly-stats' | 'friend-notification';

const EMAIL_TYPES: { id: EmailType; label: string; description: string }[] = [
  { id: 'welcome', label: 'Welcome', description: 'Sent when a new user registers' },
  { id: 'task-reminder', label: 'Task Reminder', description: 'Sent when tasks are due soon' },
  { id: 'weekly-stats', label: 'Weekly Stats', description: 'Weekly summary of user activity' },
  { id: 'friend-notification', label: 'Friend Notification', description: 'Sent on friend interactions' },
];

const EmailConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<EmailConfig>(defaultEmailConfig);
  const [selectedType, setSelectedType] = useState<EmailType>('welcome');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConfigChange = (key: keyof EmailConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setSendResult(null);
    try {
      const { render } = await import('@react-email/render');
      const sampleData = getSampleData(selectedType);
      let html: string;

      if (selectedType === 'welcome') {
        html = await render(React.createElement(WelcomeEmail, { ...sampleData, config } as any));
      } else if (selectedType === 'task-reminder') {
        html = await render(React.createElement(TaskReminderEmail, { ...sampleData, config } as any));
      } else if (selectedType === 'weekly-stats') {
        html = await render(React.createElement(WeeklyStatsEmail, { ...sampleData, config } as any));
      } else {
        html = await render(React.createElement(FriendNotificationEmail, { ...sampleData, config } as any));
      }

      setPreviewHtml(html);
    } catch (err) {
      setSendResult({ success: false, message: `Preview error: ${err instanceof Error ? err.message : 'Unknown'}` });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      setSendResult({ success: false, message: 'Please enter a test email address' });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const sampleData = getSampleData(selectedType);
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          to: testEmail.trim(),
          config,
          data: sampleData,
        }),
      });

      if (response.ok) {
        setSendResult({ success: true, message: `Test email sent to ${testEmail}` });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSendResult({ success: false, message: errorData.error || `HTTP ${response.status}` });
      }
    } catch (err) {
      setSendResult({ success: false, message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-[var(--accent-primary)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Email Configuration</h2>
          <p className="text-xs text-[var(--text-secondary)]">Customize and test email notifications</p>
        </div>
      </div>

      {/* Config inputs */}
      <div className="bg-[var(--bg-secondary)]/20 border-2 border-[var(--border-primary)]/30 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings size={16} className="text-[var(--text-secondary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Brand Settings</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">App Name</label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) => handleConfigChange('appName', e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                className="w-10 h-9 rounded-lg border-2 border-[var(--border-primary)] cursor-pointer bg-[var(--bg-primary)]"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border-2 border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Logo URL (optional)</label>
            <input
              type="text"
              value={config.logoUrl || ''}
              onChange={(e) => handleConfigChange('logoUrl', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border-2 border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Footer Text</label>
            <input
              type="text"
              value={config.footerText}
              onChange={(e) => handleConfigChange('footerText', e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Email type selector */}
      <div className="bg-[var(--bg-secondary)]/20 border-2 border-[var(--border-primary)]/30 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Select Email Type</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {EMAIL_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => { setSelectedType(type.id); setPreviewHtml(null); setSendResult(null); }}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedType === type.id
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/30'
              }`}
            >
              <p className="text-sm font-semibold text-[var(--text-primary)]">{type.label}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview & Test */}
      <div className="bg-[var(--bg-secondary)]/20 border-2 border-[var(--border-primary)]/30 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[var(--border-primary)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-secondary)]/30 disabled:opacity-50 transition-all"
          >
            <Eye size={16} />
            {previewLoading ? 'Loading...' : 'Preview Email'}
          </button>

          <div className="flex flex-1 gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="flex-1 px-3 py-2 text-sm border-2 border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
            <button
              onClick={handleSendTest}
              disabled={sending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Send size={16} />
              {sending ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        </div>

        {sendResult && (
          <div className={`p-3 rounded-lg text-sm ${sendResult.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {sendResult.message}
          </div>
        )}

        {previewHtml && (
          <div className="mt-4">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Email Preview:</p>
            <div className="border-2 border-[var(--border-primary)] rounded-lg overflow-hidden bg-white max-h-[500px] overflow-y-auto">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[500px] border-0"
                title="Email Preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function getSampleData(type: EmailType): Record<string, unknown> {
  switch (type) {
    case 'welcome':
      return { userName: 'John', loginUrl: 'https://unitracker.me' };
    case 'task-reminder':
      return {
        userName: 'John',
        tasks: [
          { title: 'Complete Math Assignment', dueDate: 'Tomorrow', workspace: 'Mathematics' },
          { title: 'Read Chapter 5 - Biology', dueDate: 'In 3 days', workspace: 'Biology' },
        ],
        tasksUrl: 'https://unitracker.me',
      };
    case 'weekly-stats':
      return {
        userName: 'John',
        stats: {
          studyTime: '12h 30m',
          pomodorosCompleted: 18,
          tasksCompleted: 7,
          habitsCompleted: 5,
          longestStreak: 12,
        },
        statsUrl: 'https://unitracker.me',
      };
    case 'friend-notification':
      return {
        userName: 'John',
        friendName: 'Sarah',
        action: 'request' as const,
        appUrl: 'https://unitracker.me',
      };
  }
}

export default EmailConfigPanel;
