#!/usr/bin/env python3
"""
Generate one folder of HTML per locale from the English pages.

  python3 i18n_build.py            build every locale that has a JSON file
  python3 i18n_build.py hy fr      build only those

The English pages in the project root stay the source of truth and are also
rewritten in place to carry the hreflang set and the language switcher, so
every language points at every other one.
"""
import glob, json, pathlib, re, sys, i18n_lib

ROOT = pathlib.Path(__file__).parent
I18N = ROOT / "i18n"

# name shown in the switcher, and writing direction
LOCALES = {
    "en": ("English",    "ltr"),
    "hy": ("Հայերեն",    "ltr"),
    "fr": ("Français",   "ltr"),
    "es": ("Español",    "ltr"),
    "ru": ("Русский",    "ltr"),
    "uk": ("Українська", "ltr"),
    "de": ("Deutsch",    "ltr"),
    "pt": ("Português",  "ltr"),
    "ar": ("العربية",     "rtl"),
    "fa": ("فارسی",       "rtl"),
    "zh": ("中文",        "ltr"),
}

# Never translated, whatever a catalogue might say: proper nouns, datasets,
# instrument names. Guarding these is the difference between a translated
# site and a damaged one.
PROTECTED = re.compile(
    r"\b(ARPF|CHELSA|CMIP6|GEDI|SHAP|NetCDF|Pangeo|xarray|rioxarray|rasterio|"
    r"WSL|FORACCA|AUA|UNICEF|UNFCCC|CBD|COP17|LCOY|SUSI|GMU|IBM|Cisco|Dell|"
    r"Sentinel-2|Streamlit|GitHub|Python|Narek Ohanyan)\b")

ASSET = re.compile(r'(src|href)="(?!https?:|mailto:|#|/)([^"]+)"')
PAGE  = re.compile(r"^[\w-]+\.html($|\?|#)")


def localise_paths(html):
    """Locale pages live one directory down: assets need ../ but links to
    sibling pages must stay inside the locale."""
    def sub(m):
        attr, val = m.group(1), m.group(2)
        if PAGE.match(val):
            return m.group(0)
        return f'{attr}="../{val}"'
    return ASSET.sub(sub, html)


def hreflang_block(page, locales, current):
    """Paths are relative, so they depend on where the page being written
    lives. From /hy/ the English page is ../index.html, not index.html —
    which would resolve straight back to the Armenian one."""
    up = "" if current == "en" else "../"
    out = []
    for lc in locales:
        href = f"{up}{page}" if lc == "en" else f"{up}{lc}/{page}"
        out.append(f'<link rel="alternate" hreflang="{lc}" href="{href}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{up}{page}">')
    return "\n".join(out)


# Accessible name for the switcher, in each language. Falls back to English.
UI_LABEL = {
    "en": "Change language. Current language: {}",
    "hy": "Փոխել լեզուն։ Ընթացիկ լեզուն՝ {}",
    "fr": "Changer de langue. Langue actuelle : {}",
    "es": "Cambiar de idioma. Idioma actual: {}",
    "ru": "Сменить язык. Текущий язык: {}",
    "uk": "Змінити мову. Поточна мова: {}",
    "de": "Sprache wechseln. Aktuelle Sprache: {}",
    "pt": "Mudar de idioma. Idioma atual: {}",
    "ar": "تغيير اللغة. اللغة الحالية: {}",
    "fa": "تغییر زبان. زبان فعلی: {}",
    "zh": "切换语言。当前语言：{}",
}


def switcher(page, current, locales):
    opts = []
    for lc in locales:
        label, _ = LOCALES[lc]
        href = page if lc == "en" else f"{lc}/{page}"
        if current != "en":
            href = f"../{page}" if lc == "en" else f"../{lc}/{page}"
        sel = ' aria-current="true"' if lc == current else ""
        opts.append(f'      <li><a lang="{lc}" href="{href}"{sel}>{label}</a></li>')
    items = "\n".join(opts)
    name = LOCALES[current][0]
    label = UI_LABEL.get(current, UI_LABEL["en"]).format(name)
    return f'''<div class="lang">
  <button id="langBtn" class="lang__btn" type="button" aria-expanded="false"
          aria-controls="langMenu" aria-label="{label}">
    <svg class="lang__globe" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/>
      <path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/></svg>
    <span class="lang__now">{current.upper()}</span>
  </button>
  <ul id="langMenu" class="lang__menu" hidden>
{items}
  </ul>
</div>'''


MARK_A, MARK_B = "<!--i18n:head-->", "<!--i18n:switch-->"


def strip_marks(html):
    html = re.sub(re.escape(MARK_A) + r".*?" + re.escape(MARK_A), "", html, flags=re.S)
    html = re.sub(re.escape(MARK_B) + r".*?" + re.escape(MARK_B), "", html, flags=re.S)
    return html


def render(src, loc, tr, page, locales):
    html = strip_marks(src)
    if loc != "en":
        parts = []
        for kind, p in i18n_lib.tokenize(html):
            if kind == "text":
                lead, body, trail = p
                t = tr.get(i18n_lib.key_for(" ".join(body.split())))
                parts.append(lead + (t if t else body) + trail)
            elif kind == "attr":
                an, val = p
                t = tr.get(i18n_lib.key_for(" ".join(val.split())))
                parts.append(f'{an}="{t if t else val}"')
            else:
                parts.append(p)
        html = "".join(parts)
        html = localise_paths(html)

    lang, direction = loc, LOCALES[loc][1]
    html = re.sub(r"<html[^>]*>",
                  f'<html lang="{lang}"' + (f' dir="{direction}"' if direction == "rtl" else "") + ">",
                  html, count=1)

    head = MARK_A + "\n" + hreflang_block(page, locales, loc) + "\n" + MARK_A
    html = html.replace("</head>", head + "\n</head>", 1)

    sw = MARK_B + "\n" + switcher(page, loc, locales) + "\n" + MARK_B
    html = html.replace('<div class="nav__tools">', '<div class="nav__tools">\n' + sw, 1)
    return html


def main():
    en = json.loads((I18N / "en.json").read_text(encoding="utf-8"))
    have = ["en"] + [f.stem for f in sorted(I18N.glob("*.json")) if f.stem != "en"]
    want = sys.argv[1:] or have
    pages = [pathlib.Path(p).name for p in sorted(glob.glob(str(ROOT / "*.html")))]

    for loc in want:
        if loc not in LOCALES:
            print(f"  skip {loc}: not in LOCALES"); continue
        tr = {} if loc == "en" else json.loads((I18N / f"{loc}.json").read_text(encoding="utf-8"))
        outdir = ROOT if loc == "en" else ROOT / loc
        outdir.mkdir(exist_ok=True)
        n = 0
        for page in pages:
            src = (ROOT / page).read_text(encoding="utf-8")
            (outdir / page).write_text(render(src, loc, tr, page, have), encoding="utf-8")
            n += 1
        done = sum(1 for k in en if tr.get(k)) if loc != "en" else len(en)
        print(f"  {loc:<3} {n:>3} pages   {100*done//len(en):>3}% translated")


if __name__ == "__main__":
    main()
