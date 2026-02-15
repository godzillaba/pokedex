# Scrape — Wikipedia Species Extraction & Enrichment

Extracts North American wildlife data from a local Wikipedia ZIM archive, enriches it with an LLM, and outputs the app's `species.json`. The pipeline runs in 5 stages: index → pages → extract → enrich → build.

## Prerequisites

- Python 3.10+ with `python3-venv` (in Dockerfile)
- Python packages in `requirements.txt` — installed automatically via `postCreateCommand` into `scrape/.venv`
- `wikipedia_en_all_maxi_2024-01.zim` (103 GB) in the repo root
- `ANTHROPIC_API_KEY` environment variable (for the enrich step)

## Usage

```bash
# 1. Build the species index from Wikipedia list pages (needs ZIM)
python3 scrape/build_index.py

# 2. Extract full article HTML for each species (needs ZIM)
python3 scrape/extract_pages.py

# 3. Parse HTML for binomial names, conservation status, common names
python3 scrape/extract.py

# 4. Enrich with LLM (descriptions, stats, regions, habitats)
ANTHROPIC_API_KEY=sk-... python3 scrape/enrich.py

# 5. Assemble final species.json
python3 scrape/build.py
```

Steps 1-2 require the ZIM file. Steps 3-5 work from the already-extracted data.

## Pipeline architecture

```
ZIM archive
    │
    ├─ [1] build_index.py      → species_index.json  (3,306 species)
    │
    ├─ [2] extract_pages.py    → pages/*.html         (3,733 articles)
    │
    ▼
species_index.json + pages/*.html
    │
    ├─ [3] extract.py          → extracted.json        (+ binomial names, IUCN status)
    │
    ├─ [4] enrich.py          → llm_cache/*.json      (LLM-generated fields)
    │
    ▼
extracted.json + llm_cache/
    │
    └─ [5] build.py            → src/data/species.json  (final app data)
```

## What each script does

| Script | Input | Output |
|---|---|---|
| `build_index.py` | ZIM list pages (mammals, birds, amphibians, reptiles, fish) | `species_index.json` |
| `extract_pages.py` | `species_index.json` + ZIM | `pages/*.html` |
| `extract.py` | `species_index.json` + `pages/*.html` | `extracted.json` |
| `enrich.py` | `extracted.json` + `pages/*.html` | `llm_cache/*.json` |
| `build.py` | `extracted.json` + `llm_cache/*.json` | `src/data/species.json` |
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

## Step 3: extract.py — Deterministic field extraction

Parses each species' HTML page to extract structured fields without any LLM calls:

- **Full binomial name** — from `<span class="binomial"><i>...</i></span>` in the infobox. Falls back to `latin` from `species_index.json` if no HTML page exists.
- **Conservation status** — first IUCN status keyword found in the article (Least Concern, Vulnerable, Endangered, etc.). Used later as an input signal for the `rarity` stat.
- **Name cleanup** — for the 319 species where the scraper stored the Latin name as the common name (mostly amphibians), extracts the actual common name from the article `<title>`.

Output: `extracted.json` — same 3,306 entries with cleaned fields.

## Step 4: enrich.py — LLM enrichment with per-field caching

Uses Claude Haiku (`claude-haiku-4-5-20251001`) to generate Pokédex-style fields for each species. The key design feature is **per-field caching** — each field type is stored in a separate JSON file:

```
scrape/llm_cache/
  descriptions.json   — { "/wiki/Bald_eagle": "The national bird...", ... }
  stats.json          — { "/wiki/Bald_eagle": { "size": 85, ... }, ... }
  regions.json        — { "/wiki/Bald_eagle": "Continental US, Alaska", ... }
  habitats.json       — { "/wiki/Bald_eagle": "Near large bodies of water", ... }
  names.json          — { "/wiki/Acris_crepitans": "Northern Cricket Frog", ... }
```

All keyed by `wiki_path` (the most stable unique identifier).

### How caching works

For each species, the script checks which fields are already cached. If all present → skip. If some missing → make ONE API call requesting only the missing fields. Cache is flushed to disk after every species for crash safety.

### Regenerating a single field

Delete its cache file and re-run:

```bash
rm scrape/llm_cache/descriptions.json
python3 scrape/enrich.py     # re-generates only descriptions
```

### Flags

- `--limit N` — process only the first N species (for testing)

### Error handling

- Non-retryable errors (auth, bad request): log and skip
- Retryable errors (429 rate limit, 5xx): exponential backoff, up to 3 retries

## Step 5: build.py — Assemble final species.json

Merges `extracted.json` with all LLM cache files into the app's `src/data/species.json`:

1. Joins deterministic fields (`name`, `species`, `type`) with LLM fields (`region`, `habitat`, `stats`, `description`)
2. Skips any species missing critical LLM fields (incomplete enrichment)
3. Sorts by type (Mammal → Bird → Reptile → Amphibian → Fish) then alphabetically
4. Assigns sequential IDs (1, 2, 3, ...) and placeholder image paths

## Species counts

| Type | Count |
|---|---|
| Mammal | 516 |
| Bird | 1,278 |
| Reptile | 426 |
| Amphibian | 303 |
| Fish | 783 |
| **Total** | **3,306** |
