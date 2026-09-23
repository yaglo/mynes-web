---
layout: "page"
title: "Showcase"
permalink: "/archive/showcase/"
section: "archive"
description: "NES games rendered through the MyNES GPU signal and CRT pipeline: Castlevania on the PVM at 3840×2880, five 60.1 fps clips, native phase detail and VHS playback."
source: "docs/nes-visual-showcase.md"
source_note: "The video table is shown as embedded players with poster frames"
archived: 2026-09-23
replaced_by: "/gallery/games/"
sitemap: false
redirect_from:
  - "/gallery/showcase/"
---

NES games rendered through MyNES's GPU signal and CRT pipeline.

<figure class="figure">
<a href="{{ '/assets/images/showcase/4k/castlevania-pvm-gameplay.png' | relative_url }}"><img src="{{ '/assets/previews/showcase/4k/castlevania-pvm-gameplay.webp' | relative_url }}" alt="Castlevania on the Sony PVM-14L2, 3840×2880" width="1600" height="1200" loading="lazy"></a>
<figcaption class="fig-note">Preview reduced to 1600×1200. Open the image for the original 3840×2880 PNG (11.9 MB).</figcaption>
</figure>

[Close-up of the same frame]({{ '/assets/images/showcase/4k/castlevania-pvm-detail.png' | relative_url }}) · [Current 23-preset audit]({{ '/archive/presets/' | relative_url }})


## Watch

<figure class="figure video">
<video controls preload="metadata" playsinline width="960" height="720" poster="{{ '/assets/posters/showcase/showcase-reel.webp' | relative_url }}">
<source src="{{ '/assets/images/showcase/showcase-reel.mp4' | relative_url }}" type="video/mp4">
</video>
<figcaption>Five games in 20 seconds · 60.1 fps · the original 960×720 capture · <a href="{{ '/assets/images/showcase/showcase-reel.mp4' | relative_url }}">MP4, 12.1 MB</a></figcaption>
</figure>

<div class="video-grid">
<figure class="figure video">
<video controls preload="none" playsinline width="960" height="720" poster="{{ '/assets/posters/showcase/kirby-jvc_d_series_2000.webp' | relative_url }}">
<source src="{{ '/assets/images/showcase/kirby-jvc_d_series_2000.mp4' | relative_url }}" type="video/mp4">
</video>
<figcaption>Kirby's Adventure · Animated title and opening · JVC D-Series · <a href="{{ '/assets/images/showcase/kirby-jvc_d_series_2000.mp4' | relative_url }}">MP4, 2.1 MB</a></figcaption>
</figure>
<figure class="figure video">
<video controls preload="none" playsinline width="960" height="720" poster="{{ '/assets/posters/showcase/little-samson-jvc_d_series_2000.webp' | relative_url }}">
<source src="{{ '/assets/images/showcase/little-samson-jvc_d_series_2000.mp4' | relative_url }}" type="video/mp4">
</video>
<figcaption>Little Samson · Mountain and palace opening · JVC D-Series · <a href="{{ '/assets/images/showcase/little-samson-jvc_d_series_2000.mp4' | relative_url }}">MP4, 4.2 MB</a></figcaption>
</figure>
<figure class="figure video">
<video controls preload="none" playsinline width="960" height="720" poster="{{ '/assets/posters/showcase/darkwing-stass_favourite.webp' | relative_url }}">
<source src="{{ '/assets/images/showcase/darkwing-stass_favourite.mp4' | relative_url }}" type="video/mp4">
</video>
<figcaption>Darkwing Duck · Bridge gameplay · Stas's Favourite · RF · <a href="{{ '/assets/images/showcase/darkwing-stass_favourite.mp4' | relative_url }}">MP4, 3.4 MB</a></figcaption>
</figure>
<figure class="figure video">
<video controls preload="none" playsinline width="960" height="720" poster="{{ '/assets/posters/showcase/mario-3-toshiba_14af43.webp' | relative_url }}">
<source src="{{ '/assets/images/showcase/mario-3-toshiba_14af43.mp4' | relative_url }}" type="video/mp4">
</video>
<figcaption>Super Mario Bros. 3 · Animated theatrical title · Toshiba 14AF · <a href="{{ '/assets/images/showcase/mario-3-toshiba_14af43.mp4' | relative_url }}">MP4, 1.3 MB</a></figcaption>
</figure>
<figure class="figure video">
<video controls preload="none" playsinline width="960" height="720" poster="{{ '/assets/posters/showcase/mega-man-2-sony_pvm_14l2.webp' | relative_url }}">
<source src="{{ '/assets/images/showcase/mega-man-2-sony_pvm_14l2.mp4' | relative_url }}" type="video/mp4">
</video>
<figcaption>Mega Man 2 · Rooftop title · Sony PVM-14L2 · <a href="{{ '/assets/images/showcase/mega-man-2-sony_pvm_14l2.mp4' | relative_url }}">MP4, 1.2 MB</a></figcaption>
</figure>
</div>

All clips run at 60.0988 fps with alternating NTSC phases kept separate; nothing autoplays on this page. The [motion review]({{ '/archive/motion-review/' | relative_url }}) explains the capture method.

## Look closer


[Full-resolution gameplay and native close-ups]({{ '/gallery/close-ups/' | relative_url }}) show the beam, grille and brightness-dependent scanline width. Full game captures are 3840×2880; the four-preset title comparison also renders the complete 4:3 image at 3840×2880.

<figure class="figure">
<a href="{{ '/assets/images/showcase/kirby-phase-detail.webp' | relative_url }}"><img src="{{ '/assets/images/showcase/kirby-phase-detail.webp' | relative_url }}" alt="Kirby title: native-pixel, unaveraged phase detail" width="384" height="256" loading="lazy"></a>
</figure>

This lossless animated detail retains the changing NTSC phases. The videos run at 60.0988 fps without frame blending. README GIF previews use 50 fps for compatibility; click through to the videos for the original cadence.


## VHS playback


The clips below predate the September 22 shadow-grain and chroma-delay tuning.
See the [current feature tour]({{ '/archive/feature-tour/' | relative_url }}) for the updated noise comparison.

<figure class="figure">
<a href="{{ '/assets/images/showcase/4k/contra-vhs-sp.png' | relative_url }}"><img src="{{ '/assets/previews/showcase/4k/contra-vhs-sp.webp' | relative_url }}" alt="Contra boss through VHS SP recording and a consumer CRT, 3840×2880" width="1600" height="1200" loading="lazy"></a>
<figcaption class="fig-note">Preview reduced to 1600×1200. Open the image for the original 3840×2880 PNG (9.4 MB).</figcaption>
</figure>

*Actual GPU output · one unaveraged frame · SDR · click for the full 3840×2880 image.*

Select **VHS SP playback** in **OSD → Presets**.
The composite recording/playback stage softens horizontal detail and spreads
color before the picture reaches the consumer CRT. Adjust it under
**Signal chain → VHS recording / playback**.

This is a generic recovered VHS response, not a calibrated VCR model.
The still shows its bandwidth and color effects. [Watch four seconds of unaveraged VHS playback]({{ '/assets/images/motion/boss-vhs_sp_consumer.mp4' | relative_url }}) for the residual timing and phase behavior. [Preset file](https://github.com/yaglo/mynes/blob/master/presets/vhs_sp_consumer.json).

[Capture details](https://github.com/yaglo/mynes/blob/master/docs/showcase-captures.json) · [CRT presets]({{ '/archive/presets/' | relative_url }}) · [Beam measurements]({{ '/gallery/close-ups/' | relative_url }}#does-the-beam-actually-widen)
