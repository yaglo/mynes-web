# MyNES project site

Source of <https://yaglo.github.io/mynes-web/>, the website of
[MyNES](https://github.com/yaglo/mynes). MyNES is an NES emulator whose GPU
frontend encodes the picture as composite or RF video and draws the decoded
signal on a simulated CRT.

The site is a plain [Jekyll](https://jekyllrb.com) site built by GitHub Pages
(Jekyll 3.10 through the `github-pages` gem). It has no remote theme. The
layouts are in `_layouts/`, and the stylesheets are `assets/css/style.css` and
`assets/css/tv.css` (the television switcher only). The plugins are the ones
GitHub allows: `jekyll-seo-tag`, `jekyll-sitemap`, `jekyll-feed`,
`jekyll-relative-links` and `jekyll-redirect-from`.

## Files and directories

| Path | Contents |
|---|---|
| `index.md` | Home: the television switcher, the one-sentence description of MyNES, 3 facts, the download button, how the picture is made and a comparison slider |
| `gallery/` | Gallery index; `games/` and `televisions/` (one stub page per game and per preset of the hero data), `close-ups.md`, `motion.md` |
| `notes/` | Technical notes (formerly `research/`): hardware research, PVM-14L2, GDM-FW900, measurements, receiver sharpening, HDR output |
| `_posts/`, `blog/` | The 8-part blog series and the blog index |
| `download.md`, `about.md` | Download and build; the About page |
| `redirects/` | Redirects for old URLs that have no page of their own |
| `_data/` | `hero.json` (a copy of the hero manifest), `renders.yml`, `presets.yml`, `facts.yml`, `release.yml` |
| `_includes/crop.html`, `clip.html`, `pan.html`, `compare.html` | Renders at one source pixel per device pixel (see [Render includes](#render-includes)) |
| `assets/renders/` | 1:1 crops cut from the 3840×2880 frames |
| `assets/hero/` | Manifest, posters and 3840×2880 lens stills for the television switcher (see [The television switcher](#the-television-switcher-assetshero)) |
| `assets/js/tv-switcher.js`, `assets/css/tv.css`, `_includes/tv-switcher.html` | The switcher's script, styles and markup |
| `assets/js/render.js`, `viewer.js`, `compare.js` | Sizing of renders, the pan viewer and the comparison slider |
| `tools/check_site.py`, `tools/old-urls.txt` | Link and asset checker for a built `_site`; it also checks that every URL of the site before the restructure still answers |
| `tools/gallery_pages.py` | Writes the stub page of each game and preset of `_data/hero.json`; `--check` finds missing ones |
| `tools/make_crop.py` | Cuts a 1:1 crop from a frame |
| `tools/check_render_pixels.js` | Headless Chrome: each render on screen equals its file pixel for pixel at ratios 1, 1.5, 2 and 3 |
| `tools/test_*.py`, `tools/test_media.js` | Tests for the tools and the media scripts |
| `tools/test_tv_switcher.js` | Node tests for the switcher's pure helpers, both manifests, the markup and the CSS |
| `tools/test_tv_switcher_browser.js` | Headless Chrome checks for the switcher: seed poster, focus, live regions, prefetch, lens sync, fallbacks |
| `tools/tv-fixture/` | Synthetic version 2 manifest with small clips (`make_fixture.py`), its preview page and `preview.yml` |

## Pages and old URLs

The navigation lists Gallery, Technical notes, Blog, Download, About and
GitHub, and the footer adds the Archive. A page that moves lists its old URL
under `redirect_from` in its front matter. jekyll-redirect-from then writes a
page at the old URL with a meta refresh, a canonical link and a plain link
(`_layouts/redirect.html`). `tools/old-urls.txt` lists every page of the site
before the restructure. `check_site.py` fails if one of them has no page, or
redirects to a missing page or to another redirect.

## Where the images come from

The images and clips are renders and captures from the MyNES GPU frontend.
The recording pipeline in the code repository's `tools/showcase/` writes
`assets/hero/`, and the crops under `assets/renders/` are cut from those
frames with `tools/make_crop.py`. The beam height fixture is the one render
from an earlier review script that remains. Every page shows renders only
through the includes below.

## Render includes

The browser never scales a render. The global
`img:not(.render), video:not(.render) { max-width: 100% }` rule fits other
images to the column. Renders keep their pixel size and scroll sideways in
`.render-scroll` on narrow windows.

- `{% include crop.html id="..." %}`: a 1:1 crop from `_data/renders.yml`,
  or with every field given as a parameter. The crop is one file, shown 1:1
  at every pixel ratio: its attributes are half its pixel size for 2 dppx,
  and at 1 dppx `style.css` gives it the full size from `--crop-w` and
  `--crop-h`. There is no reduced copy for 1× displays; the crop is twice as
  large on their screens and scrolls sideways when it is wider than the
  column. An HDR AVIF, when given, is offered to `(dynamic-range: high)`
  displays. The caption is built from the fields.
- `{% include pan.html id="..." %}`, or with `src`, `hdr`, `width`, `height`,
  `x`, `y`, `alt`, `caption` and `alternates`: a full frame in a scroll box at
  1:1, with drag, keys, 1:1, 2:1 and 4:1 zoom and an overview map
  (`assets/js/viewer.js`). `video` takes rendered `<source>` elements.
- `{% include compare.html a="..." b="..." %}`: 2 crops of the same region
  in a comparison slider (`assets/js/compare.js`).
- `{% include clip.html sources=... %}`, or with `src`, `width` and
  `height`: a clip at 1:1, with the HDR sources first and a `2x` source for
  2 dppx displays.

`assets/js/render.js` sizes renders at pixel ratios other than 1 and 2,
moves each render box onto whole device pixels, and writes the caption fields
that depend on the file the browser chose.
`tools/make_crop.py FRAME.png X Y W H OUT.png` cuts a crop. `X`, `Y`, `W`
and `H` must be even. Multiples of 6 are also exact at
ratios 1.5 and 3, and multiples of 10 at 1.25.

## Gallery data

The gallery reads `_data/hero.json`, a copy of `assets/hero/manifest.json`,
which the `tools/showcase/` pipeline in the code repository writes (version
2). The Games and Televisions pages are stubs with a `game` or `preset` id.
Their layouts (`_layouts/game.html`, `television.html`) and the gallery
includes show only what the data lists, and a plain line when the data lists
nothing. A preset recorded for its still frame only has a `crop` entry and
no clip: its Televisions page shows the crop, and the switcher leaves it
out. After installing media, copy the manifest to `_data/hero.json` and run
`python3 tools/gallery_pages.py` (see `assets/hero/README.md`).

## The television switcher (`assets/hero/`)

The home page opens with a game recording on a simulated CRT, and the visitor
switches the preset while the clip keeps running. The stage shows the clip at
one source pixel per device pixel: the 1920×1440 render on a 2× display and
the 960×720 render on a 1× display. When no render fits the window, the stage
is scaled and a note under it says so. HDR files play where the display and
the browser support them, and a line under the switcher says which file plays
and why.

Inspect opens a round lens over the picture with the 3840×2880 render at 1:1,
2:1 or 4:1. With a lens clip, the lens follows the stage clip frame by frame.
With a still and no lens clip, the stage freezes on the still's frame. A
preset with neither has Inspect switched off and shows "Full-resolution
capture not rendered yet". Clicking the picture or pressing Space freezes the
clip, and on a preset with a still and no clip it opens Inspect.

`assets/hero/manifest.json` sets the game tabs, the preset chips and the
media, and the script reads 2 versions of it. Version 2 is what the
`tools/showcase/` pipeline in the code repository writes: stage clips per
size and range, lens clips, HDR and SDR stills, detail crops and posters per
stage size. Version 1 was the seed data of the first site, one SDR clip per
preset of unknown size and 3840×2880 PNG stills, and the script still reads
it. [`assets/hero/README.md`](assets/hero/README.md) gives the schema, the
display rules and what Inspect does for each type of clip.

The first page load fetches the manifest, `tv.css`, the script, one poster
and one stage clip. The other clips of a game are prefetched one at a time
after the first can play through. They are never prefetched on connections
that report `saveData` or a 2G or 3G effective type.

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

## Local preview

```sh
gem install bundler
bundle install            # installs the github-pages gem
bundle exec jekyll serve  # http://127.0.0.1:4000/mynes-web/
```

The `baseurl` is `/mynes-web`. Every internal link goes through
`relative_url`, so the site also works when it is served from a
subdirectory.

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

- Blog post: add `_posts/YYYY-MM-DD-slug.md` with `title` and `series` in the
  front matter. The index lists posts by year.
- Render: cut it with `tools/make_crop.py`, add an entry to
  `_data/renders.yml` and place it with `crop.html`, `pan.html` or
  `compare.html`.
- Technical note: add `notes/<name>.md` with `section: notes`, `nav_order`,
  `nav_title` and `description`. The index and the navigation list it.
- Moved page: add its old URL under `redirect_from`.
- Hero clip or still: add the files under `assets/hero/<game>/<preset>/` and
  the entry to `assets/hero/manifest.json`, copy the manifest to
  `_data/hero.json` and run `python3 tools/gallery_pages.py`. When the home
  page's first clip changes, update the seed values in
  `_includes/tv-switcher.html` (`poster`, `poster_2x` and the texts), which
  `index.md` uses unchanged. A new preset also needs a `caption` (the short
  line after its name in the switcher) and a `summary` in
  `_data/presets.yml`; the site shows these in place of the manifest's blurb.
- At most one `<video>` per page autoplays: the switcher's first clip on the
  home page. Other clips use `preload="none"` with a poster.

## License

The site text and images come from the MyNES repository and are covered by
its [Apache License 2.0](https://github.com/yaglo/mynes/blob/master/LICENSE).
