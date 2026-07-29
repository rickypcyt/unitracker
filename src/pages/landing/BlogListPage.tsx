import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { blogCategories, blogPosts } from './blogPosts';

const BlogListPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts = activeCategory === 'All'
    ? blogPosts
    : blogPosts.filter((p) => p.category === activeCategory);

  const featuredPost = blogPosts[0]!;

  return (
    <>
      <Helmet>
        <title>Blog — UniTracker | Study Tips, Productivity Guides & Tutorials</title>
        <meta name="description" content="Learn how to study smarter with UniTracker's blog. Pomodoro guides, time management tips, app comparisons, and tutorials for students." />
        <link rel="canonical" href="https://unitracker.me/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/blog" />
        <meta property="og:title" content="Blog — UniTracker | Study Tips & Productivity Guides" />
        <meta property="og:description" content="Learn how to study smarter with UniTracker's blog. Pomodoro guides, time management tips, app comparisons, and tutorials for students." />
        <meta property="og:image" content="https://unitracker.me/assets/og-image.png" />
        <meta property="og:site_name" content="UniTracker" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog — UniTracker | Study Tips & Productivity Guides" />
        <meta name="twitter:description" content="Learn how to study smarter with UniTracker's blog. Pomodoro guides, time management tips, and tutorials for students." />
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
              <Link to="/pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
              <Link to="/compare" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Compare</Link>
              <Link to="/app" className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">UniTracker Blog</h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Study tips, productivity guides, and tutorials to help you get the most out of your study sessions.
            </p>
          </div>

          {/* Featured post */}
          <Link
            to={`/blog/${featuredPost.slug}`}
            className="block mb-12 group"
          >
            <div className="border border-[var(--border-primary)]/30 rounded-2xl overflow-hidden hover:border-[var(--accent-primary)]/50 transition-colors">
              <div className="bg-gradient-to-br from-[var(--accent-primary)]/20 to-transparent p-8 sm:p-12">
                <span className="inline-block px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-semibold mb-4">
                  Featured
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 group-hover:text-[var(--accent-primary)] transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-[var(--text-secondary)] mb-4 max-w-2xl">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(featuredPost.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {blogCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Post grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group border border-[var(--border-primary)]/30 rounded-2xl p-6 hover:border-[var(--accent-primary)]/50 transition-colors"
              >
                <span className="inline-block px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-semibold mb-3">
                  {post.category}
                </span>
                <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center border-t border-[var(--border-primary)]/30 pt-12">
            <h2 className="text-2xl font-bold mb-4">Ready to put these tips into practice?</h2>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:opacity-90 transition-opacity active:scale-95"
            >
              Start Studying Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogListPage;
