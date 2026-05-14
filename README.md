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
- `talks-data.js` — full talk dataset (4,050 talks, April 1971 – April 2026)
- `config.js` — Supabase project URL and anon key
- `confirm.html` — email confirmation landing page

## Talk data

`talks-data.js` contains the full General Conference dataset sourced from the Gospel Library. Each talk looks like this:

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

The source CSV is `General Conference Database FINAL - Sheet1.csv`. To update the dataset after a new conference, add rows to the CSV and regenerate `talks-data.js` from it.

## What's next

- Fix cloud sync: new talks added to `talks-data.js` don't get added to the remaining bag for users who already have Supabase data saved
- Add a forgot password link to the auth modal
- Topic/theme filter
- Search within history and favorites
