#!/usr/bin/env python3
"""Extract article HTML from ZIM for each species in the index.

Reads scrape/species_index.json, looks up each wiki_path in the ZIM archive,
and writes HTML to scrape/pages/<name>.html.
"""

import json
import re
from pathlib import Path
from urllib.parse import unquote

from zim_utils import read_article

INDEX = Path(__file__).parent / "species_index.json"
PAGES_DIR = Path(__file__).parent / "pages"


def sanitize_filename(wiki_path):
    name = wiki_path.removeprefix("/wiki/")
    name = unquote(name)
    name = re.sub(r'[<>:"/\\|?*]', '_', name)
    return name + ".html"


def main():
    with open(INDEX) as f:
        species = json.load(f)

    PAGES_DIR.mkdir(exist_ok=True)

    found = 0
    missing = []
    for i, s in enumerate(species):
        wiki_path = s["wiki_path"]
        raw_name = wiki_path.removeprefix("/wiki/")
        decoded_name = unquote(raw_name)
        zim_path = "A/" + decoded_name

        html = read_article(zim_path)
        if html is None and decoded_name != raw_name:
            html = read_article("A/" + raw_name)
        if html is None:
            missing.append(s["name"])
            continue

        filename = sanitize_filename(wiki_path)
        (PAGES_DIR / filename).write_text(html)
        found += 1

        if (i + 1) % 200 == 0:
            print(f"  {i + 1}/{len(species)} processed...")

    print(f"\nExtracted {found} pages, {len(missing)} missing")
    if missing:
        print(f"Missing (first 20): {missing[:20]}")


if __name__ == "__main__":
    main()
