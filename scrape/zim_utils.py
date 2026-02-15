"""Shared ZIM reader helper. Opens the archive once and provides lookup functions."""

from pathlib import Path
from libzim.reader import Archive

ZIM_PATH = Path(__file__).resolve().parent.parent / "wikipedia_en_all_maxi_2024-01.zim"

_archive = None

def _get_archive():
    global _archive
    if _archive is None:
        _archive = Archive(str(ZIM_PATH))
    return _archive


def read_article(path):
    """Read an article by path (e.g. 'A/Largemouth_bass'). Follows redirects.
    Returns HTML string or None if not found."""
    zim = _get_archive()
    try:
        entry = zim.get_entry_by_path(path)
        if entry.is_redirect:
            entry = entry.get_redirect_entry()
        return entry.get_item().content.tobytes().decode()
    except KeyError:
        return None


def article_exists(path):
    """Check if an article exists in the ZIM archive."""
    zim = _get_archive()
    try:
        zim.get_entry_by_path(path)
        return True
    except KeyError:
        return False
