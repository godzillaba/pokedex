# Scrape — Wikipedia Species Extraction

Extracts North American wildlife data from a local Wikipedia ZIM archive. No network access required.

## Prerequisites

- Python 3.10+
- `libzim` — `pip install libzim`
- `wikipedia_en_all_maxi_2024-01.zim` (103 GB) in the repo root

## Usage

```bash
cd scrape

# 1. Build the species index from Wikipedia list pages
python3 build_index.py

# 2. Extract full article HTML for each species
python3 extract_pages.py
```

## What each script does

| Script | Input | Output |
|---|---|---|
| `build_index.py` | ZIM list pages (mammals, birds, amphibians, reptiles, fish) | `species_index.json` |
| `extract_pages.py` | `species_index.json` + ZIM | `pages/*.html` |
| `zim_utils.py` | _(shared module)_ | Provides `read_article(path)` for ZIM lookups |

## Source pages

`build_index.py` reads these Wikipedia list pages from the ZIM:

- **Mammals** (528) — `List_of_mammals_of_the_United_States`
- **Birds** (1,278) — `List_of_birds_of_the_United_States`
- **Amphibians** (303) — `List_of_amphibians_of_the_United_States`
- **Reptiles** (426) — `List_of_North_American_reptiles`
- **Fish** (hybrid) — see below

### Fish: hybrid approach

Unlike the other types, Wikipedia has no single "List of fish of the United States" page. Fish are collected via a two-phase hybrid:

**Phase 1 — State-level lists (ground truth):**
12 state-specific Wikipedia pages that list fish found in that state. These are North American by definition — no filtering needed. Covers diverse biomes (subtropical FL, mountain CO/WY/MT/ID, plains OK/MO, midwest IN/MN/AR, Appalachian WV, Pacific HI).

Pages: `List_of_fishes_of_Arkansas`, `..._Colorado`, `..._Florida`, `List_of_fish_of_Hawaii`, `..._Idaho`, `..._Indiana`, `..._Minnesota`, `..._Missouri`, `..._Montana`, `..._Oklahoma`, `..._West_Virginia`, `..._Wyoming`

Some pages use wikitable format (`<table>`), others use list format (`<li>`). The parser auto-detects and handles both.

**Phase 2 — Global list, filtered by article content:**
Reads `List_of_common_fish_names` (~1,248 entries, worldwide). For each fish *not already found* in the state lists, opens its Wikipedia article from the ZIM and scans the distribution/range section for North American keywords (e.g. "North America", "United States", "Great Lakes", "western Atlantic"). This catches fish from states without dedicated list pages (OR, WA, ME, NY, etc.).

## Output format

`species_index.json` — array of objects:

```json
{
  "name": "Virginia opossum",
  "latin": "D. virginiana",
  "family": "",
  "type": "Mammal",
  "distribution": "",
  "wiki_path": "/wiki/Virginia_opossum"
}
```

`pages/` — one HTML file per species, named by wiki path (e.g. `Virginia_opossum.html`).
