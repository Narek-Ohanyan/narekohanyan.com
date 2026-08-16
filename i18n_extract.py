#!/usr/bin/env python3
"""
Refresh i18n/en.json — the catalogue of every translatable string.

Run after editing any English page. Existing translations are keyed by the
hash of the English text, so untouched strings keep their translations and
only changed or new ones show up as missing.
"""
import glob, json, pathlib, i18n_lib

ROOT = pathlib.Path(__file__).parent
OUT  = ROOT / "i18n" / "en.json"

cat = {}
for p in sorted(glob.glob(str(ROOT / "*.html"))):
    for k, s in i18n_lib.strings(open(p).read()):
        cat.setdefault(k, s)

OUT.write_text(json.dumps(cat, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"i18n/en.json  {len(cat)} strings, {sum(len(v.split()) for v in cat.values()):,} words")

# report coverage of every locale file that exists
for f in sorted((ROOT / "i18n").glob("*.json")):
    if f.name == "en.json":
        continue
    tr = json.loads(f.read_text(encoding="utf-8"))
    done = sum(1 for k in cat if tr.get(k))
    stale = [k for k in tr if k not in cat]
    print(f"  {f.stem:<4} {done:>4}/{len(cat)}  ({100*done//len(cat):>3}%)"
          + (f"  {len(stale)} stale" if stale else ""))
