# Draw page — plan (V2)

Branch: `feature/draw-page` (off `v2`). Written 2026-09-21. Product spec came from the user (drafted in Claude chat against V1); this file is the V2 translation. Local commits only, never push unless asked.

## Decisions (user-confirmed)
- **Every Draw button goes to `/draw`** (Home CTA, web sidebar, native tab-bar center button, and "Draw another talk" on the talk screen). Nothing draws instantly from a button anymore.
- Drawing does **not** mark a talk studied (unchanged from today). Studied status is still only recorded by "Mark as studied" (`mark_talk_studied` RPC). Tell the user before changing this.
- Result screen = existing `/talk/[id]`; when reached via Draw it gets **Draw again** (same scope, replace) and **Change scope** (back to `/draw`, filters intact).

## V2 facts the spec was missing
- Data: `src/data/talks.json` (4,050 talks, 1971–2026; fields id, title, speaker, year, month 4/10, session, category). Status: `talk_status` + `study_events` via `useTalkStatus()` (`studiedIdsByRecency`, `favoriteIds`). No `user_progress` / `remaining_ids` in V2 (that is V1 only).
- Current draw: `src/hooks/use-draw-random-talk.tsx` (`DrawRevealProvider`, reveal overlay, pool = unstudied, falls back to all talks).
- 9 session categories (`src/constants/session-taxonomy.ts`); 555 speaker strings, only known variant so far is "Jack H Goaslind Jr." vs "Jack H. Goaslind Jr." — normalize punctuation/titles, one entry per person.
- Non-tab screens must be added as a sibling `Stack.Screen` in root `src/app/_layout.tsx`.
- Guest storage: must work on web AND native (not raw `localStorage`).

## Scope controls
Year (single year picker with "All years", user chose this over a from/to range) · April/October toggles · session chips (9) · searchable multi-select speakers · "Unstudied only" (default on when signed in) · "From my Saved" · presets: Unstudied, Saved ("Last 10 years" dropped — can't be expressed with a single year). Live match count; Draw disabled at 0. Pre-fill last-used scope (first visit: everything). Scope encoded in URL params (`from`, `to`, `speaker`, ...). Works signed out (guest studied list on device until sign-in). If everything in scope is studied: say so, offer "Include studied talks" / "Widen scope".

## Progress (2026-09-21)
Done + user-verified in the dev server: `/draw` page with dropdowns (Year single-select incl. All years, Conference Both/April/October, Session multi with All-exclusive behavior, Speaker searchable multi), live match count, saved scope (`src/hooks/use-draw-scope.tsx`, AsyncStorage `gctp.drawScope.v1`), scope in URL params (`year, conf, sessions, speakers, unstudied, saved`, helpers in `src/lib/draw-scope.ts`), all Draw buttons (Home, web sidebar, native center tab) open `/draw`, `/draw` Draw + talk-screen "Draw another talk" draw from the saved scope (excluding the current talk; empty pool opens `/draw`), "Change scope" link on talk screen.
Also done + verified: empty-scope card on `/draw` (all studied → Include studied talks / Widen scope; no saved talks; filters don't overlap).
Still to do: guest studied list on device for Unstudied only; talk screen "Draw again"/"Change scope" polish; remove now-unused unscoped path in `use-draw-random-talk.tsx`; test on native (Expo Go); update SESSION_HANDOFF.md.

## Build steps (original order)
1. `/draw` route + scope model + filter controls + live match count (no drawing yet).
2. Presets, remembered last scope, URL params, speaker normalization.
3. Draw + result (Draw again / Change scope), reroute all entry points, all-studied edge case, guest handling.
4. Test on web + Expo Go, update SESSION_HANDOFF.md, commit locally.

## Constraints
Match design system/components/mobile layout. Metadata only (title, speaker, date) — link out to churchofjesuschrist.org, no talk content.
