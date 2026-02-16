"""Score species by cultural awareness using an LLM.

Sends batches of species names to Sonnet and asks it to rate each
on a 0-100 cultural awareness scale. Outputs popularity_scores.json.

Resume-safe: skips species already in the cache file.

Usage:
    python3 scrape/score_popularity.py [--limit N]
"""

import json
import os
import time
from pathlib import Path

import anthropic

SCRAPE_DIR = Path(__file__).resolve().parent
INDEX_PATH = SCRAPE_DIR / "species_index.json"
OUTPUT_PATH = SCRAPE_DIR / "popularity_scores.json"

BATCH_SIZE = 200
MODEL = "claude-sonnet-4-5-20250929"

PROMPT = """\
Rate each animal's cultural awareness / public recognition on a scale of 0-100.
100 = universally known (e.g. bald eagle, grizzly bear, great white shark)
50 = moderately known (e.g. copperhead snake, blue jay, rainbow trout)
0 = virtually unknown to the general public (e.g. Ozark hellbender, pallid sturgeon)

Consider: how likely is an average American to recognize the name?

Return ONLY a JSON object mapping each name to its integer score. No commentary.

Animals:
"""


def score_batch(client, names):
    names_text = "\n".join(f"- {n}" for n in names)
    resp = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": PROMPT + names_text}],
    )
    text = resp.content[0].text.strip()
    # Strip markdown code fence if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(text)


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("PERSONAL_ANTHROPIC_API_KEY")
    if not api_key:
        from dotenv import load_dotenv
        load_dotenv(SCRAPE_DIR.parent / ".env")
        api_key = os.environ.get("PERSONAL_ANTHROPIC_API_KEY")

    client = anthropic.Anthropic(api_key=api_key)

    with open(INDEX_PATH) as f:
        species = json.load(f)

    cache = {}
    if OUTPUT_PATH.exists():
        cache = json.loads(OUTPUT_PATH.read_text())

    # Build list of species still needing scores
    todo = [(s["wiki_path"], s["name"]) for s in species if s["wiki_path"] not in cache]
    if args.limit:
        todo = todo[:args.limit]

    print(f"Total species: {len(species)}, cached: {len(cache)}, to score: {len(todo)}")

    for batch_start in range(0, len(todo), BATCH_SIZE):
        batch = todo[batch_start:batch_start + BATCH_SIZE]
        names = [name for _, name in batch]
        path_map = {name: wp for wp, name in batch}

        try:
            scores = score_batch(client, names)
        except Exception as e:
            print(f"  Batch error: {e}")
            time.sleep(2)
            continue

        matched = 0
        for name, score in scores.items():
            wp = path_map.get(name)
            if wp:
                cache[wp] = int(score)
                matched += 1

        OUTPUT_PATH.write_text(json.dumps(cache, indent=2))
        print(f"[{len(cache)}/{len(species)}] Batch scored {matched}/{len(batch)}")

    OUTPUT_PATH.write_text(json.dumps(cache, indent=2))
    print(f"\nDone. Wrote {len(cache)} entries to {OUTPUT_PATH}")

    ranked = sorted(cache.items(), key=lambda x: -x[1])
    print("\nTop 20:")
    for i, (path, score) in enumerate(ranked[:20], 1):
        name = path.split("/wiki/")[-1].replace("_", " ")
        print(f"  #{i:3d}  {score:3d}  {name}")


if __name__ == "__main__":
    main()
