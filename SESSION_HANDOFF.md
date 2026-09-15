# General Conference Talk Picker V2 — Session Handoff

Last updated: 2026-09-15, end of session (moving to another machine).

**Read this first if you're a fresh Claude Code session picking this up.** Claude's persistent memory lives in the local user's home directory on the machine it was created on — it does **not** travel with this removable drive. On a new machine this project will look completely unfamiliar to Claude even though the git history and this file are right here. Point Claude at this file first thing.

## Quick start

```bash
cd "Design/APP V2"
npm install        # if node_modules isn't already on the drive / needs a refresh
npx expo start --web
# open http://localhost:8081
```

Four real routes: Home (`/`), Browse (`/browse`), Progress (`/progress`), Saved (`/saved`), plus a living design-system reference at `/design-system` (not in the nav, direct URL only).

## Where the code actually lives (this matters)

This repo uses a **git worktree**, not a separate repo:

- Same repository/remote as V1: `kingstonmatua/general-conference-talk-picker` on GitHub.
- V1 (the current live app) is untouched, on `develop`, checked out at `app/` (sibling folder).
- V2 is on a branch called **`v2`**, checked out at *this* folder (`Design/APP V2`).
- `v2` branched off `develop` at commit `c01f0a5`, tagged **`v1-final`** as a permanent marker of where V2 began.
- **Nothing has been pushed to GitHub yet.** `v2` and `v1-final` exist only in this local `.git` — which does travel with the drive, so history/branches are fine to resume from any machine that has this drive mounted. Just don't expect `git fetch`/`git pull` to show anything until someone pushes.
- Run git commands for V2 from inside `Design/APP V2` specifically, not from `app/` — they're different working trees of the same repo.

## Stack

Expo SDK 57, Expo Router, React 19.2 / React Native 0.86, TypeScript, typed routes, React Compiler enabled. Routes live under `src/app/` (not root-level `app/`, to avoid confusion with the sibling V1 folder). No backend wired up yet — everything below is UI/layout only.

## Design source of truth

`Design/GPT Mock Images/talk-picker-v2-brand-board.pdf` is the **binding** visual spec (colors, type, spacing, icon rules, nav labels). The 8 ChatGPT mockup PNGs next to it are rough layout guides only, explicitly non-binding on exact pixels/copy.

**Standing rule, confirmed by the user: when the PDF and a mockup disagree, the PDF always wins.** This came up concretely with the primary button color — the PDF's own example art shows a champagne-filled primary button + purple-outline secondary, while the mockups show a solid purple CTA. Champagne/purple-outline is what's built. Don't re-litigate this or similar conflicts; just follow the PDF.

## What's built so far

All on the `v2` branch, one focused commit per change (`git log` tells the story in order):

1. **Scaffold** — stock `create-expo-app` output, renamed from generic defaults.
2. **Design-system tokens** (`src/constants/theme.ts`) — full brand palette, session-tag color tints, Georgia/Arial type scale (`ThemedText` types: `display`/`section`/`body`/`control`/`metadata`/`eyebrow`), the 4/8/12/16/24/32/48 spacing scale, card/button/tag radii. Primitives: `Card`, `Button` (primary=champagne, secondary=purple outline), `SessionTag`/`Tag`, `StatTile`, `TalkCard`, `Pill`, `SearchField`. All viewable live at `/design-system`.
3. **Icon system** — `src/components/ui/icon.tsx` wraps Ionicons' outline set (one consistent family, used natively via `NativeTabs.Trigger.VectorIcon` too, no exported PNGs needed). `src/components/ui/page-fold-icon.tsx` is a hand-drawn SVG of the brand's signature open-book/"V" motif, sharpened to match the actual logo's book shape.
4. **Nav shell** — exactly four items (Home/Browse/Progress/Saved), matching the PDF's §07 spec, not the mockups' 5-item FAB layout. Web: persistent left sidebar (`app-tabs.web.tsx`). Native: real bottom tabs (`app-tabs.tsx`). **Known gap:** the web sidebar isn't responsive for a narrow/phone browser — a bottom-bar fallback was attempted and reverted because `expo-router/ui`'s `<Tabs>` broke when `<TabTrigger>` children weren't static (see the git log message on that commit for the exact failure and what to avoid retrying). Low priority since the native app already covers phones properly.
5. **Four real screens** — Home, Browse, Progress, Saved. Each has a real layout using the primitives above. **All of it is placeholder data** — small hardcoded sample arrays. Search/filter/favorite-toggle interactions are genuinely functional (real client-side state), just not backed by anything real.
6. **Hero images** — every page has a full-bleed photo (user-supplied temple watercolor art, `assets/images/hero/`) with a dark-ink headline/subhead faded into the canvas color. Home additionally has its "daily moment" card pulled up to overlap/bleed behind the bottom of its hero image (a treatment unique to Home; not replicated on the other three pages since they don't have an equivalent first element).

## Locked product decisions (don't re-litigate these; if genuinely stuck, ask, don't guess)

- **Session taxonomy**: full mapping of all 21 raw `session` values in the real dataset (`app/General Conference Database FINAL - Sheet1.csv`) to 10 normalized categories — see `src/constants/theme.ts`'s `SessionCategoryTag`/`SessionCategory` for the implemented version. Notably: `RELIEF_SOCIETY` (not `WOMEN`) absorbs "General Women's Session/Meeting" + "General Relief Society Meeting"; `YOUNG_WOMEN` is kept separate (currently unused, zero matches in the data, kept for future-proofing); there's no `GENERAL_SESSION` catch-all.
- **Speaker headshots: IN**, but sourcing is unresolved — open questions are (a) current photo vs. era-correct photo per talk, (b) hotlink vs. download-and-self-host, (c) quick sanity-check on churchofjesuschrist.org's terms before treating their imagery as freely reusable. Nothing built yet.
- **No duration/reading-time field** — decided against, no reliable source data exists.
- **Day streak**: a "study day" = a calendar day with ≥1 talk marked studied (not drawn, not opened, not just app-launched). Requires an append-only study-event log (`user_id`, `talk_id`, `completed_at`) — `currentStreak`/`longestStreak` are derived from it, never stored as a raw counter, and unmarking a talk must NOT delete its historical event (or past streaks would retroactively change). Not built yet — no backend at all currently.
- **Progress Scope** (renamed from "Study Range"): reporting-only, fully independent from Draw/Browse filters — changing it never affects what Random Talk draws or what Browse shows. Default: "All Conferences", not an arbitrary recent-years window. Mental model: *Browse filters = find, Draw filters = choose, Progress Scope = measure.* Implemented as pill UI on `/progress`, not yet wired to real numbers.
- **Git/worktree strategy** — see "Where the code actually lives" above.

## Not yet built (the big next chunk)

- No talks dataset imported into the app at all (the real ~4,050-talk CSV lives at `app/General Conference Database FINAL - Sheet1.csv`, untouched by V2 so far).
- No Supabase client in V2 (V1's auth/sync code in `app/app.js` is the reference for what existed before, but V2's schema needs to change — see the streak note above, plus the session-taxonomy fields).
- No real "remaining bag" / draw logic ported over yet.
- Browse's combined "Relief Society & Young Women" filter label was proposed but never explicitly confirmed by the user.

## Suggested next steps

Pick up wherever makes sense, but in rough priority order: (1) import the real talks dataset with the session-taxonomy fields applied, (2) stand up the Supabase schema (study-event log, not just status arrays), (3) wire Home's draw button and the four screens' placeholder data to real state. Or keep doing visual/UX passes on what's there — both are reasonable; ask the user which they want to do first rather than assuming.
