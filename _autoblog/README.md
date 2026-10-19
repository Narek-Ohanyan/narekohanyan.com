# COP17 daily recap — editorial rules

The scheduled cloud routine reads this file every run. Edit it to change how
the posts are written; no change to the routine itself is needed.

## When it publishes

- One post per COP17 day, **19–30 October 2026**, written in the evening
  (Asia/Yerevan, UTC+4) about **that Yerevan calendar day**.
- One closing recap on **31 October** (final outcomes, once the plenary has ended).
- **Do not publish** if any of these is true — end the run and say why:
  - `_autoblog/PAUSE` exists (the owner's kill switch: create the file to pause everything)
  - a post for the date already exists (`blog-cop17-day-YYYY-MM-DD.html`)
  - fewer than 3 usable sources could be read, from at least 2 different sites
  - the date is outside 19–31 October 2026

## Notifications and network problems

- Always finish with a push notification (PushNotification tool): on success, the
  post title and live URL; on any skip or failure, the one-line reason.
- The cloud sandbox may block outbound requests (WebFetch DNS errors, or `403` on
  curl CONNECT). If you cannot read full articles from at least 3 usable sources on at
  least 2 sites, **do not publish** on search snippets alone. Notify the owner that the
  environment's network access must be opened (claude.ai/code → environment settings →
  network access: Full, or allow the news domains and Wikimedia), then stop.

## What goes in the post

Voice: Narek Ohanyan's blog. Plain language a non-specialist can follow (short
sentences; explain every acronym on first use). Warm, precise, never promotional.

**Focus: the high-level negotiations.** The core of every post is what happened in the
plenary and the working groups: openings and elections, agenda and organisation of work,
statements by the President, the Executive Secretary and the regional and interest groups
(Africa Group, GRULAC, Asia-Pacific, EU, JUSCANZ, ASEAN, Arab Group, SIDS, LMMC, Indigenous
peoples, women, youth, business, NGOs), their positions, where they agree and clash, what
was decided, blocked or postponed, and how the negotiations are going. Side events, pavilions
and photo-ops get at most a short paragraph. Name each group and what it asked for.
Use the UN Transcripts record of plenaries (https://transcripts.un.org, unofficial automatic
transcript: say so, and treat numbers and names with care) and the Earth Negotiations
Bulletin as the main sources for this.

Required sections (use these headings or close variants, at least 4 in total):

1. **The day in negotiations** — what the plenary, contact groups and subsidiary bodies
   did; which agenda items moved (global review of progress, resource mobilisation,
   digital sequence information, etc.); what was agreed, blocked or postponed.
2. **Positions and stakeholders** — group-by-group positions (a butterfly-bullet list works
   well) and the statements of Indigenous peoples, women, youth, business and NGOs; then,
   briefly, other developments worth marking (announcements, pledges, notable side events).
3. **Numbers to know** (when there are figures) — a butterfly-bullet list.
4. **Through a child and youth lens** (always, heading must contain "child" and "youth")
   — what today means for children and young people: youth and child participation in
   decisions, intergenerational language in the text, UNICEF / GYBN / youth caucus
   statements, children's rights. Narek is a member of the UNICEF Global Delegation and
   advocates for the inclusion of children and youth in the CBD process; frame this
   section from that standpoint. If nothing child- or youth-specific happened, say so
   plainly and explain which decisions matter for them and what to watch.
5. **On my calendar today** (only if `cop17-data.js` lists events for that date) — list
   the scheduled engagements in plain words (title, time, place or "to be confirmed"),
   and mention the Armenia Tree Project booth hours from `booth.slots` for that date.
   Note that booth co-hosting does not block the calendar: Narek is open to speaking requests.
   Phrase as *scheduled*; never claim what was said or achieved there.
6. **What to watch tomorrow** — 2–4 items.

Always end the body with the pointer line the builder adds (my COP17 schedule + Newsroom).

Length: 650–1,700 words. Title pattern: `Day N in Yerevan: <specific headline>`.
Tags: always `COP17`, `Biodiversity`, `Children & youth`; add `Policy`, `Finance`,
`Science` etc. when they fit.

## Facts and citations (non-negotiable)

- Every claim, number and quote must come from a source you actually read this run.
  Never fill gaps from memory or by guessing. If something is uncertain or sources
  disagree, say so or leave it out.
- Attribute numbers and statements to a named person, body or outlet in the text.
- Paraphrase. At most one short direct quote (under 15 words) per post, in quotation
  marks, with attribution.
- Do not describe Narek's personal experiences, conversations or opinions beyond what
  this file and `cop17-data.js` support. The child-and-youth lens may state his advocacy
  focus (above) but must not invent anything he said or did.
- Sources list: at least 3 entries, at least 2 different websites, each with title,
  outlet, date and `https://` URL.
- Preferred sources, in this order: official CBD / COP17 pages (cbd.int,
  cop17yerevan.am), the Earth Negotiations Bulletin (enb.iisd.org) daily reports,
  UN News, UNICEF and GYBN statements, national news agencies (Armenpress, Public Radio
  of Armenia), regional outlets (JAMnews, CivilNet), the European Commission and other
  governments' press releases. Treat social media as a pointer only, never as the sole source.

## Pictures

Every post needs a **cover** and **at least one in-body figure**, each with
descriptive `alt` text, a caption, and a `credit`.

Order of preference:

1. **Photos the owner provided** in `_autoblog/inbox/YYYY-MM-DD/` (any number of
   images; an optional `credits.txt` with one line per file: `filename | caption | credit`).
   Copy them to `Media/web/blog/` (resize to at most 1600 px wide, JPEG quality 85,
   under 2.5 MB) and use them first.
2. **The official COP17 photo gallery on Flickr** — the owner has asked for these to be
   used. Account "CBD COP17 Yerevan Armenia | Official Photo Gallery",
   https://www.flickr.com/photos/cop17armenia/ (account id `205035723@N07`).
   The newest 20 uploads are in the public feed
   `https://www.flickr.com/services/feeds/photos_public.gne?id=205035723@N07&format=atom`;
   photo titles start with the date (`2026.10.17_GYBN_Youth_Summit_Opening_Photo-81`), so
   pick the photos for the day being covered. In the feed, `..._m.jpg` is the small size:
   try the same URL with `_k.jpg`, then `_h.jpg`, then `_b.jpg` (largest that works).
   Their Flickr licence is "All rights reserved", so: use at most 3 photos per post,
   never alter them beyond resizing/cropping, always credit exactly
   `Photo: CBD COP17 Yerevan Armenia | Official Photo Gallery, via Flickr`, and put the
   photo page URL in the sources list. Prefer photos that show people and moments over
   close-ups of individuals unless the post is about them. Do not use a photo if the page
   shows it is private, or if you cannot download it.
3. **Openly licensed images** — Wikimedia Commons (public domain, CC0, CC BY, CC BY-SA),
   or Flickr/other images explicitly under CC BY / CC BY-SA, ideally of COP17 or the
   topic. Record author, licence and source URL in the `credit`
   (e.g. `Photo: Jane Doe, CC BY 4.0, via Wikimedia Commons`). Never hot-link; download,
   resize and store under `Media/web/blog/cop17-YYYY-MM-DD-*.jpg`.
4. **The fallback card** — `python3 _autoblog/cop17_blog.py card --day N --date YYYY-MM-DD
   --out Media/web/blog/cop17-YYYY-MM-DD-card.jpg --line "..." --line "..."` draws an
   original cover from the site palette and the COP17 butterfly. Credit:
   `Illustration: Narek Ohanyan, using the COP17 butterfly symbol.`

Apart from the official gallery above, never use an image whose licence you cannot confirm. Never use news-agency or UN press
photos unless the page states a licence that allows reuse. Never use the COP17 logo
lock-ups; the butterfly symbol is used only through the card.

## Bullets

All bulleted lists are `ul` blocks in the JSON — the site draws them as animated COP17
butterflies automatically. Never use `ol` or hand-made bullets in the body.

## How to publish

1. Write `_autoblog/posts/YYYY-MM-DD.json` (format in `cop17_blog.py`).
2. `python3 _autoblog/cop17_blog.py check _autoblog/posts/YYYY-MM-DD.json` until it
   prints `ok`.
3. `python3 _autoblog/cop17_blog.py build _autoblog/posts/YYYY-MM-DD.json`.
4. Read the generated page once for sense and typos.
5. Commit only these paths: the new `blog-cop17-day-*.html`, `blog.html`, the previous
   newest post, `seo.py`, `sitemap.xml`, the stamped pages, `Media/web/blog/…`,
   `_autoblog/posts/…`. **Never** touch `antar/` (another publisher owns it).
6. `git pull --rebase`, then push to `main`. The host deploys `main` within seconds.
7. Verify `https://narekohanyan.com/blog-cop17-day-YYYY-MM-DD.html` returns 200.

## Practical notes (from test runs)

- Wikimedia rate-limits shared cloud IPs (HTTP 429). Send a descriptive User-Agent
  (`narekohanyan-autoblog/1.0 (nar.ohanyan.eco@gmail.com)`), wait and retry once, and if it still
  fails use the official Flickr gallery or the fallback card. Do not loop on 429s.
- FIRST STEP of every run: `python3 -m pip install --quiet --ignore-installed pillow` (the cloud image's
  system Pillow is broken for its Python; the reinstall lasts only for that run).
- enb.iisd.org answers 403 to automated reads; use the UN Transcripts record, CBD/COP17 pages and news
  agencies instead. en.armradio.am may show a bot-check page; use WebSearch snippets only as a pointer.
- Flickr photo files: `https://live.staticflickr.com/65535/<id>_<secret>_b.jpg` (1024 px) works;
  the larger sizes (`_k`, `_h`) return 410.
