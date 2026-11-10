import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  Feather,
  GraduationCap,
  Landmark,
  Timer,
  WifiOff,
  Zap,
} from 'lucide-react';
import WhatsAppIcon from '@/components/share/WhatsAppIcon';
import LanguageToggle from '@/components/ui/LanguageToggle';
import Countdown from '@/pages/session/Countdown';
import Pomodoro from '@/pages/session/Pomodoro';
import StudyTimer from '@/pages/session/StudyTimer';
import { startOnboarding } from '@/pages/landing/LandingPage';

interface FaqItem {
  q: string;
  a: string;
}

const examCards = [
  { icon: GraduationCap, key: 'jee' },
  { icon: BookOpen, key: 'boards' },
  { icon: Landmark, key: 'college' },
  { icon: Feather, key: 'upsc' },
] as const;

const featureCards = [
  { icon: WifiOff, key: 'offline' },
  { icon: Zap, key: 'free' },
  { icon: Timer, key: 'light' },
  { icon: BarChart3, key: 'streaks' },
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

const IndiaLandingPage = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const faqItems = t('india.faq.items', { returnObjects: true }) as FaqItem[];
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(t('india.hero.shareMessage'))}`;

  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = 'en';
    };
  }, [lang]);

  const metaTitle =
    lang === 'hi'
      ? 'UniTracker - JEE, NEET और Board Exams के लिए Free Study App | Pomodoro Timer'
      : lang === 'es'
        ? 'UniTracker - App de estudio gratis para JEE, NEET y CBSE | Temporizador Pomodoro'
        : 'UniTracker India - Free Study App for JEE, NEET & CBSE | Pomodoro Timer';
  const metaDescription =
    lang === 'hi'
      ? 'JEE, NEET, CBSE और college की तैयारी के लिए free study app। Pomodoro timer, tasks, calendar और analytics। No ads, offline चलता है।'
      : lang === 'es'
        ? 'App de estudio gratuita para estudiantes que preparan JEE, NEET, CBSE y exámenes universitarios. Pomodoro, tareas, calendario y analíticas. Sin anuncios, funciona offline.'
        : 'Free study app for students in India preparing for JEE, NEET, CBSE boards and university exams. Pomodoro timer, tasks, calendar & analytics. No ads, works offline.';

  return (
    <>
      <Helmet>
        <html lang={lang} />
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta
          name="keywords"
          content="study app India, free study app for students, JEE study app, NEET preparation app, CBSE study planner, pomodoro timer India, exam preparation app, study timer for students, board exam study app, UPSC study tracker, app de estudio gratis, temporizador pomodoro"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://unitracker.me/india" />
        <link rel="alternate" hrefLang="en" href="https://unitracker.me/india" />
        <link rel="alternate" hrefLang="hi" href="https://unitracker.me/india?lang=hi" />
        <link rel="alternate" hrefLang="es" href="https://unitracker.me/india?lang=es" />
        <link rel="alternate" hrefLang="x-default" href="https://unitracker.me/india" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/india" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content="https://unitracker.me/assets/og-image.png" />
        <meta property="og:site_name" content="UniTracker" />
        <meta property="og:locale" content={lang === 'hi' ? 'hi_IN' : lang === 'es' ? 'es_ES' : 'en_IN'} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://unitracker.me/india" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content="https://unitracker.me/assets/og-image.png" />
        <meta name="twitter:site" content="@UniTrackerApp" />

        {/* Structured data — rich result eligibility */}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'UniTracker',
          url: 'https://unitracker.me/india',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          inLanguage: ['en', 'hi'],
          audience: {
            '@type': 'EducationalAudience',
            educationalRole: 'student',
            audienceType: 'Students preparing for JEE, NEET, CBSE boards and university exams in India',
          },
          description: metaDescription,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
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
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
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
        {/* Nav */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/[0.08]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
            <Link to="/" className="font-heading text-[15px] font-bold tracking-tight">
              <span className="text-white">Uni</span><span className="text-[var(--accent-primary)]">Tracker</span>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageToggle langs={['en', 'hi', 'es']} />
              <Link
                to="/app"
                onClick={startOnboarding}
                className="text-[13px] font-semibold px-4 py-1.5 rounded-md bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
              >
                {t('india.nav.getStarted')}
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[700px] h-[500px] opacity-[0.14] blur-3xl"
            style={{ background: 'radial-gradient(ellipse at center, var(--accent-primary) 0%, transparent 65%)' }}
          />
          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-14">
            <div className="animate-um-rise max-w-2xl">
              <Eyebrow>{t('india.hero.eyebrow')}</Eyebrow>
              <h1 className="text-[2.5rem] sm:text-6xl font-heading font-bold mb-5 tracking-[-0.03em] leading-[1.05]">
                {t('india.hero.title')}
              </h1>
              <p className="text-base sm:text-lg text-white/50 max-w-lg mb-8 leading-relaxed">
                {t('india.hero.subtitle')}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/app"
                  onClick={startOnboarding}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-[var(--accent-primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  {t('india.hero.cta')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md border border-[#25D366]/40 text-[#25D366] font-medium text-sm hover:bg-[#25D366]/10 transition-colors"
                >
                  <WhatsAppIcon size={16} />
                  {t('india.hero.share')}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Live timers */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <Eyebrow>{t('india.timers.eyebrow')}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight mb-2">
              {t('india.timers.title')}
            </h2>
            <p className="text-white/50 text-sm mb-8 max-w-md">
              {t('india.timers.subtitle')}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
              <ShowcaseFrame title={t('india.timers.studyTimer')}>
                <StudyTimer hideHeader />
              </ShowcaseFrame>
              <ShowcaseFrame title={t('india.timers.pomodoro')}>
                <Pomodoro hideHeader fresh />
              </ShowcaseFrame>
              <ShowcaseFrame title={t('india.timers.countdown')}>
                <Countdown hideHeader />
              </ShowcaseFrame>
            </div>
          </div>
        </section>

        {/* Exams */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <Eyebrow>{t('india.exams.eyebrow')}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight mb-10">
              {t('india.exams.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-white/[0.06]">
              {examCards.map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="border-b border-r border-white/[0.06] p-6 hover:bg-white/[0.03] transition-colors"
                >
                  <Icon className="w-4 h-4 text-[var(--accent-primary)] mb-4" />
                  <h3 className="text-sm font-semibold text-white/90 mb-1">
                    {t(`india.exams.${key}.title`)}
                  </h3>
                  <p className="text-[13px] text-white/45 leading-relaxed">
                    {t(`india.exams.${key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <Eyebrow>{t('india.features.eyebrow')}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight mb-10">
              {t('india.features.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-white/[0.06]">
              {featureCards.map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="border-b border-r border-white/[0.06] p-6 hover:bg-white/[0.03] transition-colors"
                >
                  <Icon className="w-4 h-4 text-[var(--accent-primary)] mb-4" />
                  <h3 className="text-sm font-semibold text-white/90 mb-1">
                    {t(`india.features.${key}.title`)}
                  </h3>
                  <p className="text-[13px] text-white/45 leading-relaxed">
                    {t(`india.features.${key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <Eyebrow>{t('india.faq.eyebrow')}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight mb-10">
              {t('india.faq.title')}
            </h2>
            <div className="max-w-3xl divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
              {faqItems.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-semibold text-white/85 hover:text-white transition-colors">
                    {item.q}
                    <ChevronRight className="w-4 h-4 shrink-0 text-white/35 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="text-[13px] text-white/50 leading-relaxed mt-3 pr-8">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
            <Eyebrow>{t('india.cta.eyebrow')}</Eyebrow>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold tracking-tight mb-3">
              {t('india.cta.title')}
            </h2>
            <p className="text-white/50 text-sm mb-8">{t('india.cta.subtitle')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/app"
                onClick={startOnboarding}
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-md bg-[var(--accent-primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {t('india.cta.button')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-md border border-[#25D366]/40 text-[#25D366] font-medium text-sm hover:bg-[#25D366]/10 transition-colors"
              >
                <WhatsAppIcon size={16} />
                {t('india.hero.share')}
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-xs text-white/40">{t('india.footer.copyright')}</span>
            <div className="flex items-center gap-5 text-[13px] text-white/40">
              <Link to="/" className="hover:text-white transition-colors">{t('india.footer.home')}</Link>
              <a href="https://github.com/rickypcyt/unitracker/issues" target="_blank" rel="noopener" className="hover:text-white transition-colors">{t('india.footer.issues')}</a>
              <Link to="/app" onClick={startOnboarding} className="hover:text-white transition-colors flex items-center gap-0.5">
                {t('india.footer.getStarted')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default IndiaLandingPage;
