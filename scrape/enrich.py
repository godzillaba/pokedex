"""LLM enrichment for species data.

Generates descriptions, stats, regions, habitats, and common names
using Claude Haiku with per-field caching.

Usage:
    python3 scrape/enrich.py              # enrich all species
    python3 scrape/enrich.py --limit 5    # test with 5 species

To regenerate a single field, delete its cache file and re-run:
    rm scrape/llm_cache/descriptions.json && python3 scrape/enrich.py
"""

import argparse
import json
import re
import time
from pathlib import Path

import anthropic

SCRAPE_DIR = Path(__file__).resolve().parent
PAGES_DIR = SCRAPE_DIR / "pages"
CACHE_DIR = SCRAPE_DIR / "llm_cache"
EXTRACTED_PATH = SCRAPE_DIR / "extracted.json"

CACHE_FIELDS = ["descriptions", "stats", "regions", "habitats", "names"]

EXAMPLE_DESCRIPTIONS = [
    "The national bird of the United States, known for its striking white head "
    "and powerful talons capable of exerting 400 pounds of pressure per square inch.",
    "One of North America's most powerful predators, capable of running at "
    "35 mph despite weighing up to 800 pounds.",
    "Pound for pound, her venom is 15 times stronger than a rattlesnake's.",
    "The fastest animal on Earth, reaching speeds over 240 mph in a hunting dive called a stoop.",
]

TAG_RE = re.compile(r"<[^>]+>")
SCRIPT_STYLE_RE = re.compile(r"<(script|style|link)[^>]*>[\s\S]*?</\1>", re.IGNORECASE)


# --- Cache ---

def load_cache(field):
    path = CACHE_DIR / f"{field}.json"
    if path.exists():
        return json.loads(path.read_text())
    return {}


def save_cache(field, data):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    (CACHE_DIR / f"{field}.json").write_text(json.dumps(data, indent=2))


# --- HTML → plain text ---

def html_to_text(html):
    text = SCRIPT_STYLE_RE.sub("", html)
    text = TAG_RE.sub(" ", text)
    for old, new in [("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"),
                     ("&quot;", '"'), ("&#39;", "'"), ("&nbsp;", " ")]:
        text = text.replace(old, new)
    text = re.sub(r"&#\d+;", "", text)
    return re.sub(r"\s+", " ", text).strip()


def load_article_text(wiki_path):
    slug = wiki_path.split("/wiki/")[-1]
    path = PAGES_DIR / f"{slug}.html"
    if not path.exists():
        return None
    text = html_to_text(path.read_text(errors="replace"))
    words = text.split()
    return " ".join(words[:4000]) if len(words) > 4000 else text


# --- LLM ---

def build_prompt(species, missing_fields):
    fields = []

    if "regions" in missing_fields:
        fields.append(
            '"region": Where this species is found in the US/North America '
            '(short phrase, e.g. "Continental US, Alaska", "Southeastern US")')

    if "habitats" in missing_fields:
        fields.append(
            '"habitat": Primary habitat (short phrase, e.g. '
            '"Near large bodies of water", "Deciduous forests")')

    if "stats" in missing_fields:
        cs = species.get("conservation_status")
        cs_hint = f'this species is "{cs}" — ' if cs else ""
        fields.append(
            '"stats": An object with Pokédex-style stats from 0-100:\n'
            "   - \"size\": relative body size (monarch butterfly=5, housefly=2, bison=100, bass=40)\n"
            "   - \"speed\": relative speed/agility (snail=5, cheetah=100, most songbirds=50-70)\n"
            f"   - \"rarity\": how rare ({cs_hint}Least Concern≈15-30, Vulnerable≈40-55, "
            "Endangered≈70-85, Critically Endangered≈90+)\n"
            '   - "danger": danger to humans (harmless insect=0-5, venomous snake=70-85, grizzly=95)')

    if "descriptions" in missing_fields:
        examples = "\n   ".join(f'- "{d}"' for d in EXAMPLE_DESCRIPTIONS)
        fields.append(
            '"description": A fun, punchy 1-2 sentence Pokédex entry highlighting the most '
            "surprising or impressive fact about this animal. Use specific numbers when available. "
            f"Do NOT start with the species name.\n   Style examples:\n   {examples}")

    if "names" in missing_fields:
        fields.append(
            '"name": The most commonly used English common name for this species '
            '(title case, e.g. "Northern Cricket Frog")')

    numbered = "\n\n".join(f"{i+1}. {f}" for i, f in enumerate(fields))

    return (
        "You are writing entries for a wildlife Pokédex — a retro-styled catalog of American animals.\n"
        f"Given this Wikipedia article about {species['name']} ({species['species']}), "
        f"generate the following fields:\n\n{numbered}\n\n"
        "Return ONLY valid JSON with the requested fields, no markdown fences or extra text."
    )


def enrich_one(client, species, caches):
    key = species["wiki_path"]

    missing = []
    for field in CACHE_FIELDS:
        if field == "names":
            if species["name"] == species["species"] and key not in caches["names"]:
                missing.append("names")
        elif key not in caches[field]:
            missing.append(field)

    if not missing:
        return None

    article = load_article_text(species["wiki_path"])
    prompt = build_prompt(species, missing)
    content = f"<article>\n{article}\n</article>\n\n{prompt}" if article else prompt

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": content}],
    )

    text = response.content[0].text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*$", "", text)
    parsed = json.loads(text)

    if parsed.get("region"):
        caches["regions"][key] = parsed["region"]
    if parsed.get("habitat"):
        caches["habitats"][key] = parsed["habitat"]
    if parsed.get("stats"):
        caches["stats"][key] = parsed["stats"]
    if parsed.get("description"):
        caches["descriptions"][key] = parsed["description"]
    if parsed.get("name"):
        caches["names"][key] = parsed["name"]

    return missing


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    extracted = json.loads(EXTRACTED_PATH.read_text())
    species_list = extracted[:args.limit] if args.limit else extracted
    total = len(species_list)

    print(f"Enriching {total} species ({len(extracted)} total)...")

    caches = {field: load_cache(field) for field in CACHE_FIELDS}
    client = anthropic.Anthropic()

    enriched = skipped = errors = 0

    for i, species in enumerate(species_list):
        prefix = f"[{i+1}/{total}]"

        for attempt in range(4):
            try:
                fields = enrich_one(client, species, caches)
                if fields:
                    print(f"{prefix} {species['name']} — enriched: {', '.join(fields)}")
                    enriched += 1
                    for f in fields:
                        save_cache(f, caches[f])
                else:
                    skipped += 1
                break
            except anthropic.RateLimitError:
                delay = 2 ** (attempt + 1)
                print(f"{prefix} {species['name']} — rate limited, retrying in {delay}s...")
                time.sleep(delay)
            except anthropic.APIStatusError as e:
                if e.status_code >= 500 and attempt < 3:
                    delay = 2 ** (attempt + 1)
                    print(f"{prefix} {species['name']} — {e.status_code}, retrying in {delay}s...")
                    time.sleep(delay)
                else:
                    print(f"{prefix} {species['name']} — ERROR: {e}")
                    errors += 1
                    break
            except (json.JSONDecodeError, KeyError, IndexError) as e:
                print(f"{prefix} {species['name']} — parse error: {e}")
                errors += 1
                break

    print(f"\nDone. Enriched: {enriched}, Skipped (cached): {skipped}, Errors: {errors}")
    for field in CACHE_FIELDS:
        print(f"  {field}: {len(caches[field])} entries")


if __name__ == "__main__":
    main()
