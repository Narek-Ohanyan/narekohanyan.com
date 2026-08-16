#!/usr/bin/env python3
"""
Stamp SEO metadata into every page from one table.

    python3 seo.py            rewrite <head> metadata + sitemap.xml + robots.txt

Everything lives here so eighteen pages cannot drift apart. The block is
delimited by markers and replaced wholesale on each run, so running it twice
is the same as running it once.

A note on `keywords`: Google has ignored the meta keywords tag since 2009.
It is emitted because it costs nothing and a few smaller engines still read
it — but the work that actually ranks is in the titles, descriptions,
headings and structured data below.
"""
import pathlib, re, datetime

SITE   = "https://narekohanyan.com"
NAME   = "Narek Ohanyan"
BRAND  = "Narek Ohanyan"
LOCALE = "en_US"
TODAY  = datetime.date.today().isoformat()

A, B = "<!--seo-->", "<!--/seo-->"

# page: (title, description, keywords, og image, priority, changefreq, type)
P = {
"index.html": (
 f"{NAME} — Climate & Environmental Researcher",
 "Climate and environmental researcher, policy advocate and certified trainer. Author of "
 "The Overshoot and contributor to Armenia's Law on Climate.",
 "Narek Ohanyan, climate researcher Armenia, environmental scientist, climate policy, "
 "climate education, biodiversity, COP17 Armenia, environmental researcher",
 "default.jpg", "1.0", "monthly", "website"),

"about.html": (
 f"About {NAME} — A Decade in Climate & Environment",
 "From an eco-club in Ararat at eleven to the UNFCCC, WSL and COP17 — the biography, "
 f"timeline, education and 18 certifications of {NAME}.",
 "Narek Ohanyan biography, climate scientist Armenia, environmental educator, "
 "American University of Armenia, climate certifications, UNFCCC youth",
 "default.jpg", "0.9", "monthly", "profile"),

"research.html": (
 "Research — Climate Science & Earth System Dynamics",
 "Cloud-native CMIP6 pipelines, forest vulnerability modelling at WSL and the AUA Acopian "
 "Center, and the Armenia Reforestation Predictive Framework.",
 "climate research, CMIP6, Earth system dynamics, forest resilience modelling, "
 "vapor pressure deficit, machine learning climate, Pangeo, xarray, GEDI, Armenia reforestation",
 "research.jpg", "0.9", "monthly", "website"),

"policy.html": (
 "Policy & Leadership — Climate Governance & Diplomacy",
 "Authoring Article 5 of Armenia's Law on Climate, leading LCOY Armenia, serving as UN Youth "
 "Climate Champion and COP27 delegate.",
 "climate policy Armenia, LCOY Armenia, UNFCCC COP27, YOUNGO, GYBN, climate diplomacy, "
 "intergenerational climate justice, National Youth Statement, climate governance",
 "default.jpg", "0.8", "monthly", "website"),

"education.html": (
 "Environmental Education — Climate Curricula & Training",
 "Bilingual climate curricula, serious-game simulations, policy labs, Armenia's first "
 "sign-language environmental course, and 100+ webinars.",
 "environmental education Armenia, climate literacy, non-formal education, training of trainers, "
 "climate curriculum, sign language education, citizen science training, gamified learning",
 "academy.jpg", "0.8", "monthly", "website"),

"projects.html": (
 "Project Leadership — Environmental Programme Management",
 "COP17 biodiversity ambassadors, regional micro-grant adaptation programmes, citizen science "
 "field operations and education technology.",
 "environmental project management, climate project lead, COP17 biodiversity, micro-grant programme, "
 "citizen science operations, USAID CeLoG, Climapolis, project management Armenia",
 "default.jpg", "0.8", "monthly", "website"),

"resources.html": (
 "Resource Hub — Free Climate Toolkits, Manuals & Games",
 "Free to download and teach with: the EPR Compass manual, the OTTERS water-quality toolkit, "
 "two board games, and the Online Green Academy.",
 "climate education resources, EPR compass, extended producer responsibility, OTTERS toolkit, "
 "water quality monitoring, climate board game, free climate curriculum, circular economy manual",
 "academy.jpg", "0.8", "weekly", "website"),

"publications.html": (
 "Publications — Books & Environmental Writing",
 "The Overshoot: Life After the 1.5°C Limit, plus published environmental science writing and "
 "features for UNICEF and international outlets.",
 "The Overshoot book, climate book, 1.5C limit, planetary boundaries, environmental writing, "
 "Narek Ohanyan publications",
 "book.jpg", "0.8", "monthly", "website"),

"the-overshoot.html": (
 "The Overshoot: Life After the 1.5°C Limit — Book",
 "A monograph on the cascading effects of breaching planetary boundaries, bridging physical "
 f"climate reality with adaptation. By {NAME}.",
 "The Overshoot, climate change book, 1.5 degrees, planetary boundaries, climate adaptation, "
 "overshoot scenarios, climate monograph",
 "book.jpg", "0.8", "monthly", "book"),

"academy.html": (
 "Online Green Academy — Free Climate Course in Armenian",
 "Free accessible climate education: a 15-part video series with Armenian sign language, "
 "dual-language subtitles and a certificate.",
 "free climate course, Armenian climate education, sustainability course, accessible education, "
 "sign language course, climate certificate, online green academy",
 "academy.jpg", "0.9", "weekly", "website"),

"course.html": (
 "Introduction to Sustainability, Environment & Climate — Course",
 "Four modules on systems thinking, climate science, green practice and leadership. Video "
 "lessons, quizzes and a certificate. Free and accessible.",
 "sustainability course, climate science course, systems thinking, circular economy course, "
 "green careers, free online course Armenia",
 "academy.jpg", "0.7", "weekly", "website"),

"media.html": (
 "Media & News — Press, Interviews & Broadcast",
 f"Television, radio, print and online coverage of {NAME}'s climate research, policy advocacy "
 "and youth leadership across Armenian and international outlets.",
 "Narek Ohanyan press, climate interviews, environmental media Armenia, climate news, "
 "youth climate spokesperson",
 "default.jpg", "0.7", "weekly", "website"),

"newsroom.html": (
 "Newsroom — Field Notes & Dispatches",
 "First-person dispatches written from the room it happened in: summits, field expeditions and "
 "policy negotiations.",
 "climate newsroom, field notes, climate dispatches, COP reporting, environmental journalism",
 "default.jpg", "0.6", "weekly", "website"),

"news-youth-day.html": (
 "International Youth Day — Newsroom",
 "A dispatch from International Youth Day: young people, climate policy and what changes when "
 "youth are treated as producers of policy rather than an audience for it.",
 "International Youth Day, youth climate action, youth policy Armenia, climate advocacy",
 "default.jpg", "0.5", "monthly", "article"),

"blog.html": (
 "Blog — Essays on Climate, Science & Action",
 "Long-form essays on climate science, environmental policy and the distance between evidence "
 f"and action, written by {NAME}.",
 "climate blog, environmental essays, climate science writing, climate communication",
 "default.jpg", "0.7", "weekly", "website"),

"blog-small-talk.html": (
 "The End of Small Talk — Blog",
 "Why the weather stopped being small talk, and what it means when the safest conversational "
 "filler becomes the most political subject in the room.",
 "climate conversation, weather small talk, climate communication, climate psychology",
 "default.jpg", "0.6", "monthly", "article"),

"blog-four-proofs.html": (
 "Four Proofs the Climate Is Changing — Blog",
 "Four independent lines of evidence for a warming planet, each measurable without trusting a "
 "single model — and what each one rules out.",
 "climate evidence, proof of climate change, global warming evidence, climate data, "
 "climate science explained",
 "default.jpg", "0.6", "monthly", "article"),

"contact.html": (
 f"Contact — Work With {NAME}",
 "Research partnerships, expert consultation, speaking engagements, workshops and training "
 "collaborations. Book a time directly or send a brief.",
 "contact Narek Ohanyan, climate consultant, environmental speaker, book a workshop, "
 "climate training collaboration, research partnership",
 "default.jpg", "0.7", "monthly", "website"),
}

PERSON = {
 "@context": "https://schema.org", "@type": "Person",
 "name": NAME, "url": SITE + "/",
 "image": SITE + "/Media/web/og/default.jpg",
 "jobTitle": "Climate & Environmental Researcher",
 "description": ("Interdisciplinary environmental researcher and climate youth leader "
                 "working across computational ecological modelling and climate policy."),
 "knowsAbout": ["Climate Change", "Earth System Dynamics", "Environmental Policy",
                "Biodiversity Conservation", "Climate Education", "Citizen Science",
                "Circular Economy", "Forest Resilience Modelling"],
 "alumniOf": {"@type": "CollegeOrUniversity", "name": "American University of Armenia"},
 "worksFor": {"@type": "Organization", "name": "AUA Acopian Center for the Environment"},
 "nationality": {"@type": "Country", "name": "Armenia"},
 "sameAs": ["https://github.com/Narek-Ohanyan"],
}


def jsonld(obj, indent=0):
    import json
    return json.dumps(obj, ensure_ascii=False, indent=1)


def block(page):
    title, desc, kw, og, _pri, _cf, otype = P[page]
    url = SITE + "/" + ("" if page == "index.html" else page)
    img = f"{SITE}/Media/web/og/{og}"
    parts = [A,
      f'<meta name="description" content="{desc}">',
      f'<meta name="keywords" content="{kw}">',
      f'<meta name="author" content="{NAME}">',
      '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
      f'<link rel="canonical" href="{url}">',
      '',
      f'<meta property="og:type" content="{otype}">',
      f'<meta property="og:site_name" content="{BRAND}">',
      f'<meta property="og:locale" content="{LOCALE}">',
      f'<meta property="og:url" content="{url}">',
      f'<meta property="og:title" content="{title}">',
      f'<meta property="og:description" content="{desc}">',
      f'<meta property="og:image" content="{img}">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      f'<meta property="og:image:alt" content="{NAME} — climate and environmental researcher">',
      '',
      '<meta name="twitter:card" content="summary_large_image">',
      f'<meta name="twitter:title" content="{title}">',
      f'<meta name="twitter:description" content="{desc}">',
      f'<meta name="twitter:image" content="{img}">',
    ]
    if page == "index.html":
        parts += ['', '<script type="application/ld+json">', jsonld(PERSON), '</script>']
    parts.append(B)
    return "\n".join(parts)


def main():
    root = pathlib.Path(__file__).parent
    done = 0
    for page in P:
        f = root / page
        if not f.exists():
            print(f"  skip {page} (missing)"); continue
        h = f.read_text(encoding="utf-8")

        h = re.sub(re.escape(A) + r".*?" + re.escape(B) + r"\n?", "", h, flags=re.S)
        h = re.sub(r'[ \t]*<meta name="description"[^>]*>\n?', "", h)
        h = re.sub(r'[ \t]*<meta name="keywords"[^>]*>\n?', "", h)

        title = P[page][0]
        h = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", h, count=1, flags=re.S)
        h = h.replace("</head>", block(page) + "\n</head>", 1)
        f.write_text(h, encoding="utf-8")
        done += 1

    urls = "\n".join(
        f'  <url>\n    <loc>{SITE}/{"" if p=="index.html" else p}</loc>\n'
        f'    <lastmod>{TODAY}</lastmod>\n    <changefreq>{P[p][5]}</changefreq>\n'
        f'    <priority>{P[p][4]}</priority>\n  </url>'
        for p in P if (root / p).exists())
    (root / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + urls + "\n</urlset>\n", encoding="utf-8")

    (root / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n\n"
        "# Generated pages and working files\nDisallow: /i18n/\n\n"
        f"Sitemap: {SITE}/sitemap.xml\n", encoding="utf-8")

    print(f"  {done} pages stamped")
    print(f"  sitemap.xml — {len([p for p in P if (root/p).exists()])} URLs")
    print("  robots.txt")


if __name__ == "__main__":
    main()
