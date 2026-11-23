import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { SEO_PAGES, SITE } from './seoPages';

const SeoLandingPage = ({ slug }: { slug: string }) => {
  const page = SEO_PAGES.find((p) => p.slug === slug);
  if (!page) return <Navigate to="/" replace />;
  const url = `${SITE}/${page.slug}`;

  return (
    <>
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.description} />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: page.faq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        })}</script>
      </Helmet>
      <main className="h-screen overflow-y-auto bg-black text-[#e4e4e7] antialiased">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <Link to="/" className="text-sm font-bold tracking-tight">UniTracker</Link>
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-white">{page.h1}</h1>
          <p className="mt-4 text-lg text-zinc-400">{page.intro}</p>
          <Link
            to="/session"
            className="mt-8 inline-block rounded-lg border-2 border-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/10"
          >
            Start free
          </Link>
          {page.sections.map((s) => (
            <section key={s.heading} className="mt-12">
              <h2 className="text-2xl font-semibold text-white">{s.heading}</h2>
              <p className="mt-3 text-zinc-400">{s.body}</p>
            </section>
          ))}
          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-white">FAQ</h2>
            {page.faq.map((f) => (
              <div key={f.q} className="mt-4">
                <h3 className="font-medium text-white">{f.q}</h3>
                <p className="mt-1 text-zinc-400">{f.a}</p>
              </div>
            ))}
          </section>
          <nav className="mt-12 flex flex-wrap gap-4 border-t border-white/10 pt-6 text-sm text-zinc-400">
            {SEO_PAGES.filter((p) => p.slug !== slug).map((p) => (
              <Link key={p.slug} to={`/${p.slug}`} className="hover:text-white">{p.h1}</Link>
            ))}
          </nav>
        </div>
      </main>
    </>
  );
};

export default SeoLandingPage;
