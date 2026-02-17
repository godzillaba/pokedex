"""Extract raw (non-pixelated) species photos from ZIM as local fallbacks.

Reads species_index.json, finds the infobox photo for each species in the ZIM,
and saves the raw WebP bytes to scrape/originals/{wiki_slug}.webp.
No resizing, no pixelation — just the original ZIM image.

Output: scrape/originals/{wiki_slug}.webp
"""

import json
from pathlib import Path

from extract_images import find_infobox_image, extract_image_bytes
from zim_utils import read_article

SCRAPE_DIR = Path(__file__).resolve().parent
INDEX_PATH = SCRAPE_DIR / "species_index.json"
ORIGINALS_DIR = SCRAPE_DIR / "originals"


def main():
    with open(INDEX_PATH) as f:
        index = json.load(f)

    ORIGINALS_DIR.mkdir(exist_ok=True)
    total = len(index)
    extracted = 0
    skipped_existing = 0
    no_image = 0

    for i, entry in enumerate(index, 1):
        slug = entry["wiki_path"].split("/wiki/")[-1]
        out_path = ORIGINALS_DIR / f"{slug}.webp"

        if out_path.exists():
            skipped_existing += 1
            continue

        html = read_article("A/" + slug)
        if not html:
            no_image += 1
            continue

        zim_path = find_infobox_image(html)
        if not zim_path:
            no_image += 1
            continue

        img_bytes = extract_image_bytes(zim_path)
        if not img_bytes:
            no_image += 1
            continue

        out_path.write_bytes(img_bytes)
        extracted += 1
        if i % 100 == 0:
            print(f"[{i}/{total}] {extracted} extracted so far...")

    print(f"\nDone: {extracted} extracted, {skipped_existing} already existed, "
          f"{no_image} no image")


if __name__ == "__main__":
    main()
