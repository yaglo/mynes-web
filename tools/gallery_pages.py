#!/usr/bin/env python3
"""Keep the gallery's per-game and per-preset pages in step with the hero data.

The Games and Televisions sections have one page per game and per preset of
_data/hero.json. GitHub Pages builds without custom plugins, so each page is
a short stub file whose layout (_layouts/game.html, television.html) reads
everything else from the data:

  gallery/games/<game id>.md             layout: game, game: <id>
  gallery/televisions/<preset slug>.md   layout: television, preset: <id>

The preset slug is the id with hyphens for underscores (sony-pvm-14l2).

  python3 tools/gallery_pages.py           write the stubs that are missing
  python3 tools/gallery_pages.py --check   list what is missing or stale; exit 1 if anything is

--check also fails when _data/hero.json differs from assets/hero/manifest.json:
Jekyll reads the data file, the switcher reads the manifest, and the
showcase pipeline's install must write both (copy the manifest over the data
file). Existing stubs are never overwritten or removed.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join("_data", "hero.json")
MANIFEST = os.path.join("assets", "hero", "manifest.json")


def slug(value):
    s = re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")
    if not s:
        raise ValueError(f"no URL slug for {value!r}")
    return s


def yaml_string(value):
    return json.dumps(str(value), ensure_ascii=False)


def stubs(hero):
    """{path: text} of every stub the data calls for."""
    out = {}
    for game in hero.get("games") or []:
        gid = game["id"]
        s = slug(gid)
        out[os.path.join("gallery", "games", s + ".md")] = (
            "---\nlayout: game\n"
            f"title: {yaml_string(game.get('title') or gid)}\n"
            f"game: {yaml_string(gid)}\n"
            f"permalink: /gallery/games/{s}/\n---\n")
    for preset in hero.get("presets") or []:
        pid = preset["id"]
        s = slug(pid)
        out[os.path.join("gallery", "televisions", s + ".md")] = (
            "---\nlayout: television\n"
            f"title: {yaml_string(preset.get('name') or pid)}\n"
            f"preset: {yaml_string(pid)}\n"
            f"permalink: /gallery/televisions/{s}/\n---\n")
    return out


def load(root, rel):
    with open(os.path.join(root, rel), encoding="utf-8") as f:
        return json.load(f)


def problems(root):
    """What --check reports: missing stubs, and data that differs from the manifest."""
    out = []
    hero = load(root, DATA)
    if os.path.isfile(os.path.join(root, MANIFEST)) and load(root, MANIFEST) != hero:
        out.append(f"{DATA} differs from {MANIFEST}: copy the manifest over it")
    for path in sorted(stubs(hero)):
        if not os.path.isfile(os.path.join(root, path)):
            out.append(f"{path} is missing: run python3 tools/gallery_pages.py")
    return out


def write_missing(root):
    written = []
    for path, text in sorted(stubs(load(root, DATA)).items()):
        full = os.path.join(root, path)
        if os.path.isfile(full):
            continue
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(text)
        written.append(path)
    return written


def main(argv):
    root = ROOT
    if "--root" in argv:
        root = argv[argv.index("--root") + 1]
    if "--check" in argv:
        found = problems(root)
        for p in found:
            print(p)
        print(f"gallery pages: {len(found)} problem(s)" if found else "gallery pages: every game and preset has a page")
        return 1 if found else 0
    for path in write_missing(root):
        print("wrote " + path)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
