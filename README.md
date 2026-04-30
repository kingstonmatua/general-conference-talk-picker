# Conference Talk Bag

This is a beginner-friendly starter app for your idea.

It does four things:

- Keeps a list of talks in a "bag"
- Draws one random talk when you click a button
- Removes that talk from the remaining bag
- Saves your progress in the browser so you can come back later

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

- `index.html` contains the page structure
- `styles.css` contains the design
- `app.js` contains the random-draw logic
- `talks-data.js` contains the talk list

## How to add more talks

Right now `talks-data.js` has a small sample list so the app works immediately.

Each talk looks like this:

```js
{
  id: "unique-id",
  title: "Talk Title",
  speaker: "Speaker Name",
  session: "April 2024 General Conference",
  reference: "Speaker calling",
  url: "https://www.churchofjesuschrist.org/study/general-conference/..."
}
```

To grow the app, you can replace the sample list with a much larger list.

## Best next step

The next practical milestone is this:

1. Keep this basic version.
2. Gather the full talk data in a structured format.
3. Load all talks into `talks-data.js` or a JSON file.
4. Add filters later, such as speaker, year, topic, or unread-only history.

## Important note

I added only sample talks here. I did **not** pull the full Gospel Library talk database into the project yet.

That full dataset is a separate step, and we should do it carefully so the data format stays clean and easy to maintain.
