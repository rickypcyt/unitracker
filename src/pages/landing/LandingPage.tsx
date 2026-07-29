import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  Download,
  Github,
  NotebookPen,
  Play,
  Plus,
  Sparkles,
  Timer,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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

// Demo data for the landing page stats preview
const demoWeekData = [
  { day: 'Mon', minutes: 145 },
  { day: 'Tue', minutes: 210 },
  { day: 'Wed', minutes: 95 },
  { day: 'Thu', minutes: 180 },
  { day: 'Fri', minutes: 260 },
  { day: 'Sat', minutes: 320 },
  { day: 'Sun', minutes: 150 },
];

const formatMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
};

const StatsPreview = () => {
  const totalMinutes = demoWeekData.reduce((sum, d) => sum + d.minutes, 0);
  const avgMinutes = Math.round(totalMinutes / demoWeekData.length);
  const todayIndex = 4; // Friday as "today" for demo

  return (
    <div className="relative rounded-2xl border border-[var(--border-primary)]/40 bg-[var(--bg-primary)] p-5 shadow-2xl shadow-black/20 animate-um-rise">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">This week</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-semibold text-[var(--text-primary)] font-mono tabular-nums">
              {formatMinutes(totalMinutes)}
            </span>
            <span className="text-sm text-[var(--text-secondary)]">studied</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/10">
          <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className="text-xs font-medium text-[var(--accent-primary)]">+24%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 w-full rounded-xl bg-[var(--bg-secondary)]/50 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={demoWeekData} barCategoryGap={12}>
            <XAxis
              dataKey="day"
              stroke="var(--text-secondary)"
              tickLine={false}
              axisLine={false}
              fontSize="11px"
              interval={0}
            />
            <YAxis
              stroke="var(--text-secondary)"
              tick={{ fill: 'var(--text-secondary)', fontSize: '10px' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatMinutes(v as number)}
              width={36}
              domain={[0, 360]}
              ticks={[0, 120, 240, 360]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(30,144,255,0.08)' }}
              contentStyle={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
              formatter={(v: number) => [formatMinutes(v), 'Studied']}
              labelStyle={{ color: 'var(--text-secondary)' }}
            />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]} animationDuration={600}>
              {demoWeekData.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={i === todayIndex ? 'var(--accent-primary)' : 'var(--accent-primary)'}
                  opacity={i === todayIndex ? 1 : 0.45}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border-primary)]/30">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
          <span className="text-xs text-[var(--text-secondary)]">
            Avg <span className="text-[var(--text-primary)] font-medium">{formatMinutes(avgMinutes)}</span>/day
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]/40" />
          <span className="text-xs text-[var(--text-secondary)]">
            Best day <span className="text-[var(--text-primary)] font-medium">{formatMinutes(320)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 bg-[var(--accent-primary)]" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent-primary)]" />
          </span>
          <span className="text-xs text-[var(--text-secondary)]">Live demo</span>
        </div>
      </div>
    </div>
  );
};

// ─── Demo Components ───────────────────────────────────────────────────────

const PomodoroTimerDemo = () => {
  const totalSeconds = 25 * 60;
  const elapsed = 8 * 60 + 42;
  const remaining = totalSeconds - elapsed;
  const progress = elapsed / totalSeconds;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="relative rounded-2xl border border-[var(--border-primary)]/40 bg-[var(--bg-primary)] p-5 shadow-2xl shadow-black/20 animate-um-rise">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <Timer className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Pomodoro</span>
        </div>
        <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">Focus</span>
      </div>

      <div className="flex flex-col items-center py-4">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-primary)" strokeWidth="6" opacity="0.3" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="var(--accent-primary)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - progress)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[var(--text-primary)] font-mono tabular-nums">
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">remaining</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-primary)] text-white text-xs font-medium">
            <Play className="w-3 h-3" /> Running
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-medium">
            <Clock className="w-3 h-3" /> Session 2 of 4
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-primary)]/30">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
        <span className="text-xs text-[var(--text-secondary)]">Auto-logs to calendar when done</span>
      </div>
    </div>
  );
};

const MiniKanbanDemo = () => {
  const columns = [
    {
      title: 'To Do',
      color: 'var(--text-secondary)',
      tasks: [
        { name: 'Calculus Problem Set', tag: 'Math' },
        { name: 'Read Chapter 7', tag: 'History' },
      ],
    },
    {
      title: 'In Progress',
      color: 'var(--accent-primary)',
      tasks: [
        { name: 'Lab Report Draft', tag: 'Chem' },
      ],
    },
    {
      title: 'Done',
      color: '#4FD1AE',
      tasks: [
        { name: 'Essay Outline', tag: 'English' },
        { name: 'Flashcards', tag: 'Bio' },
      ],
    },
  ];

  return (
    <div className="relative rounded-2xl border border-[var(--border-primary)]/40 bg-[var(--bg-primary)] p-5 shadow-2xl shadow-black/20 animate-um-rise">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Tasks</span>
        </div>
        <button className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <Plus className="w-3 h-3" /> Add task
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{col.title}</span>
              <span className="text-[10px] text-[var(--text-secondary)]/50">{col.tasks.length}</span>
            </div>
            {col.tasks.map((task) => (
              <div
                key={task.name}
                className="rounded-lg border border-[var(--border-primary)]/30 bg-[var(--bg-secondary)]/40 p-2.5 hover:border-[var(--accent-primary)]/40 transition-colors"
              >
                <div className="flex items-start gap-1.5">
                  {col.title === 'Done' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4FD1AE] flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-xs font-medium text-[var(--text-primary)] leading-tight ${col.title === 'Done' ? 'line-through opacity-50' : ''}`}>
                      {task.name}
                    </p>
                    <span className="text-[9px] text-[var(--text-secondary)] mt-0.5 inline-block">
                      {task.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-[var(--border-primary)]/30">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
        <span className="text-xs text-[var(--text-secondary)]">Drag & drop between columns</span>
      </div>
    </div>
  );
};

const MiniCalendarDemo = () => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = 15;
  const taskDays: Record<number, { count: number; color: string }> = {
    12: { count: 2, color: 'var(--accent-primary)' },
    15: { count: 3, color: 'var(--accent-primary)' },
    18: { count: 1, color: 'var(--accent-primary)' },
    22: { count: 2, color: 'var(--accent-primary)' },
    25: { count: 1, color: 'var(--accent-primary)' },
  };
  const calendarDays = Array.from({ length: 35 }, (_, i) => i - 2);

  return (
    <div className="relative rounded-2xl border border-[var(--border-primary)]/40 bg-[var(--bg-primary)] p-5 shadow-2xl shadow-black/20 animate-um-rise">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Calendar</span>
        </div>
        <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">March 2026</span>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {days.map((d, i) => (
          <div key={i} className="text-[9px] font-medium uppercase tracking-wide text-[var(--text-secondary)] text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const isValid = day >= 1 && day <= 31;
          const isToday = day === today;
          const taskInfo = taskDays[day];

          return (
            <div
              key={day}
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] ${
                isValid
                  ? isToday
                    ? 'bg-[var(--accent-primary)] text-white font-bold'
                    : taskInfo
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/50'
                  : 'opacity-20'
              }`}
            >
              {isValid && day}
              {taskInfo && !isToday && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(taskInfo.count, 3) }).map((_, i) => (
                    <span key={i} className="w-1 h-1 rounded-full bg-[var(--accent-primary)]" />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-[var(--border-primary)]/30">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
        <span className="text-xs text-[var(--text-secondary)]">Tasks & study sessions in one view</span>
      </div>
    </div>
  );
};

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
        @keyframes um-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-um-rise { animation: um-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @media (prefers-reduced-motion: reduce) {
          .animate-um-rise, .animate-ping { animation: none !important; }
        }
      `}</style>

      <div
        className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]"
      >
        {/* Nav */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border-primary)]/30">
          <div className="max-w-7xl mx-auto px-fluid h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                <Timer className="w-4.5 h-4.5 text-[var(--accent-primary)]" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Uni<span className="text-[var(--accent-primary)]">Tracker</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {[
                { to: '/pricing', label: 'Pricing' },
                { to: '/compare', label: 'Compare' },
                { to: '/blog', label: 'Blog' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50 transition-all"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="https://github.com/rickypcyt/unitracker"
                target="_blank"
                rel="noopener"
                className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50 transition-all flex items-center gap-1.5"
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
                className="text-sm font-semibold px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white hover:brightness-110 hover:shadow-lg hover:shadow-[var(--accent-primary)]/25 transition-all active:scale-95"
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
          <div className="relative max-w-7xl mx-auto px-fluid pt-fluid-hero pb-fluid-hero">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
              <div className="animate-um-rise">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  6 apps in 1 — replace your study stack
                </div>
                <h1
                  className="text-fluid-hero font-heading font-semibold mb-6"
                >
                  Stop jumping between apps. Start studying.
                </h1>
                <p className="text-fluid-lead text-[var(--text-secondary)] max-w-xl mb-10">
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
                <StatsPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-fluid-section border-t border-[var(--border-primary)]/30">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">Everything in one place</p>
              <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                One app. Your complete study workflow.
              </h2>
              <p className="text-fluid-lead text-[var(--text-secondary)]">
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
                  <h3 className="text-fluid-h3 font-semibold mb-2">{f.title}</h3>
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

        {/* Demo Showcase */}
        <section className="py-fluid-section border-t border-[var(--border-primary)]/30">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">See it in action</p>
              <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                Real components. Real workflow.
              </h2>
              <p className="text-fluid-lead text-[var(--text-secondary)]">
                These aren't screenshots — they're live previews of the actual UI. Timer, tasks, and calendar, all working together.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <PomodoroTimerDemo />
              <MiniKanbanDemo />
              <MiniCalendarDemo />
            </div>
          </div>
        </section>

      {/* Why UniTracker */}
        <section className="py-fluid-section border-t border-[var(--border-primary)]/30 bg-[var(--bg-secondary)]/20">
          <div className="max-w-7xl mx-auto px-fluid">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-3">Why UniTracker</p>
              <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
                No tricks, no fine print
              </h2>
              <p className="text-fluid-lead text-[var(--text-secondary)]">
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
                  <h3 className="text-fluid-h3 font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-fluid-section border-t border-[var(--border-primary)]/30 overflow-hidden">
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[520px] h-[300px] opacity-[0.15] blur-3xl"
            style={{ background: 'radial-gradient(circle, #F4A63A 0%, transparent 70%)' }}
          />
          <div className="relative max-w-4xl mx-auto px-fluid text-center">
            <h2 className="text-fluid-h2 font-heading font-semibold mb-4">
              One app to replace them all
            </h2>
            <p className="text-fluid-lead text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
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
          <div className="max-w-7xl mx-auto px-fluid flex flex-col sm:flex-row items-center justify-between gap-4">
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