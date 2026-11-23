# Conference Talk Bag

An app for randomly drawing General Conference talks from a "bag". Talks are removed as you draw them so you work through the full library without repeats.

Features:
- Draws a random talk and removes it from the remaining bag
- Filters by year, conference, and speaker
- Mark specific talks as studied manually
- Favorites list
- Undo last draw
- Progress tracking (overall and per year/conference)
- Supabase auth — progress syncs to the cloud across devices

## How to open it

Because this app uses regular web files, the easiest way to run it is with a small local web server.

If you have Python installed, open a terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Then open this address in your browser:

```text
http://localhost:8000
```

## Files

- `index.html` — page structure
- `styles.css` — design
- `app.js` — draw logic, state management, Supabase sync, auth
- `talks-data.js` — full talk dataset, generated from the CSV (April 1971 onward)
- `config.js` — Supabase project URL and anon key
- `confirm.html` — email confirmation landing page
- `reset-password.html` — password reset landing page
- `general-conference-talks.csv` — master list of talks; source of truth for both V1 and V2
- `append_gc_talks.py` — adds a new conference to the CSV and regenerates both apps' data (see below)

## Talk data

`general-conference-talks.csv` is the master list of General Conference talks, sourced from the Gospel Library. It grows every April and October. Two files are generated from it, so don't hand-edit either one:

- `talks-data.js` here on `develop` (V1)
- `src/data/talks.json` on `v2` (V2, via `scripts/generate-talks-data.js`)

Each talk in `talks-data.js` looks like this:

```js
{
  id: "1-1971-4-out-of-the-darkness",
  title: "Out of the Darkness",
  speaker: "Joseph Fielding Smith",
  year: "1971",
  month: "April",
  session: "Saturday Morning Session",
  reference: "April 1971 General Conference",
  url: "https://www.churchofjesuschrist.org/study/general-conference/..."
}
```

## Adding a new conference

Do this every April and October, once the conference's talks are up on churchofjesuschrist.org (a few days after it ends). It takes a couple of minutes.

One-time setup: `pip3 install requests beautifulsoup4`, and Node.js installed.

Run these in Terminal, starting in the project folder (`_General Conference Picker`).

1. Put the V2 folder on `v2`:
   ```bash
   cd "Design/APP V2"
   git checkout v2 && git pull
   ```
2. Put this folder on `develop`:
   ```bash
   cd ../../app
   git checkout develop && git pull
   ```
3. Preview what will be added (changes nothing). Use the year and `04` or `10`:
   ```bash
   python3 append_gc_talks.py 2027 04 --dry-run
   ```
4. If the preview looks right, run it for real:
   ```bash
   python3 append_gc_talks.py 2027 04
   ```
   It adds only talks that aren't already in the CSV (matched by URL), numbers them on from the last `talk_number`, and updates all three files: the CSV and `talks-data.js` here, and `src/data/talks.json` in the V2 folder. It prints how many talks were added per session and anything it skipped. Sustainings, audit reports and statistical reports are skipped on purpose because they aren't talks. Running it twice is safe; the second run adds nothing.
5. Commit in both folders:
   ```bash
   git add general-conference-talks.csv talks-data.js
   git commit -m "Add April 2027 General Conference"
   cd "../Design/APP V2"
   git add src/data/talks.json
   git commit -m "Add April 2027 General Conference"
   ```
6. Push and ship as usual. V2 bundles `talks.json` into the app, so users see the new talks only after a web deploy (`npm run deploy:web`) and a new iOS build.

If it stops, nothing was changed. The message says why:

- **Not posted yet**: the conference isn't on the site yet. Try again in a few days.
- **Session the app doesn't recognize**: the Church used a new session name. Add it to `RAW_SESSION_TO_CATEGORY` in both `src/constants/session-taxonomy.ts` and `scripts/generate-talks-data.js` on `v2`, then run step 4 again.
- **Wrong branch / no folder has v2 checked out**: redo steps 1–2.

## What's next

- Fix cloud sync: new talks added to `talks-data.js` don't get added to the remaining bag for users who already have Supabase data saved
- Topic/theme filter
