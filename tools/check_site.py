#!/usr/bin/env python3
"""Verify a built Jekyll site.

Walks every HTML file under the build directory and checks that each internal
link, image, video source, poster, stylesheet and script resolves to a file in
the build, that fragment links point at an existing element id, that internal
absolute paths carry the configured baseurl, and that no unrendered Liquid or
Liquid error text is left in the output.

Usage: python3 tools/check_site.py _site /mynes-web
Exit status is 1 when anything fails.
"""
import html.parser
import os
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


class Collector(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.ids = set()
        self.in_style_or_script = 0

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if "id" in d:
            self.ids.add(d["id"])
        if tag == "a" and "name" in d:
            self.ids.add(d["name"])
        for attr in CHECK_ATTRS.get(tag, ()):
            if d.get(attr):
                self.refs.append((tag, attr, d[attr]))
        if tag == "img" and d.get("srcset"):
            for part in d["srcset"].split(","):
                self.refs.append(("img", "srcset", part.strip().split(" ")[0]))


def parse(path, cache):
    if path not in cache:
        c = Collector()
        with open(path, encoding="utf-8") as f:
            c.feed(f.read())
        cache[path] = c
    return cache[path]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    site = os.path.abspath(sys.argv[1])
    baseurl = sys.argv[2].rstrip("/") if len(sys.argv) > 2 else ""
    cache = {}
    errors = []
    pages = 0
    internal = 0
    external = 0
    for root, _dirs, files in os.walk(site):
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(root, name)
            pages += 1
            rel = os.path.relpath(path, site)
            with open(path, encoding="utf-8") as f:
                text = f.read()
            for marker in ("Liquid Exception", "Liquid Error", "{{ ", "{% ", "{%-", " }}"):
                if marker in text:
                    errors.append(f"{rel}: unrendered Liquid or Liquid error marker {marker!r}")
                    break
            col = parse(path, cache)
            page_url_dir = "/" + os.path.dirname(rel).replace(os.sep, "/")
            if not page_url_dir.endswith("/"):
                page_url_dir += "/"
            for tag, attr, ref in col.refs:
                if ref.startswith(SKIP_SCHEMES) or ref.startswith("//"):
                    external += 1
                    continue
                internal += 1
                url, _, frag = ref.partition("#")
                url = urllib.parse.unquote(url.split("?")[0])
                if url == "":
                    target = path
                elif url.startswith("/"):
                    if baseurl and not (url == baseurl or url.startswith(baseurl + "/")):
                        errors.append(f"{rel}: <{tag} {attr}> {ref!r} is an absolute path without the baseurl")
                        continue
                    fs = url[len(baseurl):] if baseurl else url
                    target = os.path.join(site, fs.lstrip("/"))
                else:
                    target = os.path.normpath(os.path.join(site, (page_url_dir + url).lstrip("/")))
                if os.path.isdir(target):
                    target = os.path.join(target, "index.html")
                if not os.path.isfile(target):
                    errors.append(f"{rel}: <{tag} {attr}> {ref!r} does not resolve to a file")
                    continue
                if frag and target.endswith(".html"):
                    if frag not in parse(target, cache).ids:
                        errors.append(f"{rel}: <{tag} {attr}> {ref!r} fragment #{frag} not found in target")
    print(f"pages: {pages}, internal references checked: {internal}, external references skipped: {external}")
    if errors:
        print(f"FAILURES: {len(errors)}")
        for e in errors:
            print("  " + e)
        return 1
    print("OK: every internal link, image, video and fragment resolves; no Liquid residue.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
