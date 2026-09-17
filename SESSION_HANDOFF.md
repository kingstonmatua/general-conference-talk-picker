# General Conference Talk Picker V2 — Session Handoff

Last updated: 2026-09-16, end of session (includes a later same-day session that took V2 live).

## V2 is now the live site (2026-09-16)

`gctalkpicker.app` now serves V2, not V1. Deployed by exporting a static web build (`npm run build:web`) and pushing it straight to the existing Cloudflare Pages project with Wrangler (`npm run deploy:web`), **not** by pushing to GitHub and letting Cloudflare's Git integration build it — the Pages project (name `general-conference-talk-picker`, production branch `main` on GitHub — note this differs from the local worktree branch names `develop`/`v2`) is still Git-connected, so a future push to `main` would auto-rebuild and redeploy over this. If V2 needs to stay live long-term, that Git connection should eventually get pointed at a real `v2` build (root directory `Design/APP V2`, build command `npm run build:web`, output directory `dist`) instead of being bypassed by hand each time — not done yet, flagged for later.

**Two real bugs found and fixed while testing the production export** (neither showed up in `expo start --web` dev mode — dev and the static export bundle behave differently):
1. `HeroBanner` (`src/components/ui/hero-banner.tsx`) used `expo-image`'s `Image` inside `StyleSheet.absoluteFill` — its web wrapper collapsed to 0px height in the exported/minified bundle only, so every hero photo silently disappeared in production. Fixed by switching to React Native's core `Image` — **which introduced a second bug, caught by the user after go-live** ("most of the images are cut off"): react-native-web's core `Image` defaults an unstyled dimension to the source asset's own intrinsic size (all 4 hero photos are 1774x887) rather than stretching to fill absoluteFill, so `resizeMode="cover"` had nothing to scale against — photos rendered pinned at raw pixel size top-left and got clipped by the container, showing only a small inconsistent sliver. Actually fixed by also forcing `width:'100%', height:'100%'` in the Image's own style. If touching this component again: verify it's proportionally *covering* the banner at more than one viewport width, not just that a photo appears at all.
2. `src/app/account.tsx` had no signed-out state at all — `user?.email ?? 'Signed in'` faked a "Signed in" label with all-zero stats for a signed-out visitor instead of prompting sign-in like every other screen. Fixed to match the `!user` → sign-in-prompt pattern used on Home/Progress/Saved.

**A third bug is Cloudflare-specific, not app-specific, and will resurface on every future deploy if skipped**: Cloudflare Pages silently drops any uploaded file whose path contains a `node_modules` segment. `expo export --platform web` puts vendor assets (the Ionicons font, expo-router's built-in icons) under `dist/assets/node_modules/...`, so those paths 200'd with an HTML body instead of the real file once deployed — the font specifically came back as `text/html`, which the browser's `nosniff` correctly refused to use as a font, so every icon in the live app rendered as a tofu box. `scripts/patch-web-export-for-cloudflare.js` renames that folder to `dist/assets/vendor` and rewrites the matching path strings in the exported JS/CSS/HTML; it's wired into `npm run build:web` so this isn't a manual step to remember. **Always use `npm run build:web` / `npm run deploy:web`, never a bare `expo export`, before shipping a web build anywhere.**

**Known regression, accepted deliberately**: V2 is missing some things V1 had — Draw-specific filters by year/conference/speaker, an "undo last draw" button, and native (iOS/Android) sign-in. The user chose to go live anyway rather than wait; see "Not yet built" below for the full list. Worth prioritizing a fix for Draw filters/undo given real users now hit this gap.

**The disposable test account** (`gctp-v2-test-verify@mailinator.com`, see the Supabase section below) was not involved in this deploy — the real user's own account (`kingstonmatua9@gmail.com`) was already signed into the live domain from prior V1 use and picked up V2's UI immediately post-deploy, stats intact (Supabase is shared between V1/V2, see below).

**Read this first if you're a fresh Claude Code session picking this up.** Claude's persistent memory lives in the local user's home directory on the machine it was created on — it does **not** travel with this removable drive. On a new machine this project will look completely unfamiliar to Claude even though the git history and this file are right here. Point Claude at this file first thing — and also read **`CLAUDE_MEMORY.md`** in this same folder, which covers how to work with Kingston specifically (short version: not a coder, give slow numbered steps for anything hands-on).

## Quick start

```bash
cd "Design/APP V2"
npm install        # if node_modules isn't already on the drive / needs a refresh
npx expo start --web
# open http://localhost:8081
```

Four real routes, now wired to a live Supabase backend: Home (`/`), Browse (`/browse`), Progress (`/progress`), Saved (`/saved`) — all under the `(tabs)` route group now, see "Routing structure" below — plus a talk detail screen at `/talk/[id]` (tap any talk card) and a living design-system reference at `/design-system` (not in the nav, direct URL only, still placeholder/decorative — not wired to real data).

## Where the code actually lives (this matters)

This repo uses a **git worktree**, not a separate repo:

- Same repository/remote as V1: `kingstonmatua/general-conference-talk-picker` on GitHub.
- V1 (the current live app) is untouched, on `develop`, checked out at `app/` (sibling folder).
- V2 is on a branch called **`v2`**, checked out at *this* folder (`Design/APP V2`).
- `v2` branched off `develop` at commit `c01f0a5`, tagged **`v1-final`** as a permanent marker of where V2 began.
- **Nothing has been pushed to GitHub yet.** `v2` and `v1-final` exist only in this local `.git` — which does travel with the drive, so history/branches are fine to resume from any machine that has this drive mounted. Just don't expect `git fetch`/`git pull` to show anything until someone pushes.
- Run git commands for V2 from inside `Design/APP V2` specifically, not from `app/` — they're different working trees of the same repo.
- **This entire session's work IS committed** (as of 2026-09-16, 6 new commits — talks import, Supabase schema, Supabase client/auth/talk-status hooks, routing restructure + screens rewired + Draw logic, logo recolor, this handoff update). `git log` on `v2` tells the story in order, same as before. Working tree was clean at end of session. Still **not pushed to GitHub** — only commit locally unless the user explicitly asks to push.
- **Resolved, later the same day**: `gctalkpicker.app`'s deploy mechanism turned out to be a Cloudflare Pages project (`general-conference-talk-picker`, no config in-repo because it's all set up in the Cloudflare dashboard, DNS on Cloudflare's own nameservers). See "V2 is now the live site" at the top of this file for the full story — V2 replaced V1 there this session, via direct Wrangler upload, deliberately accepting the missing-features regression mentioned below.

## Stack

Expo SDK 57, Expo Router, React 19.2 / React Native 0.86, TypeScript, typed routes, React Compiler enabled. Routes live under `src/app/` (not root-level `app/`, to avoid confusion with the sibling V1 folder). **Supabase is now wired up** — see below.

## Routing structure (changed this session, 2026-09-16 — read before adding any new screen)

```
src/app/
  _layout.tsx          Root Stack. Providers (Auth/TalkStatus) + AuthSheet live HERE.
  (tabs)/
    _layout.tsx        Just renders <AppTabs/> (the sidebar/bottom-tabs chrome).
    index.tsx          Home        — same URLs as before: (tabs) doesn't appear in the path.
    browse.tsx          Browse
    progress.tsx        Progress
    saved.tsx            Saved
  talk/
    [id].tsx           Talk detail — sibling of (tabs), NOT nested under it.
  design-system.tsx     Sibling of (tabs) too.
```

**Why this exists — a real bug, not a style choice:** `expo-router/ui`'s `<Tabs>`/`<TabSlot>` (used inside `(tabs)/_layout.tsx` via `AppTabs`) only renders routes that are registered as a `<TabTrigger>`. Before this session, `_layout.tsx` rendered `<AppTabs/>` directly at the root with no `<Stack>` around it, and **any route that wasn't one of the 4 tabs silently fell back to rendering Home instead** — confirmed broken for both the new `talk/[id]` route and the pre-existing `/design-system` (which the handoff previously, incorrectly, described as "direct URL only" — it wasn't actually working). Wrapping `(tabs)` in a root `<Stack>` alongside sibling screens fixes both.

**If you add another screen that shouldn't live in the tab bar** (a settings screen, an onboarding flow, etc.), it MUST go as a sibling `Stack.Screen` in root `_layout.tsx` — do not just drop a new file directly under `(tabs)/` expecting it to be reachable outside the tab set, and do not assume a bare file under `src/app/` will "just work" the way normal Expo Router docs imply, because this project's custom tab setup breaks that assumption.

`AuthProvider`/`TalkStatusProvider`/`AuthSheet` live in the ROOT layout (not inside `(tabs)`) specifically so `talk/[id]` and `design-system` also get auth/talk-status context — if they'd stayed inside `(tabs)/_layout.tsx`, sibling screens outside the tab group wouldn't have access to them.

## Design source of truth

`Design/GPT Mock Images/talk-picker-v2-brand-board.pdf` is the **binding** visual spec (colors, type, spacing, icon rules, nav labels). The 8 ChatGPT mockup PNGs next to it are rough layout guides only, explicitly non-binding on exact pixels/copy.

**Standing rule, confirmed by the user: when the PDF and a mockup disagree, the PDF always wins.** This came up concretely with the primary button color — the PDF's own example art shows a champagne-filled primary button + purple-outline secondary, while the mockups show a solid purple CTA. Champagne/purple-outline is what's built. Don't re-litigate this or similar conflicts; just follow the PDF.

**A full Figma port of the design system also exists now** — see "Figma file" section below.

## What's built so far

### Visual/design system (prior sessions)
1. **Scaffold** — stock `create-expo-app` output, renamed from generic defaults.
2. **Design-system tokens** (`src/constants/theme.ts`) — full brand palette, session-tag color tints, Georgia/Arial type scale (`ThemedText` types: `display`/`section`/`body`/`control`/`metadata`/`eyebrow`), the 4/8/12/16/24/32/48 spacing scale, card/button/tag radii. Primitives: `Card`, `Button` (primary=champagne, secondary=purple outline), `SessionTag`/`Tag`, `StatTile`, `TalkCard`, `Pill`, `SearchField`. All viewable live at `/design-system` (still placeholder content).
3. **Icon system** — `src/components/ui/icon.tsx` wraps Ionicons' outline set. `src/components/ui/page-fold-icon.tsx` is a hand-drawn SVG of the brand's signature open-book/"V" motif.
4. **Nav shell** — exactly four items (Home/Browse/Progress/Saved). Web: persistent left sidebar (`app-tabs.web.tsx`), now also shows the signed-in user's email + Sign out (or a "Sign in to track progress" link) in the footer. Native: real bottom tabs (`app-tabs.tsx`), **not yet given the same account footer**. **Known gap:** the web sidebar isn't responsive for a narrow/phone browser (low priority, native app covers phones).
5. **Hero images** — every page has a full-bleed photo (`assets/images/hero/`) with a dark-ink headline/subhead faded into the canvas color. Home's "daily moment" card overlaps/bleeds behind the bottom of its hero image.

### Data layer (this session, 2026-09-16)
6. **Real talks dataset imported** — `scripts/generate-talks-data.js` parses `app/General Conference Database FINAL - Sheet1.csv` (4,050 rows, quote-safe CSV parsing, no dependency) into `src/data/talks.json` (minified, generated — don't hand-edit) + typed `src/data/talks.ts` (`Talk` type, `TALKS` array, `getTalkById`, `getTalksByCategory`, `searchTalks`, `formatTalkMeta`). Session-taxonomy mapping lives in `src/constants/session-taxonomy.ts` (`RAW_SESSION_TO_CATEGORY`, `mapRawSessionToCategory`) — all 21 raw session strings mapped, throws loudly on any unmapped value so a future CSV update can't silently miscategorize talks. Re-run the generator after the CSV changes: `node scripts/generate-talks-data.js`.
7. **Supabase wired up** — `src/lib/supabase.ts` is the client (same project/keys as V1, see `app/config.js` — **V1 and V2 share one user base**). Guards against a real bug: Expo Router's web server-render pass runs in Node with no `window`, and AsyncStorage's web shim crashes if used there — the client falls back to a no-op storage during that SSR pass and only uses real `AsyncStorage` in an actual browser/native runtime.
8. **`src/hooks/use-auth.tsx`** (`AuthProvider`/`useAuth`) — session state via `onAuthStateChange`, plus a `promptSignIn()`/`promptVisible` pair that any screen can call to pop the sign-in sheet without needing to render its own modal.
9. **`src/components/auth-sheet.tsx`** — the actual sign-in/sign-up modal (email + password, toggles between modes), mounted once at the root in `_layout.tsx`. **Email confirmation is required** on this Supabase project (real signup sends a real confirmation email) — there is no "skip confirmation" path.
10. **`src/hooks/use-talk-status.tsx`** (`TalkStatusProvider`/`useTalkStatus`) — fetches all `talk_status` rows for the signed-in user into memory, exposes `getStatus(talkId)`, `markStudied`/`unmarkStudied`/`setFavorite` (call the RPCs below, optimistic-update then reconcile on error), `studiedCount`, `favoriteIds`, `studiedIdsByRecency`, `currentStreak`/`longestStreak` (via `get_study_streaks()` RPC, refreshed after every `markStudied`). All three mutators call `promptSignIn()` instead of writing if there's no user.
11. **All four screens rewired to real data + real state**:
    - **Browse**: all 4,050 real talks, real search/category filter, favorite toggle wired to Supabase. Rendered via `FlatList` (not `ScrollView`+`.map`, which would try to mount 4,050 cards at once) — **note a real layout bug that had to be worked around, twice**: `FlatList`'s header/item wrappers on react-native-web don't resolve `width:'100%'`/`alignSelf:'stretch'` against the list's actual width. First surfaced as talk cards shrink-wrapping to their own content instead of filling the column; fixed by measuring the real slot width via `onLayout` on the screen's root `SafeAreaView` and passing an explicit pixel width to each card wrapper. The *same* bug then squashed the hero banner's height too (its `ListHeaderComponent` wrapper has the identical problem) — fixed the same way, by giving the header `View` an explicit `style={{ width: slotWidth }}`. See the `slotWidth`/`contentWidth` pattern in `browse.tsx`. **If any other screen ever needs a `FlatList` with centered/max-width content, reuse this pattern for every child of the list (including the header) — don't reach for `width:'100%'` inside a FlatList again.**
    - **Saved**: real favorited talks (via `favoriteIds` → `getTalkById`), real status filter, unsave = `setFavorite(id, false)`. Sign-in prompt card shown when signed out.
    - **Home**: real stats row (studied count, current streak, favorite count). "Continue Studying" was **redefined** from the old fake-progress-bar placeholder to: favorited-but-not-yet-studied talks (up to 2), each with a real "Mark as studied →" action — there's no partial in-progress-within-a-talk concept in this app (no duration/reading-time field, a locked decision), so a progress bar never made sense here once real data was wired in. Sign-in prompt card shown when signed out.
    - **Progress**: real overall %, real studied/streak/longest-streak stats, real "Recently Studied Conferences"/"Recently Studied Speakers" (grouped from `TALKS` + `talk_status`, sorted by actual `studied_at` recency, not conference date). Progress Scope's "Last 5/10 Years" pills actually filter the year range now; "Custom Range" is shown but disabled (no date-picker UI exists) rather than faked.
    - `TalkCard`'s `actionLabel` gained an optional `onPressAction` prop (backward compatible — Browse/Saved don't pass it, so their action labels stay static) so Home's "Mark as studied →" can actually do something.
12. **End-to-end verified working** (2026-09-16, via a disposable `@mailinator.com` test account signed up and confirmed through the real flow, then deleted from the account's perspective by signing out — **the test user itself was NOT deleted from Supabase Auth, see below**): favoriting persists across reloads, marking studied updates Home/Progress stats and the streak (day streak went 0→1 immediately), Saved/Continue Studying correctly react to status changes.
13. **Talk detail screen** (`src/app/talk/[id].tsx`) — required the routing restructure above. Shows the tapped talk's session tag/title/speaker/date, a favorite toggle, "Mark as studied"/"Mark as not studied", "Save for later"/"Remove from Saved", and "Read on churchofjesuschrist.org →" (opens `talk.url` via `expo-web-browser`'s `openBrowserAsync` — verified wired correctly with no console errors, but the actual tab-opening wasn't visually confirmed through the automated browser testing used this session; worth a real click to double check). `TalkCard` gained an `onPress` prop (wraps the card in a `Pressable`; the existing favorite/action-label inner `Pressable`s now call `e.stopPropagation()` so tapping those doesn't also trigger navigation) — wired up from Browse, Saved, and Home's "Continue Studying" cards, all navigating via `router.push({ pathname: '/talk/[id]', params: { id } })`.
14. **"Draw a Random Talk" is real** — `src/hooks/use-draw-random-talk.ts`. "Remaining bag" for V2 is defined as *not-yet-studied talks* (derived from `talk_status` already wired up, not a separate drawn/remaining table like V1's `remaining_ids` array); once everything is studied the bag refills from the full 4,050 rather than drawing nothing. Unfiltered for now — no Draw-specific filter UI exists (Progress Scope's "Browse filters = find, Draw filters = choose, Progress Scope = measure" framing implies Draw should eventually get its own filters, but that's not built). Wired to both the Home daily-moment button and the web sidebar's button (which used to just `<Link href="/">`, now actually draws). Verified live: draws a genuine random unstudied talk each time, from both entry points.
15. **Brand logo/icon recolored** — `assets/images/brand/main-logo.png` and `main-icon.png` used `Palette.conferencePurple` (#5B2CB5, the medium accent) for their flat purple fill, which read as a different, brighter purple than the rest of the UI. Remapped to `Palette.purpleInk` (#261845, the headline-ink color) by exact RGB replacement (both PNGs use flat colors with alpha-only anti-aliasing, no gradients, so this was a clean swap); gold and the tagline text untouched. If a real design-tool source file shows up later (there's a vector `.eps` at `Branding/V1/General Conference Talk Picker_Main Logo.eps` in the outer project folder, sibling to this worktree), prefer recoloring from that over re-editing the PNGs again.

## Figma file

A full design-system port exists in Figma: **General Conference Talk Picker — V2 Design System** (file key `sEK1hrocXl4qeYXM6hTDbx`). 17 pages: Cover, Foundations (colors/type/spacing/radius/elevation, all bound to real Figma variables), one page per component (Button/Card/Tag & SessionTag/Pill/StatTile/TalkCard/SearchField/HeroBanner/Icons), and all 4 screens composed from real component instances with your actual hero photos uploaded. Known simplifications: Georgia/Arial aren't available in that rendering environment so text uses **Noto Serif** (for Georgia) and **Arimo** (for Arial — metrically identical, not just a random substitute) instead; icons are simplified line-art stand-ins for the real Ionicons, not pixel-perfect redraws.

## Locked product decisions (don't re-litigate these; if genuinely stuck, ask, don't guess)

- **Session taxonomy**: full mapping of all 21 raw `session` values to 10 normalized categories — now implemented in **both** `src/constants/theme.ts` (`SessionCategoryTag`/`SessionCategory`, the UI-facing labels/colors) **and** `src/constants/session-taxonomy.ts` (`RAW_SESSION_TO_CATEGORY`, the actual raw-string mapping used by the data import). `RELIEF_SOCIETY` absorbs "General Women's Session/Meeting" + "General Relief Society Meeting"; `YOUNG_WOMEN` has zero real matches (kept for future-proofing); historical weekday sessions (Tue/Thu/Fri — conference ran those days in earlier decades) → `OTHER_HISTORICAL`; no `GENERAL_SESSION` catch-all.
- **Speaker headshots: IN**, but sourcing is unresolved — open questions are (a) current photo vs. era-correct photo per talk, (b) hotlink vs. download-and-self-host, (c) quick sanity-check on churchofjesuschrist.org's terms. Nothing built yet.
- **No duration/reading-time field** — decided against, no reliable source data exists. (This is why "Continue Studying" is a to-do list, not a progress bar — see above.)
- **Day streak**: a "study day" = a calendar day with ≥1 talk marked studied. **Now fully implemented and verified**: append-only `study_events` table (never updated/deleted by the app), `get_study_streaks()` Postgres function derives current/longest streak live via date-gap grouping — see `supabase/schema.sql`. Unmarking a talk flips `talk_status.is_studied` back to false but never touches `study_events`, so past streaks can't retroactively change.
- **Progress Scope** (renamed from "Study Range"): reporting-only, fully independent from Draw/Browse filters. Default: "All Conferences". **Now implemented for real** on `/progress` — Last 5/10 Years filter the year range client-side; Custom Range is a known gap (disabled pill), not built.
- **Git/worktree strategy** — see "Where the code actually lives" above.
- **Supabase project is shared with V1** — same URL/anon key (`app/config.js`), same `auth.users`. V2 added `talk_status` + `study_events` tables (RLS-scoped to `auth.uid()`) alongside V1's existing `user_progress` table (left untouched). Full schema + the three write RPCs (`mark_talk_studied`/`unmark_talk_studied`/`set_talk_favorite`) are in `supabase/schema.sql` — there's no Supabase CLI project set up, so that file is meant to be pasted into the Supabase SQL Editor (in small chunks — bare `$$` dollar-quoting broke on paste once already in that editor; the file uses named `$body$` tags instead, which is safer to paste as one block if starting fresh).
- **A surprise, already resolved**: the Supabase project also had pre-existing, empty (0 rows), undocumented `talks` and `user_talks` tables from some earlier, unreferenced backend attempt (not used by V1's `app.js`, not mentioned anywhere before this session). Confirmed empty and dropped with user approval on 2026-09-16. If anything like this turns up again, check `information_schema.columns` and row counts before building on top of it — don't assume the project only contains what's referenced in code.
- **A disposable test account** (`gctp-v2-test-verify@mailinator.com`) exists in Supabase Auth with 1 studied talk / 1 favorite, used to verify the whole pipeline end-to-end on 2026-09-16. Harmless, but the user may want to delete it from the Supabase dashboard's Authentication tab at some point — it was never cleaned up.

## Not yet built (the big next chunk)

- Draw has no filters of its own yet (see item 14 above) — Progress Scope's framing implies it eventually should.
- Browse's combined "Relief Society & Young Women" filter label was proposed but never explicitly confirmed by the user.
- Native app (iOS/Android tab bar) doesn't have an account/sign-in affordance yet — only the web sidebar does. The `AuthSheet` modal itself is cross-platform and should work fine on native once something triggers `promptSignIn()` there.
- `/design-system` reference page is still fully placeholder/decorative, not wired to anything (though it does render correctly now — see routing fix above).
- **New idea, not designed yet (flagged 2026-09-16, end of a later same-day session):** a social/sharing aspect — the user wants people to be able to share their progress, day streaks, and overall study stats (the same numbers already surfaced via `useTalkStatus()` — `studiedCount`, `currentStreak`, `longestStreak`, `favoriteIds.length` — and shown on Home/Progress/the new Account screen). Nothing about *how* is decided: not whether this means a native share-sheet image/card (`expo-sharing` / a rendered share graphic), an in-app social feed, deep links to specific stats, or posting to external platforms; not whether it's opt-in/public by default; not whether it needs any new backend (a public shareable URL would need one, a pure "share sheet with a generated image" would not). Ask the user for their mental model of this before building anything — don't assume the shape.

## Suggested next steps

In rough priority order: (1) add the sign-in affordance to the native tab bar, (2) decide on speaker headshots sourcing, (3) consider Draw-specific filters if the user wants them. Or keep doing visual/UX passes — ask the user which they want rather than assuming.
