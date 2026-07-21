"""
General Conference Talk Appender
Fetches a specific conference, appends new talks to
General Conference Database FINAL - Sheet1.csv without duplicating
anything, then regenerates talks-data.js from the full CSV so the two
files can never drift.

Requirements:
    pip install requests beautifulsoup4

Usage:
    python3 append_gc_talks.py

    By default fetches April 2026. Edit YEAR and MONTH below to target
    a different conference.
"""

import csv
import json
import re

import requests
from bs4 import BeautifulSoup

YEAR = 2026
MONTH = "04"
CSV_FILE = "General Conference Database FINAL - Sheet1.csv"
JS_FILE = "talks-data.js"
CSV_FIELDS = ["talk_number", "title", "speaker", "year", "month", "session", "url"]
MONTH_NAMES = {"4": "April", "10": "October"}
BASE = "https://www.churchofjesuschrist.org"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

SKIP_SLUGS = {
    "saturday-morning-session", "saturday-afternoon-session",
    "sunday-morning-session", "sunday-afternoon-session",
    "priesthood-session", "general-womens-session",
    "general-womens-meeting", "relief-society-session",
    "tuesday-morning-session", "tuesday-afternoon-session",
    "general-young-womens-meeting", "saturday-evening-session",
    "welfare-session", "general-primary-session",
}


def fetch_talks(year, month):
    url = f"{BASE}/study/general-conference/{year}/{month}?lang=eng"
    resp = requests.get(url, headers=HEADERS, timeout=20)
    if resp.status_code != 200:
        raise Exception(f"HTTP {resp.status_code} fetching {url}")

    resp.encoding = "utf-8"
    soup = BeautifulSoup(resp.text, "html.parser")
    talks = []
    current_session = ""

    for a in soup.find_all("a", href=True):
        href = a["href"]
        if f"/study/general-conference/{year}/{month}" not in href:
            continue

        slug = href.rstrip("/").split("?")[0].split("/")[-1]

        if slug in SKIP_SLUGS or slug == str(month) or slug == str(year):
            current_session = a.get_text(strip=True)
            continue

        parts = [p.strip() for p in a.get_text("\n").split("\n") if p.strip()]
        if not parts or len(parts[0]) < 3:
            continue

        title = parts[0]
        speaker = parts[1] if len(parts) > 1 else ""

        full_url = BASE + href if href.startswith("/") else href
        if "lang=eng" not in full_url:
            full_url += "?lang=eng"

        talks.append({
            "title": title,
            "speaker": speaker,
            "year": year,
            "month": month,
            "session": current_session,
            "url": full_url,
        })

    return talks


def read_csv_rows(filepath):
    with open(filepath, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv_rows(filepath, rows):
    with open(filepath, "w", newline="\n", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def slugify_title(title):
    s = title.lower().replace("’", "'")
    s = re.sub(r"'", "-", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    s = re.sub(r"-+", "-", s)
    return s[:60]


def append_to_csv(new_talks, filepath):
    rows = read_csv_rows(filepath)
    existing_urls = {row["url"] for row in rows}
    next_num = max((int(row["talk_number"]) for row in rows), default=0) + 1

    added = 0
    skipped = 0
    for talk in new_talks:
        if talk["url"] in existing_urls:
            skipped += 1
            continue

        rows.append({
            "talk_number": next_num,
            "title": talk["title"],
            "speaker": talk["speaker"],
            "year": talk["year"],
            "month": talk["month"],
            "session": talk["session"],
            "url": talk["url"],
        })
        existing_urls.add(talk["url"])
        next_num += 1
        added += 1

    write_csv_rows(filepath, rows)
    return added, skipped


def regenerate_talks_data_js(csv_filepath, js_filepath):
    rows = read_csv_rows(csv_filepath)

    objects = []
    for row in rows:
        slug = slugify_title(row["title"])
        month_name = MONTH_NAMES.get(row["month"].lstrip("0"), row["month"])
        obj = {
            "id": f"{row['talk_number']}-{row['year']}-{row['month'].lstrip('0')}-{slug}",
            "title": row["title"],
            "speaker": row["speaker"],
            "year": row["year"],
            "month": month_name,
            "session": row["session"],
            "reference": f"{month_name} {row['year']} General Conference",
            "url": row["url"],
        }
        objects.append(obj)

    lines = ["window.TALKS = ["]
    for i, obj in enumerate(objects):
        body = json.dumps(obj, indent=2, ensure_ascii=False)
        indented = "\n".join("  " + line for line in body.splitlines())
        suffix = "," if i < len(objects) - 1 else ""
        lines.append(indented + suffix)
    lines.append("];")

    with open(js_filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    return len(objects)


def main():
    month_label = MONTH_NAMES.get(MONTH.lstrip("0"), MONTH)
    print(f"Fetching {month_label} {YEAR} General Conference...")

    talks = fetch_talks(YEAR, MONTH)
    print(f"Found {len(talks)} talks on the site.")

    if not talks:
        print("No talks found. The conference may not be posted yet.")
        return

    print(f"Appending to {CSV_FILE}...")
    added, skipped = append_to_csv(talks, CSV_FILE)

    print(f"Regenerating {JS_FILE}...")
    total = regenerate_talks_data_js(CSV_FILE, JS_FILE)

    print(f"\nDone!")
    print(f"  Added:   {added} new talks")
    print(f"  Skipped: {skipped} already in spreadsheet")
    print(f"  Total in talks-data.js: {total}")


if __name__ == "__main__":
    main()
