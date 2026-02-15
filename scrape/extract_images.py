"""Extract species photos from ZIM and pixelate into retro sprites.

Reads species_index.json, finds the infobox photo for each species in the ZIM,
and saves a pixelated 256x256 PNG (64x64 downscale, 32 colors, nearest-neighbor upscale).

Output: scrape/images/{wiki_slug}.png
"""

import json
import re
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import unquote

from zim_utils import _get_archive, read_article

SCRAPE_DIR = Path(__file__).resolve().parent
INDEX_PATH = SCRAPE_DIR / "species_index.json"
IMAGES_DIR = SCRAPE_DIR / "images"

INFOBOX_RE = re.compile(
    r'<table[^>]*class="[^"]*infobox biota[^"]*"[^>]*>(.*?)</table>', re.DOTALL
)
IMG_RE = re.compile(r'<img[^>]+src="([^"]+)"[^>]*>', re.DOTALL)
SKIP_PREFIXES = ("Status_", "OOjs_", "Distribution_")


def find_infobox_image(html):
    m = INFOBOX_RE.search(html)
    if not m:
        return None
    for img in IMG_RE.finditer(m.group(1)):
        src = img.group(1)
        filename = src.rsplit("/", 1)[-1]
        if any(filename.startswith(p) for p in SKIP_PREFIXES):
            continue
        # Normalize ../I/foo → I/foo
        zim_path = src.lstrip("./")
        if zim_path.startswith("I/"):
            return zim_path
    return None


def extract_image_bytes(zim_path):
    zim = _get_archive()
    # HTML src attributes are often double-encoded (%252C → %2C)
    for path in [zim_path, unquote(zim_path)]:
        try:
            entry = zim.get_entry_by_path(path)
            return entry.get_item().content.tobytes()
        except KeyError:
            continue
    return None


def pixelate(input_bytes, output_path):
    with tempfile.NamedTemporaryFile(suffix=".webp", delete=False) as tmp:
        tmp.write(input_bytes)
        tmp_path = tmp.name
    try:
        subprocess.run([
            "convert", tmp_path,
            "-gravity", "center",
            "-thumbnail", "256x256^",
            "-extent", "256x256",
            "-resize", "64x64",
            "-colors", "32",
            "-filter", "point",
            "-resize", "256x256",
            str(output_path),
        ], check=True, capture_output=True)
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def main():
    with open(INDEX_PATH) as f:
        index = json.load(f)

    IMAGES_DIR.mkdir(exist_ok=True)
    total = len(index)
    extracted = 0
    skipped_existing = 0
    no_image = 0
    errors = 0

    for i, entry in enumerate(index, 1):
        slug = entry["wiki_path"].split("/wiki/")[-1]
        out_path = IMAGES_DIR / f"{slug}.png"

        if out_path.exists():
            skipped_existing += 1
            continue

        wiki_path = "A/" + slug
        html = read_article(wiki_path)
        if not html:
            print(f"[{i}/{total}] {entry['name']} — no article")
            no_image += 1
            continue

        zim_path = find_infobox_image(html)
        if not zim_path:
            print(f"[{i}/{total}] {entry['name']} — no infobox image")
            no_image += 1
            continue

        img_bytes = extract_image_bytes(zim_path)
        if not img_bytes:
            print(f"[{i}/{total}] {entry['name']} — image not in ZIM: {zim_path}")
            no_image += 1
            continue

        try:
            pixelate(img_bytes, out_path)
            extracted += 1
            print(f"[{i}/{total}] {entry['name']} \u2713")
        except subprocess.CalledProcessError as e:
            errors += 1
            print(f"[{i}/{total}] {entry['name']} — convert failed: {e.stderr[:200]}")

    print(f"\nDone: {extracted} extracted, {skipped_existing} already existed, "
          f"{no_image} no image, {errors} errors")


if __name__ == "__main__":
    main()
