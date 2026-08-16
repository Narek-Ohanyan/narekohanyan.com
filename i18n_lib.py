"""
Shared tokenizer for the localisation pipeline.

The English .html files in the project root are the single source of truth.
This splits a page into an ordered list of tokens, marking which ones carry
human-readable text, so the build step can substitute translations and
reassemble the file byte-for-byte otherwise.

No third-party parser: these pages are hand-written and well-formed, and a
tokenizer we control is easier to reason about than a DOM round-trip that
might silently normalise markup we care about.
"""
import re, hashlib

# Never translate what is inside these — code, styling and icon geometry.
OPAQUE = {"script", "style", "svg"}

# Attributes that reach a human: tooltips, alt text, accessible names.
ATTRS = ("alt", "title", "aria-label", "placeholder", "content")

TAG = re.compile(r"<[^>]*>", re.S)
HAS_LETTER = re.compile(r"[A-Za-z]")
ATTR_RE = re.compile(r'\b(%s)="([^"]*)"' % "|".join(ATTRS))
NAME_RE = re.compile(r"</?\s*([A-Za-z][\w-]*)")


def key_for(text):
    """Stable id from the English string itself, so a phrase repeated across
    pages (nav labels, the footer) is translated exactly once."""
    return hashlib.sha1(" ".join(text.split()).encode()).hexdigest()[:12]


def tokenize(html):
    """-> [(kind, payload)] where kind is 'raw', 'text' or 'attr'.

    'text'  payload = (leading_ws, content, trailing_ws)
    'attr'  payload = (before, attr_name, value, after)  within one tag
    """
    out, pos, stack = [], 0, []

    for m in TAG.finditer(html):
        if m.start() > pos:
            chunk = html[pos:m.start()]
            opaque = any(t in OPAQUE for t in stack)
            if not opaque and HAS_LETTER.search(chunk):
                lead = chunk[: len(chunk) - len(chunk.lstrip())]
                trail = chunk[len(chunk.rstrip()):]
                out.append(("text", (lead, chunk.strip(), trail)))
            else:
                out.append(("raw", chunk))
        tag = m.group(0)

        nm = NAME_RE.match(tag)
        name = nm.group(1).lower() if nm else ""
        closing = tag.startswith("</")
        selfclose = tag.endswith("/>")

        # meta description is translatable; other meta content is not
        translatable_tag = not any(t in OPAQUE for t in stack)
        if name == "meta":
            translatable_tag = ('name="description"' in tag
                                or 'property="og:description"' in tag
                                or 'property="og:title"' in tag)

        if translatable_tag and ATTR_RE.search(tag):
            last, parts = 0, []
            for a in ATTR_RE.finditer(tag):
                val = a.group(2)
                if not HAS_LETTER.search(val) or (a.group(1) == "content" and name != "meta"):
                    continue
                parts.append((tag[last:a.start()], a.group(1), val))
                last = a.end()
            if parts:
                for before, an, val in parts:
                    out.append(("raw", before))
                    out.append(("attr", (an, val)))
                out.append(("raw", tag[last:]))
            else:
                out.append(("raw", tag))
        else:
            out.append(("raw", tag))

        if not closing and not selfclose and name and name not in (
            "br", "img", "input", "meta", "link", "hr", "source", "use", "path", "circle", "rect"):
            stack.append(name)
        elif closing and stack and stack[-1] == name:
            stack.pop()

        pos = m.end()

    if pos < len(html):
        out.append(("raw", html[pos:]))
    return out


def strings(html):
    """Ordered unique (key, english) pairs for one page."""
    seen, res = set(), []
    for kind, p in tokenize(html):
        if kind == "text":
            s = " ".join(p[1].split())
        elif kind == "attr":
            s = " ".join(p[1].split())
        else:
            continue
        k = key_for(s)
        if k not in seen:
            seen.add(k)
            res.append((k, s))
    return res
