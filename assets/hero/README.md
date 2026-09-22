# assets/hero: clips and stills for the landing-page television switcher

`_includes/tv-switcher.html`, `assets/js/tv-switcher.js` and
`assets/css/tv.css` read `manifest.json` from this directory. A visitor picks
a game recording, switches the CRT preset while the clip keeps playing and
inspects the picture through a round lens. The showcase pipeline in the code
repository (`tools/showcase/`) writes this directory; the site only reads it.

The script reads manifest version 1 (the seed data committed today) and
version 2 (what the rebuilt pipeline writes). A manifest without a `version`
key is version 1.

## Display rules

- One source pixel per device pixel. The stage uses the stage clip whose
  width at the display's pixel ratio fits the switcher (1920 px on a 2x
  display, 960 px on a 1x display) and sets its CSS width to
  `width / devicePixelRatio`, placed on whole device pixels. Only when no
  clip fits (phones) is the picture scaled down, with the note "Scaled to fit
  this window. Inspect shows 1:1."
- The lens is a round element (`border-radius: 50%`, `overflow: hidden`)
  holding the full-resolution `<video>` or `<img>` at 1:1, 2:1 or 4:1,
  moved by CSS translate on whole device pixels. There is no canvas, and
  nothing that contains media gets a filter, clip-path, blend mode or
  opacity below 1. The stage clip is never magnified.
- HDR files are used when `(dynamic-range: high)` matches and the browser
  reports it can decode the file (`canPlayType` and
  `mediaCapabilities.decodingInfo` with `transferFunction: 'pq'`,
  `colorGamut: 'rec2020'`); otherwise the SDR render. A chip next to the
  controls says which one plays.

## What Inspect does

| The clip has | Inspect |
|---|---|
| `lens` clips (version 2) | Loads the 3840x2880 lens clip, showing its size and progress, and keeps it on the stage clip's frame with `requestVideoFrameCallback`: a seek above 1.5 frames of drift, otherwise `playbackRate` within 3 % of 1. Freeze pauses both clips at once. |
| a `still` only | Freezes the stage on the still's frame and shows the still at 1:1: the HDR AVIF on an HDR display, else the lossless PNG. |
| neither | Disabled, with "Full-resolution capture not rendered yet". |

## manifest.json, version 2

One directory per clip, `assets/hero/<game>/<preset>/`. File names are the
pipeline's choice; the script only reads the fields.

```json
{
  "version": 2,
  "fps": 60.0988,
  "aspect": [4, 3],
  "presets": [{"id": "sony_pvm_14l2", "name": "Sony PVM-14L2", "blurb": "Focused beam, fine aperture grille, D65, composite"}],
  "games": [{"id": "super-mario-bros", "title": "Super Mario Bros.", "scene": "World 1-1", "default_preset": "sony_pvm_14l2"}],
  "clips": {
    "super-mario-bros": {
      "sony_pvm_14l2": {
        "poster": "assets/hero/super-mario-bros/sony_pvm_14l2/poster.webp",
        "stage": [
          {"src": "assets/hero/super-mario-bros/sony_pvm_14l2/stage-1920-hdr-hevc.mp4",
           "type": "video/mp4; codecs=\"hvc1.2.4.L153.B0\"", "hdr": true,
           "width": 1920, "height": 1440, "bytes": 1234567},
          {"src": "assets/hero/super-mario-bros/sony_pvm_14l2/stage-960-sdr.mp4",
           "type": "video/mp4; codecs=\"avc1.640020\"", "hdr": false,
           "width": 960, "height": 720, "bytes": 1234567}
        ],
        "lens": [
          {"src": "assets/hero/super-mario-bros/sony_pvm_14l2/lens-hdr-hevc.mp4",
           "type": "video/mp4; codecs=\"hvc1.2.4.L183.B0\"", "hdr": true,
           "width": 3840, "height": 2880, "bytes": 1234567}
        ],
        "still": {"hdr": "assets/hero/super-mario-bros/sony_pvm_14l2/still-hdr.avif",
                  "sdr": "assets/hero/super-mario-bros/sony_pvm_14l2/still-sdr.png",
                  "width": 3840, "height": 2880, "frame": 0},
        "hdr": {"white_nits": 203, "headroom": 4.0, "max_cll": 812, "max_fall": 50}
      }
    }
  }
}
```

| Key | Meaning |
|---|---|
| `version` | `2`. |
| `fps` | Frame rate of every clip (NTSC NES: 60.0988). The lens sync measures drift in frames of this rate. |
| `aspect` | Stage aspect as `[w, h]`; the television image is 4:3. |
| `presets[]` | Every preset the switcher may offer, in chip order; number keys 1 to 9 pick them. A preset without a clip for the current game is a disabled chip ("not rendered yet"). |
| `games[]` | Game tabs, in order. `default_preset` is used when the current preset has no clip for that game. |
| `clips[game][preset]` | Media for one game on one preset. Every key is optional; an entry with no stage clip, poster or still is ignored. |
| `poster` | Frame 0 of the stage render. A path, an object `{"src", "width", "height"}`, or a list of those when there is one poster per stage size. A poster is shown only when its pixel size equals the stage clip's size, so it is never scaled. |
| `stage[]` | Stage clips, one per size and range: `src`, `type` (MIME type with the `codecs` parameter from ffprobe), `hdr` (PQ, BT.2020), `width`, `height`, `bytes`. The script picks the size first, then HDR over SDR, then a decoder the browser reports as power-efficient and smooth, then manifest order. |
| `lens[]` | 3840x2880 clips in the same shape, with the same frame count and start as the stage clips. |
| `still` | One frame at full size: `hdr` (AVIF, CICP 9/16/9, 10-bit 4:4:4), `sdr` (lossless PNG), `width`, `height`, and `frame`, the index of that frame in the stage clips. |
| `hdr` | Mastering data of the HDR files: `white_nits` (SDR white), `headroom`, `max_cll`, `max_fall`. Shown in the chip's tooltip. |

Paths are relative to the site root, without a leading slash and without
the `baseurl`; the script prefixes them.

## manifest.json, version 1 (seed data)

```json
{
  "fps": 60.0988,
  "aspect": [4, 3],
  "presets": [{"id": "sony_pvm_14l2", "name": "Sony PVM-14L2", "blurb": "Focused beam, fine aperture grille, D65, composite"}],
  "games": [{"id": "mega-man-2-title", "title": "Mega Man 2", "scene": "Rooftop title", "default_preset": "sony_pvm_14l2"}],
  "clips": {
    "mega-man-2-title": {
      "sony_pvm_14l2": {
        "video":      "assets/images/showcase/mega-man-2-sony_pvm_14l2.mp4",
        "poster":     "assets/hero/mega-man-2-title/sony_pvm_14l2.poster.webp",
        "still":      "assets/hero/mega-man-2-title/sony_pvm_14l2.4k.webp",
        "still_size": [3840, 2880],
        "full":       "assets/images/showcase/4k/sony_pvm_14l2.png"
      }
    }
  }
}
```

A version 1 `video` is one SDR H.264 clip of unknown size; the stage takes
its size from the file. Inspect uses the still tier when the clip has a
`full` PNG (preferred, lossless) or a `still` WebP, both taken as frame 0,
and is disabled otherwise. There are no lens clips in version 1.

## Rules the pipeline must keep

- Frame `still.frame` of every stage and lens clip of a preset is the frame
  in the still, and posters are frame 0.
- All clips of one game share the input replay and length, so seeking one
  to another's `currentTime` shows the same moment on another television.
- Nothing is scaled, averaged, blended or retimed: each file is rendered by
  the emulator at its own size, and each video frame is one emulator frame.

`node tools/test_tv_switcher.js` (from the site root) checks the live
manifest and the version 2 fixture in `tools/tv-fixture/` against these
rules as far as they can be checked offline: ids are unique, every
`default_preset` has a clip, referenced files exist with the sizes, byte
counts, frame counts and HDR tags the manifest claims, and paths carry no
leading slash.

## Seed contents (version 1)

| Game | Presets with a clip | Presets with a 3840x2880 still |
|---|---|---|
| `mega-man-2-title` | `sony_pvm_14l2` (960x720) | `sony_pvm_14l2`, `jvc_d_series_2000`, `toshiba_14af43`, `stass_favourite` (one shared title frame, from `assets/images/showcase/4k/`) |
| `kirby-title` | `jvc_d_series_2000` | none |
| `little-samson-opening` | `jvc_d_series_2000` | none |
| `darkwing-bridge` | `stass_favourite` | none (the existing Darkwing 4K frame is a PVM render, a different preset) |
| `mario-3-title` | `toshiba_14af43` | none |

`reference_composite` and `vhs_sp_consumer` are listed in `presets` without
clips so the switcher shows what is still to be rendered.

The posters were written by ffmpeg (frame 0 to PNG) and Pillow (WebP,
quality 85). The `.4k.webp` stills come from the 3840x2880 PNGs at quality
90. Posters for presets without a clip are the 4K frame reduced 4x by area
averaging, which breaks the no-scaling rule; the version 2 pipeline replaces
them with native 960x720 and 1920x1440 renders.
