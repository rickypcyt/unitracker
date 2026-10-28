import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Github,
  NotebookPen,
  Timer,
  WifiOff,
} from 'lucide-react';
import Pomodoro from '@/pages/session/Pomodoro';
import StudyTimer from '@/pages/session/StudyTimer';

const features = [
  { icon: Timer, label: 'Pomodoro & study timer' },
  { icon: CheckCircle2, label: 'Tasks with deadlines' },
  { icon: Calendar, label: 'Calendar & drag-and-drop' },
  { icon: BarChart3, label: 'Time analytics' },
  { icon: NotebookPen, label: 'Notes & habits' },
  { icon: WifiOff, label: 'Works fully offline' },
];

const ShowcaseFrame = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-2xl ring-1 ring-inset ring-white/10 bg-[var(--bg-secondary)] overflow-hidden shadow-2xl shadow-black/40">
    <div className="flex items-center gap-2 px-4 h-9 border-b border-white/5 bg-black/30">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      </div>
      <span className="text-xs text-[var(--text-secondary)] ml-2 font-mono">UniTracker — {title}</span>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
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

      <div className="h-screen overflow-y-auto overflow-x-hidden scroll-smooth bg-[var(--bg-primary)] text-[var(--text-primary)] pb-16">
        {/* Nav */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="font-heading text-lg font-bold tracking-tight">
              Uni<span className="text-[var(--accent-primary)]">Tracker</span>
            </Link>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/rickypcyt/unitracker"
                target="_blank"
                rel="noopener"
                className="hidden sm:flex px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors items-center gap-1.5"
              >
                <Github className="w-4 h-4" /> GitHub
              </a>
              <Link
                to="/app"
                onClick={startOnboarding}
                className="text-sm font-semibold px-4 py-2 rounded-xl ring-1 ring-inset ring-[var(--accent-primary)]/60 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all active:scale-95"
              >
                Get started free
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.12] blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)' }}
          />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
            <div className="animate-um-rise">
              <h1 className="text-4xl sm:text-6xl font-heading font-bold mb-5 tracking-tight">
                One app for your study time.
              </h1>
              <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
                Pomodoro, tasks, calendar, and analytics — free, open source, works offline.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
                <Link
                  to="/app"
                  onClick={startOnboarding}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl ring-1 ring-inset ring-[var(--accent-primary)]/60 text-[var(--accent-primary)] font-semibold hover:bg-[var(--accent-primary)]/10 transition-all active:scale-95"
                >
                  Get started free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="https://github.com/rickypcyt/unitracker"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl ring-1 ring-inset ring-white/10 font-semibold hover:bg-white/5 transition-colors"
                >
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Live demos */}
            <div className="animate-um-rise grid md:grid-cols-2 gap-5 max-w-4xl mx-auto text-left" style={{ animationDelay: '120ms' }}>
              <ShowcaseFrame title="Pomodoro">
                <div className="max-h-[420px] overflow-y-auto">
                  <Pomodoro hideHeader />
                </div>
              </ShowcaseFrame>
              <ShowcaseFrame title="Study Timer">
                <div className="max-h-[420px] overflow-y-auto">
                  <StudyTimer hideHeader />
                </div>
              </ShowcaseFrame>
            </div>
            <p className="mt-4 text-xs text-[var(--text-secondary)]">
              The real timers — press play and try them.
            </p>
          </div>
        </section>

        {/* Feature strip */}
        <section className="border-t border-white/5 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-col items-center gap-2 rounded-xl ring-1 ring-inset ring-white/5 bg-white/[0.02] px-3 py-4 text-center"
                >
                  <f.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-white/5 py-20 text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4">
              Start tracking in 30 seconds.
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">
              Free forever · No ads · Open source
            </p>
            <Link
              to="/app"
              onClick={startOnboarding}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl ring-1 ring-inset ring-[var(--accent-primary)]/60 text-[var(--accent-primary)] font-bold text-lg hover:bg-[var(--accent-primary)]/10 transition-all active:scale-95"
            >
              Try UniTracker free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-heading font-bold">
              Uni<span className="text-[var(--accent-primary)]">Tracker</span>
              <span className="ml-3 text-xs font-normal text-[var(--text-secondary)]">MIT · © 2026</span>
            </span>
            <div className="flex items-center gap-5 text-sm text-[var(--text-secondary)]">
              <a href="https://github.com/rickypcyt/unitracker" target="_blank" rel="noopener" className="hover:text-[var(--text-primary)] transition-colors">GitHub</a>
              <a href="https://github.com/rickypcyt/unitracker/issues" target="_blank" rel="noopener" className="hover:text-[var(--text-primary)] transition-colors">Report a bug</a>
              <Link to="/app" onClick={startOnboarding} className="hover:text-[var(--text-primary)] transition-colors">Get started</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
