import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Flame,
  Github,
  NotebookPen,
  Sparkles,
  Timer,
} from 'lucide-react';

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
    desc: 'Kanban with drag-and-drop, assignments, difficulty levels, tags, and AI-powered task creation.',
  },
  {
    icon: Calendar,
    title: 'Calendar View',
    desc: 'Tasks and study sessions in a unified calendar. Export to Google Calendar in one click.',
  },
  {
    icon: BarChart3,
    title: 'Study Analytics',
    desc: 'Study time, completed tasks, streaks, and productivity trends in clear charts.',
  },
  {
    icon: NotebookPen,
    title: 'Notes & Habits',
    desc: 'Markdown notes and study habit building with daily tracking and streaks.',
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
    title: '100% Free & Open Source',
    desc: 'No ads, no tracking, no subscriptions. The code is on GitHub for anyone to audit or contribute.',
  },
  {
    icon: Download,
    title: 'Your Data Is Yours',
    desc: 'Export everything as CSV, PDF, or JSON whenever you want. Import from Notion, Todoist, and Google Calendar.',
  },
  {
    icon: Timer,
    title: 'Works Offline',
    desc: 'Install UniTracker as a PWA and use the timer, tasks, and notes without a connection. Your data syncs when you go back online.',
  },
];

// Deterministic "study streak" heatmap data — density increases toward the
// most recent weeks, so the grid itself tells the story: momentum builds.
const STREAK_COLUMNS = 14;
const STREAK_ROWS = 7;
const streakCells = Array.from({ length: STREAK_COLUMNS * STREAK_ROWS }, (_, i) => {
  const col = Math.floor(i / STREAK_ROWS);
  const pseudo = Math.abs(Math.sin(i * 12.9898)) % 1;
  const momentum = 0.35 + 0.65 * (col / (STREAK_COLUMNS - 1));
  const value = pseudo * momentum;
  let tier = 0;
  if (value > 0.82) tier = 4;
  else if (value > 0.62) tier = 3;
  else if (value > 0.4) tier = 2;
  else if (value > 0.22) tier = 1;
  return tier;
});

const tierStyle = (tier: number) => {
  switch (tier) {
    case 4:
      return { background: 'var(--um-teal)', opacity: 1 };
    case 3:
      return { background: 'var(--um-lamp)', opacity: 0.95 };
    case 2:
      return { background: 'var(--um-lamp)', opacity: 0.55 };
    case 1:
      return { background: 'var(--um-lamp)', opacity: 0.25 };
    default:
      return { background: 'var(--text-secondary)', opacity: 0.08 };
  }
};

const StreakGrid = () => (
  <div
    className="relative rounded-2xl border border-[var(--border-primary)]/40 bg-[var(--bg-primary)] p-5 shadow-2xl shadow-black/20"
    style={{ '--um-lamp': '#F4A63A', '--um-teal': '#4FD1AE' } as React.CSSProperties}
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">Your study streak</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span
            className="text-3xl font-semibold text-[var(--text-primary)] font-mono"
          >
            ∞
          </span>
          <span className="text-sm text-[var(--text-secondary)]">possibilities</span>
        </div>
      </div>
      <div className="w-9 h-9 rounded-full bg-[var(--um-lamp)]/15 flex items-center justify-center">
        <Flame className="w-4.5 h-4.5" style={{ color: 'var(--um-lamp)' }} />
      </div>
    </div>

    <div
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${STREAK_COLUMNS}, minmax(0, 1fr))` }}
    >
      {streakCells.map((tier, i) => (
        <span
          key={i}
          className="aspect-square rounded-[2px] animate-cell-in"
          style={{ ...tierStyle(tier), animationDelay: `${Math.floor(i / STREAK_ROWS) * 28}ms` }}
        />
      ))}
    </div>

    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-primary)]/30">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: 'var(--um-teal)' }} />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'var(--um-teal)' }} />
      </span>
      <p className="text-xs text-[var(--text-secondary)]">
        Visualize your consistency week by week
      </p>
    </div>
  </div>
);

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>UniTracker 2026 - Free Study & Task Management App | Pomodoro Timer</title>
        <meta
          name="description"
          content="Replace 6 apps with one. Pomodoro timer, tasks, calendar, analytics, notes, and habits — all in one free and open source app. No ads, no subscriptions."
        />
        <meta
          name="keywords"
          content="free study app, pomodoro timer, task manager, study tracker, student productivity, assignment tracker, kanban board, study sessions, calendar, analytics, notes, habits"
        />
        <link rel="canonical" href="https://unitracker.me/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/" />
        <meta property="og:title" content="UniTracker 2026 - Free Study & Task Management App" />
        <meta property="og:description" content="Replace 6 apps with one. Pomodoro timer, tasks, calendar, analytics, notes, and habits — all in one free and open source app." />
        <meta property="og:image" content="https://unitracker.me/assets/og-image.png" />
        <meta property="og:site_name" content="UniTracker" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://unitracker.me/" />
        <meta name="twitter:title" content="UniTracker 2026 - Free Study & Task Management App" />
        <meta name="twitter:description" content="Replace 6 apps with one. Pomodoro timer, tasks, calendar, analytics, notes, and habits — all in one free and open source app." />
        <meta name="twitter:image" content="https://unitracker.me/assets/og-image.png" />
        <meta name="twitter:site" content="@UniTrackerApp" />
      </Helmet>

      <style>{`
        @keyframes um-cell-in {
          from { opacity: 0; transform: scale(0.4); }
        }
        .animate-cell-in { animation: um-cell-in 0.5s ease-out both; }

        @keyframes um-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-um-rise { animation: um-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @media (prefers-reduced-motion: reduce) {
          .animate-cell-in, .animate-um-rise, .animate-ping { animation: none !important; }
        }
      `}</style>

      <div
        className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]"
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
      >
        {/* Nav */}
        <nav className="sticky top-0 z-50 backdrop-blur-lg bg-[var(--bg-primary)]/85 border-b border-[var(--border-primary)]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Uni<span className="text-[var(--accent-primary)]">Tracker</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link to="/pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
              <Link to="/compare" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Compare</Link>
              <Link to="/blog" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Blog</Link>
              <a href="https://github.com/rickypcyt/unitracker" target="_blank" rel="noopener" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
                <Github className="w-4 h-4" /> GitHub
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/app" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Log in
              </Link>
              <Link
                to="/app"
                className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
              >
                Get started free
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
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
              <div className="animate-um-rise">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  6 apps in 1 — replace your study stack
                </div>
                <h1
                  className="text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] font-semibold tracking-tight mb-6"
                >
                  Stop jumping between apps. Start studying.
                </h1>
                <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mb-10">
                  Pomodoro timer, tasks, calendar, analytics, notes, and habits — all in one app.
                  No switching tabs, no losing context, no paying for 4 different subscriptions.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Link
                    to="/app"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-base hover:opacity-90 transition-opacity active:scale-95"
                  >
                    Start studying for free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border-primary)] font-semibold text-base hover:bg-[var(--bg-secondary)]/50 transition-colors"
                  >
                    See pricing
                  </Link>
                </div>

                <div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[var(--accent-primary)]" /> No ads</span>
                  <span className="flex items-center gap-1.5"><Download className="w-4 h-4 text-[var(--accent-primary)]" /> Export your data</span>
                  <span className="flex items-center gap-1.5"><Github className="w-4 h-4 text-[var(--accent-primary)]" /> Open source</span>
                  <span className="flex items-center gap-1.5"><Timer className="w-4 h-4 text-[var(--accent-primary)]" /> Works offline</span>
                </div>

                {/* App stack comparison */}
                <div className="mt-10 p-5 rounded-2xl border border-[var(--border-primary)]/30 bg-[var(--bg-secondary)]/20">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-3">Instead of using 6 different apps…</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {['Notion', 'Todoist', 'Forest', 'Google Calendar', 'Notability', 'Habitica'].map((app, i) => (
                      <span key={app} className={`px-2.5 py-1 rounded-lg line-through ${i < 5 ? 'text-[var(--text-secondary)]/50' : 'text-[var(--text-secondary)]/50'} decoration-[var(--text-secondary)]/30`}>
                        {app}
                      </span>
                    ))}
                    <span className="px-3 py-1 rounded-lg bg-[var(--accent-primary)] text-white font-medium">→ Uni<span className="font-bold">Tracker</span></span>
                  </div>
                </div>
              </div>

              <div className="animate-um-rise" style={{ animationDelay: '120ms' }}>
                <StreakGrid />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 border-t border-[var(--border-primary)]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">Everything in one place</p>
              <h2 className="text-3xl sm:text-4xl font-semibold mb-4">
                One app. Your complete study workflow.
              </h2>
              <p className="text-lg text-[var(--text-secondary)]">
                Every tool is connected to the others. The timer logs sessions to the calendar, sessions feed into analytics, tasks show up on the calendar. Everything works together.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <div
                  key={f.title}
                  className={`group border border-[var(--border-primary)]/30 rounded-2xl p-6 hover:border-[var(--accent-primary)]/50 hover:-translate-y-0.5 transition-all duration-200 ${
                    f.big ? 'md:col-span-2 lg:col-span-1 bg-[var(--bg-secondary)]/30' : ''
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                    <f.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
                  {f.big && (
                    <div className="mt-5 pt-5 border-t border-[var(--border-primary)]/30 flex items-center gap-3">
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

      {/* Why UniTracker */}
        <section className="py-20 border-t border-[var(--border-primary)]/30 bg-[var(--bg-secondary)]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">Why UniTracker</p>
              <h2 className="text-3xl sm:text-4xl font-semibold mb-4">
                No tricks, no fine print
              </h2>
              <p className="text-lg text-[var(--text-secondary)]">
                We don't sell your data, we don't show ads, we don't lock features behind paywalls. It's that simple.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {valueProps.map((v) => (
                <div
                  key={v.title}
                  className="border border-[var(--border-primary)]/30 rounded-2xl p-6 bg-[var(--bg-primary)]"
                >
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4">
                    <v.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 border-t border-[var(--border-primary)]/30 overflow-hidden">
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[520px] h-[300px] opacity-[0.15] blur-3xl"
            style={{ background: 'radial-gradient(circle, #F4A63A 0%, transparent 70%)' }}
          />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold mb-4">
              One app to replace them all
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
              UniTracker replaces 6 different tools — and it's free, open source, and works offline.
            </p>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity active:scale-95"
            >
              Get started free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border-primary)]/30 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="font-bold text-sm text-[var(--text-primary)]">
                Uni<span className="text-[var(--accent-primary)]">Tracker</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
              <Link to="/pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
              <Link to="/compare" className="hover:text-[var(--text-primary)] transition-colors">Compare</Link>
              <Link to="/blog" className="hover:text-[var(--text-primary)] transition-colors">Blog</Link>
              <a href="https://github.com/rickypcyt/unitracker" target="_blank" rel="noopener" className="hover:text-[var(--text-primary)] transition-colors">GitHub</a>
              <span>© 2026 UniTracker</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;