import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Github,
  NotebookPen,
  Sparkles,
  Timer,
  WifiOff,
} from 'lucide-react';
import Pomodoro from '@/pages/session/Pomodoro';
import StudyTimer from '@/pages/session/StudyTimer';

const features = [
  {
    icon: Timer,
    title: 'Pomodoro Timer',
    desc: 'Custom work/break intervals with sound and notifications.',
    big: true,
  },
  {
    icon: CheckCircle2,
    title: 'Task Management',
    desc: 'Kanban with drag-and-drop, tags, deadlines, and calendar sync.',
  },
  {
    icon: Calendar,
    title: 'Calendar View',
    desc: 'Tasks and sessions in one calendar with Google export.',
  },
  {
    icon: BarChart3,
    title: 'Time Analytics',
    desc: 'Track hours, completion, and streaks in clear charts.',
  },
  {
    icon: NotebookPen,
    title: 'Notes & Habits',
    desc: 'Markdown notes for projects plus habit streaks.',
  },
  {
    icon: Download,
    title: 'Export & Backup',
    desc: 'Export CSV, PDF, JSON. Import from Notion, Todoist, Google.',
  },
];

const values = [
  {
    icon: Sparkles,
    title: 'Free forever',
    desc: 'No ads, no subscriptions, no paywalls.',
  },
  {
    icon: Github,
    title: 'Open source',
    desc: 'MIT licensed. Audit, fork, or contribute on GitHub.',
  },
  {
    icon: WifiOff,
    title: 'Offline-first',
    desc: 'Works fully offline. Syncs when you reconnect.',
  },
  {
    icon: Download,
    title: 'Your data',
    desc: 'Export anytime in CSV, PDF, or JSON. No lock-in.',
  },
];

// ─── Real Component Showcase ────────────────────────────────────────────────

const ShowcaseFrame = ({ title, children }: { title: string; children: ReactNode }) => {
  return (
    <div className="rounded-2xl ring-1 ring-inset ring-white/10 bg-[var(--bg-secondary)] overflow-hidden shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 px-4 h-9 border-b border-white/5 bg-black/30">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-[var(--text-secondary)] ml-2 font-mono">UniTracker — {title}</span>
      </div>
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

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
        <title>UniTracker 2026 - Free Time & Task Management App | Pomodoro Timer</title>
        <meta
          name="description"
          content="Replace 6 apps with one. Pomodoro timer, tasks, calendar, analytics, notes, and habits — all in one free and open source app. Track your time across every area. No ads, no subscriptions."
        />
        <meta
          name="keywords"
          content="free productivity app, pomodoro timer, task manager, time tracker, focus timer, work tracker, kanban board, focus sessions, calendar, analytics, notes, habits"
        />
        <link rel="canonical" href="https://unitracker.me/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/" />
        <meta property="og:title" content="UniTracker 2026 - Free Time & Task Management App" />
        <meta property="og:description" content="Replace 6 apps with one. Pomodoro timer, tasks, calendar, analytics, notes, and habits — all in one free and open source app." />
        <meta property="og:image" content="https://unitracker.me/assets/og-image.png" />
        <meta property="og:site_name" content="UniTracker" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://unitracker.me/" />
        <meta name="twitter:title" content="UniTracker 2026 - Free Time & Task Management App" />
        <meta name="twitter:description" content="Replace 6 apps with one. Pomodoro timer, tasks, calendar, analytics, notes, and habits — all in one free and open source app." />
        <meta name="twitter:image" content="https://unitracker.me/assets/og-image.png" />
        <meta name="twitter:site" content="@UniTrackerApp" />
      </Helmet>

      <style>{`
        @keyframes um-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-um-rise { animation: um-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }

        /* Shiny button effect */
        .shiny-btn {
          position: relative;
          overflow: hidden;
        }
        .shiny-btn .shine-overlay {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 255, 255, 0.25) 50%,
            transparent 70%
          );
          transition: none;
          pointer-events: none;
        }
        .shiny-btn:hover .shine-overlay {
          animation: shine-sweep 0.9s ease-out;
        }
        @keyframes shine-sweep {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .shiny-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3);
          transition: box-shadow 0.4s ease;
          pointer-events: none;
        }
        .shiny-btn:hover::after {
          box-shadow: 0 0 20px 4px rgba(255, 255, 255, 0.1);
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-um-rise, .animate-ping, .shiny-btn .shine-overlay { animation: none !important; }
        }
      `}</style>

      <div
        className="h-screen overflow-y-auto overflow-x-hidden scroll-smooth bg-[var(--bg-primary)] text-[var(--text-primary)]"
      >
        {/* Nav */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-fluid h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="font-heading text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Uni<span className="text-[var(--accent-primary)]">Tracker</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <a
                href="https://github.com/rickypcyt/unitracker"
                target="_blank"
                rel="noopener"
                className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all flex items-center gap-1.5"
              >
                <Github className="w-4 h-4" /> GitHub
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/app"
                className="hidden sm:block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2"
              >
                Log in
              </Link>
              <Link
                to="/app"
                onClick={startOnboarding}
                className="shiny-btn text-sm font-semibold px-4 py-2 rounded-xl ring-1 ring-inset ring-[var(--accent-primary)]/60 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all active:scale-95"
              >
                Get started free
                <span className="shine-overlay" />
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full opacity-[0.12] blur-3xl"
            style={{ background: 'radial-gradient(circle, #F4A63A 0%, transparent 70%)' }}
          />
          <div className="relative max-w-7xl mx-auto px-fluid pt-fluid-hero pb-32">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-14 items-center">
              <div className="animate-um-rise">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  Your complete time & task system
                </div>
                <h1
                  className="text-fluid-hero font-heading font-semibold mb-6"
                >
                  Stop jumping between apps. Start tracking.
                </h1>
                <p className="text-fluid-lead text-[var(--text-secondary)] max-w-xl mb-10">
                  Pomodoro, tasks, calendar, notes — free, open source, and offline-ready.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Link
                    to="/app"
                    onClick={startOnboarding}
                    className="shiny-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl ring-1 ring-inset ring-[var(--accent-primary)]/60 text-[var(--accent-primary)] font-semibold text-base hover:bg-[var(--accent-primary)]/10 transition-all active:scale-95"
                  >
                    Get started free
                    <ArrowRight className="w-5 h-5" />
                    <span className="shine-overlay" />
                  </Link>
                  <a
                    href="https://github.com/rickypcyt/unitracker"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl ring-1 ring-inset ring-white/10 font-semibold text-base hover:bg-white/5 transition-colors"
                  >
                    <Github className="w-5 h-5" />
                    View on GitHub
                  </a>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[var(--accent-primary)]" /> No ads, ever</span>
                  <span className="flex items-center gap-1.5"><Download className="w-4 h-4 text-[var(--accent-primary)]" /> Export anytime</span>
                  <span className="flex items-center gap-1.5"><Github className="w-4 h-4 text-[var(--accent-primary)]" /> Open source</span>
                  <span className="flex items-center gap-1.5"><Timer className="w-4 h-4 text-[var(--accent-primary)]" /> Works offline</span>
                </div>

              </div>

              <div className="animate-um-rise" style={{ animationDelay: '120ms' }}>
                <ShowcaseFrame title="Timer">
                  <Pomodoro hideHeader />
                </ShowcaseFrame>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-fluid-section border-t border-white/5">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">Everything in one place</p>
              <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                Tools that talk to each other
              </h2>
              <p className="text-fluid-lead text-[var(--text-secondary)]">
                Timer, tasks, calendar, notes — connected, not scattered.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <div
                  key={f.title}
                  className={`group rounded-2xl ring-1 ring-inset ring-white/5 bg-white/[0.02] overflow-hidden flex flex-col hover:ring-white/10 transition-all duration-200 ${
                    f.big ? 'md:col-span-2 lg:col-span-1' : ''
                  }`}
                >
                  <dl className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                      <f.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <dt className="text-fluid-h3 font-semibold mb-2">{f.title}</dt>
                    <dd className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</dd>
                  </dl>
                  {f.big && (
                    <div className="mt-auto px-6 py-4 border-t border-white/5 flex items-center gap-3 bg-black/20">
                      <svg width="34" height="34" viewBox="0 0 34 34" className="shrink-0">
                        <circle cx="17" cy="17" r="14" fill="none" stroke="var(--border-primary)" strokeOpacity="0.3" strokeWidth="3" />
                        <circle
                          cx="17" cy="17" r="14" fill="none"
                          stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 14}
                          strokeDashoffset={2 * Math.PI * 14 * 0.32}
                          transform="rotate(-90 17 17)"
                        />
                      </svg>
                      <span className="text-sm text-[var(--text-secondary)] font-mono">
                        17:02 remaining
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live demo — Study Timer */}
        <section className="py-fluid-section border-t border-white/5">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">Live demo</p>
                <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                  Every session, logged automatically
                </h2>
                <p className="text-fluid-lead text-[var(--text-secondary)]">
                  This is the real study timer from the app — try it. Sessions log to your calendar and stats without manual entry.
                </p>
              </div>
              <div className="lg:order-1">
                <ShowcaseFrame title="Study Timer">
                  <StudyTimer hideHeader />
                </ShowcaseFrame>
              </div>
            </div>
          </div>
        </section>

        {/* How UniTracker fits your day */}
        <section className="py-fluid-section border-t border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">A day with UniTracker</p>
              <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                How it fits your workflow
              </h2>
              <p className="text-fluid-lead text-[var(--text-secondary)]">
                UniTracker fits how you already work.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  time: 'Morning',
                  icon: Calendar,
                  title: 'Check what\'s due today',
                  desc: 'Plan your day from the calendar in seconds.',
                },
                {
                  time: 'Afternoon',
                  icon: Timer,
                  title: 'Start a focus session',
                  desc: 'Pomodoro auto-logs to your calendar as you work.',
                },
                {
                  time: 'Evening',
                  icon: BarChart3,
                  title: 'See where your time went',
                  desc: 'See tracked hours and what to prioritize next.',
                },
              ].map((step) => (
                <div
                  key={step.time}
                  className="rounded-2xl ring-1 ring-inset ring-white/5 bg-white/[0.02] p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs uppercase tracking-wider text-[var(--accent-primary)] font-medium px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/10">
                      {step.time}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-fluid-h3 font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why UniTracker */}
        <section className="py-fluid-section border-t border-white/5">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">Why UniTracker</p>
              <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                No tricks, no fine print, no surprises
              </h2>
              <p className="text-fluid-lead text-[var(--text-secondary)]">
                No data selling, no ads, no paywalls. The code is public.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-2xl ring-1 ring-inset ring-white/5 bg-white/[0.02] p-6"
                >
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/10 flex items-center justify-center mb-4">
                    <v.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-fluid-h3 font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-fluid-section border-t border-white/5">
          <div className="max-w-4xl mx-auto px-fluid text-center">
              <h2 className="text-4xl sm:text-5xl font-heading font-bold text-[var(--text-primary)] mb-6">
                Ready to see where your time goes?
              </h2>
              <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
                Start in under 30 seconds. No credit card, no setup.
              </p>
              <Link
                to="/app"
                onClick={startOnboarding}
                className="shiny-btn inline-flex items-center gap-2 px-8 py-4 rounded-xl ring-1 ring-inset ring-[var(--accent-primary)]/60 text-[var(--accent-primary)] font-bold text-lg hover:bg-[var(--accent-primary)]/10 transition-all active:scale-95"
              >
                Try UniTracker free
                <ArrowRight className="w-5 h-5" />
                <span className="shine-overlay" />
              </Link>
              <p className="mt-6 text-sm text-[var(--text-secondary)]">
                No credit card required · Free forever · Open source
              </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              {/* Brand column */}
              <div className="col-span-2 md:col-span-1">
                <Link to="/" className="flex items-center gap-2.5 mb-4">
                  <span className="font-heading text-lg font-bold tracking-tight text-[var(--text-primary)]">
                    Uni<span className="text-[var(--accent-primary)]">Tracker</span>
                  </span>
                </Link>
                <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                  Free, open source time & task management. Your data, your tools, your workflow.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <a href="https://github.com/rickypcyt/unitracker" target="_blank" rel="noopener" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Product */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]/50 mb-3">Product</p>
                <ul className="space-y-2">
                  <li><Link to="/app" onClick={startOnboarding} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Get started</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]/50 mb-3">Resources</p>
                <ul className="space-y-2">
                  <li><a href="https://github.com/rickypcyt/unitracker" target="_blank" rel="noopener" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">GitHub</a></li>
                  <li><a href="https://github.com/rickypcyt/unitracker/issues" target="_blank" rel="noopener" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Report a bug</a></li>
                  <li><a href="https://github.com/rickypcyt/unitracker#readme" target="_blank" rel="noopener" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Documentation</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]/50 mb-3">About</p>
                <ul className="space-y-2">
                  <li><span className="text-sm text-[var(--text-secondary)]">MIT Licensed</span></li>
                  <li><span className="text-sm text-[var(--text-secondary)]">No ads, no tracking</span></li>
                  <li><span className="text-sm text-[var(--text-secondary)]">© 2026 UniTracker</span></li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
