-- Public, aggregate-only stats for the landing page.
-- Run once in the Supabase SQL editor. Exposes no per-user data.
create or replace function public.landing_stats()
returns json
language sql
stable
security definer
set search_path = public, auth
as $$
  with parsed as (
    select
      user_id,
      coalesce(started_at, created_at) as ts,
      case
        when duration ~ '^\d+(\.\d+)?$' then duration::numeric
        when duration ~ '^\d+:\d+:\d+(\.\d+)?$' then
          split_part(duration, ':', 1)::numeric * 3600
          + split_part(duration, ':', 2)::numeric * 60
          + split_part(duration, ':', 3)::numeric
        when duration ~ '^\d+:\d+$' then
          split_part(duration, ':', 1)::numeric * 3600
          + split_part(duration, ':', 2)::numeric * 60
        else 0
      end as secs
    from study_laps
  ),
  -- Ignore bogus rows: empty, or longer than 12h (auto-closed sessions cap)
  s as (select * from parsed where secs > 0 and secs <= 43200),
  tot as (select count(*) as sessions, coalesce(sum(secs), 0) as secs from s),
  d as (select coalesce(sum(secs),0) as secs, count(*) as n from (select user_id, ts::date, sum(secs) as secs from s group by 1,2) x),
  w as (select coalesce(sum(secs),0) as secs, count(*) as n from (select user_id, date_trunc('week', ts), sum(secs) as secs from s group by 1,2) x),
  m as (select coalesce(sum(secs),0) as secs, count(*) as n from (select user_id, date_trunc('month', ts), sum(secs) as secs from s group by 1,2) x)
  select json_build_object(
    'users',          (select count(*) from auth.users),
    'sessions',       (select sessions from tot),
    'hours',          round(((select secs from tot) / 3600)::numeric, 1),
    -- Average hours per user, over the periods in which that user studied (all-time)
    'avg_hours_per_day',   round((select secs / nullif(n,0) / 3600 from d)::numeric, 2),
    'avg_hours_per_week',  round((select secs / nullif(n,0) / 3600 from w)::numeric, 2),
    'avg_hours_per_month', round((select secs / nullif(n,0) / 3600 from m)::numeric, 2)
  );
$$;

revoke all on function public.landing_stats() from public;
grant execute on function public.landing_stats() to anon, authenticated;
