import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Clock, Mail, TrendingUp, Users } from 'lucide-react';

import EmailConfigPanel from './EmailConfigPanel';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'email'>('stats');

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = !!user?.email && user.email === adminEmail;

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, email, username, avatar_url, created_at, last_sign_in_at')
        .order('created_at', { ascending: false });
      if (err) {
        setError(err.message);
      } else {
        setProfiles((data as Profile[]) || []);
      }
      setLoading(false);
    };
    fetchProfiles();
  }, [isAdmin]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const withDates = profiles.map((p) => ({
      ...p,
      date: p.created_at ? new Date(p.created_at) : null,
      lastSignIn: p.last_sign_in_at ? new Date(p.last_sign_in_at) : null,
    }));

    const total = withDates.length;
    const newThisWeek = withDates.filter((p) => p.date && p.date >= weekAgo).length;
    const newThisMonth = withDates.filter((p) => p.date && p.date >= monthAgo).length;
    const withUsername = withDates.filter((p) => p.username).length;

    // Last sign-in stats
    const activeThisWeek = withDates.filter((p) => p.lastSignIn && p.lastSignIn >= weekAgo).length;
    const activeThisMonth = withDates.filter((p) => p.lastSignIn && p.lastSignIn >= monthAgo).length;
    const neverSignedIn = withDates.filter((p) => !p.lastSignIn).length;

    return { total, newThisWeek, newThisMonth, withUsername, activeThisWeek, activeThisMonth, neverSignedIn };
  }, [profiles]);

  const chartData = useMemo(() => {
    const days: Record<string, { date: string; count: number; label: string }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      days[key] = {
        date: key,
        count: 0,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    }
    profiles.forEach((p) => {
      if (!p.created_at) return;
      const key = p.created_at.slice(0, 10);
      if (days[key]) days[key].count++;
    });
    return Object.values(days);
  }, [profiles]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--text-primary)] mb-2">403</p>
          <p className="text-[var(--text-secondary)]">You don't have access to this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <p className="text-red-500 font-semibold mb-2">Error loading data</p>
          <p className="text-[var(--text-secondary)] text-sm">{error}</p>
          <p className="text-[var(--text-secondary)] text-xs mt-4">
            Make sure the <code className="bg-[var(--bg-secondary)] px-1 rounded">profiles</code> table has a{' '}
            <code className="bg-[var(--bg-secondary)] px-1 rounded">created_at</code> column.
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Users',
      value: stats.total,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'New This Week',
      value: stats.newThisWeek,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'New This Month',
      value: stats.newThisMonth,
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'With Username',
      value: stats.withUsername,
      icon: Clock,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
  ];

  const signInCards = [
    {
      label: 'Active This Week',
      value: stats.activeThisWeek,
      icon: Activity,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Active This Month',
      value: stats.activeThisMonth,
      icon: TrendingUp,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Never Signed In',
      value: stats.neverSignedIn,
      icon: Clock,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 mt-4 mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-6">
        Admin Dashboard
      </h1>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('stats')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'stats'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/30'
          }`}
        >
          <TrendingUp size={16} />
          Stats
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'email'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/30'
          }`}
        >
          <Mail size={16} />
          Email Config
        </button>
      </div>

      {activeTab === 'email' ? (
        <EmailConfigPanel />
      ) : (
        <>
          {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 rounded-xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className="text-sm text-[var(--text-secondary)] font-medium">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Sign-in stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {signInCards.map((card) => (
          <div
            key={card.label}
            className="bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 rounded-xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className="text-sm text-[var(--text-secondary)] font-medium">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-[var(--bg-secondary)]/20 border border-[var(--border-primary)]/30 rounded-xl p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          New Users (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              interval={4}
            />
            <YAxis
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              labelStyle={{ color: 'var(--text-secondary)' }}
            />
            <Bar dataKey="count" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} name="New Users" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent users table */}
      <div className="bg-[var(--bg-secondary)]/20 border border-[var(--border-primary)]/30 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Recent Users
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-primary)]/30">
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">User</th>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium hidden sm:table-cell">Email</th>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Username</th>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium hidden md:table-cell">Joined</th>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium hidden lg:table-cell">Last Sign In</th>
              </tr>
            </thead>
            <tbody>
              {profiles.slice(0, 50).map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--border-primary)]/10 hover:bg-[var(--bg-secondary)]/20 transition-colors"
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-sm font-bold text-[var(--accent-primary)] flex-shrink-0">
                          {(p.email?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                      <span className="text-[var(--text-primary)] truncate max-w-[120px]">
                        {p.email?.split('@')[0] || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-[var(--text-secondary)] hidden sm:table-cell">
                    {p.email || '—'}
                  </td>
                  <td className="py-2 px-3">
                    {p.username ? (
                      <span className="text-[var(--accent-primary)] font-medium">{p.username}</span>
                    ) : (
                      <span className="text-[var(--text-secondary)] italic">not set</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-[var(--text-secondary)] hidden md:table-cell">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="py-2 px-3 hidden lg:table-cell">
                    {p.last_sign_in_at
                      ? <span className="text-[var(--text-secondary)]">{new Date(p.last_sign_in_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      : <span className="text-[var(--text-secondary)] italic">never</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {profiles.length > 50 && (
          <p className="text-center text-[var(--text-secondary)] text-xs mt-4">
            Showing 50 of {profiles.length} users
          </p>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
