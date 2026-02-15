#!/usr/bin/env python3
"""Build species index from the local ZIM file.

Reads 4 Wikipedia list pages from the ZIM archive:
  - Mammals:    List_of_mammals_of_the_United_States
  - Birds:      List_of_birds_of_the_United_States
  - Amphibians: List_of_amphibians_of_the_United_States
  - Reptiles:   List_of_North_American_reptiles (redirect followed automatically)

Output: scrape/species_index.json
"""

import json
import re
from html import unescape
from pathlib import Path

from zim_utils import read_article

OUT = Path(__file__).parent / "species_index.json"

SKIP_HREF = ["File:", "Help:", "Wikipedia:", "Template:", "Category:", "Special:", "#",
             "List_of", "Mammal", "Fauna_of", "ISBN", "ISSN", "OCLC", "doi:",
             "IUCN", "Binomial", "Family_(biology)", "Order_(biology)"]


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
# Main
# ---------------------------------------------------------------------------
SOURCES = [
    ("Mammals",    "A/List_of_mammals_of_the_United_States", parse_mammals),
    ("Birds",      "A/List_of_birds_of_the_United_States",   parse_birds),
    ("Amphibians", "A/List_of_amphibians_of_the_United_States", parse_amphibians),
    ("Reptiles",   "A/List_of_North_American_reptiles",      parse_reptiles),
]


def main():
    all_species = []
    for label, path, parser in SOURCES:
        print(f"Reading {label}... ", end="", flush=True)
        html = read_article(path)
        if html is None:
            print("NOT FOUND in ZIM")
            continue
        species = parser(html)
        print(f"{len(species)} species")
        all_species.extend(species)

    seen = set()
    unique = []
    for s in all_species:
        if s["wiki_path"] not in seen:
            seen.add(s["wiki_path"])
            unique.append(s)

    print(f"\nTotal: {len(all_species)} raw, {len(unique)} unique species")

    with open(OUT, "w") as f:
        json.dump(unique, f, indent=2)
    print(f"Saved to {OUT}")


if __name__ == "__main__":
    main()
