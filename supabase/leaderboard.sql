-- Public leaderboard: top N users by tracked study time.
-- Run once in the Supabase SQL Editor.
--
-- SECURITY DEFINER bypasses RLS on study_laps, but the function only returns
-- aggregated numbers + public profile fields, never individual sessions.
-- If study_laps.duration is already of type `interval`, remove the ::interval cast.

create or replace function public.leaderboard(period text default 'month', lim int default 10)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  total_seconds bigint,
  sessions bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(nullif(p.username, ''), 'Anonymous'),
    p.avatar_url,
    sum(extract(epoch from l.duration::interval))::bigint as total_seconds,
    count(*)::bigint as sessions
  from public.study_laps l
  join public.profiles p on p.id = l.user_id
  where l.duration is not null
    -- Sanity limits: ignore corrupted rows (e.g. sessions left open for months
    -- and auto-closed with a huge duration) and sessions starting in the future.
    and l.duration::interval <= interval '24 hours'
    and l.started_at <= now()
    and (
      period = 'all'
      or l.started_at >= date_trunc(
        case when period in ('week', 'month', 'year') then period else 'month' end,
        now()
      )
    )
  group by p.id, p.username, p.avatar_url
  having sum(extract(epoch from l.duration::interval)) > 0
  order by total_seconds desc
  limit least(greatest(lim, 1), 50);
$$;

revoke all on function public.leaderboard(text, int) from public;
grant execute on function public.leaderboard(text, int) to authenticated;
