---
layout: "page"
title: "Contra boss on 21 presets"
permalink: "/archive/contra/"
section: "archive"
description: "An archived comparison of 21 presets on the Contra boss at 3840×2880, made before the 23-preset audit."
source: "docs/contra-preset-gallery.md"
updated: 2026-09-23
archived: 2026-09-23
replaced_by: "/gallery/televisions/"
sitemap: false
redirect_from:
  - "/gallery/contra/"
---

This page compares 21 presets on the same Contra boss frame at 3840×2880. Bedroom RF 1990, Basement TV, Compact video monitor and Arcade Cabinet were retuned afterwards, and the FW900 and optics lab presets brought the count to 23. The later assessment at 3840×2160 is the [23-preset audit]({{ '/archive/presets/' | relative_url }}).

Gameplay clips are on the archived [game clips page]({{ '/archive/showcase/' | relative_url }}), and gameplay at full resolution and beam close-ups are on the [Close-ups page]({{ '/gallery/close-ups/' | relative_url }}). This page keeps controlled diagnostic comparisons at the capture resolutions stated with each.

## Test conditions

The GPU renderer captured every frame offscreen at 3840×2880, with the complex-IF, beam and optical stages of the time and a fixed offscreen headroom of 1.6×. Every preset receives the same frozen 256×240 frame of Contra boss PPU codes, with its own default connection and controls. Host mask alignment is Panel-pixels at 1:1 offscreen scale. The target is larger than the MacBook panel, and the comparison is a controlled 4:3 capture.

Every still is frame 60 with no phase averaging, at a common linear exposure of 0.6 before sRGB conversion. Frame 61 is captured separately for the phase-difference measurements. The full-resolution images are lossless WebP files. The overview images are reduced in linear light, and the native crops keep the single-frame beam shape. The PNG and WebP files are SDR, and the [HDR output note]({{ '/notes/hdr/' | relative_url }}) covers the highlights above SDR white.

The [NTSC phase and motion review]({{ '/archive/motion-review/' | relative_url }}) has the NTSC phases with no averaging, as 50 fps GIFs and 60.1 fps clips.

## Assessment of the 21 presets

The 4 main presets cover 4 kinds of picture. The Sony PVM-14L2 is the focused monitor, the JVC D-Series the firmer, cool consumer set, the Toshiba 14AF the softer household picture, and Stas's Favourite the worn RF set. The bright Mario title screen shows that the color and focus differences hold outside the dark Contra scene.

Several of the other presets overlap. Several older shadow-mask presets differ mainly in softness and tint, and their coarse dot pattern can dominate at native size. The studio and Y/C group also holds near neighbors. Dying CRT has stable geometry, but its severe blur loses much of the artwork. The review recommended keeping these presets as optional looks. [How the images are made]({{ '/about/#how-the-images-are-made' | relative_url }}) says what the presets are built from.

The page holds stills only. RF noise over time, geometry breathing and audio synchronization need clips, and [Motion]({{ '/gallery/motion/' | relative_url }}) says what still images show of the beam and the phosphors. A CRT photograph of the boss served as a qualitative reference only, since it carries the camera's exposure, white balance, lens and sampling.

## The 21 presets in 6 groups

Each detail panel holds 2 separate crops, the face on the left and the platform on the right. A label and a gutter separate these distant parts of the screen, and the 2 crops do not form one contiguous image.

Each preset name links to its complete 3840×2880 render, a lossless WebP file of 5 to 12 MB. The native crops below are shown at one image pixel per device pixel, because browser resizing can change how the fine mask looks.

### Group 1: Arcade Cabinet to Compact video monitor

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-1.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/overview-1.webp' | relative_url }}" alt="Reduced full Contra frames on Arcade Cabinet, Basement TV, Bedroom RF 1990 and Compact video monitor." width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the 1280×1024 size of the lossless PNG it links to (1.2 MB).</figcaption>
</figure>

| Preset and connection | Visual assessment |
|---|---|
| [Arcade Cabinet]({{ '/assets/images/contra-gallery/arcade_cabinet.webp' | relative_url }}), RGB | The clean source and the broad beam set it apart from the fine RGB monitor. Coarse delta dots dominate at close viewing. It is a generic arcade look and does not model the PlayChoice palette ROM. |
| [Basement TV]({{ '/assets/images/contra-gallery/basement_tv.webp' | relative_url }}), RF | The darkest picture of the 21: its linear means of 0.035, 0.031 and 0.026 for R, G and B are the lowest in the frame metrics. Face detail and highlight separation are reduced, and the review judged it a poor default. |
| [Bedroom RF 1990]({{ '/assets/images/contra-gallery/bedroom_rf_1990.webp' | relative_url }}), RF | Clearer luminance detail with soft RF color, cool highlights and the original 410-triad shadow mask. Its gain of 1.25 uses the available HDR headroom. |
| [Compact video monitor]({{ '/assets/images/contra-gallery/commodore_1702.webp' | relative_url }}), S-Video | Clean Y/C edges with a softer desktop-monitor beam. Its whites are more restrained than those of the warm personal variant. The preset is generic, and no Commodore monitor was used to calibrate it. |

{% include crop.html file="assets/images/contra-gallery/native-crops-1.png" file_1x="assets/images/contra-gallery/native-crops-1@1x.png" width=1296 height=1728 alt="Face and platform crops of the Contra boss on Arcade Cabinet, Basement TV, Bedroom RF 1990 and Compact video monitor." caption='Contra, waterfall boss, frame 60. Arcade Cabinet, Basement TV, Bedroom RF 1990 and Compact video monitor presets. 1296×1728 image of 8 labeled native-pixel crops of 3840×2880 frames (face left, platform right), <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

### Group 2: Dying CRT to Late consumer aperture grille

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-2.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/overview-2.webp' | relative_url }}" alt="Reduced full Contra frames on Dying CRT, Famicom Kitchen, JVC D-Series and Late consumer aperture grille." width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the 1280×1024 size of the lossless PNG it links to (1.2 MB).</figcaption>
</figure>

| Preset and connection | Visual assessment |
|---|---|
| [Dying CRT]({{ '/assets/images/contra-gallery/dying_crt.webp' | relative_url }}), composite | Stable raster and a warm picture with weak blue, with severe loss of focus. The trapezoid is gone, but the blur still overwhelms fine artwork, which makes it a special effect and a poor default for presenting games. |
| [Famicom Kitchen]({{ '/assets/images/contra-gallery/famicom_kitchen.webp' | relative_url }}), RF | A cooler household RF picture. In this scene it differs little from Bedroom RF 1990, which makes it another candidate for merging. |
| [JVC D-Series]({{ '/assets/images/contra-gallery/jvc_d_series_2000.webp' | relative_url }}), composite | A strong main preset: cooler platform whites, distinct beam structure and restrained composite color edges. The slot grid is clear, without the large shadow-dot pattern. |
| [Late consumer aperture grille]({{ '/assets/images/contra-gallery/late_crt_wega.webp' | relative_url }}), composite | Consumer sharpness and a visible grille. At overview size it overlaps the JVC D-Series and the Sony PVM-14L2. No WEGA was used to calibrate it. |

{% include crop.html file="assets/images/contra-gallery/native-crops-2.png" file_1x="assets/images/contra-gallery/native-crops-2@1x.png" width=1296 height=1728 alt="Face and platform crops of the Contra boss on Dying CRT, Famicom Kitchen, JVC D-Series and Late consumer aperture grille." caption='Contra, waterfall boss, frame 60. Dying CRT, Famicom Kitchen, JVC D-Series and Late consumer aperture grille presets. 1296×1728 image of 8 labeled native-pixel crops of 3840×2880 frames (face left, platform right), <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

### Group 3: Living Room 1988 to Reference composite

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-3.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/overview-3.webp' | relative_url }}" alt="Reduced full Contra frames on Living Room 1988, Large RGB monitor, Large consumer shadow mask and Reference composite." width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the 1280×1024 size of the lossless PNG it links to (1.1 MB).</figcaption>
</figure>

| Preset and connection | Visual assessment |
|---|---|
| [Living Room 1988]({{ '/assets/images/contra-gallery/living_room_1988.webp' | relative_url }}), composite | A soft, warm household composite picture. It convinces from a distance, but close up its coarse phosphor dots compete with the artwork. |
| [Large RGB monitor]({{ '/assets/images/contra-gallery/nec_xm29_arcade.webp' | relative_url }}), RGB | Clean RGB detail with narrow horizontal beam structure and a fine mask. In a small thumbnail it can resemble raw pixels, and the native crops confirm that the CRT stages are active. |
| [Large consumer shadow mask]({{ '/assets/images/contra-gallery/rca_colortrak_1986.webp' | relative_url }}), composite | A broad beam and a warmer consumer response. It looks close to Living Room 1988 and adds little identity of its own in this scene. |
| [Reference composite]({{ '/assets/images/contra-gallery/reference_composite.webp' | relative_url }}), composite | A sharp diagnostic composite look with visible color breakup on fine patterns, for use as a reference. |

{% include crop.html file="assets/images/contra-gallery/native-crops-3.png" file_1x="assets/images/contra-gallery/native-crops-3@1x.png" width=1296 height=1728 alt="Face and platform crops of the Contra boss on Living Room 1988, Large RGB monitor, Large consumer shadow mask and Reference composite." caption='Contra, waterfall boss, frame 60. Living Room 1988, Large RGB monitor, Large consumer shadow mask and Reference composite presets. 1296×1728 image of 8 labeled native-pixel crops of 3840×2880 frames (face left, platform right), <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

### Group 4: Retro Gaming Setup to Stas's Favourite

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-4.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/overview-4.webp' | relative_url }}" alt="Reduced full Contra frames on Retro Gaming Setup, Sony PVM-14L2, Fine aperture grille and Stas's Favourite." width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the 1280×1024 size of the lossless PNG it links to (1.2 MB).</figcaption>
</figure>

| Preset and connection | Visual assessment |
|---|---|
| [Retro Gaming Setup]({{ '/assets/images/contra-gallery/retro_gaming_setup.webp' | relative_url }}), S-Video | A bright, crisp Y/C picture with an aperture grille. It is a useful clean alternative, though it overlaps the studio group. |
| [Sony PVM-14L2]({{ '/assets/images/contra-gallery/sony_pvm_14l2.webp' | relative_url }}), composite | The focused-monitor reference, with separated scanlines, a fine vertical grille and readable white detail. It is cleaner and more regular than the CRT photograph. No match to a PVM-14L2 was measured. |
| [Fine aperture grille]({{ '/assets/images/contra-gallery/sony_pvm_20m4u.webp' | relative_url }}), S-Video | The thinnest-looking beam of the clean group, with strong scanline separation. It looks more like an ideal high-resolution monitor than a small consumer TV. |
| [Stas's Favourite]({{ '/assets/images/contra-gallery/stass_favourite.webp' | relative_url }}), RF | The worn-TV main preset: softer RF color, visible convergence error and a coarse slot structure. Its mask is visible at native size, and its noise and load response need motion to assess. |

{% include crop.html file="assets/images/contra-gallery/native-crops-4.png" file_1x="assets/images/contra-gallery/native-crops-4@1x.png" width=1296 height=1728 alt="Face and platform crops of the Contra boss on Retro Gaming Setup, Sony PVM-14L2, Fine aperture grille and Stas's Favourite." caption='Contra, waterfall boss, frame 60. Retro Gaming Setup, Sony PVM-14L2, Fine aperture grille and Stas&#39;s Favourite presets. 1296×1728 image of 8 labeled native-pixel crops of 3840×2880 frames (face left, platform right), <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

### Group 5: Studio aperture grille to Warm Desktop Monitor

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-5.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/overview-5.webp' | relative_url }}" alt="Reduced full Contra frames on Studio aperture grille, Toshiba 14AF, Vivid Living Room and Warm Desktop Monitor." width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the 1280×1024 size of the lossless PNG it links to (1.2 MB).</figcaption>
</figure>

| Preset and connection | Visual assessment |
|---|---|
| [Studio aperture grille]({{ '/assets/images/contra-gallery/studio_pvm.webp' | relative_url }}), S-Video | Clean high-resolution Y/C, close to Fine aperture grille. The 2 are hard to justify as separate headline presets. |
| [Toshiba 14AF]({{ '/assets/images/contra-gallery/toshiba_14af43.webp' | relative_url }}), composite | A softer alternative to the JVC D-Series, with wider highlights, stronger blending and a visible slot mask. The grille and mask texture stay prominent in close-up. |
| [Vivid Living Room]({{ '/assets/images/contra-gallery/vivid_living_room.webp' | relative_url }}), composite | Rich composite color with a cooler, pinker platform than Warm Desktop Monitor. Stronger color edging shows around the small numerals. The preset is explicitly a personal preference. |
| [Warm Desktop Monitor]({{ '/assets/images/contra-gallery/warm_desktop_monitor.webp' | relative_url }}), S-Video | Warm whites and smooth Y/C detail set it apart from the neutral compact monitor. The amber tint is an intentional preference. |

{% include crop.html file="assets/images/contra-gallery/native-crops-5.png" file_1x="assets/images/contra-gallery/native-crops-5@1x.png" width=1296 height=1728 alt="Face and platform crops of the Contra boss on Studio aperture grille, Toshiba 14AF, Vivid Living Room and Warm Desktop Monitor." caption='Contra, waterfall boss, frame 60. Studio aperture grille, Toshiba 14AF, Vivid Living Room and Warm Desktop Monitor presets. 1296×1728 image of 8 labeled native-pixel crops of 3840×2880 frames (face left, platform right), <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

### Group 6: VHS SP playback

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-6.png' | relative_url }}"><img src="{{ '/assets/images/contra-gallery/overview-6.png' | relative_url }}" alt="Reduced full Contra frame on VHS SP playback." width="640" height="512" loading="lazy"></a>
</figure>

| Preset and connection | Visual assessment |
|---|---|
| [VHS SP playback]({{ '/assets/images/contra-gallery/vhs_sp_consumer.webp' | relative_url }}), composite recording and playback | Softer horizontal luma, narrower color bandwidth and a slight color delay come before a CRT like the Toshiba 14AF. It is a generic recovered tape response, and its timing errors need motion to assess. |

{% include crop.html file="assets/images/contra-gallery/native-crops-6.png" file_1x="assets/images/contra-gallery/native-crops-6@1x.png" width=1296 height=432 alt="Face and platform crops of the Contra boss on VHS SP playback." caption='Contra, waterfall boss, frame 60. VHS SP playback preset. 1296×432 image of 2 labeled native-pixel crops of a 3840×2880 frame (face left, platform right), <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR PNG</span>.' %}

## Mario title screen on the 4 main presets

<figure class="figure">
<a href="{{ '/assets/images/readme-mario.png' | relative_url }}"><img src="{{ '/assets/previews/readme-mario.webp' | relative_url }}" alt="Reduced full frames of the Mario title screen on the 4 main presets." width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the 1280×1024 size of the lossless PNG it links to (1.3 MB).</figcaption>
</figure>

The flat sky makes the cool or warm decoder response easier to compare. In the title and the bricks, the Sony PVM-14L2 separates lines more sharply and the JVC D-Series has firmer consumer focus. The Toshiba 14AF has a broader beam, and Stas's Favourite shows pronounced recovery and texture. All 4 are frame 180 of the same ROM, at the same resolution and exposure as the Contra renders.

## Reproduction

Use your own legally obtained game or PPU-code fixture. No commercial ROM or game-state binary is included.

```sh
python3 tools/review/refresh_showcase.py --sections gallery \
  --roms /path/to/roms --mario /path/to/mario.nes \
  --contra /path/to/contra-boss.bin --logs /tmp/mynes-gallery
```

The review script needs NumPy and Pillow. The full images are 3840×2880 renders. The [frame metrics](https://github.com/yaglo/mynes/blob/master/docs/contra-gallery-metrics.json) record the phase difference, the peak light and the average light of each preset. They describe the capture. The [23-preset audit]({{ '/archive/presets/' | relative_url }}), the [Hardware evidence note]({{ '/notes/hardware/' | relative_url }}) and the [model limits in the pipeline reference](https://github.com/yaglo/mynes/blob/master/docs/gpu-pipeline-reference.md) cover the rest.
