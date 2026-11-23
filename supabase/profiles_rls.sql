-- Hardening for public.profiles. Run once in the Supabase SQL Editor.
--
-- BEFORE running: inspect what is currently live
--   select policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname = 'public' and tablename = 'profiles';
-- and drop any permissive policy you don't want (e.g. one with qual = true for anon).
--
-- Goals:
--   * other users can still read username / avatar_url (friends, leaderboard, add-friend)
--   * email and last_sign_in_at are NOT readable by other users (column privileges)
--   * users can only insert/update their own row
--   * the admin dashboard reads everything through admin_list_profiles()
--
-- IMPORTANT: replace the admin email below with the value of VITE_ADMIN_EMAIL.

alter table public.profiles enable row level security;

-- Clean slate for the policies this script manages
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No anonymous access at all
revoke all on public.profiles from anon;

-- Column-level: authenticated users cannot read other people's email / sign-in time.
-- (Own email is available from the auth session: supabase.auth.getUser().)
revoke select on public.profiles from authenticated;
grant select (id, username, avatar_url, created_at, scratchpad)
  on public.profiles to authenticated;
-- The app inserts `email` on signup and updates username/avatar_url/scratchpad:
grant insert (id, email) on public.profiles to authenticated;
grant update (username, avatar_url, scratchpad) on public.profiles to authenticated;
-- The app also tries to save `referrer` but that column doesn't exist yet. To enable it:
--   alter table public.profiles add column if not exists referrer text;
--   grant select (referrer) on public.profiles to authenticated;
--   grant update (referrer) on public.profiles to authenticated;
-- (full_name is intentionally not exposed to other users.)

-- Admin-only listing used by AdminDashboard
create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  email text,
  username text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.email, p.username, p.avatar_url, p.created_at, p.last_sign_in_at
  from public.profiles p
  where lower(auth.jwt() ->> 'email') = lower('rickypcyt@gmail.com')
  order by p.created_at desc, p.id;
$$;

revoke all on function public.admin_list_profiles() from public;
grant execute on function public.admin_list_profiles() to authenticated;
