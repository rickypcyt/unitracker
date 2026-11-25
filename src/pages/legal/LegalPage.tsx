import { ArrowLeft } from 'lucide-react';
import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { LEGAL_CONTENT, LEGAL_UPDATED, type LegalDoc, type LegalLang } from './legalContent';

const LegalPage: FC<{ doc: LegalDoc }> = ({ doc }) => {
  const { i18n } = useTranslation();
  const resolved = (i18n.resolvedLanguage ?? i18n.language ?? 'en').slice(0, 2);
  const lang: LegalLang = resolved === 'es' ? 'es' : 'en';
  const content = LEGAL_CONTENT[doc][lang];
  const other = doc === 'terms' ? 'privacy' : 'terms';
  const otherTitle = LEGAL_CONTENT[other][lang].title;

  return (
    <div
      className="dark min-h-screen overflow-y-auto bg-black text-[#e4e4e7] antialiased"
      style={{ colorScheme: 'dark' }}
    >
      <Helmet>
        <title>{`${content.title} | UniTracker`}</title>
        <meta name="description" content={content.intro.slice(0, 155)} />
        <link rel="canonical" href={`https://unitracker.me/${doc}`} />
      </Helmet>

      <header className="border-b border-white/6 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link to="/" className="font-heading text-[15px] font-bold tracking-tight">
            <span className="text-white">Uni</span>
            <span className="text-(--accent-primary)">Tracker</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {lang === 'es' ? 'Volver' : 'Back'}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{content.title}</h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-white/40">
          {content.updatedLabel}: {LEGAL_UPDATED}
        </p>
        <p className="mt-8 text-[15px] leading-relaxed text-white/70">{content.intro}</p>

        <div className="mt-12 space-y-10">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-white">{section.heading}</h2>
              {section.paragraphs?.map((p) => (
                <p key={p} className="mt-3 text-[15px] leading-relaxed text-white/65">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-white/65">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex gap-3">
                      <span className="mt-2.5 h-1 w-1 flex-none rounded-full bg-(--accent-primary)" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-between border-t border-white/10 pt-6 text-[13px]">
          <Link to={`/${other}`} className="text-(--accent-primary) hover:brightness-110">
            {otherTitle}
          </Link>
          <button
            type="button"
            onClick={() => i18n.changeLanguage(lang === 'es' ? 'en' : 'es')}
            className="text-white/50 transition-colors hover:text-white"
          >
            {lang === 'es' ? 'English' : 'Español'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default LegalPage;
