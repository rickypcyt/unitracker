import AnimatedBackdrop from '@/components/layout/AnimatedBackdrop';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SEO_PAGES } from './seoPages';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Bug,
  Github,
  BarChart3,
  CalendarDays,
  ListTodo,
  NotebookPen,
  Timer,
  TrendingUp,
  WifiOff,
} from 'lucide-react';
import LanguageToggle from '@/components/ui/LanguageToggle';
import TimerCards from '@/pages/session/components/TimerCards';

const features = [
  { key: 'pomodoro', icon: Timer, span: 'md:col-span-2' },
  { key: 'tasks', icon: ListTodo, span: '' },
  { key: 'calendar', icon: CalendarDays, span: '' },
  { key: 'analytics', icon: BarChart3, span: 'md:col-span-2' },
  { key: 'notes', icon: NotebookPen, span: 'md:col-span-2' },
  { key: 'offline', icon: WifiOff, span: '' },
] as const;

const stepIcons = [ListTodo, Timer, TrendingUp] as const;

// Neon-style section heading: mono eyebrow + big left-aligned title
const SectionHeading = ({ children, sub, eyebrow, center = false }: { children: ReactNode; sub?: ReactNode; eyebrow?: ReactNode; center?: boolean }) => (
  <div className={center ? 'text-center mx-auto max-w-2xl' : 'max-w-2xl'}>
    {eyebrow && (
      <span className="block mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent-primary)]">{eyebrow}</span>
    )}
    <h2 className="text-3xl sm:text-5xl font-heading font-semibold tracking-[-0.035em] leading-[1.05] text-white">{children}</h2>
    {sub && <p className="mt-5 text-base sm:text-lg text-white/50 leading-relaxed">{sub}</p>}
  </div>
);

// Primary CTA: accent outline, no fill
const primaryBtn =
  'inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold text-[15px] hover:bg-[var(--accent-primary)]/10 hover:-translate-y-0.5 transition-all';
const ghostBtn =
  'inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-white/80 font-medium text-[15px] hover:bg-white/[0.06] hover:text-white transition-colors';

// Big framed app window — the real timers living inside it
const AppWindow = ({ children }: { children: ReactNode }) => (
  <div className="relative">
    <div
      aria-hidden="true"
      className="absolute -inset-x-10 -inset-y-8 -z-10 opacity-25 blur-3xl"
      style={{ background: 'radial-gradient(ellipse at 50% 60%, var(--accent-primary) 0%, transparent 65%)' }}
    />
    <div className="rounded-xl border border-white/10 bg-[#0a0a0c]/90 backdrop-blur-xl shadow-[0_30px_120px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-white/15" />
          <span className="w-3 h-3 rounded-full bg-white/15" />
          <span className="w-3 h-3 rounded-full bg-white/15" />
        </div>
        <span className="mx-auto text-[12px] text-white/35 pr-12">unitracker.me/session</span>
      </div>
      {children}
    </div>
  </div>
);

// Resets onboarding flags so entering the app replays welcome → color → login
export const startOnboarding = () => {
  try {
    ['hasSeenWelcomeModal', 'hasSeenThemeSelectionModal', 'hasSeenAccentColorModal']
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
};

const LandingPage = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = 'en';
    };
  }, [lang]);

  const faqItems = t('landing.faq.items', { returnObjects: true }) as unknown as { q: string; a: string }[];

  const metaTitle =
    lang === 'es'
      ? 'UniTracker - Temporizador Pomodoro y Gestor de Tareas Gratis | Open Source'
      : lang === 'hi'
        ? 'UniTracker - Free Pomodoro Timer और Task Manager | Open Source'
        : 'UniTracker - Free Pomodoro Timer & Task Manager | Open Source';
  const metaDescription =
    lang === 'es'
      ? 'Temporizador Pomodoro, gestor de tareas, calendario y analíticas de estudio gratis en una app open source. Funciona offline, sincroniza al volver. Sin anuncios ni suscripciones.'
      : lang === 'hi'
        ? 'एक open source app में free Pomodoro timer, task manager, calendar और study analytics। Offline चलता है, reconnect पर sync होता है। No ads, no subscriptions।'
        : 'Free Pomodoro timer, task manager, calendar, and study analytics in one open source app. Works offline, syncs when you\'re back. No ads, no subscriptions.';

  // Dedicated URL per language so each version can be indexed separately
  const canonicalPath = lang === 'es' ? '/es' : lang === 'hi' ? '/hi' : '/';
  const canonicalUrl = `https://unitracker.me${canonicalPath}`;
  const ogLocale = lang === 'es' ? 'es_ES' : lang === 'hi' ? 'hi_IN' : 'en_US';

  return (
    <>
      <Helmet>
        <html lang={lang} />
        <title>{metaTitle}</title>
        <meta
          name="description"
          content={metaDescription}
        />
        <meta
          name="keywords"
          content="pomodoro timer, free task manager, study timer, time tracker, productivity app, open source pomodoro, offline task app"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="en" href="https://unitracker.me/" />
        <link rel="alternate" hrefLang="es" href="https://unitracker.me/es" />
        <link rel="alternate" hrefLang="hi" href="https://unitracker.me/hi" />
        <link rel="alternate" hrefLang="x-default" href="https://unitracker.me/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content="https://unitracker.me/assets/og-image.png" />
        <meta property="og:site_name" content="UniTracker" />
        <meta property="og:locale" content={ogLocale} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
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
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        })}</script>
      </Helmet>

      <style>{`
        @keyframes um-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-um-rise { animation: um-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .um-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 64px 64px;
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%);
          mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%);
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-um-rise { animation: none !important; }
        }
      `}</style>

      <div className="dark h-screen overflow-y-auto overflow-x-hidden scroll-smooth bg-black text-[#e4e4e7] antialiased" style={{ colorScheme: 'dark' }}>
      <div className="relative isolate pb-16 sm:pb-0">
        <AnimatedBackdrop fixed />

        {/* Nav */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="font-heading text-[15px] font-bold tracking-tight">
                <span className="text-white">Uni</span><span className="text-[var(--accent-primary)]">Tracker</span>
              </Link>
              <div className="hidden md:flex items-center gap-6 text-[13px] text-white/55">
                <a href="#features" className="hover:text-white transition-colors">{t('landing.nav.features')}</a>
                <a href="#demo" className="hover:text-white transition-colors">{t('landing.nav.demo')}</a>
                <a href="#faq" className="hover:text-white transition-colors">{t('landing.nav.faq')}</a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle langs={['en', 'es']} />
              <a
                href="https://github.com/rickypcyt/unitracker"
                target="_blank"
                rel="noopener"
                className="hidden sm:flex px-3 py-1.5 rounded-md text-[13px] font-medium text-white/50 hover:text-white transition-colors items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5" /> {t('landing.nav.github')}
              </a>
              <Link
                to="/app"
                onClick={startOnboarding}
                className="text-[13px] font-semibold px-4 py-1.5 rounded-full border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
              >
                {t('landing.nav.getStarted')}
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero — centered headline, two CTAs, then the app window */}
        <section className="relative">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28">
            <div className="animate-um-rise flex flex-col items-start max-w-4xl">
              <h1 className="text-white text-[2.9rem] sm:text-7xl lg:text-[5.5rem] font-heading font-semibold mb-6 tracking-[-0.045em] leading-[0.98]">
                {t('landing.hero.title1')}<br />
                <span className="text-[var(--accent-primary)]">{t('landing.hero.title2')}</span>
              </h1>
              <p className="text-base sm:text-xl text-white/55 max-w-xl mb-9 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Link to="/app" onClick={startOnboarding} className={primaryBtn}>
                  {t('landing.hero.cta')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#demo" className={ghostBtn}>
                  {t('landing.hero.ctaSecondary')}
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-white/40">
                {(t('landing.hero.trust', { returnObjects: true }) as unknown as string[]).map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" strokeWidth={3} /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* The real app, live */}
            <div id="demo" className="animate-um-rise mt-14 sm:mt-20 scroll-mt-20" style={{ animationDelay: '0.12s' }}>
              <AppWindow>
                <div className="p-3 sm:p-5">
                  <TimerCards fresh />
                </div>
              </AppWindow>
              <p className="mt-5 text-center text-[13px] text-white/40">{t('landing.timers.subtitle')}</p>
            </div>
          </div>
        </section>

        {/* Three-up value row */}
        <section className="mt-24 sm:mt-32">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <ol className="grid md:grid-cols-3 border border-white/10 rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/10">
              {(t('landing.how.steps', { returnObjects: true }) as unknown as { title: string; desc: string }[]).map((s, i) => {
                const Icon = stepIcons[i] ?? Timer;
                return (
                  <li key={s.title} className="group p-7 bg-white/[0.015] hover:bg-white/[0.035] transition-colors">
                    <div className="flex items-center justify-between mb-10">
                      <Icon className="w-5 h-5 text-[var(--accent-primary)]" />
                      <span className="font-mono text-xs text-white/30">0{i + 1}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">{s.title}</h3>
                    <p className="text-[15px] text-white/45 leading-relaxed">{s.desc}</p>
                  </li>
                );
              })}
            </ol>
            <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-white">{t('landing.free.line')}</p>
              <Link to="/app" onClick={startOnboarding} className="inline-flex items-center gap-1.5 font-mono text-[13px] uppercase tracking-wider text-[var(--accent-primary)] hover:opacity-80 transition-opacity">
                {t('landing.footer.getStarted')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features — one unified list with big headers */}
        <section id="features" className="mt-24 sm:mt-32 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <SectionHeading eyebrow={t('landing.nav.features')}>{t('landing.features.title')}</SectionHeading>
            {/* Bento grid with shared 1px borders */}
            <div className="mt-10 sm:mt-14 grid md:grid-cols-3 gap-px rounded-xl overflow-hidden border border-white/10 bg-white/10">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.key}
                    className={`group relative bg-black p-7 sm:p-8 min-h-[220px] flex flex-col justify-between hover:bg-white/[0.03] transition-colors ${f.span}`}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(400px circle at 0% 0%, color-mix(in srgb, var(--accent-primary) 12%, transparent), transparent 70%)' }}
                    />
                    <Icon className="relative w-6 h-6 text-[var(--accent-primary)]" strokeWidth={1.75} />
                    <div className="relative mt-10">
                      <h3 className="text-2xl sm:text-3xl font-heading font-semibold tracking-[-0.03em] text-white mb-2">
                        {t(`landing.features.${f.key}.label`)}
                      </h3>
                      <p className="text-[15px] text-white/45 leading-relaxed max-w-md">
                        {t(`landing.features.${f.key}.desc`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-28 sm:mt-40 scroll-mt-20">
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <SectionHeading center>{t('landing.faq.title')}</SectionHeading>
            <div className="mt-12 divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {faqItems.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base sm:text-lg font-medium text-white/90 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown className="w-4 h-4 text-white/40 transition-transform group-open:rotate-180 flex-shrink-0" />
                  </summary>
                  <p className="mt-3 text-[15px] text-white/50 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing — big CTA + three link cards */}
        <section className="relative mt-28 sm:mt-40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 w-[900px] h-[420px] opacity-[0.18] blur-3xl"
            style={{ background: 'radial-gradient(ellipse at center, var(--accent-primary) 0%, transparent 65%)' }}
          />
          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 text-center">
            <SectionHeading center sub={t('landing.cta.subtitle')}>{t('landing.cta.title')}</SectionHeading>
            <Link
              to="/app"
              onClick={startOnboarding}
              className={`mt-9 ${primaryBtn}`}
            >
              {t('landing.cta.button')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="mt-16 grid md:grid-cols-3 gap-4 text-left">
              <a href="https://github.com/rickypcyt/unitracker" target="_blank" rel="noopener" className="group rounded-xl border border-white/10 bg-white/[0.02] p-6 hover:border-[var(--accent-primary)]/40 hover:bg-white/[0.05] transition-colors">
                <Github className="w-5 h-5 text-[var(--accent-primary)] mb-4" />
                <h3 className="font-semibold text-white mb-1">{t('landing.cards.github.t')}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{t('landing.cards.github.d')}</p>
              </a>
              <a href="https://github.com/rickypcyt/unitracker/issues" target="_blank" rel="noopener" className="group rounded-xl border border-white/10 bg-white/[0.02] p-6 hover:border-[var(--accent-primary)]/40 hover:bg-white/[0.05] transition-colors">
                <Bug className="w-5 h-5 text-[var(--accent-primary)] mb-4" />
                <h3 className="font-semibold text-white mb-1">{t('landing.cards.issues.t')}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{t('landing.cards.issues.d')}</p>
              </a>
              <Link to={`/${SEO_PAGES[0]?.slug ?? ''}`} className="group rounded-xl border border-white/10 bg-white/[0.02] p-6 hover:border-[var(--accent-primary)]/40 hover:bg-white/[0.05] transition-colors">
                <BookOpen className="w-5 h-5 text-[var(--accent-primary)] mb-4" />
                <h3 className="font-semibold text-white mb-1">{t('landing.cards.guides.t')}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{t('landing.cards.guides.d')}</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer — multi-column */}
        <footer className="mt-24 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-[13px]">
            <div className="col-span-2 md:col-span-1">
              <span className="font-heading text-[15px] font-bold tracking-tight">
                <span className="text-white">Uni</span><span className="text-[var(--accent-primary)]">Tracker</span>
              </span>
              <p className="mt-3 text-white/40 max-w-[16rem] leading-relaxed">{t('landing.hero.badge')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-white/80 mb-3">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-white/45">
                <li><a href="#features" className="hover:text-white transition-colors">{t('landing.nav.features')}</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">{t('landing.nav.demo')}</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">{t('landing.nav.faq')}</a></li>
                <li><Link to="/app" onClick={startOnboarding} className="hover:text-white transition-colors">{t('landing.footer.getStarted')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white/80 mb-3">{t('landing.footer.guides')}</h4>
              <ul className="space-y-2 text-white/45">
                {SEO_PAGES.map((p) => (
                  <li key={p.slug}><Link to={`/${p.slug}`} className="hover:text-white transition-colors">{p.h1}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white/80 mb-3">{t('landing.footer.community')}</h4>
              <ul className="space-y-2 text-white/45">
                <li><a href="https://github.com/rickypcyt/unitracker" target="_blank" rel="noopener" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="https://github.com/rickypcyt/unitracker/issues" target="_blank" rel="noopener" className="hover:text-white transition-colors">{t('landing.footer.issues')}</a></li>
                <li><Link to="/india" className="hover:text-white transition-colors">{t('landing.footer.india')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 border-t border-white/[0.06] text-xs text-white/35">
            {t('landing.footer.copyright')}
          </div>
        </footer>

        {/* Sticky mobile CTA */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
          <Link
            to="/app"
            onClick={startOnboarding}
            className="pointer-events-auto flex items-center justify-center gap-2 w-full py-3 rounded-full border border-[var(--accent-primary)] bg-black/60 backdrop-blur-md text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 font-semibold text-sm"
          >
            {t('landing.cta.button')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      </div>
    </>
  );
};

export default LandingPage;
