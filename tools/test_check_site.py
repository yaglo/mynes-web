#!/usr/bin/env python3
"""Tests for tools/check_site.py: links, fragments and the old URL check.
Run: python3 -m unittest discover -s tools -p 'test_*.py'
"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import check_site  # noqa: E402

BASE = "/mynes-web"


def redirect(to):
    return (f'<!DOCTYPE html><html><head><link rel="canonical" href="{to}">'
            f'<meta http-equiv="refresh" content="0; url={to}"></head>'
            f'<body><a href="{to}">{to}</a></body></html>')


class SiteCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.site = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, rel, text):
        path = os.path.join(self.site, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)


class OldUrls(SiteCase):
    def setUp(self):
        super().setUp()
        self.write("index.html", "<main><h1 id='top'>Home</h1></main>")
        self.write("notes/index.html", "<main>Notes</main>")
        self.write("research/index.html", redirect("https://yaglo.github.io/mynes-web/notes/"))
        self.write("old/index.html", redirect("https://yaglo.github.io/mynes-web/gone/"))
        self.write("chain/index.html", redirect("https://yaglo.github.io/mynes-web/research/"))
        self.write("readme/index.html", redirect("https://github.com/yaglo/mynes-web/blob/main/README.md"))
        self.write("relative/index.html", redirect("../notes/"))
        self.write("404.html", "<main>Not found</main>")

    def check(self, paths):
        return check_site.check_old_urls(self.site, BASE, paths)

    def test_pages_and_redirects_to_pages_pass(self):
        errors, stats = self.check(["/index.html", "/404.html", "/research/index.html", "/research/",
                                    "/readme/", "/relative/"])
        self.assertEqual(errors, [])
        self.assertEqual(stats, {"pages": 2, "redirects": 4, "external": 1})

    def test_missing_url_fails(self):
        errors, _ = self.check(["/gallery/contra/index.html"])
        self.assertEqual(len(errors), 1)
        self.assertIn("no page and no redirect", errors[0])

    def test_redirect_to_missing_page_fails(self):
        errors, _ = self.check(["/old/"])
        self.assertIn("which has no page in the build", errors[0])

    def test_redirect_chain_fails(self):
        errors, _ = self.check(["/chain/index.html"])
        self.assertIn("which is another redirect", errors[0])

    def test_list_file(self):
        path = os.path.join(self.site, "urls.txt")
        with open(path, "w") as f:
            f.write("# comment\n\n/about/index.html\nnotes/index.html  # trailing\n")
        self.assertEqual(check_site.read_url_list(path), ["/about/index.html", "/notes/index.html"])

    def test_main_reports_old_urls(self):
        path = os.path.join(self.site, "urls.txt")
        with open(path, "w") as f:
            f.write("/index.html\n/gone/\n")
        import contextlib
        import io
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            status = check_site.main([self.site, BASE, "--old-urls", path])
        self.assertEqual(status, 1)
        self.assertIn("old URL /gone/: no page and no redirect", out.getvalue())


class Links(SiteCase):
    def test_links_srcset_and_fragments(self):
        self.write("a/index.html", '<a href="/mynes-web/b/#x">b</a><picture><source srcset="/mynes-web/i-hdr.avif 1x, '
                                   '/mynes-web/i.png 2x"><img src="../i-hdr.avif" alt=""></picture>'
                                   '<a href="/mynes-web/b/#missing">b</a><a href="/b/">no base</a>')
        self.write("b/index.html", '<h2 id="x">x</h2>')
        self.write("i.png", "")
        errors, stats = check_site.check_links(self.site, BASE)
        self.assertEqual(stats["pages"], 2)
        self.assertEqual(len(errors), 4, errors)
        self.assertEqual(sum("i-hdr.avif" in e and "does not resolve" in e for e in errors), 2)
        self.assertTrue(any("#missing not found" in e for e in errors))
        self.assertTrue(any("without the baseurl" in e for e in errors))


class MainContent(unittest.TestCase):
    def test_empty_sections_and_todo_comments(self):
        page = ('<main><h1>T</h1><p>x</p><h2 id="a"><a href="#a">A</a></h2>\n<!-- TODO(copy): later -->\n'
                '<h2 id="b">B</h2><p>b</p><h3 id="c">C</h3>\n</main>')
        errors = check_site.check_main(page)
        self.assertEqual(len(errors), 3, errors)
        self.assertTrue(any("'A'" in e for e in errors) and any("'C'" in e for e in errors))
        self.assertTrue(any("TODO" in e for e in errors))
        self.assertEqual(check_site.check_main('<main><h2>A</h2><table></table><h2>B</h2><ul><li>x</li></ul></main>'), [])
        self.assertEqual(check_site.check_main('<main><h2>A</h2>\n<h3>A1</h3><p>x</p></main>'), [])
        self.assertEqual(check_site.check_main('<p>no main</p><h2>A</h2>'), [])


if __name__ == "__main__":
    unittest.main()
