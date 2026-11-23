#!/usr/bin/env node

/**
 * Codegen: reads the master talks CSV and emits `src/data/talks.json` with
 * the session-taxonomy category applied to every row.
 *
 * The CSV lives on the V1 branch (`develop`) at
 * `app/general-conference-talks.csv`. After each April/October conference,
 * `app/append_gc_talks.py` adds the new talks to it and runs this script
 * with `--csv` pointing at it, so you normally don't run this by hand.
 *
 * Run with:
 *   node scripts/generate-talks-data.js --csv /path/to/general-conference-talks.csv
 *   node scripts/generate-talks-data.js   # default: ../../app/ relative to this
 *                                         # folder (the Design/APP V2 layout)
 */

const fs = require("fs");
const path = require("path");

function csvPathFromArgs() {
  const i = process.argv.indexOf("--csv");
  if (i !== -1) {
    const value = process.argv[i + 1];
    if (!value) throw new Error("--csv needs a path");
    return path.resolve(value);
  }
  return path.join(__dirname, "..", "..", "..", "app", "general-conference-talks.csv");
}

const CSV_PATH = csvPathFromArgs();
const OUT_PATH = path.join(__dirname, "..", "src", "data", "talks.json");

// Minimal RFC4180-ish CSV parser: handles quoted fields, embedded commas,
// escaped quotes ("") and \n/\r\n line endings. No external dependency.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // skip; \n handles the row break
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Kept in sync with src/constants/session-taxonomy.ts (that file is TS and
// can't be required directly from this plain Node script).
const RAW_SESSION_TO_CATEGORY = {
  "Friday Afternoon Session": "OTHER_HISTORICAL",
  "Friday Morning Session": "OTHER_HISTORICAL",
  "General Priesthood Meeting": "PRIESTHOOD",
  "General Priesthood Session": "PRIESTHOOD",
  "General Relief Society Meeting": "RELIEF_SOCIETY",
  "General Welfare Session": "WELFARE",
  "General Women’s Meeting": "RELIEF_SOCIETY",
  "General Women’s Session": "RELIEF_SOCIETY",
  "Priesthood Session": "PRIESTHOOD",
  "Saturday Afternoon Session": "SATURDAY_AFTERNOON",
  "Saturday Evening Session": "SATURDAY_EVENING",
  "Saturday Morning": "SATURDAY_MORNING",
  "Saturday Morning Session": "SATURDAY_MORNING",
  "Sunday Afternoon Session": "SUNDAY_AFTERNOON",
  "Sunday Morning Session": "SUNDAY_MORNING",
  "Thursday Afternoon Session": "OTHER_HISTORICAL",
  "Thursday Morning Session": "OTHER_HISTORICAL",
  "Tuesday Afternoon Session": "OTHER_HISTORICAL",
  "Tuesday Morning Session": "OTHER_HISTORICAL",
  "Welfare Services Session": "WELFARE",
  "Welfare Session": "WELFARE",
};

function main() {
  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const table = parseCsv(raw).filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
  const header = table[0];
  const dataRows = table.slice(1);

  const idx = {
    talk_number: header.indexOf("talk_number"),
    title: header.indexOf("title"),
    speaker: header.indexOf("speaker"),
    year: header.indexOf("year"),
    month: header.indexOf("month"),
    session: header.indexOf("session"),
    url: header.indexOf("url"),
  };
  for (const [key, i] of Object.entries(idx)) {
    if (i === -1) throw new Error(`CSV missing expected column: ${key}`);
  }

  const seenIds = new Set();
  const unmapped = new Set();
  const talks = dataRows.map((r) => {
    const session = r[idx.session];
    const category = RAW_SESSION_TO_CATEGORY[session];
    if (!category) unmapped.add(session);

    const id = r[idx.talk_number];
    if (seenIds.has(id)) throw new Error(`Duplicate talk_number: ${id}`);
    seenIds.add(id);

    return {
      id,
      talkNumber: Number.parseInt(id, 10),
      title: r[idx.title],
      speaker: r[idx.speaker],
      year: Number.parseInt(r[idx.year], 10),
      month: Number.parseInt(r[idx.month], 10),
      session,
      category: category ?? null,
      url: r[idx.url],
    };
  });

  if (unmapped.size > 0) {
    throw new Error(
      `Unmapped raw session value(s) found: ${[...unmapped].join(", ")}. ` +
        `Add them to RAW_SESSION_TO_CATEGORY in both this script and src/constants/session-taxonomy.ts.`,
    );
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  // Minified — this ships in the app bundle, not meant to be hand-read.
  fs.writeFileSync(OUT_PATH, JSON.stringify(talks));

  console.log(`Wrote ${talks.length} talks to ${path.relative(process.cwd(), OUT_PATH)}`);
  const byCategory = {};
  for (const t of talks) byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
  console.log("By category:", byCategory);
}

main();
