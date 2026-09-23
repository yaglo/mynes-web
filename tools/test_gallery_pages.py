#!/usr/bin/env python3
"""Tests for tools/gallery_pages.py, and a check of the site's own data.
Run: python3 -m unittest discover -s tools -p 'test_*.py'
"""
import json
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gallery_pages  # noqa: E402

HERO = {"version": 2, "presets": [{"id": "sony_pvm_14l2", "name": "Sony PVM-14L2"}],
        "games": [{"id": "punch-out", "title": "Punch-Out!!", "scene": "First fight"}], "clips": {}}


class Stubs(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = self.tmp.name
        os.makedirs(os.path.join(self.root, "_data"))
        os.makedirs(os.path.join(self.root, "assets", "hero"))
        for rel in (gallery_pages.DATA, gallery_pages.MANIFEST):
            with open(os.path.join(self.root, rel), "w") as f:
                json.dump(HERO, f)

    def tearDown(self):
        self.tmp.cleanup()

    def test_slugs(self):
        self.assertEqual(gallery_pages.slug("sony_pvm_14l2"), "sony-pvm-14l2")
        self.assertEqual(gallery_pages.slug("Punch-Out!!"), "punch-out")
        with self.assertRaises(ValueError):
            gallery_pages.slug("!!")

    def test_stub_text(self):
        s = gallery_pages.stubs(HERO)
        self.assertEqual(s[os.path.join("gallery", "games", "punch-out.md")],
                         '---\nlayout: game\ntitle: "Punch-Out!!"\ngame: "punch-out"\npermalink: /gallery/games/punch-out/\n---\n')
        self.assertIn('preset: "sony_pvm_14l2"\npermalink: /gallery/televisions/sony-pvm-14l2/',
                      s[os.path.join("gallery", "televisions", "sony-pvm-14l2.md")])

    def test_write_check_and_keep(self):
        self.assertEqual(len(gallery_pages.problems(self.root)), 2)
        self.assertEqual(len(gallery_pages.write_missing(self.root)), 2)
        self.assertEqual(gallery_pages.problems(self.root), [])
        path = os.path.join(self.root, "gallery", "games", "punch-out.md")
        with open(path, "w") as f:
            f.write("---\nlayout: game\ntitle: Edited\ngame: punch-out\n---\n")
        self.assertEqual(gallery_pages.write_missing(self.root), [])
        with open(path) as f:
            self.assertIn("Edited", f.read())

    def test_data_must_match_manifest(self):
        gallery_pages.write_missing(self.root)
        with open(os.path.join(self.root, gallery_pages.MANIFEST), "w") as f:
            json.dump(dict(HERO, version=3), f)
        self.assertEqual(len(gallery_pages.problems(self.root)), 1)
        self.assertIn("differs", gallery_pages.problems(self.root)[0])


class ThisSite(unittest.TestCase):
    def test_every_game_and_preset_has_a_page_and_the_data_matches(self):
        self.assertEqual(gallery_pages.problems(gallery_pages.ROOT), [])


if __name__ == "__main__":
    unittest.main()
