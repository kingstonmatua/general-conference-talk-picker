# Social — plan (V2)

Branch: `feature/social` (off `v2`). Written 2026-10-05. Every decision below was made one by one with the user in a single session. Local commits only; never push unless asked.

## Decisions (user-confirmed)

1. **Friends are mutual**: request, then accept. People find each other by **username search** or an **invite link**. No contacts import.
2. **The wall is friends only.** Public per-talk threads might come later, not now.
3. **Every post must respond to a talk the poster has studied.** Reactions are **hearts only** (no comments) and posts are **text only** (no photos).
4. **Leaderboard: friends only for now.** National and global boards come in a later release. Their open questions (public opt-in, where country comes from, anti-cheating daily cap) are parked, not decided. The friends board has **3 boards**:
   - **Talks studied**, with a Week / Month / All-time switch. The all-time row also shows **% of all talks** inline ("212 talks · 5%").
   - **Current streak** (no period).
   - **Longest streak** (all-time).
5. **Moderation** (Update 2): reporting a post **hides it for everyone right away** until the owner reviews it. **Blocking is silent**: it unfriends, hides the person's posts and leaderboard rows, and blocks their requests and search. A **word filter** covers posts and usernames. **Community guidelines** are accepted once. The owner is the moderator: an **email alert per report** goes to kingstonmatua9@gmail.com, and reports are reviewed in the Supabase dashboard. An in-app admin screen is deferred.
6. **Identity: username only** (no display name), **changeable once every 90 days**. Setting it up is required the first time someone opens the Social tab.
7. **Tabs (native):** `Home · Browse · (Draw) · Social · Progress`. **Saved moves into Browse** as an "All | Saved" toggle. The Social tab has three sections: **Wall · Leaderboard · Friends**. The username lives on the Account screen. The web sidebar lists Home, Browse, Social, Progress and Saved.
8. **Guests** don't need an account, but get **as many sign-up prompts as fit**: a full prompt on the Social tab, plus inline "Sign up to…" cards and buttons on Home, Progress, Saved, after a draw, and on hearts and Mark as studied. No repeated blocking pop-ups unless the user asks for them.
9. **Two App Store updates.** **Update 1:** usernames, Social tab, friends (requests and invite links), friends leaderboard, tab rearrangement, guest prompts. **Update 2:** the wall (posts, hearts, report, block, filter, guidelines, email alerts). Web goes live after each piece is merged.

## Implementation calls (mine; flag if wrong)

- **Avatars must move to a readable place.** Today `avatar_url` lives in `auth.users.user_metadata`, which other users can't read. Add `social_profiles.avatar_url` and have `updateAvatar()` write to both.
- **Invite links use a token, not the username.** The link is `https://gctalkpicker.app/invite/<token>`. Redeeming it creates an **accepted** friendship straight away, since the inviter already chose to share it. That only works safely with an unguessable token; a username-based link would let anyone auto-friend anyone. There's one reusable token per user, regenerable from the Friends screen to revoke old links.
- **Getting from an invite link into the app:** on web, `/invite/[token]` works directly. On iOS, opening the link inside the app needs **universal links**, which means `ios.associatedDomains` in `app.json` (and therefore a new EAS build) plus an `apple-app-site-association` file served from gctalkpicker.app. A brand-new install loses the token, because the App Store doesn't pass it through. The invite page will show "Get the app, then tap this link again." Paid deferred-deep-link services (Branch etc.) are out of scope.
- **Weekly/monthly counts:** a talk counts toward the period when its **first-ever** `study_events` row falls inside it. That makes unmarking and re-marking a talk unable to inflate the count. Weeks start Monday. Periods and streaks are in **UTC** for now, which matches the existing `get_study_streaks()`. Local-timezone boundaries are a known follow-up.
- **All-time talks studied** = `talk_status.is_studied` count, the same number Progress shows.
- **Username rules:** 3–20 characters, `a-z 0-9 _ .`, stored lowercase, unique (case-insensitive), with a reserved list (admin, support, gctp, …) and the word filter applied. The first username set doesn't start the 90-day clock.
- **Re-requests:** a declined request can't be re-sent by the same person for 30 days, which limits pestering until Block arrives in Update 2.
- **`delete_own_account()`** must also delete profile, friendships, invite tokens, and in Update 2 posts, hearts and reports.
- **Privacy:** the username is a "User ID" (already declared in the App Privacy label). `/privacy` needs a line saying the username, avatar and study stats are visible to accepted friends.
- **Brand:** the leaderboard celebrates the top (gold chevron for #1) and never calls out last place or broken streaks. The Social tab icon comes from the same Ionicons outline set. Adding a fifth nav item goes past brand board §07's four-item nav; that was the user's explicit call.

## Data model (Update 1)

**Why `social_profiles`, not `profiles`:** the real Supabase project already has an empty, unused `public.profiles` table (columns `id`, `display_name`, `created_at`; not created by this app). The first paste failed on it on 2026-10-06, so ours was renamed rather than touching the existing one.

- `social_profiles` (user_id PK → auth.users, username unique, avatar_url, username_changed_at, created_at). Readable by any signed-in user (needed for search), writable only through RPCs.
- `friendships` (id, requester_id, addressee_id, status `pending|accepted|declined`, created_at, responded_at). One row per unordered pair. RLS: visible to both people.
- `friend_invites` (token PK, user_id, created_at).
- RPCs: `set_username`, `search_profiles`, `send_friend_request`, `respond_friend_request`, `cancel_friend_request`, `remove_friend`, `get_or_create_invite`, `redeem_invite`, `get_friends_leaderboard(period)`.

## Data model (Update 2, sketch)

`posts` (id, user_id, talk_id, body, created_at, hidden_at); `post_hearts` (post_id, user_id); `post_reports` (post_id, reporter_id, reason, created_at) → a trigger hides the post, and a Database Webhook calls a Supabase Edge Function that sends the alert email (Resend free tier); `blocks` (blocker_id, blocked_id); `guidelines_accepted_at` on social_profiles. The insert RPC checks for a `study_events` row for (user, talk) and runs the word filter.

## Build steps

**Update 1**
1. `supabase/social.sql`: tables, RLS and RPCs above, plus the `delete_own_account()` update. The user pastes it into the Supabase SQL Editor.
2. `use-social` hook: profile, friends, pending requests, leaderboard.
3. Tabs: add Social, fold Saved into Browse (All | Saved), web sidebar. **Verify in a real browser and on Expo Go**: `<Tabs>` changes have broken at runtime before while tsc/export looked clean.
4. Social tab: guest prompt → username setup → Leaderboard / Friends sections (Wall section shows "coming soon" until Update 2).
5. Friends: search, requests in/out, accept/decline, remove, share invite link (native share sheet), `/invite/[token]` route.
6. Leaderboard UI: three boards + Week/Month/All-time switch.
7. Account screen: username + change (90-day rule shown). `updateAvatar()` also writes `social_profiles.avatar_url`.
8. Guest sign-up prompts across the app.
9. Universal links config + AASA file; `/privacy` update; test web + Expo Go; update SESSION_HANDOFF.md; merge; EAS build.

**Update 2**: posts, hearts, report, block, filter, guidelines, email alerts. Plan in detail once Update 1 ships.

## Status
- 2026-10-05: plan written (`51b240c`). **Step 1 done in code** (`0ea11cb`): `supabase/social.sql`, tested in PGlite (52 behavior + 19 RLS/grant checks passed). **Not yet run in the real Supabase project.** Kingston needs to paste it into the SQL Editor (after `schema.sql` / `avatars-storage.sql`).
- **Next: step 2** (`use-social` hook). Error strings the hook should map to friendly copy: `username_invalid`, `username_not_allowed`, `username_taken`, `username_change_too_soon` (HINT = next allowed timestamp), `profile_required`, `cannot_friend_self`, `user_not_found`, `request_not_found`, `invite_not_found`, `own_invite`, `avatar_url_invalid`.
- Also: `updateAvatar()` in `use-auth.tsx` must call `set_profile_avatar(url)` after uploading (step 7).
- App Store build 1.0.0 (5) is awaiting Apple's decision (or the manual Release click). Check App Store Connect.
