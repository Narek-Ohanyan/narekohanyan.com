# Localisation

The English `.html` files in the project root are the **single source of truth**.
Never edit a file inside a locale folder (`hy/`, `fr/`, …) — it is generated and
will be overwritten.

## Workflow

    python3 i18n_extract.py      # refresh i18n/en.json + show coverage
    python3 stamp.py             # cache-bust css/js  (must run BEFORE build)
    python3 i18n_build.py        # regenerate every locale folder
    python3 i18n_build.py hy fr  # …or only the ones named

Order matters: `stamp.py` rewrites the asset hashes in the English pages, and
`i18n_build.py` copies those pages, so building first would ship stale hashes
to every locale.

## Adding a translation

Each string is keyed by a hash of its English text, so a phrase that appears on
several pages (the nav, the footer) is translated once. Put the key and the
translated string in `i18n/<locale>.json`. Anything missing falls back to
English, so a partly translated locale is always shippable.

`i18n_extract.py` prints coverage per locale and flags *stale* keys — entries
whose English source has since changed. Those need re-checking.

## Never translate

The build does not enforce this; it is on whoever writes the JSON.

Proper nouns and technical identifiers must survive untouched:
ARPF, CHELSA, CMIP6, GEDI, SHAP, NetCDF, Pangeo, xarray, rioxarray, rasterio,
Sentinel-2, WSL, FORACCA, AUA, UNICEF, UNFCCC, CBD, COP17, LCOY, SUSI,
"Narek Ohanyan", and the book title *The Overshoot: Life After the 1.5°C Limit*.

Mistranslating these on a research portfolio costs more credibility than not
offering the language at all.

## Right-to-left

`ar` and `fa` get `dir="rtl"` automatically. The stylesheet uses logical
properties throughout, so spacing and alignment mirror on their own. What does
not mirror by itself — the asymmetric "leaf" corner radii and the arrow glyphs —
is handled by the `[dir="rtl"]` block at the end of `styles.css`.

## Fonts

Playfair Display and IBM Plex Sans have no Armenian, Arabic or CJK coverage, so
`[lang="hy"]`, `[lang="ar"]`, `[lang="fa"]` and `[lang="zh"]` remap the three
font tokens to Noto families with system fallbacks. Those Noto faces are **not**
currently loaded from Google Fonts — the pages fall back to whatever the reader
has installed. Add the webfont links if the rendering is not good enough.

---

## Status: on hold

The feature is **not live**. What was removed from the shipped site:

* the generated `hy/` folder
* the switcher markup, `hreflang` tags and `<!--i18n:*-->` markers in the root pages
* `.lang` styling and the `[dir="rtl"]` / per-script font blocks → `i18n/language.css`
* the switcher behaviour → `i18n/language.js`

Everything needed to resume is still here: the three scripts, the extracted
`en.json` catalogue, and the partial `hy.json`.

### To resume

1. Append `i18n/language.css` back onto `styles.css`
2. Append `i18n/language.js` back onto `site.js`
3. `python3 i18n_extract.py && python3 stamp.py && python3 i18n_build.py`

### Kept in the codebase deliberately

Two changes made during this work stayed, because they are improvements
regardless of localisation and change nothing visually in English:

* **Logical properties.** 34 declarations moved from `margin-left` /
  `padding-right` / `text-align: left` to their `-inline-start` / `-inline-end`
  equivalents. Identical rendering in a left-to-right document, and RTL comes
  free later.
* **Nav overflow guard** in `site.js`. Measures whether the nav links actually
  fit and hands over to the drawer when they do not, instead of trusting a
  fixed 1080px breakpoint. Inert in English today; it protects against any
  future nav item or longer label overflowing the bar.
