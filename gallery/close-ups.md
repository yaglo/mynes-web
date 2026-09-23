---
layout: "page"
title: "Close-ups"
permalink: "/gallery/close-ups/"
section: "gallery"
description: "Crops of 3840×2880 CRT renders at native pixels, and the beam height measured at 3 brightness levels on 4 presets."
source: "docs/gpu-beam-closeups.md"
updated: 2026-09-23
redirect_from:
  - "/gallery/closeups/"
---

This page shows crops of CRT renders at native pixels, mostly on the Sony PVM-14L2 preset, and measures how the beam height changes with brightness on 4 presets. The Castlevania, Darkwing Duck and Mega Man 2 renders are 3840×2880, with the whole 4:3 game image 3840 pixels wide and no side bars. The beam height fixture is the exception: a 2880×2160 game viewport on a 3840×2160 canvas. Each image is a single NTSC phase. Scaling a render changes its apparent mask pattern, so each render here is shown at one image pixel per device pixel and links to its PNG file.

## Castlevania castle hall

The frame is emulated frame 2500 on the Sony PVM-14L2 preset, composite input, at an exposure of 0.6. The frame and its beam buffer are both 3840×2880. Drag the full frame below to move around it; the crop after it comes from the same frame.

{% include pan.html id="castlevania-castle-hall-pvm" %}

{% include crop.html id="castlevania-castle-hall-pvm-detail" note="Simon, the window tracery and the damaged masonry, with the beam spot and the aperture grille visible on each." %}

## Contra boss on the Studio aperture grille preset

{% include crop.html id="contra-boss-studio-aperture-grille-details" alt="The Contra boss's face and a platform on the Studio aperture grille preset, 2 labeled crops." %}

The 2 crops are unchanged from the [archived Contra gallery]({{ '/archive/contra/' | relative_url }}): one unaveraged frame of a 3840×2880 render. Averaging 2 phases whose scanlines sit on different rows makes the beam look wider than it is in either phase, so the image keeps a single phase. The crops come from different heights in the frame and are separated and labeled. They differ in position as well as in brightness, so they show the scanline structure without isolating spot growth with brightness; the fixture in [beam height vs brightness](#beam-height-vs-brightness-on-4-presets) measures that. Studio aperture grille is a generic Y/C monitor preset and a separate preset from the Sony PVM-14L2.

## Darkwing Duck on the bridge

The frame comes from play on the Sony PVM-14L2 preset, composite input, and holds Darkwing, the bridge rails, the supports and the city lights. Its beam buffer is 3840×2880 like the frame.

{% include pan.html id="darkwing-duck-bridge-pvm" %}

{% include crop.html id="darkwing-duck-bridge-pvm-detail" note="The bright support fills more of the gaps between scanlines, and the dim blue sky keeps distinct narrow rows." %}

The crop holds Darkwing, the dim blue sky, the orange rails and the bright support. The earlier [1280×1152 crop at (1600, 1000)]({{ '/assets/images/showcase/4k/darkwing-pvm-gameplay-detail.png' | relative_url }}) of the same frame is also available as a PNG file. On the PVM preset the composite signal visibly softens the edges, which unfiltered RGB pixel art would keep sharp.

## Mega Man 2 title screen on 4 presets

The title screen has dim green strokes, blue shading, bright lettering and fine edges, and the rooftop adds intermediate grays. All 4 renders are emulated frame 900, after Start at frame 600, with the same exposure of 0.6 and the pixel-aligned mask mode. The table links the 1024×683 title crops at (1680, 427), the full frames and the 768×683 rooftop crops at (2973, 1413).

| Preset | Title crop, 1024×683 | Full frame, 3840×2880 | Rooftop crop, 768×683 |
|---|---|---|---|
| Sony PVM-14L2 | [Beam and grille]({{ '/assets/images/showcase/4k/sony_pvm_14l2-beam.png' | relative_url }}) | [3840×2880 PNG]({{ '/assets/images/showcase/4k/sony_pvm_14l2.png' | relative_url }}) | [768×683 PNG]({{ '/assets/images/showcase/4k/sony_pvm_14l2-rooftop.png' | relative_url }}) |
| JVC D-Series | [Beam and slots]({{ '/assets/images/showcase/4k/jvc_d_series_2000-beam.png' | relative_url }}) | [3840×2880 PNG]({{ '/assets/images/showcase/4k/jvc_d_series_2000.png' | relative_url }}) | [768×683 PNG]({{ '/assets/images/showcase/4k/jvc_d_series_2000-rooftop.png' | relative_url }}) |
| Toshiba 14AF | [Beam and slots]({{ '/assets/images/showcase/4k/toshiba_14af43-beam.png' | relative_url }}) | [3840×2880 PNG]({{ '/assets/images/showcase/4k/toshiba_14af43.png' | relative_url }}) | [768×683 PNG]({{ '/assets/images/showcase/4k/toshiba_14af43-rooftop.png' | relative_url }}) |
| Stas's Favourite | [Beam and slots]({{ '/assets/images/showcase/4k/stass_favourite-beam.png' | relative_url }}) | [3840×2880 PNG]({{ '/assets/images/showcase/4k/stass_favourite.png' | relative_url }}) | [768×683 PNG]({{ '/assets/images/showcase/4k/stass_favourite-rooftop.png' | relative_url }}) |

The slider below compares the title lettering on the Sony PVM-14L2 and the Toshiba 14AF, cut again at 1020×684 from (1680, 426) of the same frames. The Toshiba 14AF overscans by 2.2% at each edge and the PVM-14L2 not at all. The lettering is therefore larger on the right, and the 2 sides do not line up at the divider.

{% include compare.html a="mega-man-2-title-sony-pvm-14l2-lettering" b="mega-man-2-title-toshiba-14af43-lettering" note="On the left the dim green strokes keep gaps between scanlines; on the right the outlines are softer and the slots coarser." %}

On the Sony PVM-14L2 the dim green strokes keep visible gaps between scanlines, and the white lettering spreads vertically until it nearly fills them. On the Toshiba 14AF the outlines are softer, and the slot structure is coarser and stands out more. The differences come from each preset's beam, mask and signal processing.

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

## Detail crops from the showcase recordings

{% include gallery-crops.html %}

## Limitations

- No PVM-14L2 beam was measured to calibrate the widths in the table. [Sony's specifications for the PVM-14L2](https://www.sony.jp/pro-monitor/products/PVM-14L2/) give a 0.25 mm aperture grille, 600 TVL horizontal resolution and other monitor properties, and no vertical beam widths to check them against. TVL cannot establish beam height. [How the images are made]({{ '/about/#how-the-images-are-made' | relative_url }}) gives the sources of the presets.
- The raw measurements were last updated in commit [80a69ac](https://github.com/yaglo/mynes/commit/80a69ac01df6487aec9f501f78f9dac841eb370d), and the table does not reflect preset changes made after it.
- Focus evaluation of a color CRT uses both the high- and the low-intensity parts of the spot ([Hitachi beam-profile measurement](https://www.fujipress.jp/jrm/rb/robot000700030238/)). The Gaussian approximation and this FWHM measurement do not establish the tails, the asymmetry or the edge focus of a tube. The next calibration step would photograph isolated gray and white lines on the author's PVM-14L2 with fixed exposure and focus, measured display settings and no clipped highlights.
- At 3840×2880 the PVM preset's fine grille is resolved much better than in a 960×720 capture. With Mask sampling at Panel pixels, the preset rounds its nominal RGB triad period of 3.59 pixels to 4 pixels, 0.41 px or 11% longer than nominal. That gives 960 triads across the 3840-pixel game in place of about 1070. A larger capture alone does not remove this difference, and cropping changes only the framing.
- Beam scanning and phosphor decay take place over time; [Motion]({{ '/gallery/motion/' | relative_url }}) says what still images and 60 fps video show of them.
