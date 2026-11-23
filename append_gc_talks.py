"""
Add a new General Conference to the talk list.

Run this once after each April and October conference is posted:

    python3 append_gc_talks.py 2027 04
    python3 append_gc_talks.py 2027 10 --dry-run   # preview only, writes nothing

What it does:
  1. Reads the conference's table of contents from churchofjesuschrist.org.
  2. Adds talks that aren't already in general-conference-talks.csv
     (matched by URL), numbering them on from the highest talk_number.
  3. Regenerates talks-data.js (V1, this folder, branch develop).
  4. Regenerates src/data/talks.json on V2 (branch v2) by running V2's
     scripts/generate-talks-data.js against the updated CSV.
  5. Prints how many talks were added per session, plus anything skipped.

It stops before changing any file if:
  - the conference isn't posted yet,
  - a new talk is in a session the app doesn't recognize
    (V2's src/constants/session-taxonomy.ts), or
  - this folder isn't on develop, or no folder has v2 checked out.

Requirements:
    pip3 install requests beautifulsoup4
    Node.js (for V2's generator)
"""

import argparse
import csv
import io
import json
import os
import re
import shutil
import subprocess
import sys
import warnings

# macOS's system Python prints a harmless LibreSSL warning on import.
warnings.filterwarnings("ignore", message=".*OpenSSL.*")

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Missing packages. Run:  pip3 install requests beautifulsoup4")

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(HERE, "general-conference-talks.csv")
JS_FILE = os.path.join(HERE, "talks-data.js")
CSV_FIELDS = ["talk_number", "title", "speaker", "year", "month", "session", "url"]
MONTH_NAMES = {"4": "April", "10": "October"}
V1_BRANCH = "develop"
V2_BRANCH = "v2"
V2_TAXONOMY = os.path.join("src", "constants", "session-taxonomy.ts")
V2_GENERATOR = os.path.join("scripts", "generate-talks-data.js")

BASE = "https://www.churchofjesuschrist.org"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Business items read over the pulpit. The list has never included these
# as drawable talks (Solemn Assemblies are kept; they're not matched here).
PROCEDURAL_TITLE = re.compile(
    r"^(the )?sustaining of|audit(ing)? (department|committee) report"
    r"|statistical report|finance committee report",
    re.IGNORECASE,
)


def stop(message):
    print(f"\nSTOPPED: {message}\nNo files were changed.")
    sys.exit(1)


# ---------------------------------------------------------------- git / V2

def git(args, cwd):
    result = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else None


def find_v2_dir(override):
    if override:
        path = os.path.abspath(override)
        branch = git(["rev-parse", "--abbrev-ref", "HEAD"], path)
        if branch != V2_BRANCH:
            stop(f"{path} is on '{branch}', not '{V2_BRANCH}'.")
        return path

    listing = git(["worktree", "list", "--porcelain"], HERE) or ""
    for block in listing.split("\n\n"):
        lines = dict(l.split(" ", 1) for l in block.splitlines() if " " in l)
        if lines.get("branch") == f"refs/heads/{V2_BRANCH}":
            return lines["worktree"]

    stop(
        f"No folder has the '{V2_BRANCH}' branch checked out, so talks.json can't be updated.\n"
        f"  Switch your V2 folder to it first, for example:\n"
        f'    cd "../Design/APP V2" && git checkout {V2_BRANCH}\n'
        f"  then run this again."
    )


def known_sessions(v2_dir):
    path = os.path.join(v2_dir, V2_TAXONOMY)
    try:
        text = open(path, encoding="utf-8").read()
    except OSError:
        stop(f"Can't read {path}.")
    block = re.search(r"RAW_SESSION_TO_CATEGORY[^{]*\{(.*?)\n\};", text, re.S)
    if not block:
        stop(f"Couldn't find RAW_SESSION_TO_CATEGORY in {path}.")
    return set(re.findall(r"'([^']+)'\s*:\s*'[A-Z_]+'", block.group(1)))


def preflight(v2_override):
    branch = git(["rev-parse", "--abbrev-ref", "HEAD"], HERE)
    if branch != V1_BRANCH:
        stop(f"This folder is on '{branch}'. Switch to '{V1_BRANCH}' first:  git checkout {V1_BRANCH}")
    if not os.path.exists(CSV_FILE):
        stop(f"Can't find {CSV_FILE}.")
    if not shutil.which("node"):
        stop("Node.js isn't installed (needed to regenerate V2's talks.json).")
    v2_dir = find_v2_dir(v2_override)
    if not os.path.exists(os.path.join(v2_dir, V2_GENERATOR)):
        stop(f"Can't find {V2_GENERATOR} in {v2_dir}.")
    return v2_dir, known_sessions(v2_dir)


# ---------------------------------------------------------------- website

def clean(text):
    return " ".join(text.split())


def canonical_url(href):
    url = BASE + href if href.startswith("/") else href
    return url.split("#")[0].split("?")[0] + "?lang=eng"


def fetch_contents(year, month):
    """Return (talks, loose) from the conference's table of contents.

    talks: dicts with title, speaker, session, url, in page order.
    loose: labels of top-level entries that aren't inside a session.
    """
    url = f"{BASE}/study/general-conference/{year}/{month}?lang=eng"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
    except requests.RequestException as e:
        stop(f"Couldn't reach churchofjesuschrist.org ({e}).")
    if resp.status_code == 404:
        stop(f"{MONTH_NAMES[month.lstrip('0')]} {year} conference isn't posted yet ({url} returns 404).")
    if resp.status_code != 200:
        stop(f"Got HTTP {resp.status_code} from {url}.")

    resp.encoding = "utf-8"
    soup = BeautifulSoup(resp.text, "html.parser")
    nav = soup.select_one('nav[class*="tableOfContents"]')
    top = nav.find("ul") if nav else None
    if top is None:
        stop(
            f"Couldn't find a table of contents at {url}.\n"
            "  The conference may not be posted yet, or the site layout changed."
        )

    talks, loose = [], []
    for item in top.find_all("li", recursive=False):
        link = item.find("a", recursive=False)
        sub = item.find("ul", recursive=False)
        label = clean(link.get_text()) if link else ""
        if sub is None:
            if link and canonical_url(link["href"]) != canonical_url(url):
                loose.append(label)  # "Contents" itself is ignored
            continue
        for talk_item in sub.find_all("li", recursive=False):
            a = talk_item.find("a", recursive=False)
            if not a:
                continue
            title_p = a.find("p")
            speaker_p = a.select_one('p[class*="subtitle"]')
            talks.append({
                "title": clean((title_p or a).get_text()),
                "speaker": clean(speaker_p.get_text()) if speaker_p else "",
                "session": label,
                "url": canonical_url(a["href"]),
            })

    if not talks:
        stop(f"The table of contents at {url} has no talks yet. The conference may not be posted yet.")
    return talks, loose


# ---------------------------------------------------------------- data files

def read_csv_rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def append_csv_rows(path, rows):
    """Append without rewriting, so existing rows stay byte-for-byte."""
    buf = io.StringIO()
    csv.DictWriter(buf, fieldnames=CSV_FIELDS, lineterminator="\n").writerows(rows)
    with open(path, "rb") as f:
        f.seek(-1, os.SEEK_END)
        needs_newline = f.read(1) != b"\n"
    with open(path, "a", newline="", encoding="utf-8") as f:
        if needs_newline:
            f.write("\n")
        f.write(buf.getvalue())


def slugify_title(title):
    # Must not change: talk ids are the saved-progress keys in V1 (app.js,
    # Supabase), so a different slug would orphan users' progress.
    s = title.lower().replace("’", "'")
    s = re.sub(r"'", "-", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    s = re.sub(r"-+", "-", s)
    return s[:60]


def regenerate_talks_data_js(csv_path, js_path):
    objects = []
    for row in read_csv_rows(csv_path):
        month_name = MONTH_NAMES.get(row["month"].lstrip("0"), row["month"])
        objects.append({
            "id": f"{row['talk_number']}-{row['year']}-{row['month'].lstrip('0')}-{slugify_title(row['title'])}",
            "title": row["title"],
            "speaker": row["speaker"],
            "year": row["year"],
            "month": month_name,
            "session": row["session"],
            "reference": f"{month_name} {row['year']} General Conference",
            "url": row["url"],
        })

    lines = ["window.TALKS = ["]
    for i, obj in enumerate(objects):
        body = json.dumps(obj, indent=2, ensure_ascii=False)
        indented = "\n".join("  " + line for line in body.splitlines())
        lines.append(indented + ("," if i < len(objects) - 1 else ""))
    lines.append("];")

    with open(js_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return len(objects)


def regenerate_v2_json(v2_dir, csv_path):
    result = subprocess.run(
        ["node", V2_GENERATOR, "--csv", csv_path],
        cwd=v2_dir, capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(result.stdout + result.stderr)
        print(
            "\nThe CSV and talks-data.js were updated, but V2's talks.json was NOT.\n"
            f'Fix the error above, then run from "{v2_dir}":\n'
            f'  node {V2_GENERATOR} --csv "{csv_path}"'
        )
        sys.exit(1)
    return result.stdout.strip()


# ---------------------------------------------------------------- main

def parse_args():
    p = argparse.ArgumentParser(description="Add a General Conference to the talk list.")
    p.add_argument("year", help="e.g. 2027")
    p.add_argument("month", help="04 (April) or 10 (October)")
    p.add_argument("--dry-run", action="store_true", help="show what would be added; change nothing")
    p.add_argument("--v2-dir", help="folder with the v2 branch checked out (found automatically by default)")
    args = p.parse_args()

    if not re.fullmatch(r"(19|20)\d\d", args.year):
        p.error(f"year should look like 2027, got '{args.year}'")
    month = args.month.lstrip("0")
    if month not in MONTH_NAMES:
        p.error(f"month should be 04 or 10, got '{args.month}'")
    args.month = month.zfill(2)
    return args


def main():
    args = parse_args()
    year, month = args.year, args.month
    label = f"{MONTH_NAMES[month.lstrip('0')]} {year}"

    v2_dir, sessions_ok = preflight(args.v2_dir)

    print(f"Reading the {label} table of contents...")
    talks, loose = fetch_contents(year, month)

    rows = read_csv_rows(CSV_FILE)
    existing_urls = {r["url"] for r in rows}

    new, skipped, already = [], [], 0
    for t in talks:
        if t["url"] in existing_urls:
            already += 1
        elif PROCEDURAL_TITLE.search(t["title"]):
            skipped.append(f"{t['title']} ({t['session']}): business item, not a talk")
        else:
            existing_urls.add(t["url"])
            new.append(t)
    skipped += [f"{name}: not inside a session" for name in loose]

    unknown = sorted({t["session"] for t in new} - sessions_ok)
    if unknown:
        listing = "\n".join(f"    - {s}" for s in unknown)
        stop(
            f"{label} has a session the app doesn't recognize:\n{listing}\n"
            "  Add it to RAW_SESSION_TO_CATEGORY in BOTH of these files on v2, then run this again:\n"
            f"    {V2_TAXONOMY}\n    {V2_GENERATOR}"
        )

    next_num = max((int(r["talk_number"]) for r in rows), default=0) + 1
    new_rows = [
        {
            "talk_number": next_num + i,
            "title": t["title"],
            "speaker": t["speaker"],
            "year": year,
            "month": month.lstrip("0"),
            "session": t["session"],
            "url": t["url"],
        }
        for i, t in enumerate(new)
    ]

    # ---- summary
    print(f"\n{label}: {len(talks)} entries on the site\n")
    verb = "Would add" if args.dry_run else "Added"
    if new_rows:
        noun = "talk" if len(new_rows) == 1 else "talks"
        print(f"{verb} {len(new_rows)} {noun} (#{new_rows[0]['talk_number']}–#{new_rows[-1]['talk_number']}):")
        per_session = {}
        for r in new_rows:
            per_session[r["session"]] = per_session.get(r["session"], 0) + 1
        for session, n in per_session.items():
            print(f"  {n:>3}  {session}")
        missing_speaker = [r["title"] for r in new_rows if not r["speaker"]]
        for title in missing_speaker:
            print(f"  note: no speaker listed for “{title}”")
    else:
        print(f"{verb} 0 talks.")
    if already:
        print(f"\nAlready in the list: {already}")
    if skipped:
        print(f"\nSkipped {len(skipped)}:")
        for s in skipped:
            print(f"  - {s}")

    if args.dry_run:
        print("\nDry run: no files changed.")
        return
    if not new_rows:
        print("\nNothing new, so no files changed.")
        return

    append_csv_rows(CSV_FILE, new_rows)
    total = regenerate_talks_data_js(CSV_FILE, JS_FILE)
    v2_out = regenerate_v2_json(v2_dir, CSV_FILE)

    print("\nUpdated:")
    print(f"  general-conference-talks.csv   ({total} talks)")
    print(f"  talks-data.js                  (develop)")
    print(f"  src/data/talks.json            (v2, in {v2_dir})")
    print(f"    {v2_out.splitlines()[0] if v2_out else ''}")
    print("\nNext: review and commit in both folders (see README, “Adding a new conference”).")


if __name__ == "__main__":
    main()
