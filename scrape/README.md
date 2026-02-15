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
| `build_index.py` | ZIM list pages (mammals, birds, amphibians, reptiles) | `species_index.json` |
| `extract_pages.py` | `species_index.json` + ZIM | `pages/*.html` |
| `zim_utils.py` | _(shared module)_ | Provides `read_article(path)` for ZIM lookups |

## Source pages

`build_index.py` reads these 4 Wikipedia list pages from the ZIM:

- **Mammals** (528) — `List_of_mammals_of_the_United_States`
- **Birds** (1,278) — `List_of_birds_of_the_United_States`
- **Amphibians** (303) — `List_of_amphibians_of_the_United_States`
- **Reptiles** (426) — `List_of_North_American_reptiles`

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
