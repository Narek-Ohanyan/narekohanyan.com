#!/usr/bin/env python3
"""
COP17 daily recap — builder and publisher.

The scheduled routine (or a person) writes ONE json file describing the day,
then runs:

    python3 _autoblog/cop17_blog.py check   _autoblog/posts/2026-10-19.json
    python3 _autoblog/cop17_blog.py build   _autoblog/posts/2026-10-19.json
    python3 _autoblog/cop17_blog.py card    --day 1 --date 2026-10-19 --out Media/web/blog/cop17-2026-10-19-card.jpg \
                                            --line "First plenary" --line "Finance on the table"

`check`  validates the content against the editorial rules and prints problems.
`build`  runs `check`, then writes blog-cop17-day-<date>.html, adds the card to
         blog.html, links the previous post forward, registers the page in
         seo.py and sitemap.xml, and re-stamps assets. It never pushes.
`card`   draws an original fallback cover (no licensing questions) from the
         site palette and the COP17 butterfly already in the repo.

Content format (see _autoblog/README.md for the editorial rules):

{
  "date": "2026-10-19", "day": 1,
  "title": "...", "excerpt": "...", "description": "...", "keywords": "...",
  "tags": ["COP17", "Biodiversity", "Policy", "Children & youth"],
  "cover": {"file": "Media/web/blog/....jpg", "alt": "...", "credit": "Photo: ..."},
  "lead": "html",
  "sections": [
     {"h2": "...", "blocks": [
        {"p": "html"},
        {"ul": ["html", "html"]},
        {"quote": "text"},
        {"figure": {"file": "...", "alt": "...", "caption": "...", "credit": "...", "side": true}}
     ]}
  ],
  "sources": [{"text": "Title (Outlet, date)", "url": "https://..."}]
}
"""
import argparse, html, json, pathlib, re, sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = "blog-leaders-summit.html"
ALLOWED_INLINE = {"a", "strong", "em", "cite", "br"}
MIN_WORDS, MAX_WORDS = 650, 1700
MAX_IMG_BYTES = 2_500_000


# ── helpers ────────────────────────────────────────────────────────────────
class _Tags(HTMLParser):
    def __init__(self):
        super().__init__(); self.tags = []; self.hrefs = []
    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)
        if tag == "a":
            self.hrefs.append(dict(attrs).get("href", ""))
    def handle_startendtag(self, tag, attrs):
        self.tags.append(tag)


def inline_ok(fragment):
    p = _Tags(); p.feed(fragment)
    bad = sorted({t for t in p.tags if t not in ALLOWED_INLINE})
    return bad, p.hrefs


def words(fragment):
    return len(re.sub(r"<[^>]+>", " ", html.unescape(fragment)).split())


def all_text(d):
    out = [d.get("lead", "")]
    for s in d.get("sections", []):
        out.append(s.get("h2", ""))
        for b in s.get("blocks", []):
            if "p" in b: out.append(b["p"])
            if "ul" in b: out += b["ul"]
            if "quote" in b: out.append(b["quote"])
    return out


def esc(s):
    return html.escape(s, quote=True)


def image_problems(spec, label):
    errs = []
    f = ROOT / spec.get("file", "")
    if not spec.get("file") or not f.is_file():
        errs.append(f"{label}: image file missing ({spec.get('file')})")
    elif f.stat().st_size > MAX_IMG_BYTES:
        errs.append(f"{label}: image is over {MAX_IMG_BYTES // 1000} KB")
    for k in ("alt", "credit"):
        if not str(spec.get(k, "")).strip():
            errs.append(f"{label}: '{k}' is required")
    return errs


# ── checks ─────────────────────────────────────────────────────────────────
def check(d):
    errs = []
    for k in ("date", "day", "title", "excerpt", "description", "keywords", "tags", "cover", "lead", "sections", "sources"):
        if k not in d: errs.append(f"missing field: {k}")
    if errs: return errs

    if not d.get("_any_date") and not re.fullmatch(r"2026-10-(19|2\d|3[01])", d["date"]):
        errs.append("date must be a COP17 day (2026-10-19 … 2026-10-30) or the closing recap on 2026-10-31")
    if (ROOT / f"blog-cop17-day-{d['date']}.html").exists() and not d.get("_force"):
        errs.append("a post for this date already exists")

    errs += image_problems(d["cover"], "cover")

    n = sum(words(t) for t in all_text(d))
    if n < MIN_WORDS: errs.append(f"too short: {n} words (min {MIN_WORDS})")
    if n > MAX_WORDS: errs.append(f"too long: {n} words (max {MAX_WORDS})")

    headings = " | ".join(s.get("h2", "") for s in d["sections"]).lower()
    if not ("child" in headings and "youth" in headings):
        errs.append("a section whose heading mentions both 'child' and 'youth' is required")
    if len(d["sections"]) < 4: errs.append("at least 4 sections are required")

    if not any("ul" in b for s in d["sections"] for b in s.get("blocks", [])):
        errs.append("at least one bulleted list is required (bullets render as butterflies)")

    figures = [b["figure"] for s in d["sections"] for b in s.get("blocks", []) if "figure" in b]
    if not figures: errs.append("at least one in-body figure is required (besides the cover)")
    for i, f in enumerate(figures, 1):
        errs += image_problems(f, f"figure {i}")
        if not str(f.get("caption", "")).strip(): errs.append(f"figure {i}: 'caption' is required")

    if len(d["sources"]) < 3: errs.append("at least 3 sources are required")
    for s in d["sources"]:
        if not re.match(r"https://", s.get("url", "")): errs.append(f"source without https url: {s}")
        if not s.get("text", "").strip(): errs.append("source without text")
    if len({re.sub(r'^https://(www\.)?', '', s['url']).split('/')[0] for s in d["sources"]}) < 2:
        errs.append("sources must come from at least 2 different sites")

    for t in all_text(d):
        bad, hrefs = inline_ok(t)
        if bad: errs.append(f"disallowed tags {bad} in: {t[:60]}")
        for h in hrefs:
            if not (h.startswith("https://") or h in ("cop17/", "newsroom.html", "blog.html")):
                errs.append(f"link not allowed: {h}")
    # a post must not read like a press release written by an unattended robot
    joined = " ".join(all_text(d)).lower()
    for banned in ("as an ai", "i cannot", "lorem ipsum", "todo", "[citation", "placeholder"):
        if banned in joined: errs.append(f"contains '{banned}'")
    return errs


# ── build ──────────────────────────────────────────────────────────────────
def render_figure(f, side=False):
    cls = "fig fig--side" if side or f.get("side") else "fig"
    w, h = f.get("width"), f.get("height")
    dims = f' width="{w}" height="{h}"' if w and h else ""
    cap = f["caption"].strip()
    credit = f["credit"].strip()
    return (f'    <figure class="{cls}">\n'
            f'      <img src="{esc(f["file"])}"{dims} loading="lazy" decoding="async" alt="{esc(f["alt"])}">\n'
            f'      <figcaption>{cap} <span class="fig__credit">{esc(credit)}</span></figcaption>\n'
            f'    </figure>\n')


def render_section(s):
    out = [f'    <h2 class="art__h2">{esc(s["h2"])}</h2>\n']
    for b in s.get("blocks", []):
        if "p" in b: out.append(f'    <p>{b["p"]}</p>\n')
        elif "ul" in b:
            out.append("    <ul>\n" + "".join(f"      <li>{li}</li>\n" for li in b["ul"]) + "    </ul>\n")
        elif "quote" in b: out.append(f'    <blockquote class="pull"><p>{esc(b["quote"])}</p></blockquote>\n')
        elif "figure" in b: out.append(render_figure(b["figure"]))
    return "".join(out)


def day_label(day):
    return "Closing" if str(day).lower() == "closing" else f"Day {int(day)}"


def human_date(iso):
    y, m, d = map(int, iso.split("-"))
    return f"{d} {['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m]} {y}"


def latest_post_href():
    b = (ROOT / "blog.html").read_text(encoding="utf-8")
    m = re.search(r'<ul class="post-grid"[^>]*>\s*<li[^>]*>\s*<a class="post-card__link" href="([^"]+)"', b)
    return m.group(1) if m else None


def post_title(path):
    t = (ROOT / path).read_text(encoding="utf-8")
    m = re.search(r'<h1 class="art__title">(.*?)</h1>', t, re.S)
    return re.sub(r"\s+", " ", m.group(1)).strip() if m else path


def build(d):
    import importlib.util
    spec = importlib.util.spec_from_file_location("seo", ROOT / "seo.py")
    seo = importlib.util.module_from_spec(spec); spec.loader.exec_module(seo)

    page = f"blog-cop17-day-{d['date']}.html"
    plain_title = html.unescape(d["title"])
    mins = max(3, round(sum(words(t) for t in all_text(d)) / 200))
    seo.P[page] = (plain_title + " — Blog", d["description"], d["keywords"], "default.jpg", "0.7", "monthly", "article")

    base = (ROOT / TEMPLATE).read_text(encoding="utf-8")
    head_a = base.index("<!--seo-->"); head_b = base.index("<!--/seo-->") + len("<!--/seo-->")
    main_a = base.index('<main id="main"'); main_b = base.index("</main>") + len("</main>")
    head = base[:head_a] + seo.block(page) + base[head_b:main_a]
    head = re.sub(r"<title>.*?</title>", f"<title>{esc(plain_title)} — Blog</title>", head, count=1, flags=re.S)
    tail = base[main_b:]

    prev = latest_post_href()
    pn_inner = "<span></span><span></span>"
    if prev:
        pn_inner = ('<span></span>'
                    f'<a class="pn__side pn__side--next" href="{prev}"><span class="pn__dir">Older &rarr;</span>'
                    f'<span class="pn__name">{post_title(prev)}</span></a>')
    tags = "".join(f'<span class="tag">{esc(t)}</span> ' for t in d["tags"]).strip()
    cv = d["cover"]
    cover_credit = f'\n    <p class="art__credit">{esc(cv["credit"])}</p>'
    main = f'''<main id="main" class="content article-pg article-pg--wide">

  <header class="art__head">
    <p class="crumb"><a href="blog.html">Blog</a> <span aria-hidden="true">/</span> COP17 &middot; {day_label(d["day"])}</p>
    <h1 class="art__title">{esc(plain_title)}</h1>
    <p class="art__meta">
      <time datetime="{d["date"]}">{human_date(d["date"])}</time>
      <span class="art__dot" aria-hidden="true">&middot;</span>
      <span>{mins} min read</span>
    </p>
    <p class="art__tags">{tags}</p>
  </header>

  <div class="art__cover" data-reveal>
    <img src="{esc(cv["file"])}"
         width="{cv.get("width", 1600)}" height="{cv.get("height", 900)}" decoding="async" alt="{esc(cv["alt"])}">{cover_credit}
  </div>

  <article class="art">
    <p class="art__lead">{d["lead"]}</p>

''' + "\n".join(render_section(s) for s in d["sections"]) + f'''
    <p>Follow where I am each day on <a href="cop17/">my COP17 schedule</a>, and the daily news in the <a href="newsroom.html">Newsroom</a>.</p>

    <section class="refs" aria-labelledby="refs-h">
      <h2 id="refs-h" class="refs__h">Sources</h2>
      <ol class="refs__list">
''' + "".join(f'      <li>{esc(s["text"])}. <a href="{esc(s["url"])}" target="_blank" rel="noopener noreferrer">{esc(s["url"])}</a></li>\n' for s in d["sources"]) + f'''      </ol>
    </section>
  </article>

  <nav class="pn" aria-label="More posts">{pn_inner}</nav>

  <footer class="footer">
    <p>&copy; 2026 Narek Ohanyan</p>
    <p>Between science and activism</p>
  </footer>
</main>'''
    (ROOT / page).write_text(head + main + tail, encoding="utf-8")

    # the previous newest post now links forward
    if prev:
        pp = ROOT / prev
        t = pp.read_text(encoding="utf-8")
        newer = (f'<a class="pn__side pn__side--prev" href="{page}"><span class="pn__dir">&larr; Newer</span>'
                 f'<span class="pn__name">{esc(plain_title.split(":")[0])}</span></a>')
        m = re.search(r'(<nav class="pn" aria-label="More posts">)<span></span>', t)
        if m:
            pp.write_text(t.replace(m.group(0), m.group(1) + newer, 1), encoding="utf-8")

    # blog index: card at the top + any new tag chips
    bp = ROOT / "blog.html"
    b = bp.read_text(encoding="utf-8")
    card = f'''      <li class="post-card" data-reveal data-tags="{"|".join(esc(t) for t in d["tags"])}">
        <a class="post-card__link" href="{page}">
          <span class="post-card__shot">
            <img src="{esc(cv["file"])}"
                 width="{cv.get("width", 1600)}" height="{cv.get("height", 900)}" loading="lazy" decoding="async" alt="">
            <span class="post-card__glow" aria-hidden="true"></span>
          </span>
          <span class="post-card__body">
            <span class="post-card__meta">
              <time datetime="{d["date"]}">{human_date(d["date"])}</time>
              <span class="post-card__dot" aria-hidden="true">&middot;</span>
              <span>{mins} min read</span>
            </span>
            <h2 class="post-card__title">{esc(plain_title)}</h2>
            <p class="post-card__excerpt">{esc(d["excerpt"])}</p>
            <span class="post-card__tags" aria-hidden="true">
              {" ".join(f'<span class="tag">{esc(t)}</span>' for t in d["tags"])}
            </span>
            <span class="post-card__cta">Read more <span aria-hidden="true">&#10142;</span></span>
          </span>
        </a>
      </li>
'''
    anchor = '  <ul class="post-grid" id="postGrid" role="list">\n'
    b = b.replace(anchor, anchor + card, 1)
    chips = re.findall(r'<button class="chip" type="button" data-tag="([^"]+)"', b)
    allc = sorted(set(chips) | {esc(t) for t in d["tags"]}, key=str.lower)
    a = b.index('        <button class="chip" type="button" data-tag="')
    e = b.index("    </div>", a)
    b = b[:a] + "".join(f'        <button class="chip" type="button" data-tag="{c}" aria-pressed="false">{c}</button>\n' for c in allc) + b[e:]
    bp.write_text(b, encoding="utf-8")

    # seo.py table + sitemap.xml
    sp = ROOT / "seo.py"
    s = sp.read_text(encoding="utf-8")
    entry = (f' "{page}": (\n  {json.dumps(plain_title + " — Blog", ensure_ascii=False)},\n'
             f'  {json.dumps(d["description"], ensure_ascii=False)},\n'
             f'  {json.dumps(d["keywords"], ensure_ascii=False)},\n'
             f'  "default.jpg", "0.7", "monthly", "article"),\n\n')
    s = s.replace('"contact.html": (', entry.lstrip("\n") + '"contact.html": (', 1)
    sp.write_text(s, encoding="utf-8")
    xp = ROOT / "sitemap.xml"
    x = xp.read_text(encoding="utf-8")
    url = (f'  <url>\n    <loc>https://narekohanyan.com/{page}</loc>\n    <lastmod>{d["date"]}</lastmod>\n'
           f'    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n')
    x = x.replace("</urlset>", url + "</urlset>")
    xp.write_text(x, encoding="utf-8")

    import subprocess
    subprocess.run([sys.executable, "stamp.py"], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    # stamp.py also touches the ANTAR-owned page; leave that file alone
    subprocess.run(["git", "checkout", "--", "antar/index.html"], cwd=ROOT, stderr=subprocess.DEVNULL)
    return page


# ── fallback cover ─────────────────────────────────────────────────────────
def card(day, date, lines, out):
    try:
        from PIL import Image, ImageDraw, ImageFilter, ImageFont
    except Exception:
        # A system Pillow built for another Python can import-fail; reinstall for THIS interpreter.
        subprocess = __import__("subprocess")
        subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--ignore-installed", "pillow"], check=True)
        import importlib
        for name in [m for m in sys.modules if m == 'PIL' or m.startswith('PIL.')]:
            del sys.modules[name]          # drop the half-imported broken copy
        importlib.invalidate_caches()
        from PIL import Image, ImageDraw, ImageFilter, ImageFont
    W, H = 1600, 900
    bg = Image.new("RGB", (W, H)); px = bg.load()
    for y in range(H):
        for x in range(W):
            t = x / W * .6 + y / H * .4
            px[x, y] = (int(27 + (14 - 27) * t), int(62 + (80 - 62) * t), int(38 + (78 - 38) * t))
    bg = bg.convert("RGBA")
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(glow)
    for cx, cy, r, col in [(1300, 220, 420, (10, 181, 204, 120)), (1150, 780, 380, (120, 166, 26, 110)), (250, 160, 300, (240, 117, 69, 70))]:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)
    bg.alpha_composite(glow.filter(ImageFilter.GaussianBlur(120)))
    bf = Image.open(ROOT / "Media/web/cop17/butterfly.png").convert("RGBA")
    big = bf.resize((820, round(820 * bf.height / bf.width)), Image.LANCZOS)
    big.putalpha(big.getchannel("A").point(lambda v: int(v * .9)))
    bg.alpha_composite(big, (W - 900, 130))

    def font(size, bold=True):
        for p in ["/System/Library/Fonts/Supplemental/Georgia Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
                  "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"]:
            try: return ImageFont.truetype(p, size)
            except OSError: continue
        return ImageFont.load_default()
    dr = ImageDraw.Draw(bg)
    dr.text((90, 120), "COP17 · " + day_label(day).upper(), font=font(34), fill=(245, 236, 154, 255))
    dr.text((90, 180), human_date(date), font=font(64), fill=(255, 255, 255, 255))
    y = 360
    for ln in lines[:4]:
        dr.ellipse((90, y + 16, 106, y + 32), fill=(245, 236, 154, 255))
        dr.text((130, y), ln, font=font(44), fill=(255, 255, 255, 255)); y += 90
    pathlib.Path(out).parent.mkdir(parents=True, exist_ok=True)
    bg.convert("RGB").save(out, "JPEG", quality=86, optimize=True, progressive=True)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("check", "build"):
        p = sub.add_parser(name); p.add_argument("json"); p.add_argument("--force", action="store_true")
        p.add_argument("--any-date", action="store_true", help="dry runs only")
    c = sub.add_parser("card")
    c.add_argument("--day", required=True); c.add_argument("--date", required=True)
    c.add_argument("--out", required=True); c.add_argument("--line", action="append", default=[])
    a = ap.parse_args()

    if a.cmd == "card":
        card(a.day, a.date, a.line, a.out); print("wrote", a.out); return
    d = json.loads(pathlib.Path(a.json).read_text(encoding="utf-8"))
    if a.force: d["_force"] = True
    if a.any_date: d["_any_date"] = True
    errs = check(d)
    if errs:
        print("PROBLEMS:"); [print(" -", e) for e in errs]; sys.exit(1)
    if a.cmd == "check":
        print("ok:", sum(words(t) for t in all_text(d)), "words"); return
    print("built", build(d))


if __name__ == "__main__":
    main()
