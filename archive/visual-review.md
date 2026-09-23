---
layout: "page"
title: "CRT visual review, 2026-09-21"
permalink: "/archive/visual-review/"
section: "archive"
description: "Renders of the same Contra boss on 4 presets, checks of 2 drawable sizes and 3 connections, OSD captures, and what stills leave unverified."
source: "docs/gpu-visual-review.md"
updated: 2026-09-23
archived: 2026-09-23
replaced_by: "/gallery/televisions/"
sitemap: false
redirect_from:
  - "/gallery/visual-review/"
---

This review compares the same Contra boss frame on 4 presets and checks the mask at 2 drawable sizes, 3 connections, the OSD and the RF noise over time. Gameplay clips are on the archived [game clips page]({{ '/archive/showcase/' | relative_url }}), and gameplay at full resolution and beam close-ups are on the [Close-ups page]({{ '/gallery/close-ups/' | relative_url }}). This page keeps controlled diagnostic comparisons at the capture resolutions stated with each.

## Test conditions

The Contra images come from the SDL3 GPU pipeline, rendered offscreen at 3840×2880 with a fixed output headroom of 1.6×. Stills show frame 60 with no averaging, and frame 61 is captured separately for the phase checks. The SDR previews use a common linear exposure of 0.6 to keep bright phosphor detail, and they do not establish the luminance of a screen. The native crops are not resized.

## Contra boss on 4 presets

<figure class="figure">
<a href="{{ '/assets/images/crt-contra-review.png' | relative_url }}"><img src="{{ '/assets/previews/crt-contra-review.webp' | relative_url }}" alt="Reduced full frames of the Contra boss on the 4 main presets." width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the 1280×1024 size of the lossless PNG it links to (1.3 MB).</figcaption>
</figure>

{% include crop.html file="assets/images/crt-contra-native.png" file_1x="assets/images/crt-contra-native@1x.png" width=1296 height=1728 alt="Face and platform crops of the Contra boss on the Sony PVM-14L2, JVC D-Series, Toshiba 14AF and Stas's Favourite presets." caption='Contra, waterfall boss, frame 60. Sony PVM-14L2, JVC D-Series, Toshiba 14AF and Stas&#39;s Favourite presets. 1296×1728 image of 8 labeled native-pixel crops of 3840×2880 frames (face left, platform right), <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

The fixture holds PPU codes captured from a Contra ROM at the Waterfall boss. A CRT photograph of the same boss is the reference for the scene, and its player and projectile states differ. The source was not reconstructed from that photograph.

- Sony PVM-14L2: fine aperture grille, neutral D65 white, adaptive composite separation and narrower midtone spots. Bright lines widen per gun, and the nominal vertical response measures 0.388 to 0.900 source lines across the tested drive range. The high-contrast mask stays conspicuous in a native close-up. The preset interprets the nominal PVM-14L2.
- JVC D-Series: 2-line separation, cool white, a mild red push in the decoder, a curved consumer raster and an inline slot mask. The white point and the decoder values are estimates based on the hardware and owner references.
- Toshiba 14AF: near-flat face, 3-line separator and broader bright spots. Its slot pitch is an estimate. The target is the look of a small consumer set, with less resolution than a PVM.
- Stas's Favourite: RF, modest noise, imperfect convergence and gray tracking, broad highlights and causal recovery. The coarse delta-dot weave of the earlier version hid detail, and a finer inline mask keeps the vertical RGB structure. Recovery after bright and dark patches and contraction under load stay active.

All 4 presets give the boss a yellow-green face and magenta-red eyes. The photograph has brighter, cooler platform whites and redder eyes. In the photograph, exposure, camera white balance, console revision, decoder adjustment and connection are confounded. RF is plausible, but the photograph cannot identify it conclusively. No preset was tuned to match the photograph.

## Mask resolution at the drawable size

The renderer generates the grille at the drawable size. Panel mode quantizes the complete RGB period, so at this resolution the nominal 1070 triads of the PVM become a coarser resolved grille. Physical-pitch mode keeps the tube's density and filters the structure it cannot resolve. Neither mode proves alignment to individual LCD subpixels, and viewing a crop at a different scale can change the apparent mask.

## GPU regression tests and RF noise correlation

Separate GPU regression tests check the neutral mask mean, nonnegative coverage, RGB and BGR order, resize behavior, linear HDR handling, beam energy and gun-independent growth.

The complex-IF GPU regression test found a maximum absolute correlation of 0.00632 in decoded gray noise at lags 1 to 12. Before the IF update, a separate 36-frame gray-field test on the final render found no repeating peak, with a maximum absolute correlation of 0.034. That test removes the fixed image and mask by subtracting the temporal mean, which introduces a small negative bias. The [final-render metrics](https://github.com/yaglo/mynes/blob/master/docs/gpu-rf-temporal-results.json) hold the numbers.

Replaying the last saved legacy RF profile with all its controls also produced no cycle of several frames. The correlation between adjacent frames decayed and did not return at a periodic lag. These tests do not identify the exact texture reported during the review. Deterministic composite crawl and mask structure have to stay separate from random snow.

## Drawable size and connection checks

{% include crop.html file="assets/images/crt-contra-window-native.png" file_1x="assets/images/crt-contra-window-native@1x.png" width=1280 height=1024 alt="Contra boss crops from a 1280×960 drawable on the 4 main presets." caption='Contra, waterfall boss, frame 60. Sony PVM-14L2, JVC D-Series, Toshiba 14AF and Stas&#39;s Favourite presets. 1280×1024 image of 4 labeled 640×480 native-pixel crops of 1280×960 frames, <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

The same 4 presets were also rendered at 1280×960. The mask is refitted to that drawable, and the images are renders at that size with no resizing of a full-resolution screenshot. In panel mode, fitting complete RGB periods trades the exact tube density for a resolved pattern, so at smaller sizes the PVM grille cannot keep its physical triad count. The native crop is the useful check of the mask, and reduced overview images can introduce aliasing of their own.

<figure class="figure">
<a href="{{ '/assets/images/crt-contra-inputs.png' | relative_url }}"><img src="{{ '/assets/images/crt-contra-inputs.png' | relative_url }}" alt="Reduced Contra frames on the Sony PVM-14L2 preset through component, composite and an external RF receiver." width="1920" height="512" loading="lazy"></a>
</figure>

Through component, the same Contra codes keep their color and have cleaner edges than through composite and RF. Component stands for an ideal decoded or modified source, since the stock NES has no component output. RF here means an external receiver feeding the PVM, which has no tuner. The 4 curated presets keep their defaults: composite for the Sony PVM-14L2, JVC D-Series and Toshiba 14AF, and RF for Stas's Favourite.

## Mario, recovery and OSD captures

<figure class="figure">
<a href="{{ '/assets/images/crt-preset-review.png' | relative_url }}"><img src="{{ '/assets/previews/crt-preset-review.webp' | relative_url }}" alt="Reduced full frames of the Mario title screen on the 4 main presets." width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the 1280×1024 size of the lossless PNG it links to (1.3 MB).</figcaption>
</figure>

<figure class="figure">
<a href="{{ '/assets/images/crt-streak-review.png' | relative_url }}"><img src="{{ '/assets/images/crt-streak-review.png' | relative_url }}" alt="Reduced frames of a bright and dark recovery chart on the 4 main presets." width="1280" height="1024" loading="lazy"></a>
</figure>

These images use the color and inline-mask models of this review. The isolated recovery chart shows a darker wake after white and a brighter wake after black. Stas's Favourite keeps this upstream voltage response, and the regulated PVM gets no artificial worn-TV streak.

{% include crop.html file="assets/images/gpu-osd-review.png" file_1x="assets/images/gpu-osd-review@1x.png" width=1280 height=960 alt="The MyNES OSD open over the Contra boss on the Sony PVM-14L2 preset." caption='Contra, waterfall boss, with the OSD open. Sony PVM-14L2 preset. 1280×960 frame, <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

The translucent OSD groups the physical stages and shows the preset and whether it was modified, the region, the output mode and the headroom. The OSD is injected as RGB after color decoding and before the gun and beam stages, so its text stays free of NES decoder artifacts. Its headroom comes from the same calculation as the renderer's. The offscreen review shows 1.60× and names the hidden drawable as its target, and the physical screen is no longer reported as the target.

{% include crop.html file="assets/images/gpu-osd-adjustment.png" file_1x="assets/images/gpu-osd-adjustment@1x.png" width=1280 height=960 alt="A parameter adjustment strip at the bottom of the screen over the Contra boss on the Sony PVM-14L2 preset." caption='Contra, waterfall boss, with a parameter adjustment strip open. Sony PVM-14L2 preset. 1280×960 frame, <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

Enter on a parameter opens this strip and leaves the value unchanged. Left and Right adjust the value, and Enter or Escape returns to the same menu row. During tuning, the strip covers only the bottom of the screen, and the picture keeps running.

## Checks in this pass

This pass checked the RF behavior of the final image over time, component color, 2 drawable sizes and new Mario and OSD captures. Geometry reuse and direct offscreen readback preserved the reviewed pixels, and screenshot encoding runs outside the interactive render thread. The [benchmarks](https://github.com/yaglo/mynes/blob/master/docs/gpu-benchmark-results.md) separate fence measurements of the complete chain from full playback of a game ROM, and neither timestamp measures photon latency.

## Limitations

The full renders were inspected next to photographs of the named displays, and the [Hardware evidence note]({{ '/notes/hardware/' | relative_url }}) records the evidence and the assumptions separately. The beam and decoder parameters are still nominal. Exact phosphor spectra, non-Gaussian spot tails, individual convergence maps and chip-specific ABL are not calibrated. Paired stills check spatial and phase behavior, and [Motion]({{ '/gallery/motion/' | relative_url }}) says what still images and 60 fps video show of a moving beam.
