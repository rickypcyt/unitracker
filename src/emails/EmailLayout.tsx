import { Body, Container, Head, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
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
  primaryColor: '#1e90ff',
  footerText: '© 2026 UniTracker. All rights reserved.',
  socialLinks: [
    { label: 'Website', url: 'https://unitracker.me' },
    { label: 'GitHub', url: 'https://github.com/rickypcyt/unitracker' },
  ],
};

// Edge-to-edge black layout: flat sections, hairline dividers, big uppercase
// condensed headlines and sharp rectangular buttons.
export const emailTheme = {
  bg: '#000000',
  bg2: '#0c0c0e',
  stroke: '#232326',
  fg: '#ffffff',
  fg2: '#a1a1aa',
  faint: '#71717a',
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  condensed: "'Arial Narrow', 'Helvetica Neue', 'Roboto Condensed', Impact, Arial, sans-serif",
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

interface EmailLayoutProps {
  children: ReactNode;
  preview: string;
  config: EmailConfig;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, preview, config }) => {
  const t = emailTheme;
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ fontFamily: t.font, margin: 0, padding: 0, backgroundColor: t.bg2, color: t.fg }}>
        <Container style={{ maxWidth: 640, margin: '0 auto', backgroundColor: t.bg }}>
          {/* Logo */}
          <Section style={{ padding: '24px' }}>
            {config.logoUrl ? (
              <Img src={config.logoUrl} alt={config.appName} height="32" style={{ display: 'block' }} />
            ) : (
              <Text style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: t.fg }}>
                <span style={{ color: config.primaryColor }}>●</span>&nbsp; {config.appName}
              </Text>
            )}
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Section style={{ padding: '56px 24px 48px', borderTop: `1px solid ${t.stroke}` }}>
            <Text style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: t.fg2, maxWidth: 340 }}>
              {config.appName} brings your timer, tasks, habits and stats into one place, so you can focus on studying.
            </Text>
            {config.socialLinks && config.socialLinks.length > 0 && (
              <Text style={{ margin: '24px 0 0', fontSize: 13, color: t.fg2 }}>
                {config.socialLinks.map((link, i) => (
                  <React.Fragment key={link.label}>
                    {i > 0 && <span style={{ color: t.stroke }}>&nbsp;&nbsp;/&nbsp;&nbsp;</span>}
                    <Link href={link.url} style={{ color: t.fg, textDecoration: 'none' }}>
                      {link.label}
                    </Link>
                  </React.Fragment>
                ))}
              </Text>
            )}
            <Text style={{ margin: '24px 0 0', fontSize: 11, color: t.faint }}>{config.footerText}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

/** Hero block: big uppercase headline, copy and an optional button. */
export const EmailHero: React.FC<{ title: string; children?: ReactNode; cta?: ReactNode }> = ({
  title,
  children,
  cta,
}) => (
  <Section style={{ padding: '40px 24px 56px' }}>
    <Text style={emailText.display}>{title}</Text>
    {children}
    {cta && <div style={{ marginTop: 32 }}>{cta}</div>}
  </Section>
);

/** Titled block of dividers, like the "Get started" list. */
export const EmailListSection: React.FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <Section style={{ padding: '0 24px 48px' }}>
    <Text style={{ ...emailText.display, fontSize: 28, margin: '0 0 8px' }}>{title}</Text>
    {children}
  </Section>
);

export const EmailListItem: React.FC<{ title: string; children?: ReactNode }> = ({ title, children }) => (
  <Section style={{ padding: '28px 0', borderBottom: `1px solid ${emailTheme.stroke}` }}>
    <Text style={{ margin: 0, fontFamily: emailTheme.condensed, fontSize: 20, fontWeight: 600, color: emailTheme.fg }}>
      {title}
    </Text>
    {children && <Text style={{ ...emailText.body, margin: '10px 0 0' }}>{children}</Text>}
  </Section>
);

// Sharp rectangular button in the accent color.
export const EmailButton: React.FC<{ href: string; label: string; color: string }> = ({ href, label, color }) => (
  <a
    href={href}
    style={{
      display: 'inline-block',
      padding: '14px 20px',
      backgroundColor: color,
      color: '#000000',
      fontSize: 15,
      fontWeight: 600,
      textDecoration: 'none',
      textAlign: 'center',
    }}
  >
    {label}
  </a>
);

// Shared text styles
export const emailText = {
  display: {
    margin: 0,
    fontFamily: emailTheme.condensed,
    fontSize: 44,
    fontWeight: 600,
    lineHeight: 1.05,
    letterSpacing: '-0.01em',
    textTransform: 'uppercase',
    color: emailTheme.fg,
  } as React.CSSProperties,
  body: {
    fontSize: 14,
    lineHeight: 1.65,
    color: emailTheme.fg2,
    margin: '20px 0 0',
  } as React.CSSProperties,
  small: {
    fontSize: 12,
    color: emailTheme.faint,
    margin: '20px 0 0',
  } as React.CSSProperties,
};
