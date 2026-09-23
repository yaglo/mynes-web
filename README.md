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
`jekyll-relative-links`, `jekyll-redirect-from`).

## What is here

| Path | Contents |
|---|---|
| `index.md` | Home: the television switcher, what MyNES is, three facts, download, how the picture is made, a comparison slider |
| `gallery/` | Gallery index; `games/` and `televisions/` (one stub page per game and per preset of the hero data), `close-ups.md`, `motion.md` |
| `notes/` | Technical notes (formerly `research/`): hardware research, PVM-14L2, GDM-FW900, measurements, receiver sharpening, HDR output |
| `_posts/`, `blog/` | The eight-part blog series and its index |
| `download.md`, `about.md` | Download and build; project background |
| `archive/` | Superseded gallery pages and reviews, at `/archive/<slug>/`, and their index |
| `redirects/` | Redirects for old URLs that have no page of their own |
| `_data/` | `hero.json` (a copy of the hero manifest), `renders.yml`, `presets.yml`, `facts.yml`, `release.yml` |
| `_includes/crop.html`, `clip.html`, `pan.html`, `compare.html` | Renders at one source pixel per device pixel (see below) |
| `assets/renders/` | 1:1 crops cut from the 3840×2880 frames and their `@1x` files |
| `assets/images/` | Every image and video from the code repository's former `docs/images/` tree, with the original directory layout |
| `assets/previews/` | WebP previews of rasters over 1 MB, used by the archived pages |
| `assets/posters/` | Poster frames for the MP4 clips |
| `assets/hero/` | Manifest, posters and 4K lens stills for the television switcher (see below) |
| `assets/js/tv-switcher.js`, `assets/css/tv.css`, `_includes/tv-switcher.html` | The switcher: script, styles and markup |
| `assets/js/render.js`, `viewer.js`, `compare.js` | Sizing of renders, the pan viewer and the comparison slider |
| `assets/video/` | The showcase reel re-encoded at 1280×960 (H.264, crf 30, about 2.4 MB) and its poster; used by an archived page |
| `tools/check_site.py`, `tools/old-urls.txt` | Link and asset checker for a built `_site`; it also checks that every URL of the site before the restructure still answers |
| `tools/gallery_pages.py` | Writes the stub page of each game and preset of `_data/hero.json`; `--check` finds missing ones |
| `tools/make_crop.py` | Cuts a 1:1 crop from a frame and writes its `@1x` file |
| `tools/check_render_pixels.js` | Headless Chrome: each render on screen equals its file pixel for pixel at ratios 1, 1.5, 2 and 3 |
| `tools/test_*.py`, `tools/test_media.js` | Tests for the tools and the media scripts |
| `tools/test_tv_switcher.js` | Node tests for the switcher's pure helpers, both manifests, the markup and the CSS |
| `tools/test_tv_switcher_browser.js` | Headless Chrome checks for the switcher: seed poster, focus, live regions, prefetch, lens sync, fallbacks |
| `tools/tv-fixture/` | Synthetic version 2 manifest with small clips (`make_fixture.py`), its preview page and `preview.yml` |

## Pages and old URLs

The navigation is Gallery, Technical notes, Blog, Download, About and
GitHub; the footer adds the Archive. A page that moves lists its old URL
under `redirect_from` in its front matter, and jekyll-redirect-from writes a
page there with a meta refresh, a canonical link and a plain link
(`_layouts/redirect.html`). `tools/old-urls.txt` lists every page of the site
before the restructure; `check_site.py` fails if one of them has no page, or
redirects to a missing page or to another redirect.

An archived page lives in `archive/`, has `archived: <date>`,
`replaced_by: <URL>` and `sitemap: false` in its front matter, and is listed
on `/archive/`. A page migrated from the code repository names its source
document in `source:`; the footer links it at the last commit that had it.

## Where the images come from

All pictures and clips are renders and captures from the MyNES GPU
frontend. The older ones were produced by the review scripts in the code
repository (`tools/review/`) and lived under `docs/images/` there; the
showcase pipeline (`tools/showcase/`) writes `assets/hero/`. The heavy
originals, including the 3840×2880 PNGs, live in this repository so that the
code repository stays small. The archived pages keep their reduced previews;
every other page shows renders only through the includes below.

## Renders at one source pixel per device pixel

A render is never scaled by the browser. The global
`img:not(.render), video:not(.render) { max-width: 100% }` rule fits other
images to the column; renders keep their pixel size and scroll sideways in
`.render-scroll` on narrow windows.

- `{% include crop.html id="..." %}`: a 1:1 crop from `_data/renders.yml`
  (or with every field given as a parameter). The crop is the 2x candidate
  shown at half its pixel size, its `@1x` file (`Image.reduce(2)`) the 1x
  candidate; an HDR AVIF, when given, is offered to
  `(dynamic-range: high)` displays. The caption is built from the fields.
- `{% include pan.html id="..." %}` (or `src`, `hdr`, `width`, `height`,
  `x`, `y`, `alt`, `caption`, `alternates`): a full frame in a scroll box at
  1:1, with drag, keys, 1:1/2:1/4:1 zoom and an overview map
  (`assets/js/viewer.js`). `video` takes rendered `<source>` elements.
- `{% include compare.html a="..." b="..." %}`: two crops of the same
  region in a comparison slider (`assets/js/compare.js`).
- `{% include clip.html sources=... %}` (or `src`, `width`, `height`): a
  clip at 1:1, HDR sources first, a 2x source for 2 dppx displays.

`assets/js/render.js` sizes renders at pixel ratios other than 1 and 2,
moves each render box onto whole device pixels, and writes the caption
fields that depend on the file the browser chose. `tools/make_crop.py
FRAME.png X Y W H OUT.png` cuts a crop and its `@1x` file; width and height
must be even, and multiples of 6 make ratio 3 exact too.

## Gallery data

The gallery reads `_data/hero.json`, a copy of `assets/hero/manifest.json`
(version 1 today, version 2 once the showcase pipeline installs its media).
The Games and Televisions pages are stubs with a `game` or `preset` id;
their layouts (`_layouts/game.html`, `television.html`) and the gallery
includes show only what the data lists, and a plain line when there is
nothing. After installing media: copy the manifest to `_data/hero.json` and
run `python3 tools/gallery_pages.py` (see `assets/hero/README.md`).

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
python3 tools/gallery_pages.py --check
python3 -m unittest discover -s tools -p 'test_*.py'
node tools/test_media.js
node tools/check_render_pixels.js _site   # headless Chrome, a few minutes
```

## Adding content

- New blog post: add `_posts/YYYY-MM-DD-slug.md` with `title` and `series`
  in the front matter. The index lists posts by year.
- New render: cut it with `tools/make_crop.py`, add an entry to
  `_data/renders.yml` and place it with `crop.html`, `pan.html` or
  `compare.html`.
- New technical note: add `notes/<name>.md` with `section: notes`,
  `nav_order`, `nav_title` and `description`; the index and the navigation
  list it.
- Moved page: add its old URL under `redirect_from`.
- New hero clip or still: add the files under `assets/hero/<game>/<preset>/`
  and the entry to `assets/hero/manifest.json`, copy the manifest to
  `_data/hero.json` and run `python3 tools/gallery_pages.py`. When the landing
  page's first clip changes, update the seed values in
  `_includes/tv-switcher.html` (poster, poster_2x, texts), which `index.md`
  uses as they are.
- Only one `<video>` per page autoplays (the switcher's first clip on the
  landing page); other clips use `preload="none"` with a poster.

## License

Site text and images come from the MyNES repository and are covered by its
[Apache License 2.0](https://github.com/yaglo/mynes/blob/master/LICENSE).
