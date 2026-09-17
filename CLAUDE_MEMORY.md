# Claude Memory Export

This file exists because Claude's persistent memory lives in `~/.claude/...` on whichever machine created it — it does **not** travel with this removable drive. Everything below was learned during 2026-09-16 and 2026-09-17 sessions and would otherwise be invisible to a fresh Claude session on a new machine. Project facts (what's built, schema decisions, known bugs) belong in `SESSION_HANDOFF.md`, not here — this file is specifically about **how to work with Kingston**, not the project itself.

## About Kingston

**Not a coder.** Said explicitly: "I am not a coder so you are going to have to slow things down for me and give me step by step."

**How to apply this:**
- For anything requiring Kingston to do something manually — run SQL in a dashboard, use a terminal, click through an app's or a website's UI — give numbered, granular steps. Assume no familiarity with the tool, menu names, or jargon (don't say "run this migration" or "paste this into the SQL editor" without first explaining where that screen even lives and how to get there).
- Prefer doing things yourself over asking Kingston to do them, whenever there's a way to. Reserve manual walkthroughs for things Claude genuinely can't do directly — e.g. no Supabase MCP/API access exists in this setup, so any database schema change has to be pasted into the Supabase SQL Editor by Kingston, by hand.
- After giving steps, check in rather than assuming success — Kingston is more likely to get stuck on unfamiliar UI than a developer would be, and won't necessarily know how to describe what went wrong. Ask for the exact error text rather than a paraphrase.
- This pattern showed up concretely once already: pasting a SQL block with bare `$$ ... $$` dollar-quoting into the Supabase SQL Editor got mangled (unclear whether by the editor's auto-bracket-matching or the paste itself) and threw a syntax error. The fix was switching to named `$body$` tags and splitting the script into small, separately-pasted chunks so any future failure is easy to localize. Default to that approach (small chunks, named dollar-quote tags) for any future SQL handoff to Kingston, rather than one large block.

**Floats feature ideas at a conceptual level, not a spec'd-out one.** Concretely: raised a "let people share their progress/streaks/stats" idea (see `SESSION_HANDOFF.md`'s "Not yet built" section) with the *what* clear but every *how* question open — no share-sheet vs. feed vs. deep-link decision, no opt-in/public default, no call on whether it needs new backend.

**How to apply this:**
- Don't start building off a one-line feature idea. Ask what Kingston pictures it looking like (a native share sheet? a public link? something else?) before writing any code or making an implementation choice on his behalf.
- This is the same instinct as the "not a coder" pattern above, one level up: he'll describe an outcome and expect Claude to drive the technical *how*, but still wants to be asked rather than have a shape assumed for him when it's genuinely open-ended.

## Project touches Figma, Expo/React Native, and Supabase

All three of those involve exactly the kind of hands-on-UI or terminal work covered above — expect the "not a coder" pattern to recur across all three, not just Supabase (where it first came up). As of 2026-09-16/17, add Cloudflare (web deploy) and Apple Developer Program / App Store Connect / EAS (iOS build + TestFlight) to that list — same pattern applied there too, successfully.

## Credential-gated steps: hand the command to Kingston, don't run it yourself

**Rule**: any command that needs Kingston's own login/password/2FA (Cloudflare's `wrangler login`, and especially Apple's `eas build`/`eas submit`/`eas credentials`, which prompt for Apple ID + password + 2FA interactively) must be run **by Kingston himself, in his own Terminal window** — never through an assistant-run Bash tool call, even though technically nothing stops the tool from doing it.

**Why**: this is a real policy boundary (don't handle passwords/credentials), but it's also just correct practice — his Apple ID and Cloudflare login should never pass through a chat transcript at all, no exceptions for convenience.

**How this actually played out, successfully, twice**: for the Cloudflare deploy, `wrangler login` was run directly (it opens the user's own browser for OAuth, no password ever typed anywhere) — that one's fine to run directly since it's a browser-handoff flow, not a password prompt. For the iOS builds, `eas build`/`eas submit` were different: they ask for Apple ID email + password + 2FA as **plain terminal input**, so those had to be handed to Kingston as an exact command to paste into his own Terminal, with the expected prompts explained in plain language up front ("it'll ask you to log in with your Apple ID — a two-factor code may be sent to your other Apple devices — enter it there") so he wasn't caught off guard mid-flow. He then reported back each prompt's exact wording when unsure how to answer (e.g. "Generate a new Apple Distribution Certificate? (Y/n)"), and got a direct plain-language answer + reasoning each time. This back-and-forth worked well — keep doing it this way rather than trying to shortcut it.

**How to apply**: before running any CLI command in a new area (a new cloud provider, a new build tool), check whether it's a browser-OAuth handoff (fine to run directly) or a direct credential prompt (hand it to Kingston with expected-prompts context). When in doubt, hand it to him — the cost of an unnecessary handoff is small; the cost of accidentally routing a password through the chat is not.

## Read-only status checks are fine to run directly

Once Kingston has completed a credential-gated step himself (logged in, started a build), checking on progress afterward — `eas build:list`, `eas build:view`, `wrangler pages deployment list`, polling a build/deploy status — doesn't need fresh credentials and is fine to run directly without asking him to do it. Don't make him re-run things just to check status.

## Testing before declaring something done

Concretely bit twice on the same project (2026-09-16): a hero-image bug looked fixed after one check (a photo appeared at all) but was actually still broken (not proportionally scaled — "most of the images are cut off," reported by Kingston after go-live). The general lesson, not just about that one component: **when fixing a rendering/visual bug, verify the actual fix criterion, not just "something changed" or "no crash."** If the bug was "X doesn't appear," confirm X appears *correctly* (right proportions, at more than one viewport/screen size if that's plausibly relevant), not just that it's present at all.
