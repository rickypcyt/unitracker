import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Check, X } from 'lucide-react';

type Cell = boolean | string;

const competitors = ['UniTracker', 'Notion', 'Todoist', 'Forest'];

const rows: { category: string; items: { feature: string; values: Cell[] }[] }[] = [
  {
    category: 'Core Features',
    items: [
      { feature: 'Pomodoro Timer', values: [true, false, false, true] },
      { feature: 'Task Management', values: [true, true, true, false] },
      { feature: 'Kanban Board', values: [true, true, true, false] },
      { feature: 'Calendar View', values: [true, true, true, false] },
      { feature: 'Study Session Tracking', values: [true, false, false, true] },
      { feature: 'Notes (Markdown)', values: [true, true, false, false] },
      { feature: 'Habit Tracking', values: [true, true, false, false] },
      { feature: 'Analytics & Charts', values: [true, false, 'Premium', false] },
    ],
  },
  {
    category: 'Integrations & Export',
    items: [
      { feature: 'Google Calendar Export', values: [true, false, 'Premium', false] },
      { feature: 'Import from Notion', values: [true, 'N/A', false, false] },
      { feature: 'Import from Todoist', values: [true, false, 'N/A', false] },
      { feature: 'CSV Export', values: [true, 'Premium', 'Premium', false] },
      { feature: 'PDF Export', values: [true, false, false, false] },
      { feature: 'Full Data Backup (JSON)', values: [true, 'Premium', false, false] },
    ],
  },
  {
    category: 'AI & Productivity',
    items: [
      { feature: 'AI Task Creation', values: [true, 'Add-on', false, false] },
      { feature: 'Works Offline (PWA)', values: [true, true, true, true] },
      { feature: 'Custom Workspaces', values: [true, true, 'Premium', false] },
      { feature: 'Assignment Tracking', values: [true, true, true, false] },
    ],
  },
  {
    category: 'Pricing',
    items: [
      { feature: 'Free Plan', values: [true, true, true, true] },
      { feature: 'Ads in Free', values: [false, false, false, true] },
      { feature: 'Pro Price', values: ['$3.99/mo', '$10/mo', '$4/mo', '$3.99/mo'] },
      { feature: 'Open Source', values: [true, false, false, false] },
    ],
  },
];

function CellRenderer({ value }: { value: Cell }) {
  if (value === true) return <Check className="w-5 h-5 text-[var(--accent-primary)] mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-[var(--text-secondary)]/40 mx-auto" />;
  if (value === 'N/A') return <span className="text-xs text-[var(--text-secondary)]/40">N/A</span>;
  return <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>;
}

const ComparePage = () => {
  return (
    <>
      <Helmet>
        <title>UniTracker vs Notion vs Todoist vs Forest — Comparison</title>
        <meta name="description" content="Compare UniTracker with Notion, Todoist, and Forest. See why UniTracker is the best free study app for students." />
        <link rel="canonical" href="https://unitracker.me/compare" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/compare" />
        <meta property="og:title" content="UniTracker vs Notion vs Todoist vs Forest" />
        <meta property="og:description" content="Compare UniTracker with Notion, Todoist, and Forest. See why UniTracker is the best free study app for students." />
        <meta property="og:image" content="https://unitracker.me/assets/og-image.png" />
        <meta property="og:site_name" content="UniTracker" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="UniTracker vs Notion vs Todoist vs Forest" />
        <meta name="twitter:description" content="Compare UniTracker with Notion, Todoist, and Forest. See why UniTracker is the best free study app for students." />
        <meta name="twitter:image" content="https://unitracker.me/assets/og-image.png" />
      </Helmet>

      <div className="h-screen overflow-y-auto overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {/* Nav */}
        <nav className="sticky top-0 z-50 backdrop-blur-lg bg-[var(--bg-primary)]/80 border-b border-[var(--border-primary)]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                Uni<span className="text-[var(--accent-primary)]">Tracker</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Home</Link>
              <Link to="/pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
              <Link to="/blog" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Blog</Link>
              <Link to="/app" className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">How does UniTracker compare?</h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              We respect the competition. Here's an honest, side-by-side comparison so you can pick the right tool for you.
            </p>
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto rounded-2xl border-2 border-[var(--border-primary)]/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-primary)]/30 bg-[var(--bg-secondary)]/30">
                  <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)] min-w-[200px]">Feature</th>
                  {competitors.map((c, i) => (
                    <th
                      key={c}
                      className={`py-4 px-4 text-center font-bold ${i === 0 ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/5' : 'text-[var(--text-primary)]'}`}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((section) => (
                  <Fragment key={section.category}>
                    <tr className="border-b border-[var(--border-primary)]/20 bg-[var(--bg-secondary)]/10">
                      <td colSpan={competitors.length + 1} className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                        {section.category}
                      </td>
                    </tr>
                    {section.items.map((row) => (
                      <tr key={row.feature} className="border-b border-[var(--border-primary)]/10 hover:bg-[var(--bg-secondary)]/20 transition-colors">
                        <td className="py-3 px-4 text-[var(--text-primary)] font-medium">{row.feature}</td>
                        {row.values.map((v, i) => (
                          <td key={i} className={`py-3 px-4 text-center ${i === 0 ? 'bg-[var(--accent-primary)]/5' : ''}`}>
                            <CellRenderer value={v} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {[
              {
                title: 'vs Notion',
                desc: 'Notion is a great all-purpose workspace, but it lacks a built-in Pomodoro timer, study session tracking, and analytics. UniTracker is purpose-built for students.',
              },
              {
                title: 'vs Todoist',
                desc: 'Todoist is a solid task manager, but no Pomodoro, no notes, no habits, and no study analytics. Plus, CSV/PDF export requires Premium. UniTracker gives you all that for free.',
              },
              {
                title: 'vs Forest',
                desc: "Forest is great for focus timing, but that's all it does. No tasks, no calendar, no analytics, no notes. UniTracker has Forest's core feature plus everything else.",
              },
            ].map((card) => (
              <div key={card.title} className="border-2 border-[var(--border-primary)]/30 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-3 text-[var(--accent-primary)]">{card.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold mb-4">See for yourself</h2>
            <p className="text-[var(--text-secondary)] mb-6">Try UniTracker free — no credit card, no signup wall.</p>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity active:scale-95"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default ComparePage;
