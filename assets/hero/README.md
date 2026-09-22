# assets/hero — clips and stills for the landing-page television switcher

`_includes/tv-switcher.html` and `assets/js/tv-switcher.js` read
`manifest.json` from this directory and let a visitor pick a game recording,
switch the CRT preset while the clip keeps playing and hold a lens over the
picture. The capture pipeline in the code repository writes this directory;
the site only reads it.

## manifest.json

```json
{
  "fps": 60.0988,
  "aspect": [4, 3],
  "presets": [
    {"id": "sony_pvm_14l2", "name": "Sony PVM-14L2", "blurb": "Focused beam, fine aperture grille, D65, composite"}
  ],
  "games": [
    {"id": "mega-man-2-title", "title": "Mega Man 2", "scene": "Rooftop title", "default_preset": "sony_pvm_14l2"}
  ],
  "clips": {
    "mega-man-2-title": {
      "sony_pvm_14l2": {
        "video":      "assets/hero/mega-man-2-title/sony_pvm_14l2.mp4",
        "poster":     "assets/hero/mega-man-2-title/sony_pvm_14l2.poster.webp",
        "still":      "assets/hero/mega-man-2-title/sony_pvm_14l2.4k.webp",
        "still_size": [3840, 2880],
        "full":       "assets/hero/mega-man-2-title/sony_pvm_14l2.4k.png"
      }
    }
  }
}
```

| Key | Meaning |
|---|---|
| `fps` | Frame rate of every clip (NTSC NES: 60.0988). Shown in the caption; playback uses the file's own timing. |
| `aspect` | Stage aspect as `[w, h]`; the television image is 4:3. |
| `presets[]` | Every preset the switcher may offer, in chip order. `name` is the chip label, `blurb` the one-line description in the caption. A preset listed here but missing from a game's `clips` is shown as a disabled chip ("not rendered yet"). |
| `games[]` | Game tabs, in order. `scene` names what the recording shows. `default_preset` is used when the visitor's current preset has no clip for that game. |
| `clips[game][preset]` | Media for one game on one preset. **Every key is optional.** |
| `video` | MP4 (H.264, yuv420p, 60.0988 fps, muted or with audio). All clips of one game are recorded from the same input replay, so they stay in step and a preset switch seeks the new clip to the old clip's time. |
| `poster` | WebP of frame 0 at the clip's size. Shown before the clip can play and as the stage picture when there is no `video`. |
| `still` | Lossy WebP (quality 90) of frame 0 rendered at full size, normally 3840×2880. Fetched only when the visitor freezes; the lens then shows it at one source pixel per device pixel. Without a `still`, freezing pauses the clip and the lens keeps magnifying the video. |
| `still_size` | `[w, h]` of `still`. Optional; read from the image if absent. |
| `full` | Lossless PNG of the same frame for the "Open 4K frame" link. Not fetched by the page. |

Paths are relative to the site root, without a leading slash and without
the `baseurl`; the script prefixes them. They do not have to live under
`assets/hero/`: the seed manifest points `video` at the existing showcase
clips and `full` at the existing 4K PNGs so nothing is duplicated.

Rules the pipeline must keep:

- Frame 0 of `video`, `poster` and `still` are the same emulator frame: the
  freeze tier pauses every clip at time 0 and swaps the lens to the still.
- All clips of one game share the input replay and length, so seeking one to
  another's `currentTime` shows the same moment on a different television.
- Nothing is averaged, blended or retimed: each frame is one emulator frame.

`node tools/test_tv_switcher.js` (from the site root) checks a manifest
against these rules as far as they can be checked offline: ids are unique,
every `default_preset` has a clip, every referenced file exists, paths carry
no leading slash, and `still_size` only appears with a `still`.

## Seed contents

| Game | Presets with a clip | Presets with a 4K still |
|---|---|---|
| `mega-man-2-title` | `sony_pvm_14l2` (960×720) | `sony_pvm_14l2`, `jvc_d_series_2000`, `toshiba_14af43`, `stass_favourite` (one shared title frame, from `assets/images/showcase/4k/`) |
| `kirby-title` | `jvc_d_series_2000` | — |
| `little-samson-opening` | `jvc_d_series_2000` | — |
| `darkwing-bridge` | `stass_favourite` | — (the existing Darkwing 4K frame is a PVM render, a different preset) |
| `mario-3-title` | `toshiba_14af43` | — |

`reference_composite` and `vhs_sp_consumer` are listed in `presets` without
clips so the switcher shows what is still to be rendered.

The posters were written by ffmpeg (frame 0 to PNG) and Pillow (WebP,
quality 85). The `.4k.webp` stills come from the 3840×2880 PNGs at quality
90. Posters for presets without a clip are the 4K frame reduced 4× by area
averaging. The videos are the untouched showcase captures.
