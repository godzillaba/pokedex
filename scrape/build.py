"""Assemble final species.json from extracted data + LLM cache.

Reads:
  - scrape/extracted.json          (deterministic fields)
  - scrape/llm_cache/*.json        (LLM-generated fields)
  - scrape/popularity_scores.json  (cultural awareness scores)
  - scrape/images/*.png            (pixelated species images)

Outputs:
  - src/data/species.json              (complete Pokédex entries)
  - public/images/animals/{id:03d}.png (copied species images)
"""

import json
import shutil
from pathlib import Path

SCRAPE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRAPE_DIR.parent
CACHE_DIR = SCRAPE_DIR / "llm_cache"
EXTRACTED_PATH = SCRAPE_DIR / "extracted.json"
POPULARITY_PATH = SCRAPE_DIR / "popularity_scores.json"
OUTPUT_PATH = PROJECT_DIR / "src" / "data" / "species.json"
SPRITE_DIR = SCRAPE_DIR / "images"
PUBLIC_IMG_DIR = PROJECT_DIR / "public" / "images" / "animals"

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

    popularity = {}
    if POPULARITY_PATH.exists():
        popularity = json.loads(POPULARITY_PATH.read_text())
    else:
        print("WARNING: popularity_scores.json not found, falling back to alpha sort")

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
            "_wiki_slug": key.split("/wiki/")[-1],
            "_wiki_path": key,
        })

    # Sort by popularity (highest first), then alphabetically as tiebreaker
    if popularity:
        species_list.sort(key=lambda s: (-popularity.get(s["_wiki_path"], 0), s["name"].lower()))
    else:
        species_list.sort(key=lambda s: (
            TYPE_ORDER.index(s["type"]) if s["type"] in TYPE_ORDER else 99,
            s["name"].lower(),
        ))

    # Copy images and assign sequential IDs
    PUBLIC_IMG_DIR.mkdir(parents=True, exist_ok=True)
    images_copied = 0
    for i, s in enumerate(species_list, 1):
        s["id"] = i
        sprite = SPRITE_DIR / f"{s['_wiki_slug']}.png"
        original = SPRITE_DIR / f"{s['_wiki_slug']}-original.png"
        if sprite.exists():
            shutil.copy2(sprite, PUBLIC_IMG_DIR / f"{i:03d}.png")
            s["image"] = f"images/animals/{i:03d}.png"
            images_copied += 1
        else:
            s["image"] = "images/animals/placeholder.svg"
        if original.exists():
            shutil.copy2(original, PUBLIC_IMG_DIR / f"{i:03d}-original.png")
        del s["_wiki_path"]
        del s["_wiki_slug"]

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
    print(f"Images copied: {images_copied}/{len(output)}")

    # Type breakdown
    type_counts = {}
    for s in output:
        type_counts[s["type"]] = type_counts.get(s["type"], 0) + 1
    print("Type breakdown:")
    for t in TYPE_ORDER:
        print(f"  {t}: {type_counts.get(t, 0)}")


if __name__ == "__main__":
    main()
