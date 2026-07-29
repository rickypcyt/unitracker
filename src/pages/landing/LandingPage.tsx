import { useState } from 'react';
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
  Lock,
  NotebookPen,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Timer,
  TrendingUp,
  Users,
  Zap,
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

// ─── Demo Components ───────────────────────────────────────────────────────

const PomodoroTimerDemo = () => {
  const totalSeconds = 25 * 60;
  const elapsed = 8 * 60 + 42;
  const remaining = totalSeconds - elapsed;
  const progress = elapsed / totalSeconds;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="relative rounded-2xl ring-1 ring-inset ring-white/5 bg-[var(--bg-secondary)]/30 p-5 shadow-2xl shadow-black/20 animate-um-rise card-shimmer">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/10 flex items-center justify-center">
            <Timer className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Pomodoro</span>
        </div>
        <span className="text-xs text-[var(--text-secondary)] bg-white/5 px-2 py-0.5 rounded-full">Focus</span>
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
    <div className="relative rounded-2xl ring-1 ring-inset ring-white/5 bg-[var(--bg-secondary)]/30 p-5 shadow-2xl shadow-black/20 animate-um-rise card-shimmer">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/10 flex items-center justify-center">
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
                className="rounded-lg border-2 border-[var(--border-primary)]/30 bg-[var(--bg-secondary)]/40 p-2.5 hover:border-[var(--accent-primary)]/40 transition-colors"
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
    <div className="relative rounded-2xl ring-1 ring-inset ring-white/5 bg-[var(--bg-secondary)]/30 p-5 shadow-2xl shadow-black/20 animate-um-rise card-shimmer">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Calendar</span>
        </div>
        <span className="text-xs text-[var(--text-secondary)] bg-white/5 px-2 py-0.5 rounded-full">March 2026</span>
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

// ─── App Window Mock (Hero visual) ───────────────────────────────────────────

const AppWindowMock = () => {
  return (
    <div className="relative">
      {/* Desktop window */}
      <div className="relative rounded-xl ring-1 ring-inset ring-white/10 bg-[var(--bg-secondary)]/60 overflow-hidden shadow-2xl shadow-black/40 animate-um-rise">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 h-9 border-b border-white/5 bg-black/30">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] ml-2 font-mono">UniTracker — Dashboard</span>
        </div>

        {/* Content: sidebar + main pane */}
        <div className="flex h-[280px] sm:h-[340px]">
          {/* Sidebar */}
          <div className="w-44 flex-shrink-0 border-r border-white/5 bg-black/20 p-3 hidden sm:block">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-6 h-6 rounded-lg bg-[var(--accent-primary)]/15 flex items-center justify-center">
                <Timer className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">UniTracker</span>
            </div>
            <div className="space-y-1">
              {[
                { icon: Timer, label: 'Timer', active: true },
                { icon: CheckSquare, label: 'Tasks' },
                { icon: Calendar, label: 'Calendar' },
                { icon: BarChart3, label: 'Analytics' },
                { icon: NotebookPen, label: 'Notes' },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                    item.active
                      ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)]/50 px-1 mb-2">Subjects</p>
              {['Math', 'Chemistry', 'History'].map((s) => (
                <div key={s} className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-secondary)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]/50" />
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Main pane */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Today's Focus</p>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Calculus Problem Set</h4>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--accent-primary)]/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span className="text-[10px] text-[var(--accent-primary)] font-medium">Focus session</span>
              </div>
            </div>

            {/* Timer ring + stats side by side */}
            <div className="grid grid-cols-2 gap-3 h-[200px] sm:h-[260px]">
              {/* Timer ring */}
              <div className="rounded-lg ring-1 ring-inset ring-white/5 bg-black/20 p-3 flex flex-col items-center justify-center">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-primary)" strokeWidth="5" opacity="0.2" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke="var(--accent-primary)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 * 0.35}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-[var(--text-primary)] font-mono tabular-nums">17:02</span>
                    <span className="text-[9px] text-[var(--text-secondary)]">remaining</span>
                  </div>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] mt-2">Session 2 of 4</span>
              </div>

              {/* Mini stats */}
              <div className="rounded-lg ring-1 ring-inset ring-white/5 bg-black/20 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-secondary)]">This week</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-[var(--accent-primary)]">
                    <TrendingUp className="w-2.5 h-2.5" /> +24%
                  </span>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {[40, 65, 30, 55, 80, 95, 45].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        background: i === 4 ? 'var(--accent-primary)' : 'var(--accent-primary)',
                        opacity: i === 4 ? 1 : 0.35,
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[10px] text-[var(--text-secondary)]">Total</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)] font-mono">22h 15m</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4FD1AE]" />
                  <span className="text-[10px] text-[var(--text-secondary)]">7-day streak</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phone overlay - bottom left */}
      <div className="absolute -bottom-6 -left-4 sm:-left-8 w-32 sm:w-40 rounded-[1.5rem] ring-1 ring-inset ring-white/10 bg-[var(--bg-secondary)]/80 shadow-2xl shadow-black/50 overflow-hidden animate-um-rise" style={{ animationDelay: '200ms' }}>
        {/* Phone notch */}
        <div className="flex justify-center pt-1.5">
          <div className="w-12 h-1 rounded-full bg-white/10" />
        </div>
        {/* Phone content - mini kanban */}
        <div className="p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3 h-3 text-[var(--accent-primary)]" />
            <span className="text-[9px] font-semibold text-[var(--text-primary)]">Tasks</span>
          </div>
          {[
            { name: 'Lab Report', tag: 'Chem', done: false },
            { name: 'Essay Outline', tag: 'Eng', done: true },
            { name: 'Flashcards', tag: 'Bio', done: true },
          ].map((t) => (
            <div key={t.name} className="rounded-md ring-1 ring-inset ring-white/5 bg-black/20 p-1.5">
              <div className="flex items-center gap-1">
                {t.done ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#4FD1AE] flex-shrink-0" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-[var(--text-secondary)] flex-shrink-0" />
                )}
                <span className={`text-[8px] ${t.done ? 'line-through opacity-40' : ''} text-[var(--text-primary)]`}>{t.name}</span>
                <span className="text-[7px] text-[var(--text-secondary)] ml-auto">{t.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Tabbed Section (Sync / Collab / Encryption) ─────────────────────────────

const TabSection = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    {
      icon: RefreshCw,
      label: 'Sync',
      title: 'Your data, everywhere',
      desc: 'Start a session on your laptop, finish on your phone. UniTracker syncs in real-time across all your devices — no manual refresh needed.',
      features: ['Real-time sync across devices', 'Conflict-free offline edits', 'Automatic backup to cloud'],
    },
    {
      icon: Users,
      label: 'Collaborate',
      title: 'Study together, stay accountable',
      desc: 'Share tasks and study sessions with friends. See each other\'s progress in real-time and keep each other on track.',
      features: ['Shared task boards', 'Friend activity feed', 'Group study sessions with timer'],
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
    { icon: Users, value: '12,000+', label: 'Students studying' },
    { icon: Timer, value: '2.4M', label: 'Focus sessions logged' },
    { icon: CheckSquare, value: '850K', label: 'Tasks completed' },
    { icon: Github, value: '1,200+', label: 'GitHub stars' },
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
              <div className="w-9 h-9 rounded-[20%] bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/20 flex items-center justify-center group-hover:bg-[var(--accent-primary)]/20 transition-colors">
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
                    className="shiny-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-base hover:brightness-110 hover:shadow-lg hover:shadow-[var(--accent-primary)]/25 transition-all active:scale-95"
                  >
                    Start studying for free
                    <ArrowRight className="w-5 h-5" />
                    <span className="shine-overlay" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl ring-1 ring-inset ring-white/10 font-semibold text-base hover:bg-white/5 transition-colors"
                  >
                    See pricing
                  </Link>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[var(--accent-primary)]" /> No ads</span>
                  <span className="flex items-center gap-1.5"><Download className="w-4 h-4 text-[var(--accent-primary)]" /> Export your data</span>
                  <span className="flex items-center gap-1.5"><Github className="w-4 h-4 text-[var(--accent-primary)]" /> Open source</span>
                  <span className="flex items-center gap-1.5"><Timer className="w-4 h-4 text-[var(--accent-primary)]" /> Works offline</span>
                </div>

                {/* App stack comparison */}
                <div className="mt-8 p-5 rounded-2xl ring-1 ring-inset ring-white/5 bg-white/[0.02]">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-3">Instead of using 6 different apps…</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {['Notion', 'Todoist', 'Forest', 'Google Calendar', 'Notability', 'Habitica'].map((app) => (
                      <span key={app} className="px-2.5 py-1 rounded-lg line-through text-[var(--text-secondary)]/50 decoration-[var(--text-secondary)]/30">
                        {app}
                      </span>
                    ))}
                    <span className="px-3 py-1 rounded-lg bg-[var(--accent-primary)] text-white font-medium">→ Uni<span className="font-bold">Tracker</span></span>
                  </div>
                </div>
              </div>

              <div className="animate-um-rise" style={{ animationDelay: '120ms' }}>
                <AppWindowMock />
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
                    <h3 className="text-fluid-h3 font-semibold">Built for focus</h3>
                  </dt>
                  <dd className="text-[var(--text-secondary)] text-fluid-lead pl-13">
                    Every feature is designed to keep you in the zone. Timer, tasks, and notes are one shortcut away — no context switching.
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
                <div className="relative w-48 h-48 rounded-[20%] bg-[var(--accent-primary)]/5 ring-1 ring-inset ring-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-[20%] opacity-20 blur-2xl" style={{ background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)' }} />
                  <Timer className="w-20 h-20 text-[var(--accent-primary)] relative" />
                </div>
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

        {/* Demo Showcase */}
        <section className="py-fluid-section border-t border-white/5">
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
                Real-time sync across devices, collaborative study sessions, and end-to-end encryption. Your data stays yours.
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

        {/* Prefooter — Accent-colored CTA (Todoist-inspired) */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-[var(--accent-primary)]" />
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' }}
          />
          <div className="relative max-w-4xl mx-auto px-fluid text-center">
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-white fill-white" />
              ))}
            </div>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4">
              One app to replace them all
            </h2>
            <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              UniTracker replaces 6 different tools — and it's free, open source, and works offline.
            </p>
            <Link
              to="/app"
              className="shiny-btn inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[var(--accent-primary)] font-bold text-lg hover:bg-white/90 hover:shadow-2xl hover:shadow-black/20 transition-all active:scale-95"
            >
              Get started free
              <ArrowRight className="w-5 h-5" />
              <span className="shine-overlay" />
            </Link>
            <p className="mt-6 text-sm text-white/60">
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
                Built by students, for students
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
                  desc: 'Join hundreds of students using UniTracker to stay on top of their studies.',
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
                  <div className="w-9 h-9 rounded-[20%] bg-[var(--accent-primary)]/10 ring-1 ring-inset ring-[var(--accent-primary)]/20 flex items-center justify-center">
                    <Timer className="w-4.5 h-4.5 text-[var(--accent-primary)]" />
                  </div>
                  <span className="font-heading text-lg font-bold tracking-tight text-[var(--text-primary)]">
                    Uni<span className="text-[var(--accent-primary)]">Tracker</span>
                  </span>
                </Link>
                <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                  Free, open source study & task management. Your data, your tools, your workflow.
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
                  <li><Link to="/pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link></li>
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