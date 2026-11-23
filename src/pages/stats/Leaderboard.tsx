import { Crown, Medal, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/auth/useAuth';
import { LeaderboardService, type LeaderboardPeriod } from '@/services/LeaderboardService';

const DEFAULT_AVATAR = '/assets/default-avatar.svg';
const TOP_N = 10;

const PERIODS: LeaderboardPeriod[] = ['week', 'month', 'year', 'all'];

const formatHours = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown size={18} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={18} className="text-gray-300" />;
  if (rank === 3) return <Medal size={18} className="text-amber-600" />;
  return <span className="text-sm font-semibold tabular-nums text-[var(--text-secondary)]">{rank}</span>;
};

const Leaderboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>('month');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => LeaderboardService.getTop(period, TOP_N),
    staleTime: 60 * 1000,
  });

  const top = data?.[0]?.total_seconds ?? 0;
  // Two columns of five on large screens, filled column by column (1-5 left, 6-10 right)
  const gridClass = 'grid grid-cols-1 gap-px bg-[var(--border-primary)] lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-5';

  return (
    <section
      aria-labelledby="leaderboard-title"
      className="overflow-hidden rounded-2xl border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)]"
    >
      {/* Card header */}
      <div className="grid gap-3 border-b border-[var(--border-primary)] px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[var(--accent-primary)]" />
          <h3 id="leaderboard-title" className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            {t('leaderboard.title')}
          </h3>
        </div>

        <div
          role="tablist"
          aria-label={t('leaderboard.title')}
          className="flex w-full items-center gap-1 rounded-xl bg-[var(--bg-primary)] p-1 sm:w-auto"
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:flex-none sm:px-4 ${
                period === p
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {t(`leaderboard.periods.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <ul className={gridClass} aria-busy="true">
          {Array.from({ length: TOP_N }).map((_, i) => (
            <li key={i} className="h-[68px] animate-pulse bg-[var(--bg-secondary)]" />
          ))}
        </ul>
      )}

      {isError && (
        <div className="px-4 py-8 text-center">
          <p className="mb-3 text-sm text-[var(--text-secondary)]">{t('leaderboard.error')}</p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-black"
          >
            {t('leaderboard.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">{t('leaderboard.empty')}</p>
      )}

      {!isLoading && !isError && !!data?.length && (
        <ol className={gridClass}>
          {data.map((entry, i) => {
            const isMe = entry.user_id === user?.id;
            const pct = top > 0 ? Math.max(4, Math.round((entry.total_seconds / top) * 100)) : 0;
            return (
              <li
                key={entry.user_id}
                className={`flex flex-col justify-center gap-2 px-4 py-3 ${
                  isMe ? 'bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-secondary))]' : 'bg-[var(--bg-secondary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex w-6 shrink-0 justify-center"><RankBadge rank={i + 1} /></span>
                  <img
                    src={entry.avatar_url || DEFAULT_AVATAR}
                    alt=""
                    className="h-9 w-9 shrink-0 overflow-hidden rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith(DEFAULT_AVATAR)) e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {entry.username}
                      {isMe && (
                        <span className="ml-2 text-xs font-semibold text-[var(--accent-primary)]">{t('leaderboard.you')}</span>
                      )}
                    </p>
                    <p className="text-xs tabular-nums text-[var(--text-secondary)]">
                      {t('leaderboard.sessions', { count: entry.sessions })}
                    </p>
                  </div>
                  <span className="shrink-0 text-lg font-bold tabular-nums text-[var(--text-primary)]">
                    {formatHours(entry.total_seconds)}
                  </span>
                </div>
                <div
                  className="h-1 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' }}
                >
                  <div
                    className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
          {/* Skeleton slots keep the grid full, so the divider colour never shows through empty cells */}
          {Array.from({ length: Math.max(0, TOP_N - data.length) }).map((_, k) => (
            <li
              key={`empty-${k}`}
              aria-hidden="true"
              className="flex flex-col justify-center gap-2 bg-[var(--bg-secondary)] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex w-6 shrink-0 justify-center text-sm font-semibold tabular-nums text-[var(--text-secondary)]/30">
                  {data.length + k + 1}
                </span>
                <span className="h-9 w-9 shrink-0 rounded-full bg-[var(--bg-primary)]" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="block h-3 w-24 rounded bg-[var(--bg-primary)]" />
                  <span className="block h-2.5 w-14 rounded bg-[var(--bg-primary)]/70" />
                </div>
                <span className="block h-4 w-12 shrink-0 rounded bg-[var(--bg-primary)]" />
              </div>
              <div className="h-1 w-full rounded-full bg-[var(--bg-primary)]" />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default Leaderboard;
