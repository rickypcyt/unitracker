import { Section, Text } from '@react-email/components';
import React from 'react';

import { EmailButton, EmailHero, EmailLayout, emailText, emailTheme, type EmailConfig } from './EmailLayout';

interface FriendNotificationEmailProps {
  userName: string;
  friendName: string;
  action: 'added' | 'request' | 'accepted';
  config: EmailConfig;
  appUrl?: string;
}

const actionText: Record<FriendNotificationEmailProps['action'], string> = {
  added: 'added you as a friend',
  request: 'sent you a friend request',
  accepted: 'accepted your friend request',
};

export const FriendNotificationEmail: React.FC<FriendNotificationEmailProps> = ({
  userName,
  friendName,
  action,
  config,
  appUrl = 'https://unitracker.me',
}) => (
  <EmailLayout preview={`${friendName} ${actionText[action]}`} config={config}>
    <EmailHero
      title={`${friendName} ${actionText[action]}`}
      cta={
        <EmailButton
          href={appUrl}
          label={action === 'request' ? 'View requests' : 'Open app'}
          color={config.primaryColor}
        />
      }
    >
      <Text style={emailText.body}>
        Hi {userName}, <span style={{ color: emailTheme.fg, fontWeight: 600 }}>{friendName}</span> {actionText[action]}{' '}
        on {config.appName}.
      </Text>
      <Text style={emailText.body}>
        {action === 'request'
          ? 'You have a pending friend request waiting for you.'
          : `You and ${friendName} are now friends. Study together!`}
      </Text>
    </EmailHero>
    <Section style={{ padding: '0 0 8px' }} />
  </EmailLayout>
);

export default FriendNotificationEmail;
