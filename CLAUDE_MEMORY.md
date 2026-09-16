# Claude Memory Export

This file exists because Claude's persistent memory lives in `~/.claude/...` on whichever machine created it — it does **not** travel with this removable drive. Everything below was learned during 2026-09-16 sessions and would otherwise be invisible to a fresh Claude session on a new machine. Project facts (what's built, schema decisions, known bugs) belong in `SESSION_HANDOFF.md`, not here — this file is specifically about **how to work with Kingston**, not the project itself.

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

All three of those involve exactly the kind of hands-on-UI or terminal work covered above — expect the "not a coder" pattern to recur across all three, not just Supabase (where it first came up).
