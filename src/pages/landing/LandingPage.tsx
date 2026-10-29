import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Github,
  NotebookPen,
  Timer,
  WifiOff,
} from 'lucide-react';
import Pomodoro from '@/pages/session/Pomodoro';
import StudyTimer from '@/pages/session/StudyTimer';

const features = [
  { icon: Timer, label: 'Pomodoro & study timer', desc: 'Focus sessions that log themselves.' },
  { icon: CheckCircle2, label: 'Tasks', desc: 'Deadlines, priorities, statuses.' },
  { icon: Calendar, label: 'Calendar', desc: 'Week and month views, drag-and-drop.' },
  { icon: BarChart3, label: 'Analytics', desc: 'See where your hours actually go.' },
  { icon: NotebookPen, label: 'Notes & habits', desc: 'Markdown notes plus daily streaks.' },
  { icon: WifiOff, label: 'Offline-first', desc: 'Everything works without internet.' },
];

const ShowcaseFrame = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-xl border border-white/10 bg-[#0b0b0f] overflow-hidden">
    <div className="flex items-center gap-2 px-4 h-9 border-b border-white/[0.06]">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
      </div>
      <span className="text-[11px] text-white/40 ml-2 font-mono">unitracker/{title}</span>
    </div>
    <div className="p-3 max-h-[420px] overflow-y-auto">
      {children}
    </div>
  </div>
);

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent-primary)] mb-4">
    {children}
  </p>
);

// Resets onboarding flags so entering the app replays welcome → color → login
const startOnboarding = () => {
  try {
    ['hasSeenWelcomeModal', 'hasSeenThemeSelectionModal', 'hasSeenAccentColorModal', 'hasSeenLoginModal']
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
};

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>UniTracker - Free Pomodoro Timer & Task Manager | Open Source</title>
        <meta
          name="description"
          content="Free Pomodoro timer, task manager, calendar, and study analytics in one open source app. Works offline, syncs when you're back. No ads, no subscriptions."
        />
        <meta
          name="keywords"
          content="pomodoro timer, free task manager, study timer, time tracker, productivity app, open source pomodoro, offline task app"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://unitracker.me/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/" />
        <meta property="og:title" content="UniTracker - Free Pomodoro Timer & Task Manager" />
        <meta property="og:description" content="Free Pomodoro timer, task manager, calendar, and study analytics in one open source app. Works offline." />
        <meta property="og:image" content="https://unitracker.me/assets/og-image.png" />
        <meta property="og:site_name" content="UniTracker" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://unitracker.me/" />
        <meta name="twitter:title" content="UniTracker - Free Pomodoro Timer & Task Manager" />
        <meta name="twitter:description" content="Free Pomodoro timer, task manager, calendar, and study analytics in one open source app. Works offline." />
        <meta name="twitter:image" content="https://unitracker.me/assets/og-image.png" />
        <meta name="twitter:site" content="@UniTrackerApp" />

        {/* Structured data — rich result eligibility */}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'UniTracker',
          url: 'https://unitracker.me/',
          applicationCategory: 'ProductivityApplication',
          operatingSystem: 'Web',
          description:
            'Free Pomodoro timer, task manager, calendar, and study analytics in one open source app. Works offline, syncs when you reconnect.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          featureList:
            'Pomodoro timer, study timer, task management, calendar, time analytics, notes, habits, offline-first, cloud sync',
        })}</script>
      </Helmet>

      <style>{`
        @keyframes um-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-um-rise { animation: um-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .animate-um-rise { animation: none !important; }
        }
      `}</style>

      <div className="h-screen overflow-y-auto overflow-x-hidden scroll-smooth bg-[#0a0a0d] text-[#e4e4e7] pb-16 antialiased">
        {/* Nav — minimal, hairline */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0d]/80 border-b border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
            <Link to="/" className="font-heading text-[15px] font-bold tracking-tight">
              Uni<span className="text-[var(--accent-primary)]">Tracker</span>
            </Link>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/rickypcyt/unitracker"
                target="_blank"
                rel="noopener"
                className="hidden sm:flex px-3 py-1.5 rounded-md text-[13px] font-medium text-white/50 hover:text-white transition-colors items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
              <Link
                to="/app"
                onClick={startOnboarding}
                className="text-[13px] font-semibold px-4 py-1.5 rounded-md bg-white text-black hover:bg-white/90 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero — Resend style: eyebrow, tight headline, minimal CTAs */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[700px] h-[500px] opacity-[0.10] blur-3xl"
            style={{ background: 'radial-gradient(ellipse at center, var(--accent-primary) 0%, transparent 65%)' }}
          />
          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-14">
            <div className="animate-um-rise max-w-2xl">
              <Eyebrow>// Free & open source</Eyebrow>
              <h1 className="text-[2.5rem] sm:text-6xl font-heading font-bold mb-5 tracking-[-0.03em] leading-[1.05]">
                One app for<br />your study time.
              </h1>
              <p className="text-base sm:text-lg text-white/50 max-w-lg mb-8 leading-relaxed">
                Pomodoro, tasks, calendar, and analytics — designed to stay out of your way. Works offline, syncs when you're back.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/app"
                  onClick={startOnboarding}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
                >
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://github.com/rickypcyt/unitracker"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md border border-white/10 text-white/70 font-medium text-sm hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Live timers */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <Eyebrow>// Live, not screenshots</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight mb-2">
              The real timers, right here.
            </h2>
            <p className="text-white/50 text-sm mb-8 max-w-md">
              These are the actual components from the app. Press play — enable sync and control both from one.
            </p>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
              <ShowcaseFrame title="pomodoro">
                <Pomodoro hideHeader fresh />
              </ShowcaseFrame>
              <ShowcaseFrame title="study-timer">
                <StudyTimer hideHeader />
              </ShowcaseFrame>
            </div>
          </div>
        </section>

        {/* Features — hairline grid, Resend style */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <Eyebrow>// Everything in one place</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight mb-10">
              Less juggling, more studying.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/[0.06]">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="border-b border-r border-white/[0.06] p-6 hover:bg-white/[0.03] transition-colors group"
                >
                  <f.icon className="w-4 h-4 text-[var(--accent-primary)] mb-4" />
                  <h3 className="text-sm font-semibold text-white/90 mb-1">{f.label}</h3>
                  <p className="text-[13px] text-white/45 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
            <Eyebrow>// Start now</Eyebrow>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold tracking-tight mb-3">
              Tracking in 30 seconds.
            </h2>
            <p className="text-white/50 text-sm mb-8">Free forever · No ads · Open source</p>
            <Link
              to="/app"
              onClick={startOnboarding}
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-md bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Footer — minimal hairline */}
        <footer className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="font-mono text-xs text-white/40">unitracker © 2026 · MIT</span>
            <div className="flex items-center gap-5 text-[13px] text-white/40">
              <a href="https://github.com/rickypcyt/unitracker" target="_blank" rel="noopener" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://github.com/rickypcyt/unitracker/issues" target="_blank" rel="noopener" className="hover:text-white transition-colors">Issues</a>
              <Link to="/app" onClick={startOnboarding} className="hover:text-white transition-colors flex items-center gap-0.5">
                Get started <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
