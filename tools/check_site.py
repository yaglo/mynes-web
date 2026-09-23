#!/usr/bin/env python3
"""Verify a built Jekyll site.

Walks every HTML file under the build directory and checks that each internal
link, image, video source, poster, stylesheet and script resolves to a file in
the build, that fragment links point at an existing element id, that internal
absolute paths carry the configured baseurl, and that no unrendered Liquid or
Liquid error text is left in the output. In <main> it also fails a section
heading (h2 or h3) with nothing under it before the next heading or the end
of the page, and an HTML comment that starts with TODO.

It also checks that every page URL of the site before the restructure, listed
in tools/old-urls.txt, still answers: with a page, or with a redirect page
whose target is a page of the build (or an external URL). A redirect page is
one with <meta http-equiv="refresh">; redirects to redirects are refused.

Usage: python3 tools/check_site.py _site /mynes-web [--old-urls FILE]
Exit status is 1 when anything fails.
"""
import html.parser
import os
import re
import sys
import urllib.parse

SKIP_SCHEMES = ("http:", "https:", "mailto:", "data:", "javascript:", "tel:")
CHECK_ATTRS = {
    "a": ("href",),
    "img": ("src",),
    "video": ("poster", "src"),
    "source": ("src",),
    "link": ("href",),
    "script": ("src",),
}
DEFAULT_OLD_URLS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "old-urls.txt")


class Collector(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.ids = set()
        self.refresh = None

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if "id" in d:
            self.ids.add(d["id"])
        if tag == "a" and "name" in d:
            self.ids.add(d["name"])
        if tag == "meta" and (d.get("http-equiv") or "").lower() == "refresh":
            m = re.match(r"\s*\d+\s*;\s*url\s*=\s*(.+?)\s*$", d.get("content") or "", re.I)
            if m:
                self.refresh = m.group(1).strip("'\"")
        for attr in CHECK_ATTRS.get(tag, ()):
            if d.get(attr):
                self.refs.append((tag, attr, d[attr]))
        if tag in ("img", "source") and d.get("srcset"):
            for part in d["srcset"].split(","):
                if part.strip():
                    self.refs.append((tag, "srcset", part.strip().split()[0]))


def parse(path, cache):
    if path not in cache:
        c = Collector()
        with open(path, encoding="utf-8") as f:
            c.feed(f.read())
        cache[path] = c
    return cache[path]


def resolve(site, baseurl, page_rel, ref):
    """(file, None) for the file a reference in page_rel (a path under site)
    points at, or (None, problem) when an absolute path lacks the baseurl."""
    url = urllib.parse.unquote(ref.partition("#")[0].split("?")[0])
    page_dir = "/" + os.path.dirname(page_rel).replace(os.sep, "/")
    if not page_dir.endswith("/"):
        page_dir += "/"
    if url == "":
        target = os.path.join(site, page_rel)
    elif url.startswith("/"):
        if baseurl and not (url == baseurl or url.startswith(baseurl + "/")):
            return None, "is an absolute path without the baseurl"
        fs = url[len(baseurl):] if baseurl else url
        target = os.path.join(site, fs.lstrip("/"))
    else:
        target = os.path.normpath(os.path.join(site, (page_dir + url).lstrip("/")))
    if os.path.isdir(target):
        target = os.path.join(target, "index.html")
    return target, None


# A heading, then only whitespace and comments, then a heading of the same or a
# higher level or the end of the page. An h2 followed by its h3s is not empty.
EMPTY_SECTION = [re.compile(r"<(h%d)\b[^>]*>((?:(?!</?h[1-6]\b).)*?)</\1>(?:\s|<!--(?:(?!-->).)*-->)*"
                            r"(?=<h[1-%d]\b|</main>|</article>)" % (n, n), re.S | re.I) for n in (2, 3)]
TODO_COMMENT = re.compile(r"<!--\s*TODO", re.I)


def check_main(text):
    """Problems in the <main> of a page: empty sections and TODO comments."""
    m = re.search(r"<main\b.*?</main>", text, re.S | re.I)
    if not m:
        return []
    main = m.group(0)
    out = []
    for h in (h for pattern in EMPTY_SECTION for h in pattern.finditer(main)):
        title = re.sub(r"<[^>]+>", "", h.group(2)).strip()
        out.append(f"section {title!r} ({h.group(1)}) has nothing under it")
    if TODO_COMMENT.search(main):
        out.append("a TODO comment is left in the page")
    return out


def check_links(site, baseurl, cache=None):
    """(errors, stats) for the links, media and fragments of every page."""
    cache = {} if cache is None else cache
    errors = []
    stats = {"pages": 0, "internal": 0, "external": 0}
    for root, _dirs, files in os.walk(site):
        for name in sorted(files):
            if not name.endswith(".html"):
                continue
            path = os.path.join(root, name)
            stats["pages"] += 1
            rel = os.path.relpath(path, site)
            with open(path, encoding="utf-8") as f:
                text = f.read()
            for marker in ("Liquid Exception", "Liquid Error", "{{ ", "{% ", "{%-", " }}"):
                if marker in text:
                    errors.append(f"{rel}: unrendered Liquid or Liquid error marker {marker!r}")
                    break
            errors += [f"{rel}: {e}" for e in check_main(text)]
            col = parse(path, cache)
            for tag, attr, ref in col.refs:
                if ref.startswith(SKIP_SCHEMES) or ref.startswith("//"):
                    stats["external"] += 1
                    continue
                stats["internal"] += 1
                target, problem = resolve(site, baseurl, rel, ref)
                if problem:
                    errors.append(f"{rel}: <{tag} {attr}> {ref!r} {problem}")
                    continue
                if not os.path.isfile(target):
                    errors.append(f"{rel}: <{tag} {attr}> {ref!r} does not resolve to a file")
                    continue
                frag = ref.partition("#")[2]
                if frag and target.endswith(".html"):
                    if frag not in parse(target, cache).ids:
                        errors.append(f"{rel}: <{tag} {attr}> {ref!r} fragment #{frag} not found in target")
    return errors, stats


def read_url_list(path):
    """Paths from a list file: one per line, relative to the site root and
    without the baseurl; blank lines and # comments are skipped."""
    out = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.split("#", 1)[0].strip()
            if line:
                out.append(line if line.startswith("/") else "/" + line)
    return out


def url_file(site, path):
    """The file that serves a URL path, or None."""
    target = os.path.join(site, urllib.parse.unquote(path).lstrip("/"))
    if path.endswith("/") or os.path.isdir(target):
        target = os.path.join(target, "index.html")
    return target if os.path.isfile(target) else None


def check_old_urls(site, baseurl, paths, cache=None):
    """(errors, stats) for old URL paths: each must answer with a page, or
    with a redirect to a page of the build or to another site."""
    cache = {} if cache is None else cache
    errors = []
    stats = {"pages": 0, "redirects": 0, "external": 0}
    for path in paths:
        target = url_file(site, path)
        if not target:
            errors.append(f"old URL {path}: no page and no redirect in the build")
            continue
        refresh = parse(target, cache).refresh if target.endswith(".html") else None
        if not refresh:
            stats["pages"] += 1
            continue
        stats["redirects"] += 1
        u = urllib.parse.urlsplit(refresh)
        inside = u.path == baseurl or u.path.startswith(baseurl + "/") if baseurl else u.path.startswith("/")
        if u.scheme in ("http", "https") and not inside:
            stats["external"] += 1
            continue
        if inside:
            dest = u.path[len(baseurl):] or "/"
        else:
            dest = urllib.parse.urljoin(path, u.path)
        dest_file = url_file(site, dest)
        if not dest_file:
            errors.append(f"old URL {path}: redirects to {refresh}, which has no page in the build")
        elif dest_file.endswith(".html") and parse(dest_file, cache).refresh:
            errors.append(f"old URL {path}: redirects to {refresh}, which is another redirect")
    return errors, stats


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    old_urls = DEFAULT_OLD_URLS
    if "--old-urls" in argv:
        i = argv.index("--old-urls")
        old_urls = argv[i + 1]
        del argv[i:i + 2]
    if not argv:
        print(__doc__)
        return 2
    site = os.path.abspath(argv[0])
    baseurl = argv[1].rstrip("/") if len(argv) > 1 else ""
    cache = {}
    errors, stats = check_links(site, baseurl, cache)
    print(f"pages: {stats['pages']}, internal references checked: {stats['internal']}, "
          f"external references skipped: {stats['external']}")
    if old_urls and os.path.isfile(old_urls):
        paths = read_url_list(old_urls)
        old_errors, old = check_old_urls(site, baseurl, paths, cache)
        errors += old_errors
        print(f"old URLs: {len(paths)} ({old['pages']} pages, {old['redirects']} redirects, "
              f"{old['external']} of them to other sites)")
    if errors:
        print(f"FAILURES: {len(errors)}")
        for e in errors:
            print("  " + e)
        return 1
    print("OK: every internal link, image, video and fragment resolves; every old URL answers; no Liquid residue.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
