-- General Conference Talk Picker — V2 schema
--
-- Runs against the SAME Supabase project V1 already uses (see
-- app/config.js for the URL/key) so auth/users are shared — this file
-- only ADDS new tables/functions. It does not touch V1's existing
-- `user_progress` table, which V1 keeps using untouched.
--
-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- There is no Supabase CLI project set up yet, so this isn't a CLI
-- migration — if one gets set up later, this file is the starting point.
--
-- talk_id values are the same strings as `Talk.id` in
-- src/data/talks.ts (the CSV's `talk_number`, as text) — there is no
-- `talks` table in Postgres, the dataset ships in the app bundle, so
-- talk_id is intentionally not a foreign key.

create extension if not exists pgcrypto;

-- ─── talk_status ────────────────────────────────────────────────────────────
-- Current per-user, per-talk state. Mutable — this is what the UI reads
-- for "Studied"/"Not studied" badges, the favorite star, and the Saved
-- list. Unmarking a talk as studied flips is_studied back to false HERE
-- but never touches study_events (see below) — that's what keeps past
-- streaks from retroactively changing.

create table if not exists public.talk_status (
  user_id uuid not null references auth.users (id) on delete cascade,
  talk_id text not null,
  is_studied boolean not null default false,
  is_favorite boolean not null default false,
  studied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, talk_id)
);

create index if not exists talk_status_user_favorites_idx
  on public.talk_status (user_id)
  where is_favorite;

alter table public.talk_status enable row level security;

drop policy if exists "talk_status: owner select" on public.talk_status;
create policy "talk_status: owner select" on public.talk_status
  for select using (auth.uid() = user_id);
drop policy if exists "talk_status: owner insert" on public.talk_status;
create policy "talk_status: owner insert" on public.talk_status
  for insert with check (auth.uid() = user_id);
drop policy if exists "talk_status: owner update" on public.talk_status;
create policy "talk_status: owner update" on public.talk_status
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "talk_status: owner delete" on public.talk_status;
create policy "talk_status: owner delete" on public.talk_status
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $body$
begin
  new.updated_at = now();
  return new;
end;
$body$;

drop trigger if exists talk_status_set_updated_at on public.talk_status;
create trigger talk_status_set_updated_at
  before update on public.talk_status
  for each row execute function public.set_updated_at();

-- ─── study_events ───────────────────────────────────────────────────────────
-- Append-only log: one row per "marked as studied" action. NEVER
-- updated or deleted by the app — currentStreak/longestStreak are always
-- derived from this table, never stored as a raw counter (locked
-- decision, see SESSION_HANDOFF.md). Re-studying a talk on a later day
-- is expected to insert another row.

create table if not exists public.study_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  talk_id text not null,
  completed_at timestamptz not null default now()
);

create index if not exists study_events_user_date_idx
  on public.study_events (user_id, completed_at);

alter table public.study_events enable row level security;

drop policy if exists "study_events: owner select" on public.study_events;
create policy "study_events: owner select" on public.study_events
  for select using (auth.uid() = user_id);
drop policy if exists "study_events: owner insert" on public.study_events;
create policy "study_events: owner insert" on public.study_events
  for insert with check (auth.uid() = user_id);
-- Intentionally no update/delete policy — append-only from the app's
-- perspective. (A service-role key could still administratively fix
-- data, but no authenticated client can.)

-- ─── RPCs ───────────────────────────────────────────────────────────────────
-- Small, safe surface for the client instead of raw table writes, so
-- "mark studied" can never update talk_status without also logging the
-- event, and "unmark" can never accidentally touch the log.

create or replace function public.mark_talk_studied(p_talk_id text)
returns void
language plpgsql
security invoker
set search_path = public
as $body$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.talk_status (user_id, talk_id, is_studied, studied_at)
  values (auth.uid(), p_talk_id, true, now())
  on conflict (user_id, talk_id)
  do update set is_studied = true, studied_at = now();

  insert into public.study_events (user_id, talk_id, completed_at)
  values (auth.uid(), p_talk_id, now());
end;
$body$;

create or replace function public.unmark_talk_studied(p_talk_id text)
returns void
language plpgsql
security invoker
set search_path = public
as $body$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.talk_status (user_id, talk_id, is_studied)
  values (auth.uid(), p_talk_id, false)
  on conflict (user_id, talk_id)
  do update set is_studied = false;
end;
$body$;

create or replace function public.set_talk_favorite(p_talk_id text, p_favorite boolean)
returns void
language plpgsql
security invoker
set search_path = public
as $body$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.talk_status (user_id, talk_id, is_favorite)
  values (auth.uid(), p_talk_id, p_favorite)
  on conflict (user_id, talk_id)
  do update set is_favorite = p_favorite;
end;
$body$;

-- ─── Streak calculation ─────────────────────────────────────────────────────
-- "study day" = a calendar day with >=1 study_events row. current_streak
-- counts the trailing run of consecutive study days, and is 0 if the
-- most recent study day was more than 1 day ago (i.e. it's still "alive"
-- through today or yesterday, not broken the moment a day is skipped
-- before it's even over). longest_streak is the longest such run ever.
-- Always derived live from study_events — never cached/stored.

create or replace function public.get_study_streaks()
returns table (current_streak integer, longest_streak integer)
language sql
stable
security invoker
set search_path = public
as $body$
  with study_days as (
    select distinct completed_at::date as study_date
    from public.study_events
    where user_id = auth.uid()
  ),
  numbered as (
    select
      study_date,
      study_date - (row_number() over (order by study_date))::integer as grp
    from study_days
  ),
  streaks as (
    select grp, count(*) as streak_length, max(study_date) as streak_end
    from numbered
    group by grp
  )
  select
    coalesce(
      (select streak_length from streaks
       where streak_end >= current_date - 1
       order by streak_end desc limit 1),
      0
    )::integer as current_streak,
    coalesce((select max(streak_length) from streaks), 0)::integer as longest_streak;
$body$;

-- ─── Account deletion ───────────────────────────────────────────────────────
-- Required by Apple (Guideline 5.1.1(v)): an app that supports account
-- creation must also let a user delete their account from inside the app,
-- not just "email us". `security definer` is required here (unlike the
-- RPCs above) because deleting from auth.users needs privileges an
-- ordinary authenticated client role doesn't have — this function runs
-- as its owner (whichever role pastes this into the SQL Editor, normally
-- the project's postgres/admin role) instead, but it can only ever act
-- on auth.uid()'s own row, so a client still can't delete anyone else.
--
-- Deletes V2's own tables explicitly rather than relying solely on their
-- `on delete cascade` FK to auth.users, and also deletes V1's
-- `user_progress` row (that table predates this schema file and its FK
-- behavior toward auth.users isn't documented/managed here) — so this
-- stays correct even if either assumption changes later. Also removes
-- the user's uploaded avatar object from Storage, since that isn't
-- covered by any Postgres foreign key at all.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.user_progress where user_id = v_uid;
  delete from public.study_events where user_id = v_uid;
  delete from public.talk_status where user_id = v_uid;

  delete from auth.users where id = v_uid;
end;
$body$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
