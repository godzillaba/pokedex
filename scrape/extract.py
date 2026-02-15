"""Extract structured fields from scraped HTML pages.

Reads species_index.json + pages/*.html → outputs extracted.json with:
  - Full binomial name (from infobox)
  - Conservation status (from infobox)
  - Cleaned common name (from <title> when scraper name == latin)
"""

import json
import re
from pathlib import Path

SCRAPE_DIR = Path(__file__).resolve().parent
PAGES_DIR = SCRAPE_DIR / "pages"
INDEX_PATH = SCRAPE_DIR / "species_index.json"
OUTPUT_PATH = SCRAPE_DIR / "extracted.json"

IUCN_STATUSES = [
    "Extinct in the Wild",
    "Critically Endangered",
    "Near Threatened",
    "Least Concern",
    "Data Deficient",
    "Endangered",
    "Vulnerable",
    "Extinct",
    "Secure",
]

IUCN_RE = re.compile("|".join(re.escape(s) for s in IUCN_STATUSES), re.IGNORECASE)
BINOMIAL_RE = re.compile(r'class="binomial"[^>]*>(.*?)</(?:td|span)', re.DOTALL)
TITLE_RE = re.compile(r"<title>(.*?)</title>")
TAG_RE = re.compile(r"<[^>]+>")
BRACKET_RE = re.compile(r"\[.*?\]")


def html_for_species(wiki_path):
    slug = wiki_path.split("/wiki/")[-1]
    path = PAGES_DIR / (slug + ".html")
    if path.exists():
        return path.read_text(errors="replace")
    return None


def parse_binomial(html):
    m = BINOMIAL_RE.search(html)
    if not m:
        return None
    raw = TAG_RE.sub("", m.group(1))
    raw = BRACKET_RE.sub("", raw)
    # Keep only the binomial (first two words), drop author/year
    words = raw.split()
    if len(words) >= 2:
        return words[0] + " " + words[1]
    return None


def parse_conservation_status(html):
    statuses = IUCN_RE.findall(html)
    if not statuses:
        return None
    # Return the first one found (most prominent in infobox), title-cased
    return statuses[0].title()


def parse_title_name(html):
    m = TITLE_RE.search(html)
    if not m:
        return None
    title = m.group(1).strip()
    # Wikipedia titles sometimes end with " - Wikipedia" in ZIM
    title = re.sub(r"\s*[-–—]\s*Wikipedia.*$", "", title)
    if not title or title[0].islower():
        return title.title()
    return title


def title_case_name(name):
    lowered = {"of", "the", "and", "in", "on", "at", "to", "for", "a", "an"}
    words = name.split()
    result = []
    for i, w in enumerate(words):
        if i == 0 or w.lower() not in lowered:
            result.append(w.capitalize() if w == w.lower() or w == w.upper() else w)
        else:
            result.append(w.lower())
    return " ".join(result)


def extract_one(entry):
    html = html_for_species(entry["wiki_path"])

    name = entry["name"]
    species = entry.get("latin", "")
    conservation = None

    if html:
        binomial = parse_binomial(html)
        if binomial:
            species = binomial

        conservation = parse_conservation_status(html)

        # If scraper name == latin, try to get common name from title
        if entry["name"] == entry.get("latin", ""):
            title_name = parse_title_name(html)
            if title_name and title_name.lower() != species.lower():
                name = title_name

    name = title_case_name(name)

    return {
        "name": name,
        "species": species,
        "type": entry["type"],
        "wiki_path": entry["wiki_path"],
        "conservation_status": conservation,
    }


def main():
    with open(INDEX_PATH) as f:
        index = json.load(f)

    print(f"Processing {len(index)} species...")

    results = []
    status_counts = {}
    name_fixed = 0

    for entry in index:
        result = extract_one(entry)
        results.append(result)

        cs = result["conservation_status"] or "Unknown"
        status_counts[cs] = status_counts.get(cs, 0) + 1

        if entry["name"] == entry.get("latin", "") and result["name"] != entry["name"]:
            name_fixed += 1

    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)

    print(f"Wrote {len(results)} species to {OUTPUT_PATH}")
    print(f"Names fixed from title: {name_fixed}")
    print("Conservation status breakdown:")
    for status, count in sorted(status_counts.items(), key=lambda x: -x[1]):
        print(f"  {status}: {count}")


if __name__ == "__main__":
    main()
