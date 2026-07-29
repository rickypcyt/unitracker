import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components';
import React, { ReactNode } from 'react';

export interface EmailConfig {
  appName: string;
  primaryColor: string;
  logoUrl?: string;
  footerText: string;
  socialLinks?: { label: string; url: string }[];
}

export const defaultEmailConfig: EmailConfig = {
  appName: 'UniTracker',
  primaryColor: '#0A84FF',
  footerText: '© 2026 UniTracker. All rights reserved.',
  socialLinks: [
    { label: 'Website', url: 'https://unitracker.me' },
  ],
};

interface EmailLayoutProps {
  children: ReactNode;
  preview: string;
  config: EmailConfig;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, preview, config }) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: 0, backgroundColor: '#f4f5f7' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.appName} style={{ height: 40, margin: '0 auto' }} />
            ) : (
              <Heading style={{ color: config.primaryColor, fontSize: 24, fontWeight: 700, margin: 0 }}>
                {config.appName}
              </Heading>
            )}
          </div>

          {/* Content card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 32, marginBottom: 24 }}>
            {children}
          </div>

          {/* Footer */}
          <Hr style={{ border: 'none', borderTop: '1px solid #e4e7eb', margin: '24px 0' }} />
          <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
            {config.footerText}
          </Text>
          {config.socialLinks && config.socialLinks.length > 0 && (
            <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              {config.socialLinks.map((link, i) => (
                <React.Fragment key={link.label}>
                  {i > 0 && ' · '}
                  <a href={link.url} style={{ color: config.primaryColor, textDecoration: 'none' }}>
                    {link.label}
                  </a>
                </React.Fragment>
              ))}
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  );
};

// Shared button component
export const EmailButton: React.FC<{ href: string; label: string; color: string }> = ({ href, label, color }) => (
  <a
    href={href}
    style={{
      display: 'inline-block',
      padding: '12px 28px',
      backgroundColor: color,
      color: '#ffffff',
      borderRadius: 8,
      fontSize: 15,
      fontWeight: 600,
      textDecoration: 'none',
      margin: '16px 0',
    }}
  >
    {label}
  </a>
);
