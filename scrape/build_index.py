#!/usr/bin/env python3
"""Build species index from the local ZIM file.

Reads Wikipedia list pages from the ZIM archive:
  - Mammals:    List_of_mammals_of_the_United_States
  - Birds:      List_of_birds_of_the_United_States
  - Amphibians: List_of_amphibians_of_the_United_States
  - Reptiles:   List_of_North_American_reptiles
  - Fish:       12 state-level lists + global list filtered by NA distribution

Output: scrape/species_index.json
"""

import json
import re
from html import unescape
from pathlib import Path
from urllib.parse import unquote

from zim_utils import read_article

OUT = Path(__file__).parent / "species_index.json"

SKIP_HREF = ["File:", "Help:", "Wikipedia:", "Template:", "Category:", "Special:", "#",
             "List_of", "Mammal", "Fauna_of", "ISBN", "ISSN", "OCLC", "doi:",
             "IUCN", "Binomial", "Family_(biology)", "Order_(biology)",
             "http:", "https:"]

LATIN_RE = re.compile(r'^[A-Z][a-z]+ [a-z]+(?:-[a-z]+)*(?:\s[a-z]+)?$')


def clean(text):
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text).strip()
    return re.sub(r"\s+", " ", text)


def extract_link(html_fragment):
    m = re.search(r'href="([^"#]+)"', html_fragment)
    if not m:
        return None
    path = m.group(1)
    if any(x in path for x in SKIP_HREF):
        return None
    return "/wiki/" + path


# ---------------------------------------------------------------------------
# Mammals: <a href="...">Common name</a>, <i>Abbreviated latin</i>
# Source: A/List_of_mammals_of_the_United_States
# ---------------------------------------------------------------------------
def parse_mammals(html):
    pattern = (
        r'<a[^>]*href="([^"#]+)"[^>]*title="([^"]+)"[^>]*>([^<]+)</a>'
        r'\s*,\s*<i[^>]*>([^<]+)</i>'
    )
    matches = re.findall(pattern, html)
    species = []
    for href, title, name, latin in matches:
        if any(x in href for x in SKIP_HREF):
            continue
        species.append({
            "name": name.strip(),
            "latin": latin.strip(),
            "family": "",
            "type": "Mammal",
            "distribution": "",
            "wiki_path": "/wiki/" + href,
        })
    return species


# ---------------------------------------------------------------------------
# Birds: <a href="...">Common name</a>, <i>Latin name</i>
# Source: A/List_of_birds_of_the_United_States
# ---------------------------------------------------------------------------
def parse_birds(html):
    content_start = html.find('id="mw-content-text"')
    if content_start > 0:
        html = html[content_start:]

    items = re.findall(r"<li[^>]*>(.*?)</li>", html, re.DOTALL)
    species = []
    for item in items:
        if "<i" not in item:
            continue
        link = extract_link(item)
        if not link:
            continue

        text = clean(item)
        m = re.match(r"^(.+?)\s*,\s*([A-Z][a-z]+ [a-z]+(?:\s+[a-z]+)?)", text)
        if not m:
            continue

        species.append({
            "name": m.group(1).strip(),
            "latin": m.group(2).strip(),
            "family": "",
            "type": "Bird",
            "distribution": "",
            "wiki_path": link,
        })
    return species


# ---------------------------------------------------------------------------
# Amphibians: <li><i><a href="...">Latin name</a></i> Author, Year</li>
# Source: A/List_of_amphibians_of_the_United_States
# ---------------------------------------------------------------------------
def parse_amphibians(html):
    pattern = (
        r'<li[^>]*>\s*<i[^>]*>\s*'
        r'<a[^>]*href="([^"#]+)"[^>]*title="([^"]+)"[^>]*>([^<]+)</a>'
        r'\s*</i>'
    )
    matches = re.findall(pattern, html)
    species = []
    for href, title, latin in matches:
        if any(x in href for x in SKIP_HREF):
            continue
        name = title if title != latin else latin
        species.append({
            "name": name,
            "latin": latin,
            "family": "",
            "type": "Amphibian",
            "distribution": "",
            "wiki_path": "/wiki/" + href,
        })
    return species


# ---------------------------------------------------------------------------
# Reptiles: <a href="...">Common name</a> (<i>Latin name</i>)
# Source: A/List_of_North_American_reptiles (follows redirect)
# ---------------------------------------------------------------------------
def parse_reptiles(html):
    content_start = html.find('id="mw-content-text"')
    if content_start > 0:
        html = html[content_start:]
    refs_start = html.find('id="References"')
    if refs_start > 0:
        html = html[:refs_start]

    items = re.findall(r"<li[^>]*>(.*?)</li>", html, re.DOTALL)
    species = []
    for item in items:
        if "<i" not in item:
            continue
        link = extract_link(item)
        if not link:
            continue

        text = clean(item)
        m = re.match(r"^(.+?)\s*\(\s*([A-Z][a-z]+ [a-z]+(?:\s+[a-z]+)?)\s*\)", text)
        if m:
            name, latin = m.group(1).strip(), m.group(2).strip()
        else:
            link_match = re.search(r'<a[^>]*>([^<]*)</a>', item)
            if not link_match:
                continue
            name = unescape(link_match.group(1)).strip()
            latin = name

        species.append({
            "name": name,
            "latin": latin,
            "family": "",
            "type": "Reptile",
            "distribution": "",
            "wiki_path": link,
        })
    return species


# ---------------------------------------------------------------------------
# Fish: Hybrid — state-level lists (ground truth) + global common-names list
# filtered by checking each article's distribution section for NA keywords.
# No single "List of fish of the United States" exists in Wikipedia.
# ---------------------------------------------------------------------------

FISH_PAGES = [
    "A/List_of_fishes_of_Arkansas",
    "A/List_of_fishes_of_Colorado",
    "A/List_of_fishes_of_Florida",
    "A/List_of_fish_of_Hawaii",
    "A/List_of_fishes_of_Idaho",
    "A/List_of_fishes_of_Indiana",
    "A/List_of_fish_of_Minnesota",
    "A/List_of_fishes_of_Missouri",
    "A/List_of_fish_of_Montana",
    "A/List_of_fish_of_Oklahoma",
    "A/List_of_fishes_of_West_Virginia",
    "A/List_of_fishes_of_Wyoming",
]

FISH_GLOBAL = "A/List_of_common_fish_names"

NA_KEYWORDS = [
    "north america", "united states", "canada", "mexico",
    "mississippi", "great lakes", "gulf of mexico", "chesapeake",
    "appalachian", "colorado river", "missouri river", "ohio river",
    "rio grande", "columbia river", "yukon", "hudson bay",
    "western atlantic", "eastern pacific",
]


def trim_content(html):
    start = html.find('id="mw-content-text"')
    if start > 0:
        html = html[start:]
    for marker in ['class="navbox', 'id="References"', 'id="See_also"',
                    'id="External_links"']:
        pos = html.find(marker)
        if pos > 0:
            html = html[:pos]
    return html


def parse_fish_table(html):
    html = trim_content(html)
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.DOTALL)
    species = []
    for row in rows:
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.DOTALL)
        if len(cells) < 2:
            continue
        link = re.search(r'<a[^>]*href="([^"#]+)"[^>]*>([^<]+)</a>', cells[0])
        if not link or any(x in link.group(1) for x in SKIP_HREF):
            continue
        latin_m = re.search(r"<i[^>]*>([^<]+)</i>", cells[1])
        species.append({
            "name": unescape(link.group(2)).strip(),
            "latin": latin_m.group(1).strip() if latin_m else "",
            "family": "", "type": "Fish", "distribution": "",
            "wiki_path": "/wiki/" + link.group(1),
        })
    return species


def parse_fish_list(html):
    html = trim_content(html)
    items = re.findall(r"<li[^>]*>(.*?)</li>", html, re.DOTALL)
    species = []
    for item in items:
        link = re.search(r'<a[^>]*href="([^"#]+)"[^>]*>([^<]+)</a>', item)
        if not link or any(x in link.group(1) for x in SKIP_HREF):
            continue
        latin_m = re.search(r"<i[^>]*>([^<]+)</i>", item)
        species.append({
            "name": unescape(link.group(2)).strip(),
            "latin": latin_m.group(1).strip() if latin_m else "",
            "family": "", "type": "Fish", "distribution": "",
            "wiki_path": "/wiki/" + link.group(1),
        })
    return species


def parse_fish_page(html):
    if '<table class="wikitable' in html:
        return parse_fish_table(html)
    return parse_fish_list(html)


def get_range_text(html):
    parts = []
    for hid in ["Distribution", "Range", "Habitat", "Distribution_and_habitat",
                 "Habitat_and_range", "Geographic_range"]:
        m = re.search(rf'id="{hid}".*?</h[23]>(.*?)(?:<h[23]|$)', html,
                       re.DOTALL | re.IGNORECASE)
        if m:
            parts.append(re.sub(r"<[^>]+>", " ", m.group(1))[:1000])
    intro = html[:html.find("<h2") if "<h2" in html else 5000]
    for sentence in re.split(r"[.!]", re.sub(r"<[^>]+>", " ", intro)):
        if any(w in sentence.lower() for w in
               ["native to", "found in", "ranges from", "endemic to",
                "distributed", "occurs in", "inhabit"]):
            parts.append(sentence)
    return " ".join(parts).lower()



def validate_and_enrich(fish_list):
    """Verify each entry is a real species and fix name/latin from the article."""
    result = []
    for i, s in enumerate(fish_list):
        if (i + 1) % 200 == 0:
            print(f"    {i + 1}/{len(fish_list)}...", flush=True)
        html = read_article("A/" + s["wiki_path"].split("/wiki/")[-1])
        if not html:
            continue
        binom_pos = html.find("Binomial name")
        if binom_pos < 0:
            continue
        latin_m = re.search(
            r'<i[^>]*>(?:<b>)?([A-Z][a-z]+ [a-z]+(?:-[a-z]+)*(?:\s[a-z]+)?)',
            html[binom_pos:binom_pos + 500],
        )
        if not latin_m:
            continue
        epithet = latin_m.group(1).split()[1] if " " in latin_m.group(1) else ""
        if epithet in ("sp", "spp", "sp.", "spp."):
            continue
        s["latin"] = latin_m.group(1)

        genus = s["latin"].split()[0]
        title_m = re.search(r'<title>([^<]+)</title>', html)
        title = title_m.group(1).split(" - ")[0].strip() if title_m else ""

        if s["name"] == s["latin"] or s["name"] == genus:
            if title and title != s["latin"] and title != genus:
                s["name"] = title
            else:
                slug = unquote(s["wiki_path"].split("/wiki/")[-1]).replace("_", " ")
                slug = re.sub(r"\s*\([^)]+\)$", "", slug)
                if not LATIN_RE.match(slug) and slug != genus:
                    s["name"] = slug
        elif title and title != s["latin"] and title != genus and title != s["name"]:
            s["name"] = title

        s["name"] = re.sub(r"\s*\([^)]+\)\s*$", "", s["name"]).strip()
        result.append(s)
    return result


def collect_fish():
    all_fish = []
    seen = set()

    def add(species_list):
        for s in species_list:
            key = s["wiki_path"].lower()
            if key not in seen:
                seen.add(key)
                all_fish.append(s)

    for path in FISH_PAGES:
        label = re.sub(r"List_of_fish(es)?_of_", "", path.split("/")[-1]).replace("_", " ")
        print(f"  {label}... ", end="", flush=True)
        html = read_article(path)
        if not html:
            print("NOT FOUND")
            continue
        add(parse_fish_page(html))
        print(f"{len(all_fish)} cumulative unique")

    state_count = len(all_fish)
    print(f"  State lists: {state_count} unique fish")

    print("  Scanning global list... ", end="", flush=True)
    html = read_article(FISH_GLOBAL)
    if not html:
        print("NOT FOUND")
        return all_fish
    global_fish = parse_fish_list(html)
    candidates = [s for s in global_fish if s["wiki_path"].lower() not in seen]
    print(f"{len(global_fish)} total, {len(candidates)} new candidates")

    added = 0
    for i, s in enumerate(candidates):
        if i % 100 == 0 and i > 0:
            print(f"    ...{i}/{len(candidates)} scanned, {added} NA", flush=True)
        page_html = read_article("A/" + s["wiki_path"].split("/wiki/")[-1])
        if not page_html:
            continue
        if "Binomial name" not in page_html:
            continue
        text = get_range_text(page_html)
        if any(kw in text for kw in NA_KEYWORDS):
            add([s])
            added += 1
    print(f"  Global filter: +{added} NA fish")

    print(f"  Validating {len(all_fish)} entries...")
    all_fish = validate_and_enrich(all_fish)
    print(f"  Fish total: {len(all_fish)} verified species")
    return all_fish


# ---------------------------------------------------------------------------
# Manual additions — species present in the ZIM but missing from list pages
# (e.g. Elk is a separate species from Red deer since 2004 DNA evidence,
#  but the mammals list page only links to Red_deer)
# ---------------------------------------------------------------------------
MANUAL_ADDITIONS = [
    {
        "name": "Elk",
        "latin": "Cervus canadensis",
        "family": "",
        "type": "Mammal",
        "distribution": "",
        "wiki_path": "/wiki/Elk",
    },
]

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
SOURCES = [
    ("Mammals",    "A/List_of_mammals_of_the_United_States", parse_mammals),
    ("Birds",      "A/List_of_birds_of_the_United_States",   parse_birds),
    ("Amphibians", "A/List_of_amphibians_of_the_United_States", parse_amphibians),
    ("Reptiles",   "A/List_of_North_American_reptiles",      parse_reptiles),
]


def main():
    all_species = list(MANUAL_ADDITIONS)
    print(f"Manual additions: {len(MANUAL_ADDITIONS)}")
    for label, path, parser in SOURCES:
        print(f"Reading {label}... ", end="", flush=True)
        html = read_article(path)
        if html is None:
            print("NOT FOUND in ZIM")
            continue
        species = parser(html)
        print(f"{len(species)} species")
        all_species.extend(species)

    print("Reading Fish...")
    all_species.extend(collect_fish())

    seen_paths = set()
    seen_latin = set()
    seen_names = set()
    unique = []
    for s in all_species:
        path_key = s["wiki_path"].lower()
        if path_key in seen_paths:
            continue
        seen_paths.add(path_key)
        if s["latin"]:
            latin_key = s["latin"].lower()
            if latin_key in seen_latin:
                continue
            seen_latin.add(latin_key)
        name_key = (s["type"], s["name"].lower())
        if name_key in seen_names:
            continue
        seen_names.add(name_key)
        unique.append(s)

    print(f"\nTotal: {len(all_species)} raw, {len(unique)} unique species")

    with open(OUT, "w") as f:
        json.dump(unique, f, indent=2)
    print(f"Saved to {OUT}")


if __name__ == "__main__":
    main()
