import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Check } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Everything you need to stay on top of your studies.',
    features: [
      'Unlimited tasks & assignments',
      'Pomodoro timer with sound alerts',
      'Study session tracking',
      'Calendar view',
      'Study analytics & charts',
      'Notes with markdown support',
      'Habit tracking',
      'Export to CSV & PDF',
      'Import from Notion, Todoist, Google Calendar',
      'Full data backup & restore',
      'PWA — works offline',
      'AI task creation',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$3.99',
    period: '/month',
    desc: 'For power users who want the edge.',
    features: [
      'Everything in Free, plus:',
      'Unlimited workspaces',
      'Advanced analytics & insights',
      'Custom pomodoro themes',
      'Priority AI (faster models)',
      'Email reminders for deadlines',
      'Calendar sync (2-way Google Calendar)',
      'Early access to new features',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Team',
    price: '$8.99',
    period: '/user/month',
    desc: 'For study groups and classrooms.',
    features: [
      'Everything in Pro, plus:',
      'Shared task boards',
      'Group study sessions',
      'Team analytics dashboard',
      'Role-based permissions',
      'Shared calendar & deadlines',
      'Admin controls',
      'Email support',
    ],
    cta: 'Contact Us',
    highlighted: false,
  },
];

const PricingPage = () => {
  return (
    <>
      <Helmet>
        <title>Pricing — UniTracker | Free Study App for Students</title>
        <meta name="description" content="Simple, transparent pricing. UniTracker is free forever for students. Upgrade to Pro or Team for advanced features." />
        <link rel="canonical" href="https://unitracker.me/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/pricing" />
        <meta property="og:title" content="Pricing — UniTracker | Free Study App" />
        <meta property="og:description" content="Simple, transparent pricing. UniTracker is free forever for students." />
        <meta property="og:image" content="https://unitracker.me/assets/og-image.png" />
        <meta property="og:site_name" content="UniTracker" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pricing — UniTracker | Free Study App" />
        <meta name="twitter:description" content="Simple, transparent pricing. UniTracker is free forever for students." />
        <meta name="twitter:image" content="https://unitracker.me/assets/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
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
              <Link to="/compare" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Compare</Link>
              <Link to="/blog" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Blog</Link>
              <Link to="/app" className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Pricing */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple, honest pricing</h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              UniTracker is <span className="text-[var(--accent-primary)] font-semibold">free forever</span> for students.
              Upgrade only if you want extras. No hidden fees, no ads, no tricks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 ${
                  tier.highlighted
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 shadow-lg shadow-[var(--accent-primary)]/10'
                    : 'border-[var(--border-primary)]/30'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--accent-primary)] text-white text-xs font-semibold">
                    {tier.badge}
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">{tier.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-sm text-[var(--text-secondary)]">{tier.period}</span>
                </div>
                <Link
                  to="/app"
                  className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                    tier.highlighted
                      ? 'bg-[var(--accent-primary)] text-white hover:opacity-90'
                      : 'border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/50'
                  }`}
                >
                  {tier.cta}
                </Link>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((f, i) => {
                    const isHeader = f.endsWith(':');
                    return (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isHeader ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {isHeader ? (
                          <span className="w-full">{f}</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Pricing FAQ</h2>
            <div className="space-y-4">
              {[
                { q: 'Is UniTracker really free?', a: 'Yes. The Free plan includes all core features — tasks, Pomodoro, analytics, notes, habits, export/import, and AI task creation. No credit card required.' },
                { q: 'Can I switch plans anytime?', a: 'Absolutely. Upgrade or downgrade at any time. Changes take effect immediately and we prorate the difference.' },
                { q: 'Do you offer student discounts?', a: 'UniTracker is already built for students. The Free plan covers everything most students need. Pro is priced affordably at $3.99/month.' },
                { q: 'What payment methods do you accept?', a: 'We accept all major credit cards and PayPal. Pro and Team plans are billed monthly with no long-term commitment.' },
              ].map((faq) => (
                <div key={faq.q} className="border border-[var(--border-primary)]/30 rounded-xl p-5">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 text-center">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity active:scale-95"
            >
              Start Free Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default PricingPage;
