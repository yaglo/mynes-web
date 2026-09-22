# MyNES project site

Source of <https://yaglo.github.io/mynes-web/>, the website for
[MyNES](https://github.com/yaglo/mynes), a NES emulator that generates the
console's composite video waveform and follows it through a television
receiver to a modelled CRT.

The site is a plain [Jekyll](https://jekyllrb.com) site built by GitHub Pages
(Jekyll 3.10 through the `github-pages` gem). It uses no remote theme: the
layouts are in `_layouts/`, the stylesheets are `assets/css/style.css` and
`assets/css/tv.css` (the television switcher only), and the only plugins are
the ones GitHub whitelists (`jekyll-seo-tag`, `jekyll-sitemap`, `jekyll-feed`,
`jekyll-relative-links`).

## What is here

| Path | Contents |
|---|---|
| `index.md` | Landing page with the television switcher hero |
| `gallery/` | Showcase, the 23-preset audit, beam close-ups, feature tour, the historical Contra gallery, motion review, visual review and the consumer CRT review |
| `research/` | Hardware research, PVM-14L2 and GDM-FW900 model notes, published measurements, receiver sharpening audit |
| `_posts/` | The eight-part blog series, one post per day from 2026-09-15 |
| `download.md`, `about.md` | How to get and build the emulator; project background |
| `assets/images/` | Every image and video from the code repository's former `docs/images/` tree, with the original directory layout |
| `assets/previews/` | WebP previews (at most 1600 px wide, quality 85) of rasters over 1 MB; each preview links to its original |
| `assets/posters/` | Poster frames for the MP4 clips |
| `assets/hero/` | Manifest, posters and 4K lens stills for the landing-page television switcher (see below) |
| `assets/js/tv-switcher.js`, `assets/css/tv.css`, `_includes/tv-switcher.html` | The switcher: script, styles and markup |
| `assets/video/` | The showcase reel re-encoded at 1280×960 (H.264, crf 30, about 2.4 MB) and its poster; used by the gallery |
| `tools/check_site.py` | Link and asset checker for a built `_site` |
| `tools/test_tv_switcher.js` | Node tests for the switcher's pure helpers, both manifests, the markup and the CSS |
| `tools/test_tv_switcher_browser.js` | Headless Chrome checks for the switcher: seed poster, focus, live regions, prefetch, lens sync, fallbacks |
| `tools/tv-fixture/` | Synthetic version 2 manifest with small clips (`make_fixture.py`), its preview page and `preview.yml` |

## Where the images come from

All pictures and clips are actual renders and captures from the MyNES GPU
frontend. They were produced by the review scripts in the code repository
(`tools/review/`) and lived under `docs/images/` there. The heavy originals,
including the 3840×2880 PNGs and lossless WebP renders used for pixel
inspection, live in this repository so that the code repository stays small.
Pages link to those originals; the inline images are reduced previews only
where the original is larger than 1 MB.

Page text comes from the corresponding documents in the code repository's
`docs/` directory. Each migrated page names its source document; captions and
the notes about what is and is not measured are carried over as written.

## The television switcher (`assets/hero/`)

The landing page opens with a game recording playing on a modelled CRT. The
visitor switches the television while the clip keeps running. The stage
shows the clip at one source pixel per device pixel: the 1920×1440 render on
a 2x display, the 960×720 render on a 1x display. Only when no render fits
the window is it scaled, with a note under it. HDR files play where the
display and browser support them, and a line under the switcher says which
file plays and why.

Inspect opens a round lens over the picture with the 3840×2880 render at
1:1, 2:1 or 4:1. With a lens clip the lens follows the stage clip frame by
frame; with only a still the stage freezes on the still's frame. Presets
with neither have Inspect switched off with "Full-resolution capture not
rendered yet". Clicking the picture or pressing Space freezes the clip; on a
preset with a still and no clip it opens Inspect.

`assets/hero/manifest.json` drives the tabs, chips and media. The script
reads version 1, the seed data committed now (one SDR clip per preset of
unknown size, 3840×2880 PNG stills), and version 2, which the rebuilt
showcase pipeline in the code repository writes (stage clips per size and
range, lens clips, HDR and SDR stills, posters per stage size). The schema,
the display rules, what Inspect does for each kind of clip and the seed
contents are in [`assets/hero/README.md`](assets/hero/README.md).

The initial page load fetches the manifest, `tv.css`, the script, one poster
and one stage clip. The other clips of a game are prefetched one at a time
after the first can play through, and never on connections that report
`saveData` or a 2G/3G effective type.

Tests:

```sh
node tools/test_tv_switcher.js           # pure helpers, both manifests, markup, CSS
node tools/test_tv_switcher_browser.js   # headless Chrome; builds the fixture preview first
```

The browser checks use `$CHROME` or Chrome for Testing under
`~/.cache/puppeteer`, and skip when neither exists. To look at the version 2
fixture in a browser:

```sh
bundle exec jekyll serve --config _config.yml,tools/tv-fixture/preview.yml \
  --destination "$TMPDIR/mynes-web-preview" --port 4011
# http://127.0.0.1:4011/mynes-web/tools/tv-fixture/
```

## Preview locally

```sh
gem install bundler
bundle install            # installs the github-pages gem
bundle exec jekyll serve  # http://127.0.0.1:4000/mynes-web/
```

The `baseurl` is `/mynes-web`; all internal links go through `relative_url`,
so the site also works when served from a subdirectory.

To check a build:

```sh
bundle exec jekyll build
python3 tools/check_site.py _site /mynes-web
```

## Adding content

- New blog post: add `_posts/YYYY-MM-DD-slug.md` with `title`, `series` and
  `teaser` in the front matter. The index sorts by date ascending.
- New image: put the original under `assets/images/`; if it is over 1 MB,
  add a WebP preview under `assets/previews/` at the same relative path and
  link the preview to the original.
- Only one `<video>` per page autoplays (the switcher's first clip on the
  landing page); other clips use `preload="none"` with a poster.
- New hero clip or still: add the files under `assets/hero/<game>/<preset>/`
  and the entry to `assets/hero/manifest.json`; the page needs no other
  change. When the landing page's first clip changes, update the seed
  values in `_includes/tv-switcher.html` (poster, poster_2x, texts), which
  `index.md` uses as they are.

## License

Site text and images come from the MyNES repository and are covered by its
[Apache License 2.0](https://github.com/yaglo/mynes/blob/master/LICENSE).
