import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
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
import LanguageToggle from '@/components/ui/LanguageToggle';
import Countdown from '@/pages/session/Countdown';
import Pomodoro from '@/pages/session/Pomodoro';
import StudyTimer from '@/pages/session/StudyTimer';

const features = [
  { icon: Timer, key: 'pomodoro' },
  { icon: CheckCircle2, key: 'tasks' },
  { icon: Calendar, key: 'calendar' },
  { icon: BarChart3, key: 'analytics' },
  { icon: NotebookPen, key: 'notes' },
  { icon: WifiOff, key: 'offline' },
] as const;

const ShowcaseFrame = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
    <div className="flex items-center gap-2 px-4 h-9 border-b border-white/[0.06]">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
      </div>
      <span className="text-[11px] text-white/40 ml-2">unitracker/{title}</span>
    </div>
    <div className="p-3 max-h-[420px] overflow-y-auto">
      {children}
    </div>
  </div>
);

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="text-sm sm:text-base uppercase tracking-[0.2em] font-semibold text-[var(--accent-primary)] mb-4">
    {children}
  </p>
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

      <div className="h-screen overflow-y-auto overflow-x-hidden scroll-smooth bg-black text-[#e4e4e7] pb-16 antialiased">
        {/* Nav — minimal, hairline */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/[0.08]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
            <Link to="/" className="font-heading text-[15px] font-bold tracking-tight">
              <span className="text-white">Uni</span><span className="text-[var(--accent-primary)]">Tracker</span>
            </Link>
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
                className="text-[13px] font-semibold px-4 py-1.5 rounded-md bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
              >
                {t('landing.nav.getStarted')}
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero — Resend style: eyebrow, tight headline, minimal CTAs */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[700px] h-[500px] opacity-[0.14] blur-3xl"
            style={{ background: 'radial-gradient(ellipse at center, var(--accent-primary) 0%, transparent 65%)' }}
          />
          <div
            className="pointer-events-none absolute top-40 -left-40 w-[400px] h-[400px] opacity-[0.07] blur-3xl"
            style={{ background: 'radial-gradient(ellipse at center, var(--accent-primary) 0%, transparent 70%)' }}
          />
          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-14">
            <div className="animate-um-rise max-w-2xl">
              <Eyebrow>{t('landing.hero.eyebrow')}</Eyebrow>
              <h1 className="text-[2.5rem] sm:text-6xl font-heading font-bold mb-5 tracking-[-0.03em] leading-[1.05]">
                {t('landing.hero.title1')}<br />{t('landing.hero.title2')}
              </h1>
              <p className="text-base sm:text-lg text-white/50 max-w-lg mb-8 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/app"
                  onClick={startOnboarding}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-[var(--accent-primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  {t('landing.hero.cta')}
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
            <Eyebrow>{t('landing.timers.eyebrow')}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight mb-2">
              {t('landing.timers.title')}
            </h2>
            <p className="text-white/50 text-sm mb-8 max-w-md">
              {t('landing.timers.subtitle')}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
              <ShowcaseFrame title={t('landing.timers.studyTimer')}>
                <StudyTimer hideHeader />
              </ShowcaseFrame>
              <ShowcaseFrame title={t('landing.timers.pomodoro')}>
                <Pomodoro hideHeader fresh />
              </ShowcaseFrame>
              <ShowcaseFrame title={t('landing.timers.countdown')}>
                <Countdown hideHeader />
              </ShowcaseFrame>
            </div>
          </div>
        </section>

        {/* Features — hairline grid, Resend style */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <Eyebrow>{t('landing.features.eyebrow')}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight mb-10">
              {t('landing.features.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/[0.06]">
              {features.map((f) => (
                <div
                  key={f.key}
                  className="border-b border-r border-white/[0.06] p-6 hover:bg-white/[0.03] transition-colors group"
                >
                  <f.icon className="w-4 h-4 text-[var(--accent-primary)] mb-4" />
                  <h3 className="text-sm font-semibold text-white/90 mb-1">{t(`landing.features.${f.key}.label`)}</h3>
                  <p className="text-[13px] text-white/45 leading-relaxed">{t(`landing.features.${f.key}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
            <Eyebrow>{t('landing.cta.eyebrow')}</Eyebrow>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold tracking-tight mb-3">
              {t('landing.cta.title')}
            </h2>
            <p className="text-white/50 text-sm mb-8">{t('landing.cta.subtitle')}</p>
            <Link
              to="/app"
              onClick={startOnboarding}
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-md bg-[var(--accent-primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {t('landing.cta.button')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Footer — minimal hairline */}
        <footer className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-xs text-white/40">{t('landing.footer.copyright')}</span>
            <div className="flex items-center gap-5 text-[13px] text-white/40">
              <Link to="/india" className="hover:text-white transition-colors">{t('landing.footer.india')}</Link>
              <a href="https://github.com/rickypcyt/unitracker" target="_blank" rel="noopener" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://github.com/rickypcyt/unitracker/issues" target="_blank" rel="noopener" className="hover:text-white transition-colors">{t('landing.footer.issues')}</a>
              <Link to="/app" onClick={startOnboarding} className="hover:text-white transition-colors flex items-center gap-0.5">
                {t('landing.footer.getStarted')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
