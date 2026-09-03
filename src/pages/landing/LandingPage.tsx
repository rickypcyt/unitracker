import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Github,
  Lock,
  NotebookPen,
  RefreshCw,
  Sparkles,
  Timer,
  Users,
  Zap,
} from 'lucide-react';
import Pomodoro from '@/pages/session/Pomodoro';
import StudyTimer from '@/pages/session/StudyTimer';

const features = [
  {
    icon: Timer,
    title: 'Pomodoro Timer',
    desc: 'Customizable work and break intervals, with sound alerts and notifications to keep your momentum going.',
    big: true,
  },
  {
    icon: CheckCircle2,
    title: 'Task Management',
    desc: 'Kanban with drag-and-drop, assignments, difficulty levels, tags, and deadlines that sync with your calendar.',
  },
  {
    icon: Calendar,
    title: 'Calendar View',
    desc: 'Tasks and focus sessions in a unified calendar. Export to Google Calendar in one click.',
  },
  {
    icon: BarChart3,
    title: 'Time Analytics',
    desc: 'See exactly where your time goes. Tracked hours, task completion, and streaks in clear charts.',
  },
  {
    icon: NotebookPen,
    title: 'Notes & Habits',
    desc: 'Markdown notes linked to your projects, plus habit tracking with daily streaks.',
  },
  {
    icon: Download,
    title: 'Export & Backup',
    desc: 'Export your data as CSV, PDF, or JSON. Import from Notion, Todoist, and Google Calendar.',
  },
];

const valueProps = [
  {
    icon: Sparkles,
    title: 'Free forever, no catches',
    desc: 'No ads, no tracking, no paywalls. The code is on GitHub — anyone can audit it, contribute to it, or fork it.',
  },
  {
    icon: Download,
    title: 'Your data stays yours',
    desc: 'Export everything as CSV, PDF, or JSON whenever you want. Import from Notion, Todoist, and Google Calendar.',
  },
  {
    icon: Timer,
    title: 'Works without wifi',
    desc: 'Install as a PWA and use the timer, tasks, and notes offline. Your data syncs automatically when you reconnect.',
  },
];

// ─── Real Component Wrappers for Landing ────────────────────────────────────

const TimerShowcase = () => {
  return (
    <div className="rounded-2xl ring-1 ring-inset ring-white/10 bg-[var(--bg-secondary)] overflow-hidden shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 px-4 h-9 border-b border-white/5 bg-black/30">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] ml-2 font-mono">UniTracker — Timer</span>
      </div>
      <div className="p-4 max-h-[500px] overflow-y-auto">
        <Pomodoro hideHeader />
      </div>
    </div>
  );
};

const StudyTimerShowcase = () => {
  return (
    <div className="rounded-2xl ring-1 ring-inset ring-white/10 bg-[var(--bg-secondary)] overflow-hidden shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 px-4 h-9 border-b border-white/5 bg-black/30">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] ml-2 font-mono">UniTracker — Study Timer</span>
      </div>
      <div className="p-4 max-h-[500px] overflow-y-auto">
        <StudyTimer hideHeader />
      </div>
    </div>
  );
};

const AppIframeShowcase = ({ page }: { page: string }) => {
  return (
    <div className="rounded-2xl ring-1 ring-inset ring-white/10 bg-[var(--bg-secondary)] overflow-hidden shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 px-4 h-9 border-b border-white/5 bg-black/30">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] ml-2 font-mono">UniTracker — {page}</span>
      </div>
      <iframe
        src={`/app`}
        className="w-full h-[500px] border-0"
        title={`UniTracker ${page}`}
        loading="lazy"
      />
    </div>
  );
};

// ─── Static Section (replaces PinnedSection) ─────────────────────────────────

const StaticSection = ({
  label,
  title,
  description,
  children,
  reverse = false,
}: {
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
  reverse?: boolean;
}) => {
  return (
    <section className="py-fluid-section border-t border-white/5">
      <div className="max-w-7xl mx-auto px-fluid">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${reverse ? 'lg:grid-flow-col-dense' : ''}`}>
          <div className={reverse ? 'lg:col-start-2' : ''}>
            <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">{label}</p>
            <h2 className="text-fluid-h2 font-heading font-semibold mb-4">{title}</h2>
            <p className="text-fluid-lead text-[var(--text-secondary)] mb-6">{description}</p>
          </div>
          <div className={reverse ? 'lg:col-start-1 lg:row-start-1' : ''}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Tabbed Section (Sync / Collab / Encryption) ─────────────────────────────

const TabSection = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    {
      icon: RefreshCw,
      label: 'Sync',
      title: 'Start on laptop, finish on phone',
      desc: 'UniTracker syncs in real-time across all your devices. No manual refresh, no "last saved 3 hours ago" — your data is just there.',
      features: ['Real-time sync across devices', 'Conflict-free offline edits', 'Automatic backup to cloud'],
    },
    {
      icon: Users,
      label: 'Collaborate',
      title: 'Work together, stay accountable',
      desc: 'Share tasks and sessions with friends or teammates. See each other\'s progress in real-time and keep each other on track.',
      features: ['Shared task boards', 'Friend activity feed', 'Group focus sessions with timer'],
    },
    {
      icon: Lock,
      label: 'Private',
      title: 'Your data is yours, always',
      desc: 'End-to-end encrypted sync means nobody — not even us — can read your data. Export everything as CSV, PDF, or JSON anytime.',
      features: ['End-to-end encryption', 'No tracking, no ads', 'Full data export anytime'],
    },
  ];
  const active = tabs[activeTab]!;

  return (
    <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start">
      {/* Tab list */}
      <div className="relative">
        <div className="space-y-1">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                i === activeTab
                  ? 'bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/30'
                  : 'hover:bg-white/5 ring-1 ring-inset ring-white/5'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                i === activeTab ? 'bg-[var(--accent-primary)]/20' : 'bg-white/5'
              }`}>
                <tab.icon className={`w-4 h-4 ${i === activeTab ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} />
              </div>
              <div>
                <span className={`text-sm font-semibold ${i === activeTab ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                  {tab.label}
                </span>
                <p className="text-xs text-[var(--text-secondary)]/70 mt-0.5">{tab.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="rounded-2xl ring-1 ring-inset ring-white/5 bg-[var(--bg-secondary)]/30 p-6 sm:p-8 min-h-[300px]">
        <div key={activeTab} className="animate-um-rise">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <active.icon className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">{active.title}</h3>
          </div>
          <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">{active.desc}</p>
          <ul className="space-y-3">
            {active.features.map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// ─── Stats Section (Todoist-inspired big numbers) ───────────────────────────

const StatsSection = () => {
  const stats = [
    { icon: Github, value: 'Open', label: 'Source from day one' },
    { icon: Users, value: 'Built', label: 'In public, for everyone' },
    { icon: Sparkles, value: 'Free', label: 'Forever, no paywalls' },
    { icon: Timer, value: 'Offline', label: 'First, sync second' },
  ];

  return (
    <section className="py-fluid-section border-t border-white/5">
      <div className="max-w-7xl mx-auto px-fluid">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl ring-1 ring-inset ring-white/5 bg-white/[0.02] p-6 text-center hover:ring-white/10 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/10 flex items-center justify-center mb-4 mx-auto">
                <s.icon className="w-6 h-6 text-[var(--accent-primary)]" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] font-heading tabular-nums">
                {s.value}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
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

        @keyframes card-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .card-shimmer {
          background-image: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255, 255, 255, 0.03) 50%,
            transparent 60%
          );
          background-size: 200% 100%;
          animation: card-shimmer 4s ease-in-out infinite;
        }

        /* Shiny button effect (Todoist-inspired) */
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
          .animate-um-rise, .animate-ping, .card-shimmer, .shiny-btn .shine-overlay { animation: none !important; }
        }
      `}</style>

      <div
        className="h-screen overflow-y-auto overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]"
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
              {[
                { to: '/pricing', label: 'Support' },
                { to: '/compare', label: 'Compare' },
                { to: '/blog', label: 'Blog' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
                >
                  {item.label}
                </Link>
              ))}
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
                className="shiny-btn text-sm font-semibold px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white hover:brightness-110 hover:shadow-lg hover:shadow-[var(--accent-primary)]/25 transition-all active:scale-95"
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
                  Plan your projects, focus with Pomodoro, track your hours, and keep your notes together —
                  without switching between six different apps.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Link
                    to="/app"
                    className="shiny-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-base hover:brightness-110 hover:shadow-lg hover:shadow-[var(--accent-primary)]/25 transition-all active:scale-95"
                  >
                    Get started free
                    <ArrowRight className="w-5 h-5" />
                    <span className="shine-overlay" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl ring-1 ring-inset ring-white/10 font-semibold text-base hover:bg-white/5 transition-colors"
                  >
                    Support the project
                  </Link>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[var(--accent-primary)]" /> No ads, ever</span>
                  <span className="flex items-center gap-1.5"><Download className="w-4 h-4 text-[var(--accent-primary)]" /> Export anytime</span>
                  <span className="flex items-center gap-1.5"><Github className="w-4 h-4 text-[var(--accent-primary)]" /> Open source</span>
                  <span className="flex items-center gap-1.5"><Timer className="w-4 h-4 text-[var(--accent-primary)]" /> Works offline</span>
                </div>

              </div>

              <div className="animate-um-rise" style={{ animationDelay: '120ms' }}>
                <TimerShowcase />
              </div>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="py-fluid-section border-t border-white/5">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-14 items-center">
              <dl className="space-y-8">
                <div>
                  <dt className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <h3 className="text-fluid-h3 font-semibold">No tab switching. No scattered notes. Just work.</h3>
                  </dt>
                  <dd className="text-[var(--text-secondary)] text-fluid-lead pl-13">
                    Timer, tasks, and notes live in the same window. One shortcut to start a session, one click to check what's due, one place for everything.
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/20 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <h3 className="text-fluid-h3 font-semibold">Private by default</h3>
                  </dt>
                  <dd className="text-[var(--text-secondary)] text-fluid-lead pl-13">
                    Your data lives on your device. Sync is end-to-end encrypted. No tracking, no analytics, no selling your data.
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/20 flex items-center justify-center">
                      <Github className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <h3 className="text-fluid-h3 font-semibold">Yours to keep</h3>
                  </dt>
                  <dd className="text-[var(--text-secondary)] text-fluid-lead pl-13">
                    Open source, MIT licensed. Fork it, audit it, contribute to it. Export everything as CSV, PDF, or JSON anytime.
                  </dd>
                </div>
              </dl>

              {/* Large logo/visual */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 opacity-20 blur-2xl" style={{ background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)' }} />
                  <span className="font-heading text-6xl font-bold tracking-tight text-[var(--accent-primary)] relative">Uni<span className="text-[var(--text-primary)]">Tracker</span></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-fluid-section border-t border-white/5">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">Connected, not stacked</p>
              <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                Tools that talk to each other
              </h2>
              <p className="text-fluid-lead text-[var(--text-secondary)]">
                Your timer logs sessions to the calendar. Sessions feed into analytics. Tasks show up on the calendar. Notes link to projects. Nothing exists in isolation.
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

        {/* Showcase — Real Components */}
        <StaticSection
          label="Focus"
          title="Real Pomodoro. Real countdown."
          description="This is the actual timer from the app, not a mockup. Try it — click play, adjust settings, sync it with your study sessions. Everything works right here."
        >
          <TimerShowcase />
        </StaticSection>

        <StaticSection
          label="Track"
          title="Every session, logged automatically."
          description="Start a focus session and UniTracker records it. No manual timers, no spreadsheets. Your time is tracked and ready for analytics."
          reverse
        >
          <StudyTimerShowcase />
        </StaticSection>

        <StaticSection
          label="Organize"
          title="Tasks, calendar, analytics — live."
          description="This is the real app running in an iframe. Tasks, calendar, and analytics are all connected. What you track here shows up everywhere."
        >
          <AppIframeShowcase page="Tasks & Calendar" />
        </StaticSection>

        {/* How UniTracker fits your day */}
        <section className="py-fluid-section border-t border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">A day with UniTracker</p>
              <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                How it fits your workflow
              </h2>
              <p className="text-fluid-lead text-[var(--text-secondary)]">
                Not another app you have to remember to open. UniTracker adapts to how you already work.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  time: 'Morning',
                  icon: Calendar,
                  title: 'Check what\'s due today',
                  desc: 'Open your calendar. See which tasks are pending, which deadlines are coming, and plan your day in 30 seconds.',
                },
                {
                  time: 'Afternoon',
                  icon: Timer,
                  title: 'Start a focus session',
                  desc: 'Pick a task, hit start on the Pomodoro timer. Your session auto-logs to the calendar so you always know where your time went.',
                },
                {
                  time: 'Evening',
                  icon: BarChart3,
                  title: 'See where your time went',
                  desc: 'Check analytics to see how many hours you tracked, what you completed, and what to prioritize tomorrow.',
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

        {/* Stats — Big numbers (Todoist-inspired) */}
        <StatsSection />

        {/* Sync securely — Tabbed Section */}
        <section className="py-fluid-section border-t border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">Sync & collaborate</p>
              <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                Your data, secured and synced
              </h2>
              <p className="text-fluid-lead text-[var(--text-secondary)]">
                Real-time sync across devices, collaborative sessions, and end-to-end encryption. Your data stays yours.
              </p>
            </div>
            <TabSection />
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
                We don't sell your data. We don't show ads. We don't lock features behind paywalls. The code is public — read it, fork it, verify it.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {valueProps.map((v) => (
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
                Start tracking in under 30 seconds. No credit card, no setup, no catch.
              </p>
              <Link
                to="/app"
                className="shiny-btn inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--accent-primary)] text-white font-bold text-lg hover:brightness-110 hover:shadow-lg hover:shadow-[var(--accent-primary)]/25 transition-all active:scale-95"
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

        {/* Community cards */}
        <section className="py-fluid-section border-t border-white/5">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">Community</p>
              <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                Built in public, for everyone
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: Github,
                  title: 'Open Source',
                  desc: 'Star us on GitHub. Contribute features, report bugs, or just read the code.',
                  link: 'https://github.com/rickypcyt/unitracker',
                  linkLabel: 'View on GitHub',
                },
                {
                  icon: Users,
                  title: 'Community',
                  desc: 'Join the first users shaping UniTracker. Your feedback directly shapes what we build next.',
                  link: '/app',
                  linkLabel: 'Join free',
                },
                {
                  icon: Sparkles,
                  title: 'Roadmap',
                  desc: 'Vote on features, suggest ideas, and see what we\'re building next.',
                  link: '/blog',
                  linkLabel: 'Read the blog',
                },
              ].map((c) => (
                <a
                  key={c.title}
                  href={c.link}
                  target={c.link.startsWith('http') ? '_blank' : undefined}
                  rel={c.link.startsWith('http') ? 'noopener' : undefined}
                  className="group rounded-2xl ring-1 ring-inset ring-white/5 bg-white/[0.02] p-6 hover:ring-white/10 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                    <c.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-fluid-h3 font-semibold mb-2">{c.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{c.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-primary)] font-medium group-hover:gap-2.5 transition-all">
                    {c.linkLabel}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </a>
              ))}
            </div>
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
                  <li><Link to="/pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Support UniTracker</Link></li>
                  <li><Link to="/compare" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Compare</Link></li>
                  <li><Link to="/blog" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Blog</Link></li>
                  <li><Link to="/app" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Get started</Link></li>
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