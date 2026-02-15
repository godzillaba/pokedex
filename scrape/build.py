"""Assemble final species.json from extracted data + LLM cache.

Reads:
  - scrape/extracted.json     (deterministic fields)
  - scrape/llm_cache/*.json   (LLM-generated fields)

Outputs:
  - src/data/species.json     (complete Pokédex entries)
"""

import json
from pathlib import Path

SCRAPE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRAPE_DIR.parent
CACHE_DIR = SCRAPE_DIR / "llm_cache"
EXTRACTED_PATH = SCRAPE_DIR / "extracted.json"
OUTPUT_PATH = PROJECT_DIR / "src" / "data" / "species.json"

TYPE_ORDER = ["Mammal", "Bird", "Reptile", "Amphibian", "Fish"]


def load_cache(name):
    path = CACHE_DIR / f"{name}.json"
    if path.exists():
        return json.loads(path.read_text())
    return {}


def main():
    with open(EXTRACTED_PATH) as f:
        extracted = json.load(f)

    descriptions = load_cache("descriptions")
    stats = load_cache("stats")
    regions = load_cache("regions")
    habitats = load_cache("habitats")
    names = load_cache("names")

    species_list = []
    skipped = 0

    for entry in extracted:
        key = entry["wiki_path"]

        # Use LLM name if available (for species where name == latin)
        name = names.get(key, entry["name"])

        desc = descriptions.get(key)
        st = stats.get(key)
        region = regions.get(key)
        habitat = habitats.get(key)

        # Skip species missing critical LLM fields
        if not desc or not st or not region or not habitat:
            skipped += 1
            continue

        # Validate stats are proper integers 0-100
        try:
            st = {k: max(0, min(100, int(v))) for k, v in st.items()
                  if k in ("size", "speed", "rarity", "danger")}
            if len(st) != 4:
                skipped += 1
                continue
        except (ValueError, TypeError):
            skipped += 1
            continue

        species_list.append({
            "name": name,
            "species": entry["species"],
            "type": entry["type"],
            "region": region,
            "habitat": habitat,
            "stats": st,
            "description": desc,
            "_sort_key": (TYPE_ORDER.index(entry["type"])
                          if entry["type"] in TYPE_ORDER else 99, name.lower()),
        })

    # Sort by type order, then alphabetically by name
    species_list.sort(key=lambda s: s["_sort_key"])

    # Assign sequential IDs and image paths, remove sort key
    for i, s in enumerate(species_list, 1):
        s["id"] = i
        s["image"] = f"images/animals/{i:03d}.jpg"
        del s["_sort_key"]

    # Reorder fields for readability
    output = []
    for s in species_list:
        output.append({
            "id": s["id"],
            "name": s["name"],
            "species": s["species"],
            "type": s["type"],
            "region": s["region"],
            "habitat": s["habitat"],
            "stats": s["stats"],
            "description": s["description"],
            "image": s["image"],
        })

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Wrote {len(output)} species to {OUTPUT_PATH}")
    print(f"Skipped {skipped} incomplete entries")

    # Type breakdown
    type_counts = {}
    for s in output:
        type_counts[s["type"]] = type_counts.get(s["type"], 0) + 1
    print("Type breakdown:")
    for t in TYPE_ORDER:
        print(f"  {t}: {type_counts.get(t, 0)}")


if __name__ == "__main__":
    main()
