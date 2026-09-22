# MyNES project site

Source of <https://yaglo.github.io/mynes-web/>, the website for
[MyNES](https://github.com/yaglo/mynes), a NES emulator that generates the
console's composite video waveform and follows it through a television
receiver to a modelled CRT.

The site is a plain [Jekyll](https://jekyllrb.com) site built by GitHub Pages
(Jekyll 3.10 through the `github-pages` gem). It uses no remote theme: the
layouts are in `_layouts/`, the one stylesheet is `assets/css/style.css`, and
the only plugins are the ones GitHub whitelists (`jekyll-seo-tag`,
`jekyll-sitemap`, `jekyll-feed`, `jekyll-relative-links`).

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
| `assets/js/tv-switcher.js`, `_includes/tv-switcher.html` | The switcher: script and markup |
| `assets/video/` | The showcase reel re-encoded at 1280×960 (H.264, crf 30, about 2.4 MB) and its poster; used by the gallery |
| `tools/check_site.py` | Link and asset checker for a built `_site` |
| `tools/test_tv_switcher.js` | Node tests for the switcher's pure helpers and a manifest check |

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
visitor switches the television while the clip keeps running and holds a lens
over the picture to see the beam, scanlines and mask; a click freezes every
clip on frame 0 and the lens then shows the 3840×2880 render of that frame at
one source pixel per device pixel.

Everything it shows comes from `assets/hero/manifest.json`:

- `presets[]`: the televisions the chips offer, with a name and a one-line
  blurb. A preset without a clip for the current game is a disabled chip.
- `games[]`: the tabs, each with a `scene` and a `default_preset`.
- `clips[game][preset]`: `video` (MP4), `poster` (WebP of frame 0), `still`
  (lossy WebP of the 4K frame, fetched only when freezing), `still_size` and
  `full` (the lossless PNG behind "Open 4K frame"). Every key is optional: a
  clip with only a still is shown as a picture, a clip with only a video has
  the live lens tier only.

The rules the files must keep (all clips of one game share the input replay;
frame 0 of video, poster and still is the same emulator frame) and the seed
contents are documented in [`assets/hero/README.md`](assets/hero/README.md).
The capture pipeline in the code repository writes this directory; the seed
was made from the existing showcase clips and 4K PNGs, which the manifest
references in place. The initial page load fetches the manifest, one poster
and one clip; the other clips of a game are prefetched one at a time after
the first can play through, and never on connections that report
`saveData` or a 2G/3G effective type.

To test the script's pure helpers and validate the manifest:

```sh
node tools/test_tv_switcher.js
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
- New hero clip or still: add the files under `assets/hero/<game>/` and the
  entry to `assets/hero/manifest.json`; the page needs no other change.

## License

Site text and images come from the MyNES repository and are covered by its
[Apache License 2.0](https://github.com/yaglo/mynes/blob/master/LICENSE).
