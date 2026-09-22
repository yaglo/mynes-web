---
layout: "page"
title: "Contra: historical 21-preset gallery"
permalink: "/gallery/contra/"
section: "gallery"
description: "Archived 21-preset Contra comparison at 3840×2880, superseded by the 23-preset 4K audit."
source: "docs/contra-preset-gallery.md"
---

This is an archived 21-preset snapshot. Bedroom, Basement, Compact and Arcade were subsequently retuned, and FW900 plus the optics lab brought the library to 23. For the current 4K assessment, see [the preset audit]({{ '/gallery/presets/' | relative_url }}).

For the gameplay presentation, see the [game showcase]({{ '/gallery/showcase/' | relative_url }}) and [full-resolution gameplay / beam close-ups]({{ '/gallery/closeups/' | relative_url }}). This page retains controlled diagnostic comparisons at their stated capture resolutions.

Actual output from the GPU renderer, captured offscreen at **3840×2880**. These captures use the then-current complex-IF, beam and optical renderer, with fixed 1.6× offscreen headroom. Every preset receives the same frozen 256×240 Contra boss PPU-code frame, with its own default connection and controls. Host mask alignment is Panel-pixels at 1:1 offscreen scale. This target is larger than the MacBook panel; it is a controlled 4:3 comparison, not a claim about fullscreen panel mapping.

Every still shows **frame 60 without phase averaging**, at a common 0.6 linear exposure before sRGB conversion. Frame 61 is captured separately for phase-difference measurements. Full-resolution images are lossless WebP. Overview reductions are also made in linear light. Native crops retain the actual single-frame beam shape. These PNG/WebP previews do not reproduce live HDR headroom.

For unaveraged NTSC phases, see the [50 fps GIFs and 60.1 fps motion clips]({{ '/gallery/motion/' | relative_url }}).

## Assessment

**The four main profiles are the strongest way to present the project.** Sony is the focused monitor, JVC the firmer cool consumer set, Toshiba the softer household image, and Stas's Favourite the worn RF set. Mario's bright title screen confirms that the colour and focus differences survive outside the dark Contra scene.

There is still too much overlap in the wider library. Several old shadow-mask profiles are mainly variations of softness and tint; their coarse dot pattern can dominate at native size. The studio/Y/C group also contains near-neighbours. Dying CRT has stable geometry, but its severe blur sacrifices much of the artwork. Keep these as optional looks rather than presenting all twenty-one as equally convincing or individually measured televisions.

The renders have recognizable CRT structure, but a still cannot establish phosphor motion, flicker, time-varying RF noise, geometry breathing or audio synchronization. The supplied CRT photo also contains camera exposure, white-balance, lens and sampling effects; it is a useful qualitative reference, not a direct colour-calibration target. No rendering parameters were changed to make this gallery more flattering.

## Every preset

Each detail panel contains two separate crops: face on the left, platform on the right. Labels and a gutter separate these distant parts of the screen; they are not one contiguous image.

Click a preset name for the complete **3840×2880** render (a lossless WebP of 5–12 MB each). View native crops at 100%: browser resizing can change fine mask appearance.

### Group 1

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-1.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/overview-1.webp' | relative_url }}" alt="Four complete Contra renders" width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1280×1024 size. Open the image for the lossless PNG (1.2 MB).</figcaption>
</figure>

| Preset / connection | Visual assessment |
|---|---|
| [Arcade Cabinet]({{ '/assets/images/contra-gallery/arcade_cabinet.webp' | relative_url }}) · rgb | Clean source and broad beam distinguish it from the fine RGB monitor. Coarse delta dots dominate at close viewing; this is a generic arcade look, not a PlayChoice palette-ROM model. |
| [Basement TV]({{ '/assets/images/contra-gallery/basement_tv.webp' | relative_url }}) · rf | The darkest, muddiest RF image. Useful as a damaged-set extreme, but not a good default: face detail and highlight separation suffer. |
| [Bedroom RF 1990]({{ '/assets/images/contra-gallery/bedroom_rf_1990.webp' | relative_url }}) · rf | Clearer luminance detail with soft RF colour, cool highlights and the original 410-triad shadow mask. Gain 1.25 uses available HDR headroom; this SDR gallery does not reproduce its live highlight luminance. |
| [Compact video monitor]({{ '/assets/images/contra-gallery/commodore_1702.webp' | relative_url }}) · svideo | Clean Y/C edges with a softer desktop-monitor beam. More restrained whites than the warm personal variant; generic rather than Commodore-calibrated. |

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/native-crops-1.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/native-crops-1.webp' | relative_url }}" alt="Native-pixel face and platform details" width="1296" height="1728" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1296×1728 size. Open the image for the lossless PNG (2.8 MB).</figcaption>
</figure>

### Group 2

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-2.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/overview-2.webp' | relative_url }}" alt="Four complete Contra renders" width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1280×1024 size. Open the image for the lossless PNG (1.2 MB).</figcaption>
</figure>

| Preset / connection | Visual assessment |
|---|---|
| [Dying CRT]({{ '/assets/images/contra-gallery/dying_crt.webp' | relative_url }}) · composite | Stable raster and warm, weak-blue image, with severe loss of focus. The trapezoid is gone, but the blur still overwhelms fine artwork; a special effect rather than a showcase default. |
| [Famicom Kitchen]({{ '/assets/images/contra-gallery/famicom_kitchen.webp' | relative_url }}) · rf | Cooler household RF rendition. Its practical difference from Bedroom RF is modest in this scene; another candidate for library consolidation. |
| [JVC D-Series (nominal)]({{ '/assets/images/contra-gallery/jvc_d_series_2000.webp' | relative_url }}) · composite | A strong main profile: cooler platform whites, distinct beam structure and restrained composite colour edges. The slot grid is clear without the large shadow-dot pattern. |
| [Late consumer aperture grille]({{ '/assets/images/contra-gallery/late_crt_wega.webp' | relative_url }}) · composite | Balanced consumer sharpness and visible grille. Attractive, but overlaps JVC/PVM at overview size; not an independently calibrated WEGA. |

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/native-crops-2.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/native-crops-2.webp' | relative_url }}" alt="Native-pixel face and platform details" width="1296" height="1728" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1296×1728 size. Open the image for the lossless PNG (2.5 MB).</figcaption>
</figure>

### Group 3

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-3.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/overview-3.webp' | relative_url }}" alt="Four complete Contra renders" width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1280×1024 size. Open the image for the lossless PNG (1.1 MB).</figcaption>
</figure>

| Preset / connection | Visual assessment |
|---|---|
| [Living Room 1988]({{ '/assets/images/contra-gallery/living_room_1988.webp' | relative_url }}) · composite | Soft, warm household composite image. Broadly convincing from a distance, but coarse phosphor dots compete with the artwork close up. |
| [Large RGB monitor]({{ '/assets/images/contra-gallery/nec_xm29_arcade.webp' | relative_url }}) · rgb | Very clean RGB detail with narrow horizontal beam structure and fine mask. It can resemble raw pixels in a small thumbnail; native crops confirm the CRT stages are active. |
| [Large consumer shadow mask]({{ '/assets/images/contra-gallery/rca_colortrak_1986.webp' | relative_url }}) · composite | Broad beam and warmer consumer response. Visually close to Living Room 1988; limited additional identity in this scene. |
| [Reference composite]({{ '/assets/images/contra-gallery/reference_composite.webp' | relative_url }}) · composite | Sharp composite diagnostic look with visible colour breakup on fine patterns. Useful reference, less attractive as a television showcase. |

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/native-crops-3.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/native-crops-3.webp' | relative_url }}" alt="Native-pixel face and platform details" width="1296" height="1728" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1296×1728 size. Open the image for the lossless PNG (2.2 MB).</figcaption>
</figure>

### Group 4

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-4.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/overview-4.webp' | relative_url }}" alt="Four complete Contra renders" width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1280×1024 size. Open the image for the lossless PNG (1.2 MB).</figcaption>
</figure>

| Preset / connection | Visual assessment |
|---|---|
| [Retro Gaming Setup]({{ '/assets/images/contra-gallery/retro_gaming_setup.webp' | relative_url }}) · svideo | Bright, crisp Y/C picture with an aperture grille. A useful clean alternative, though it overlaps the studio group. |
| [Sony PVM-14L2 (nominal)]({{ '/assets/images/contra-gallery/sony_pvm_14l2.webp' | relative_url }}) · composite | The strongest focused-monitor reference here: separated scanlines, a fine vertical grille and readable white detail. Still cleaner and more regular than the supplied camera photograph; this is not proof of an exact 14L2 match. |
| [Fine aperture grille]({{ '/assets/images/contra-gallery/sony_pvm_20m4u.webp' | relative_url }}) · svideo | The thinnest-looking beam of the clean group. Strong scanline separation; more of an ideal high-resolution monitor than a small consumer TV. |
| [Stas's Favourite]({{ '/assets/images/contra-gallery/stass_favourite.webp' | relative_url }}) · rf | The most distinct worn-TV main profile: softer RF colour, visible convergence and a coarse slot structure. Rich character, but the mask is conspicuous at native size; static captures cannot assess whether its noise or load response moves convincingly. |

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/native-crops-4.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/native-crops-4.webp' | relative_url }}" alt="Native-pixel face and platform details" width="1296" height="1728" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1296×1728 size. Open the image for the lossless PNG (1.8 MB).</figcaption>
</figure>

### Group 5

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-5.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/overview-5.webp' | relative_url }}" alt="Four complete Contra renders" width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1280×1024 size. Open the image for the lossless PNG (1.2 MB).</figcaption>
</figure>

| Preset / connection | Visual assessment |
|---|---|
| [Studio aperture grille]({{ '/assets/images/contra-gallery/studio_pvm.webp' | relative_url }}) · svideo | Clean, high-resolution Y/C, closely related to Fine aperture grille. The two are difficult to justify as separate headline presets. |
| [Toshiba 14AF (nominal)]({{ '/assets/images/contra-gallery/toshiba_14af43.webp' | relative_url }}) · composite | A convincing softer alternative to JVC: wider highlights, stronger blending and a clearly visible slot mask. The grille/mask texture remains prominent in close-up. |
| [Vivid Living Room]({{ '/assets/images/contra-gallery/vivid_living_room.webp' | relative_url }}) · composite | Rich composite colour with a cooler/pinker platform than Warm Desktop. Stronger colour edging is visible around the small numerals; explicitly a personal preference. |
| [Warm Desktop Monitor]({{ '/assets/images/contra-gallery/warm_desktop_monitor.webp' | relative_url }}) · svideo | Warm whites and smooth Y/C detail give this a real distinction from the neutral compact monitor. The amber tint is intentional preference, not factory white-balance evidence. |

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/native-crops-5.png' | relative_url }}"><img src="{{ '/assets/previews/contra-gallery/native-crops-5.webp' | relative_url }}" alt="Native-pixel face and platform details" width="1296" height="1728" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1296×1728 size. Open the image for the lossless PNG (2.3 MB).</figcaption>
</figure>

### Group 6

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/overview-6.png' | relative_url }}"><img src="{{ '/assets/images/contra-gallery/overview-6.png' | relative_url }}" alt="VHS playback" width="640" height="512" loading="lazy"></a>
</figure>

| Preset / connection | Visual assessment |
|---|---|
| [VHS SP — consumer CRT]({{ '/assets/images/contra-gallery/vhs_sp_consumer.webp' | relative_url }}) · composite recording/playback | Softer horizontal luma, narrower color bandwidth and slight color delay precede the Toshiba-style CRT. A generic recovered tape response; timing errors need motion to assess. |

<figure class="figure">
<a href="{{ '/assets/images/contra-gallery/native-crops-6.png' | relative_url }}"><img src="{{ '/assets/images/contra-gallery/native-crops-6.png' | relative_url }}" alt="VHS native face and platform details" width="1296" height="432" loading="lazy"></a>
</figure>

## A second scene

<figure class="figure">
<a href="{{ '/assets/images/readme-mario.png' | relative_url }}"><img src="{{ '/assets/previews/readme-mario.webp' | relative_url }}" alt="Mario through the four main presets" width="1280" height="1024" loading="lazy"></a>
<figcaption class="fig-note">Lossy WebP preview at the original 1280×1024 size. Open the image for the lossless PNG (1.3 MB).</figcaption>
</figure>

The flat sky makes cool/warm decoder response easier to compare. The title and bricks show Sony's sharper separation, JVC's firmer consumer focus, Toshiba's broader beam, and Stas's pronounced recovery/texture. These are frame 180 from the same ROM, with the same resolution and exposure as Contra.

## Reproduce

Use your own legally obtained game/PPU-code fixture; no commercial ROM or game-state binary is included here.

```sh
python3 tools/review/refresh_showcase.py --sections gallery \
  --roms /path/to/roms --mario /path/to/mario.nes \
  --contra /path/to/contra-boss.bin --logs /tmp/mynes-gallery
```

The review script requires NumPy and Pillow. Full images are actual 3840×2880 renders; no lower-resolution image is enlarged. [Frame metrics](https://github.com/yaglo/mynes/blob/master/docs/contra-gallery-metrics.json) record the phase difference, peak and average light for each preset. These metrics describe the capture; they are not a hardware-fidelity score. See the [preset audit]({{ '/gallery/presets/' | relative_url }}), [hardware references]({{ '/research/hardware/' | relative_url }}) and [model limits](https://github.com/yaglo/mynes/blob/master/docs/gpu-pipeline-reference.md).
