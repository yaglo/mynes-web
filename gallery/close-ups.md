---
layout: "page"
title: "Close-ups"
permalink: "/gallery/close-ups/"
section: "gallery"
description: "Detail crops of the showcase recordings at native pixels, and the beam height measured at 3 brightness levels on 4 presets."
source: "docs/gpu-beam-closeups.md"
updated: 2026-09-23
redirect_from:
  - "/gallery/closeups/"
  - "/gallery/feature-tour/"
  - "/archive/feature-tour/"
---

This page shows detail crops of the showcase recordings at native pixels and measures how the beam height changes with brightness on 4 presets. The crops are cut from 3840×2880 frames, with the whole 4:3 game image 3840 pixels wide and no side bars; the beam height fixture is a 2880×2160 game viewport on a 3840×2160 canvas. Each image is a single NTSC phase. Scaling a render changes its apparent mask pattern, so each render here is shown at one image pixel per device pixel and links to its PNG file.

## Detail crops from the showcase recordings

One crop per game, on the preset its clip plays on first. Each game page shows the same region on every preset it was recorded with, and the [Super Mario Bros. page]({{ '/gallery/games/super-mario-bros/' | relative_url }}#detail-crops) has it on every preset MyNES ships.

{% include gallery-crops.html %}

## Beam height vs brightness on 4 presets

The fixture draws PPU codes $00, $10 and $20 on $0F black. The top row has patches of equal height, and the lower row has strokes one source line tall.

{% include crop.html id="beam-height-fixture-pvm" anchor="does-the-beam-actually-widen" %}

Each consecutive linear-light capture of the final image was measured separately, averaging 96 horizontal pixels at the center of each stroke to suppress mask modulation. FWHM is the vertical width at half the peak luminance above the local background. It is measured before the 0.6 exposure and the sRGB encoding of the PNG files. Each cell gives phase 0 / phase 1, measured independently.

| Preset | Dark gray FWHM | Mid gray FWHM | White FWHM |
|---|---:|---:|---:|
| Sony PVM-14L2 | 4.44 / 4.44 px | 5.74 / 5.74 px | 9.13 / 9.13 px |
| JVC D-Series | 5.45 / 5.45 px | 6.93 / 6.93 px | 10.29 / 10.29 px |
| Toshiba 14AF | 6.64 / 6.64 px | 8.30 / 8.30 px | 12.93 / 12.94 px |
| Stas's Favourite | 5.89 / 5.84 px | 7.60 / 7.60 px | 10.38 / 10.38 px |

At this viewport height a source scanline is nominally 9 output pixels tall (2160 rows for 240 lines); geometry and overscan change the local spacing. The widths are those of the final emitted light, including focus, optics and output response, and differ from the shader's input width parameters. RF and loading also change the drive, so this pattern does not necessarily reach a preset's maximum configured spot. The [raw measurements](https://github.com/yaglo/mynes/blob/master/docs/gpu-beam-measurements.json) are in the code repository.

Brighter strokes are taller, and neighboring bright scanlines merge more than dim ones, which is the physically plausible direction. The shader sets the size of each gun's pixel-integrated Gaussian spot from that gun's current and applies shared focus and loading separately. The gaps between scanlines come from this spot model.

## Limitations

- No PVM-14L2 beam was measured to calibrate the widths in the table. [Sony's specifications for the PVM-14L2](https://www.sony.jp/pro-monitor/products/PVM-14L2/) give a 0.25 mm aperture grille, 600 TVL horizontal resolution and other monitor properties, and no vertical beam widths to check them against. TVL cannot establish beam height. [How the images are made]({{ '/about/#how-the-images-are-made' | relative_url }}) gives the sources of the presets.
- The raw measurements were last updated in commit [80a69ac](https://github.com/yaglo/mynes/commit/80a69ac01df6487aec9f501f78f9dac841eb370d), and the table does not reflect preset changes made after it.
- Focus evaluation of a color CRT uses both the high- and the low-intensity parts of the spot ([Hitachi beam-profile measurement](https://www.fujipress.jp/jrm/rb/robot000700030238/)). The Gaussian approximation and this FWHM measurement do not establish the tails, the asymmetry or the edge focus of a tube. The next calibration step would photograph isolated gray and white lines on the author's PVM-14L2 with fixed exposure and focus, measured display settings and no clipped highlights.
- At 3840×2880 the PVM preset's fine grille is resolved much better than in a 960×720 capture. With Mask sampling at Panel pixels, the preset rounds its nominal RGB triad period of 3.59 pixels to 4 pixels, 0.41 px or 11% longer than nominal. That gives 960 triads across the 3840-pixel game in place of about 1070. A larger capture alone does not remove this difference, and cropping changes only the framing.
- Beam scanning and phosphor decay take place over time; [Motion]({{ '/gallery/motion/' | relative_url }}) says what still images and 60 fps video show of them.
