-- General Conference Talk Picker — V2 social, Update 1
--
-- Usernames, mutual friends, invite links and the friends leaderboard.
-- See SOCIAL_PLAN.md for the decisions behind all of this. Update 2 (the
-- wall: posts, hearts, reports, blocks) will be a separate file.
--
-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- AFTER schema.sql and avatars-storage.sql — it reads study_events /
-- talk_status and replaces delete_own_account(). Same project V1/V2 share.
-- Safe to re-run: everything is `if not exists` / `create or replace`.
--
-- Paste this as ONE block first. If the editor mangles it, split at the
-- section dividers into separate pastes — same fallback as schema.sql.
--
-- Errors the client is expected to handle are raised with a short
-- snake_case message (e.g. 'username_taken') so the app can map them to
-- friendly copy; anything else is a genuine bug.

create extension if not exists pgcrypto;

-- ─── social_profiles ──────────────────────────────────────────────────────────
-- Public identity for social features. A row only exists once the user
-- picks a username (required the first time they open the Social tab).
-- Readable by every signed-in user (username search needs it); written
-- only through the RPCs below, never directly.
--
-- avatar_url is a copy of user_metadata.avatar_url — that one lives on
-- auth.users, which other users can't read. updateAvatar() in
-- src/hooks/use-auth.tsx calls set_profile_avatar() to keep this in sync.
--
-- username_changed_at is null until the FIRST change after creation, so
-- a typo in a brand-new username can be fixed right away; after that,
-- one change per 90 days.

create table if not exists public.social_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' and username not like '%..%'),
  avatar_url text,
  username_changed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.social_profiles enable row level security;

drop policy if exists "social_profiles: signed-in select" on public.social_profiles;
create policy "social_profiles: signed-in select" on public.social_profiles
  for select to authenticated using (true);

-- ─── blocked_terms ──────────────────────────────────────────────────────────
-- Word filter. Update 1 applies it to usernames (substring match, since
-- usernames have no spaces); Update 2 will reuse it for posts. Add more
-- terms any time from the Table Editor — no app release needed. Kept
-- short and unambiguous on purpose: substring matching on short or
-- common words would reject innocent names ("ass" in "class", "cock" in
-- "Hancock", "dick" in "Dickson") — that's why those aren't here.
-- No RLS policies = not readable by clients at all.

create table if not exists public.blocked_terms (
  term text primary key check (term = lower(term))
);

alter table public.blocked_terms enable row level security;

insert into public.blocked_terms (term) values
  ('fuck'), ('shit'), ('cunt'), ('bitch'), ('nigger'), ('nigga'), ('faggot'),
  ('whore'), ('slut'), ('porn'), ('nazi'), ('hitler'), ('retard'),
  ('pussy'), ('penis'), ('vagina'), ('rapist')
on conflict (term) do nothing;

-- Usernames that could be mistaken for the app itself or staff.
create or replace function public.is_username_allowed(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $body$
  select
    p_username <> all (array[
      'admin', 'administrator', 'support', 'help', 'moderator', 'mod',
      'official', 'staff', 'system', 'root', 'null', 'undefined', 'me',
      'everyone', 'gctp', 'gctalkpicker', 'talkpicker', 'conferencetalkpicker',
      'churchofjesuschrist', 'prophet', 'apostle'
    ])
    and not exists (
      select 1 from public.blocked_terms
      where replace(replace(p_username, '_', ''), '.', '') like '%' || term || '%'
    );
$body$;

revoke all on function public.is_username_allowed(text) from public, anon, authenticated;

-- ─── friendships ────────────────────────────────────────────────────────────
-- One row per pair of people, whichever direction it started in (the
-- unique index on least/greatest enforces that).
--
-- Declines are silent: the requester keeps seeing "Requested", and
-- re-sending within 30 days is accepted by the RPC but changes nothing,
-- so they can't pester someone into a new notification. If they cancel
-- a declined request, hidden_for_requester hides it from their list
-- without deleting the row, so cancel-then-resend can't dodge the 30 days.

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.social_profiles (user_id) on delete cascade,
  addressee_id uuid not null references public.social_profiles (user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  hidden_for_requester boolean not null default false,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

drop policy if exists "friendships: participant select" on public.friendships;
create policy "friendships: participant select" on public.friendships
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ─── friend_invites ─────────────────────────────────────────────────────────
-- One reusable invite token per user, for https://gctalkpicker.app/invite/<token>.
-- Redeeming it makes the two people friends immediately (the inviter
-- chose to share it). The token is random so links can't be guessed;
-- regenerating replaces it, which kills every previously shared link.

create table if not exists public.friend_invites (
  user_id uuid primary key references public.social_profiles (user_id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

alter table public.friend_invites enable row level security;

drop policy if exists "friend_invites: owner select" on public.friend_invites;
create policy "friend_invites: owner select" on public.friend_invites
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.new_invite_token()
returns text
language sql
volatile
as $body$
  select translate(encode(gen_random_bytes(12), 'base64'), '+/', '-_');
$body$;

revoke all on function public.new_invite_token() from public, anon, authenticated;

-- ─── Profile RPCs ───────────────────────────────────────────────────────────

-- Creates the profile on first call, renames it on later calls.
-- Returns the stored (normalized) username. Raises:
--   username_invalid, username_not_allowed, username_taken,
--   username_change_too_soon (HINT = when the next change is allowed).
create or replace function public.set_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_uid uuid := auth.uid();
  v_username text := lower(btrim(p_username));
  v_existing public.social_profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if left(v_username, 1) = '@' then
    v_username := substr(v_username, 2);
  end if;

  if v_username !~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' or v_username like '%..%' then
    raise exception 'username_invalid';
  end if;
  if not public.is_username_allowed(v_username) then
    raise exception 'username_not_allowed';
  end if;

  select * into v_existing from public.social_profiles where user_id = v_uid;

  if not found then
    begin
      insert into public.social_profiles (user_id, username, avatar_url)
      select v_uid, v_username, u.raw_user_meta_data ->> 'avatar_url'
      from auth.users u where u.id = v_uid;
    exception when unique_violation then
      raise exception 'username_taken';
    end;
    return v_username;
  end if;

  if v_existing.username = v_username then
    return v_username;
  end if;

  if v_existing.username_changed_at is not null
     and v_existing.username_changed_at > now() - interval '90 days' then
    raise exception 'username_change_too_soon'
      using hint = (v_existing.username_changed_at + interval '90 days')::text;
  end if;

  begin
    update public.social_profiles
    set username = v_username, username_changed_at = now()
    where user_id = v_uid;
  exception when unique_violation then
    raise exception 'username_taken';
  end;

  return v_username;
end;
$body$;

-- Only accepts this user's own file in the avatars bucket (or null), so a
-- profile can't be pointed at an arbitrary image somewhere else on the web.
-- No-op if the user hasn't created a profile yet; set_username() copies
-- the avatar over when they do.
create or replace function public.set_profile_avatar(p_url text)
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
  if p_url is not null
     and p_url not like '%/storage/v1/object/public/avatars/' || v_uid::text || '.jpg%' then
    raise exception 'avatar_url_invalid';
  end if;

  update public.social_profiles set avatar_url = p_url where user_id = v_uid;
end;
$body$;

-- Username prefix search for "Add friend". Excludes the caller.
-- relationship: 'friend' | 'outgoing' | 'incoming' | 'none' (an incoming
-- request the caller declined shows as 'none').
create or replace function public.search_profiles(p_query text)
returns table (user_id uuid, username text, avatar_url text, relationship text)
language sql
stable
security definer
set search_path = public
as $body$
  select
    p.user_id,
    p.username,
    p.avatar_url,
    case
      when f.status = 'accepted' then 'friend'
      when f.requester_id = auth.uid() and not f.hidden_for_requester then 'outgoing'
      when f.addressee_id = auth.uid() and f.status = 'pending' then 'incoming'
      else 'none'
    end
  from public.social_profiles p
  left join public.friendships f
    on least(f.requester_id, f.addressee_id) = least(p.user_id, auth.uid())
   and greatest(f.requester_id, f.addressee_id) = greatest(p.user_id, auth.uid())
  where auth.uid() is not null
    and p.user_id <> auth.uid()
    and length(btrim(p_query, ' @')) >= 2
    and p.username like replace(replace(lower(btrim(p_query, ' @')), '_', '\_'), '%', '\%') || '%'
  order by p.username
  limit 20;
$body$;

-- ─── Friend RPCs ────────────────────────────────────────────────────────────
-- All take the OTHER person's user_id. Every one requires the caller to
-- have a profile (raises 'profile_required') — the FK on friendships
-- would reject the row anyway, this just gives a clean error.

create or replace function public.require_profile()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $body$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if not exists (select 1 from public.social_profiles where user_id = v_uid) then
    raise exception 'profile_required';
  end if;
  return v_uid;
end;
$body$;

revoke all on function public.require_profile() from public, anon, authenticated;

-- Returns the resulting state from the caller's point of view:
-- 'outgoing' (request sent / still pending) or 'friend' (they had
-- already asked you, so this accepts it).
create or replace function public.send_friend_request(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_uid uuid := public.require_profile();
  v_row public.friendships%rowtype;
begin
  if p_user_id = v_uid then
    raise exception 'cannot_friend_self';
  end if;
  if not exists (select 1 from public.social_profiles where user_id = p_user_id) then
    raise exception 'user_not_found';
  end if;

  select * into v_row from public.friendships
  where least(requester_id, addressee_id) = least(v_uid, p_user_id)
    and greatest(requester_id, addressee_id) = greatest(v_uid, p_user_id)
  for update;

  if not found then
    insert into public.friendships (requester_id, addressee_id)
    values (v_uid, p_user_id);
    return 'outgoing';
  end if;

  if v_row.status = 'accepted' then
    return 'friend';
  end if;

  -- They already asked you: sending one back is the same as accepting.
  if v_row.status = 'pending' and v_row.addressee_id = v_uid then
    update public.friendships set status = 'accepted', responded_at = now() where id = v_row.id;
    return 'friend';
  end if;

  if v_row.status = 'pending' then
    update public.friendships set hidden_for_requester = false where id = v_row.id;
    return 'outgoing';
  end if;

  -- Declined. Same requester within 30 days: silently keep it declined.
  if v_row.requester_id = v_uid and v_row.responded_at > now() - interval '30 days' then
    update public.friendships set hidden_for_requester = false where id = v_row.id;
    return 'outgoing';
  end if;

  -- Cooldown over, or the person who declined is now asking: fresh request.
  update public.friendships
  set requester_id = v_uid, addressee_id = p_user_id, status = 'pending',
      hidden_for_requester = false, created_at = now(), responded_at = null
  where id = v_row.id;
  return 'outgoing';
end;
$body$;

create or replace function public.respond_friend_request(p_user_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_uid uuid := public.require_profile();
begin
  update public.friendships
  set status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now()
  where requester_id = p_user_id and addressee_id = v_uid and status = 'pending';

  if not found then
    raise exception 'request_not_found';
  end if;
end;
$body$;

-- Withdraws the caller's own request. A pending one is deleted; a
-- declined one is only hidden, so the 30-day cooldown still applies.
create or replace function public.cancel_friend_request(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_uid uuid := public.require_profile();
begin
  delete from public.friendships
  where requester_id = v_uid and addressee_id = p_user_id and status = 'pending';

  update public.friendships set hidden_for_requester = true
  where requester_id = v_uid and addressee_id = p_user_id and status = 'declined';
end;
$body$;

create or replace function public.remove_friend(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_uid uuid := public.require_profile();
begin
  delete from public.friendships
  where status = 'accepted'
    and least(requester_id, addressee_id) = least(v_uid, p_user_id)
    and greatest(requester_id, addressee_id) = greatest(v_uid, p_user_id);
end;
$body$;

-- Everything for the Friends screen in one call.
-- state: 'friend' | 'incoming' | 'outgoing'
create or replace function public.get_my_friendships()
returns table (user_id uuid, username text, avatar_url text, state text, since timestamptz)
language sql
stable
security definer
set search_path = public
as $body$
  select
    p.user_id,
    p.username,
    p.avatar_url,
    case
      when f.status = 'accepted' then 'friend'
      when f.addressee_id = auth.uid() then 'incoming'
      else 'outgoing'
    end,
    coalesce(f.responded_at, f.created_at)
  from public.friendships f
  join public.social_profiles p
    on p.user_id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where auth.uid() in (f.requester_id, f.addressee_id)
    and (
      f.status = 'accepted'
      or (f.status = 'pending' and not (f.requester_id = auth.uid() and f.hidden_for_requester))
      or (f.status = 'declined' and f.requester_id = auth.uid() and not f.hidden_for_requester)
    )
  order by p.username;
$body$;

-- ─── Invite RPCs ────────────────────────────────────────────────────────────

create or replace function public.get_or_create_invite()
returns text
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_uid uuid := public.require_profile();
  v_token text;
begin
  select token into v_token from public.friend_invites where user_id = v_uid;
  if v_token is null then
    insert into public.friend_invites (user_id, token)
    values (v_uid, public.new_invite_token())
    returning token into v_token;
  end if;
  return v_token;
end;
$body$;

create or replace function public.regenerate_invite()
returns text
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_uid uuid := public.require_profile();
  v_token text := public.new_invite_token();
begin
  insert into public.friend_invites (user_id, token)
  values (v_uid, v_token)
  on conflict (user_id) do update set token = excluded.token, created_at = now();
  return v_token;
end;
$body$;

-- For the /invite/<token> page, including for guests who aren't signed
-- in yet ("@kmatua invited you"). Returns nothing for an unknown token.
create or replace function public.get_invite_owner(p_token text)
returns table (username text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $body$
  select p.username, p.avatar_url
  from public.friend_invites i
  join public.social_profiles p on p.user_id = i.user_id
  where i.token = p_token;
$body$;

-- Makes the caller and the invite's owner friends right away. Returns the
-- inviter's user_id + username. Raises invite_not_found / own_invite.
create or replace function public.redeem_invite(p_token text)
returns table (user_id uuid, username text)
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_uid uuid := public.require_profile();
  v_owner uuid;
begin
  select i.user_id into v_owner from public.friend_invites i where i.token = p_token;
  if v_owner is null then
    raise exception 'invite_not_found';
  end if;
  if v_owner = v_uid then
    raise exception 'own_invite';
  end if;

  insert into public.friendships (requester_id, addressee_id, status, responded_at)
  values (v_owner, v_uid, 'accepted', now())
  on conflict ((least(requester_id, addressee_id)), (greatest(requester_id, addressee_id)))
  do update set status = 'accepted', responded_at = now(), hidden_for_requester = false
  where public.friendships.status <> 'accepted';

  return query select p.user_id, p.username from public.social_profiles p where p.user_id = v_owner;
end;
$body$;

-- ─── Friends leaderboard ────────────────────────────────────────────────────
-- One row per member (the caller + accepted friends) with every metric;
-- the app sorts it per board. security definer because each person's
-- study data is RLS-scoped to its owner — the member list below is what
-- limits this to people who are actually friends.
--
-- talks_all_time = currently-studied count (same number Progress shows).
-- talks_this_week / _month = talks whose FIRST-ever study_events row
-- falls in the period and are still marked studied, so unmark/re-mark
-- can't inflate them. Weeks start Monday. Periods and streaks are UTC,
-- matching get_study_streaks() in schema.sql.
-- % of all talks is computed in the app (the talk count lives in the bundle).

create or replace function public.get_friends_leaderboard()
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  is_me boolean,
  talks_all_time integer,
  talks_this_week integer,
  talks_this_month integer,
  current_streak integer,
  longest_streak integer
)
language sql
stable
security definer
set search_path = public
as $body$
  with members as (
    select p.user_id from public.social_profiles p where p.user_id = auth.uid()
    union
    select case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
    from public.friendships f
    where f.status = 'accepted' and auth.uid() in (f.requester_id, f.addressee_id)
  ),
  studied as (
    select ts.user_id, ts.talk_id
    from public.talk_status ts
    join members m on m.user_id = ts.user_id
    where ts.is_studied
  ),
  first_study as (
    select se.user_id, se.talk_id, min(se.completed_at) as first_at
    from public.study_events se
    join studied s on s.user_id = se.user_id and s.talk_id = se.talk_id
    group by se.user_id, se.talk_id
  ),
  talk_counts as (
    select
      s.user_id,
      count(*)::integer as all_time,
      count(*) filter (where fs.first_at >= date_trunc('week', now()))::integer as this_week,
      count(*) filter (where fs.first_at >= date_trunc('month', now()))::integer as this_month
    from studied s
    left join first_study fs on fs.user_id = s.user_id and fs.talk_id = s.talk_id
    group by s.user_id
  ),
  study_days as (
    select distinct se.user_id, se.completed_at::date as study_date
    from public.study_events se
    join members m on m.user_id = se.user_id
  ),
  streaks as (
    select user_id, count(*) as streak_length, max(study_date) as streak_end
    from (
      select user_id, study_date,
             study_date - (row_number() over (partition by user_id order by study_date))::integer as grp
      from study_days
    ) numbered
    group by user_id, grp
  ),
  streak_stats as (
    select
      user_id,
      coalesce(max(streak_length) filter (where streak_end >= current_date - 1), 0)::integer as current_streak,
      max(streak_length)::integer as longest_streak
    from streaks
    group by user_id
  )
  select
    p.user_id,
    p.username,
    p.avatar_url,
    p.user_id = auth.uid(),
    coalesce(tc.all_time, 0),
    coalesce(tc.this_week, 0),
    coalesce(tc.this_month, 0),
    coalesce(ss.current_streak, 0),
    coalesce(ss.longest_streak, 0)
  from members m
  join public.social_profiles p on p.user_id = m.user_id
  left join talk_counts tc on tc.user_id = m.user_id
  left join streak_stats ss on ss.user_id = m.user_id;
$body$;

-- ─── Account deletion (replaces the version in schema.sql) ─────────────────
-- Same as before, plus the social tables. They'd cascade from auth.users
-- anyway; deleting explicitly keeps this correct if an FK ever changes.

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

  delete from public.friend_invites where user_id = v_uid;
  delete from public.friendships where v_uid in (requester_id, addressee_id);
  delete from public.social_profiles where user_id = v_uid;

  delete from public.user_progress where user_id = v_uid;
  delete from public.study_events where user_id = v_uid;
  delete from public.talk_status where user_id = v_uid;

  delete from auth.users where id = v_uid;
end;
$body$;

-- ─── Grants ─────────────────────────────────────────────────────────────────
-- Client-callable RPCs: signed-in users only, except get_invite_owner,
-- which guests need for the invite page. Supabase's default privileges
-- grant EXECUTE to anon/authenticated directly on every new function, so
-- revoking from `public` alone isn't enough — anon is named explicitly.

do $body$
declare
  fn text;
begin
  foreach fn in array array[
    'set_username(text)', 'set_profile_avatar(text)', 'search_profiles(text)',
    'send_friend_request(uuid)', 'respond_friend_request(uuid, boolean)',
    'cancel_friend_request(uuid)', 'remove_friend(uuid)', 'get_my_friendships()',
    'get_or_create_invite()', 'regenerate_invite()', 'redeem_invite(text)',
    'get_friends_leaderboard()', 'delete_own_account()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;
end;
$body$;

revoke all on function public.get_invite_owner(text) from public;
grant execute on function public.get_invite_owner(text) to anon, authenticated;
