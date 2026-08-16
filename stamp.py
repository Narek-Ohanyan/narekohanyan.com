#!/usr/bin/env python3
"""
Stamp every HTML page's asset links with a content hash.

The dev server (and many static hosts) send Last-Modified but no
Cache-Control or ETag. Browsers then fall back to *heuristic* caching:
they invent a freshness window and serve the cached file without ever
asking the server if it changed. The result is a page that renders with
last hour's stylesheet and looks unstyled.

Hashing the content into the URL removes the guesswork — change a byte of
CSS and the URL changes, so a stale copy can never be served.

Run after editing any css/js:  python3 stamp.py
"""

import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).parent


def assets():
    """Every stylesheet and script in the root, discovered rather than listed.

    A hand-maintained list silently misses new files: contact.js was left off
    one and shipped unstamped for a whole page's life — which is precisely the
    stale-cache bug this script exists to prevent.
    """
    return sorted(p.name for p in ROOT.iterdir()
                  if p.suffix in (".css", ".js") and p.is_file())


def short_hash(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:10]


def main() -> None:
    stamps = {}
    for name in assets():
        stamps[name] = short_hash(ROOT / name)

    pages = sorted(p for p in ROOT.glob("*.html") if not p.name.startswith("_"))
    changed = 0

    for page in pages:
        text = original = page.read_text()
        for name, h in stamps.items():
            # match the asset with or without an existing ?v= stamp
            text = re.sub(
                r'(["\'])' + re.escape(name) + r'(?:\?v=[a-f0-9]+)?\1',
                r'\g<1>' + name + '?v=' + h + r'\g<1>',
                text,
            )
        if text != original:
            page.write_text(text)
            changed += 1

    for name, h in stamps.items():
        print(f"  {name:<12} v={h}")
    print(f"stamped {changed}/{len(pages)} pages")


if __name__ == "__main__":
    main()
