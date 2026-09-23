---
layout: "page"
title: "CRT feature comparisons"
permalink: "/archive/feature-tour/"
section: "archive"
description: "5 comparisons from the MyNES renderer: beam current, phosphor structure, deflection and edge focus, room light, and RF and tape noise."
source: "docs/crt-feature-tour.md"
updated: 2026-09-23
archived: 2026-09-23
replaced_by: "/gallery/close-ups/"
sitemap: false
redirect_from:
  - "/gallery/feature-tour/"
---

This page has 5 comparisons rendered by MyNES: beam current, phosphor structure, deflection and edge focus, room light, and RF and tape noise. The panels are the ones in the [README of the code repository](https://github.com/yaglo/mynes#inside-the-glow), and this page adds their capture notes.

## Beam current

{% include crop.html file="assets/images/feature-tour/beam.png" file_1x="assets/images/feature-tour/beam@1x.png" width=1600 height=820 alt="One-line strokes at NES gray codes $00, $10 and $20 on 2 presets, enlarged 4 times." caption='Beam test fixture: one-line strokes at NES gray codes $00, $10 and $20. Sony PVM-14L2 and Bedroom RF 1990 presets. 1600×820 image of 120×40 crops of a 3840×2160 render, each a 4× nearest-neighbor enlargement, <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

The fixture draws the same one-line stroke at 3 NES gray codes, `$00`, `$10` and `$20`, and both presets receive the same input. The Sony PVM-14L2 stays more focused, and Bedroom RF 1990 has a coarser, broader consumer spot. Brightness changes both the emission and the spot width. The fixed phosphor structure stays under the wider beam.

Each crop is 120×40 pixels of the 3840×2160 render, enlarged 4× by nearest-neighbor replication. Exposure is the same in every column and row. The crops come from different horizontal positions on the same line, so their masks and edge-focus states are not artificially aligned.

## Phosphor structure

{% include crop.html file="assets/images/feature-tour/masks.png" file_1x="assets/images/feature-tour/masks@1x.png" width=1600 height=740 alt="A $10 gray field on presets with shadow, slot and aperture-grille masks, enlarged 3 times." caption='NES gray code $10 as a field. 3 shipped presets with shadow, slot and aperture-grille masks. 1600×740 image of 3× nearest-neighbor enlargements, <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

The panel shows the same `$10` gray field on 3 shipped presets. The dot lattice, the vertical slots and the continuous grille differ at native resolution, and the 3× enlargement makes the differences legible on a README page.

The crops keep each preset's whole color, beam and mask response, so the comparison covers more than the mask kernel. A 4:3 picture inside a UHD frame is 2880 pixels wide. Even at 4K, a grille of 1200 triads then gets 2.4 host pixels per triad, too few to resolve every RGB stripe, and the renderer filters that structure on purpose.

## Deflection and edge focus

<figure class="figure">
<a href="{{ '/assets/images/feature-tour/geometry-focus.png' | relative_url }}"><img src="{{ '/assets/images/feature-tour/geometry-focus.png' | relative_url }}" alt="Raster geometry and focus at the center and the edge on 2 presets and a diagnostic setup." width="1600" height="1310" loading="lazy"></a>
</figure>

The top pair shows the unmodified Toshiba 14AF and Bedroom RF 1990 presets on a common grid. Curvature and overscan both shape their outlines. The deflection models work in the image domain and do not reconstruct the radii of the glass.

The lower pair is explicitly a diagnostic setup, and neither a shipped preset nor a measured tube. It uses Reference composite with `edge_focus = 1.2`, zero convergence offsets and zero vignette. Identical white crosses sit at source coordinates (128, 120) and (224, 32).

The 2 crops have the same size, are centered on their emitted light and are enlarged 2×. Neither was stretched, sharpened or normalized for exposure on its own. The pair shows the focus control apart from the subtler settings of the normal presets, and composite color stays in both crosses.

## Room light

These captures turn on the optional simulated room lighting. Playback starts with it off. The G key turns ambient reflections and glare on or off together and remembers the choice, and the reproduction scripts use `--room-reflections`.

<figure class="figure">
<a href="{{ '/assets/images/feature-tour/room-light.png' | relative_url }}"><img src="{{ '/assets/images/feature-tour/room-light.png' | relative_url }}" alt="Kitchen, evening and desktop reflections on a black screen and on Castlevania III." width="1600" height="1020" loading="lazy"></a>
</figure>

The upper row shows normal NES black `$0f`, and the lower row the same Castlevania III BLK 1-02 framebuffer on each preset. Kitchen, Living Room and Warm Desktop have distinct soft reflections. The raster can go dark while room light still falls on the glass. Internal light scatter and halation are a separate stage.

The upper row includes the whole UHD canvas. The lower row crops the gameplay to the 4:3 image so it stays legible, and both rows are reduced with Lanczos resampling. The environments are authored moods, with approximate color-temperature tints and broad procedural lights. They do not simulate a furnished room, reflections from surface normals, bezel materials or absolute lux.

## RF and tape noise

{% include crop.html file="assets/images/feature-tour/noise.webp" file_1x="assets/images/feature-tour/noise@1x.webp" width=1600 height=880 alt="48 frames of RF and VHS noise on uniform gray and normal black, enlarged 2 times." caption='RF and VHS noise on uniform gray and normal black. 1600×880 image of 2× nearest-neighbor enlargements of crops of a 4K render, 48 consecutive frames at 67 ms each, <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR lossless WebP</span>.' %}

Each side holds 48 consecutive frames of a 4K render of uniform gray and normal black. The top patches cover the output rectangle (2380, 170) to (2660, 270), and the bottom patches cover (600, 170) to (880, 270). The crops are doubled by nearest-neighbor replication, with no exposure lift, denoising, temporal averaging or added grain.

Playback is 67 ms per frame, about 4 times the frame time of the 60.1 Hz source. The loop jumps back after frame 77. It is a sequence for inspection and does not test host presentation or long transport motion.

RF noise enters at reception, and tape luma grain, color noise and transport errors come before the television decoder. The VHS preset uses a slightly lifted receiver operating point so shadow grain survives the gun response, and a reduced gain keeps white close to the previous setting. The lifted black is an authored playback look and makes no claim that every VHS deck raises black to a fixed digital value. The audit records the [patch measurements before and after the change]({{ '/archive/presets/' | relative_url }}#assessment-of-the-shared-engine).

The [static first frame]({{ '/assets/images/feature-tour/noise-still.png' | relative_url }}) and the [capture settings, fixture hashes and renderer fingerprints]({{ '/assets/images/feature-tour/sources.json' | relative_url }}) are separate files.

## Reproduction

Build the GPU frontend first. The scripts need Python with Pillow and NumPy. The layout uses the Avenir Next font of macOS; on another system, change `FONT` in the layout script. The renderer writes the UHD screenshots, and the scripts only crop, arrange and label them.

```sh
python3 tools/review/audit_presets.py \
  --game-codes /path/to/256x240-palette-frame.raw --publish docs
python3 tools/review/feature_showcase.py
```

The game input is 61,440 bytes of NES palette codes, and the SHA-256 of the reviewed scene is in [the audit manifest](https://github.com/yaglo/mynes/blob/master/docs/preset-audit-4k.json). The synthetic fixtures need no ROM.

By default, full audit captures stay in `/tmp/mynes-preset-audit-4k`, diagnostic captures and logs in `/tmp/mynes-feature-showcase`, and the selected presentation images in `docs/images/feature-tour`. Captures use an isolated user configuration, SDR output, physical mask pitch and no phase averaging. Before it reuses a capture, the feature tool checks the fingerprints of the input, the preset, the executable and the shaders.

The [23-preset audit]({{ '/archive/presets/' | relative_url }}) covers backgrounds, beam, masks, noise, optics, names and the remaining limits.

## Limitations

These spatial examples cannot establish the luminance of a physical display, and they cannot show that live presentation is free of flicker.
