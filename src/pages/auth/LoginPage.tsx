import { ArrowLeft, Github, Loader2, Mail } from 'lucide-react';
import { FC, FormEvent, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import AnimatedBackdrop from '@/components/layout/AnimatedBackdrop';
import { supabase } from '@/utils/supabaseClient';

type Method = 'google' | 'github' | 'email';

const LAST_USED_KEY = 'lastAuthMethod';

const readLastUsed = (): Method | null => {
  try {
    const v = localStorage.getItem(LAST_USED_KEY);
    return v === 'google' || v === 'github' || v === 'email' ? v : null;
  } catch {
    return null;
  }
};

const saveLastUsed = (m: Method) => {
  try {
    localStorage.setItem(LAST_USED_KEY, m);
  } catch {
    /* storage unavailable */
  }
};

const GoogleIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.07-1.1-.16-1.6H12z" />
  </svg>
);

const LastUsed: FC<{ floating?: boolean }> = ({ floating }) => (
  <span
    className={`rounded-full bg-(--accent-primary)/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-(--accent-primary) ${
      floating ? 'absolute -top-2.5 right-2 border border-(--accent-primary)/30 bg-black' : 'ml-auto'
    }`}
  >
    Last used
  </span>
);

const LoginPage: FC = () => {
  const [lastUsed, setLastUsed] = useState<Method | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<Method | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => setLastUsed(readLastUsed()), []);

  const oauth = async (provider: 'google' | 'github') => {
    if (busy) return;
    setBusy(provider);
    saveLastUsed(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(`Error logging in with ${provider === 'google' ? 'Google' : 'GitHub'}`);
      setBusy(null);
    }
  };

  const emailLogin = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || busy) return;
    setBusy('email');
    saveLastUsed('email');
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(null);
    if (error) {
      toast.error(error.message || 'Could not send the login link');
      return;
    }
    setSent(true);
  };

  const providerBtn =
    'group relative flex w-full items-center justify-center gap-2.5 rounded-lg border-2 border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/6 hover:border-white/30 disabled:opacity-60';

  return (
    <>
      <Helmet>
        <title>Log in to UniTracker</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <style>{`
        @keyframes lg-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .lg-rise { animation: lg-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .lg-rise { animation: none !important; }
        }
      `}</style>

      <div
        className="dark relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10 text-[#e4e4e7] antialiased"
        style={{ colorScheme: 'dark' }}
      >
        <AnimatedBackdrop />

        <Link
          to="/"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-white/50 transition-colors hover:bg-white/6 hover:text-white sm:left-6 sm:top-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <main className="lg-rise w-full max-w-[380px]">
          {/* Logo */}
          <Link to="/" className="mb-8 flex flex-col items-center gap-3">
            <img
              src="/assets/apple-touch-icon.png"
              alt="UniTracker"
              width={48}
              height={48}
              className="rounded-xl ring-1 ring-white/10"
            />
          </Link>

          <h1 className="text-center text-2xl font-semibold tracking-tight text-white">Log in to UniTracker</h1>
          <p className="mt-2 text-center text-sm text-white/50">
            Don't have an account? <span className="text-white/80">Sign up</span> with any option below.
          </p>

          <div className="mt-8">
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => oauth('google')} disabled={!!busy} className={providerBtn}>
                {busy === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
                Google
                {lastUsed === 'google' && <LastUsed floating />}
              </button>
              <button type="button" onClick={() => oauth('github')} disabled={!!busy} className={providerBtn}>
                {busy === 'github' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                GitHub
                {lastUsed === 'github' && <LastUsed floating />}
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-white/30">
              <span className="h-px flex-1 bg-white/10" />
              or
              <span className="h-px flex-1 bg-white/10" />
            </div>

            {sent ? (
              <div className="rounded-lg border border-(--accent-primary)/30 bg-(--accent-primary)/10 p-4 text-center text-sm text-white/80">
                Check your inbox. We sent a login link to <span className="font-semibold text-white">{email}</span>.
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-3 block w-full text-xs text-white/50 hover:text-white"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={emailLogin} className="space-y-3">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 flex items-center text-xs font-medium text-white/60">
                    Email
                    {lastUsed === 'email' && <LastUsed />}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-(--accent-primary)/60 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!!busy || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 border-2 border-(--accent-primary) text-(--accent-primary) hover:bg-(--accent-primary)/10"
                >
                  {busy === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Continue with email
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-white/40">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-white/60 underline-offset-2 hover:text-white hover:underline">Terms</Link> and{' '}
            <Link to="/privacy" className="text-white/60 underline-offset-2 hover:text-white hover:underline">Privacy Policy</Link>.
          </p>
        </main>
      </div>
    </>
  );
};

export default LoginPage;
