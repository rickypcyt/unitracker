import { Section, Text } from '@react-email/components';
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

interface AnniversaryEmailProps {
  userName: string;
  config: EmailConfig;
  appUrl?: string;
}

export const AnniversaryEmail: React.FC<AnniversaryEmailProps> = ({
  userName,
  config,
  appUrl = 'https://unitracker.me',
}) => (
  <EmailLayout preview={`${config.appName} turns 2 soon. Come take a look, ${userName}!`} config={config}>
    <EmailHero
      title={`${config.appName} turns 2`}
      cta={<EmailButton href={appUrl} label={`Open ${config.appName}`} color={config.primaryColor} />}
    >
      <Text style={emailText.body}>Hi {userName},</Text>
      <Text style={emailText.body}>
        {config.appName} is about to turn <span style={{ color: emailTheme.fg, fontWeight: 600 }}>two years old</span>.
        Thank you for being part of it. Every session you log and every task you finish helps shape what we build next.
      </Text>
      <Text style={emailText.body}>
        A lot has changed since you last visited. Come back, take a look around and see what's new.
      </Text>
    </EmailHero>

    <EmailListSection title="What's new">
      <EmailListItem title="Leaderboard">See how your study time compares with other students.</EmailListItem>
      <EmailListItem title="Noise generator">Focus sounds built into your study sessions.</EmailListItem>
      <EmailListItem title="Better tasks page">A cleaner board with centered timers on pending tasks.</EmailListItem>
    </EmailListSection>

    <Section style={{ padding: '0 24px 56px' }}>
      <Text style={{ margin: 0, fontSize: 15, color: emailTheme.fg }}>Got feedback?</Text>
      <Text style={{ margin: '2px 0 0', fontSize: 13, color: emailTheme.fg2 }}>
        Just reply to this email. We read everything.
      </Text>
    </Section>
  </EmailLayout>
);

export default AnniversaryEmail;
