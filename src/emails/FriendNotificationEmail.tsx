import { Heading, Section, Text } from '@react-email/components';
import React from 'react';

import { EmailButton, EmailLayout, type EmailConfig } from './EmailLayout';

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
    <Heading style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
      {friendName} {actionText[action]}! 👥
    </Heading>
    <Text style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.6 }}>
      Hi {userName}, <strong>{friendName}</strong> {actionText[action]} on {config.appName}.
    </Text>
    <Section style={{ margin: '24px 0' }}>
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#f9fafb',
          borderRadius: 10,
          textAlign: 'center',
        }}
      >
        <Text style={{ fontSize: 16, color: '#111827', margin: 0 }}>
          {action === 'request' ? 'You have a pending friend request waiting for you.' : `You and ${friendName} are now friends!`}
        </Text>
      </div>
    </Section>
    <Text style={{ fontSize: 15, color: '#4b5563' }}>
      {action === 'request' ? 'View and respond to friend requests:' : 'Start studying together:'}
    </Text>
    <EmailButton href={appUrl} label={action === 'request' ? 'View Requests' : 'Open App'} color={config.primaryColor} />
  </EmailLayout>
);

export default FriendNotificationEmail;
