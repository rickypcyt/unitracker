import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug, getRelatedPosts } from './blogPosts';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl font-bold mb-4">404</p>
          <p className="text-[var(--text-secondary)] mb-6">Post not found</p>
          <Link to="/blog" className="inline-flex items-center gap-2 text-[var(--accent-primary)] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const relatedPosts = getRelatedPosts(post.slug);

  return (
    <>
      <Helmet>
        <title>{post.title} — UniTracker Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://unitracker.me/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
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
              <Link to="/blog" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Blog</Link>
              <Link to="/app" className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Article */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back link */}
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-semibold mb-4">
              {post.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{post.title}</h1>
            <p className="text-lg text-[var(--text-secondary)] mb-4">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
              <span>by {post.author}</span>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none
            prose-headings:text-[var(--text-primary)]
            prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed
            prose-li:text-[var(--text-secondary)]
            prose-strong:text-[var(--text-primary)]
            prose-a:text-[var(--accent-primary)]
            prose-code:text-[var(--accent-primary)] prose-code:bg-[var(--bg-secondary)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-blockquote:border-l-[var(--accent-primary)] prose-blockquote:text-[var(--text-secondary)]
          ">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* CTA */}
          <div className="mt-12 border-t border-[var(--border-primary)]/30 pt-8">
            <div className="bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-2xl p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Try UniTracker Free</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Put these tips into action with a free Pomodoro timer, task manager, and study analytics.
              </p>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:opacity-90 transition-opacity active:scale-95"
              >
                Get Started — It's Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-bold mb-4">Related Articles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.slug}
                    to={`/blog/${rel.slug}`}
                    className="group border border-[var(--border-primary)]/30 rounded-xl p-4 hover:border-[var(--accent-primary)]/50 transition-colors"
                  >
                    <span className="text-xs text-[var(--accent-primary)] font-semibold">{rel.category}</span>
                    <h4 className="text-sm font-semibold mt-1 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                    <span className="text-xs text-[var(--text-secondary)] mt-2 block">{rel.readTime}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </>
  );
};

export default BlogPostPage;
