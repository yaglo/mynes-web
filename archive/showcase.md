---
layout: "page"
title: "Game clips and full frames"
permalink: "/archive/showcase/"
section: "archive"
description: "Castlevania at 3840×2880 on the Sony PVM-14L2 preset, 5 game clips at 60.1 fps, a lossless NTSC phase detail and a VHS SP playback frame."
source: "docs/nes-visual-showcase.md"
source_note: "The video table is shown as embedded players with poster frames"
updated: 2026-09-23
archived: 2026-09-23
replaced_by: "/gallery/games/"
sitemap: false
redirect_from:
  - "/gallery/showcase/"
---

This page shows NES games rendered by the MyNES GPU signal and CRT pipeline. It has a Castlevania frame at 3840×2880, clips of 5 games at 60.0988 fps, a lossless phase detail and a VHS SP playback frame.

{% include pan.html src="assets/images/showcase/4k/castlevania-pvm-gameplay.png" width=3840 height=2880 x=2000 y=2144 alt="Simon in the Castlevania castle hall on the Sony PVM-14L2 preset, the full 3840×2880 frame." caption="Castlevania, castle hall, emulated frame 2500. Sony PVM-14L2 preset, composite. 3840×2880 frame, shown 1:1. SDR PNG, 11.9 MB." %}

A [1280×1120 crop of the same frame]({{ '/assets/images/showcase/4k/castlevania-pvm-detail.png' | relative_url }}) is a separate PNG file. The [23-preset audit]({{ '/archive/presets/' | relative_url }}) covers every preset.

## Game clips

{% include clip.html src="assets/images/showcase/showcase-reel.mp4" width=960 height=720 poster="assets/posters/showcase/showcase-reel.webp" game="Reel of 5 games" seconds=20 note="The MP4 file is 12.1 MB." %}

{% include clip.html src="assets/images/showcase/kirby-jvc_d_series_2000.mp4" width=960 height=720 poster="assets/posters/showcase/kirby-jvc_d_series_2000.webp" game="Kirby's Adventure" scene="animated title and opening" preset_name="JVC D-Series" seconds=4 note="The MP4 file is 2.1 MB." %}

{% include clip.html src="assets/images/showcase/little-samson-jvc_d_series_2000.mp4" width=960 height=720 poster="assets/posters/showcase/little-samson-jvc_d_series_2000.webp" game="Little Samson" scene="mountain and palace opening" preset_name="JVC D-Series" seconds=4 note="The MP4 file is 4.2 MB." %}

{% include clip.html src="assets/images/showcase/darkwing-stass_favourite.mp4" width=960 height=720 poster="assets/posters/showcase/darkwing-stass_favourite.webp" game="Darkwing Duck" scene="bridge gameplay" preset_name="Stas's Favourite" seconds=4 note="RF input. The MP4 file is 3.4 MB." %}

{% include clip.html src="assets/images/showcase/mario-3-toshiba_14af43.mp4" width=960 height=720 poster="assets/posters/showcase/mario-3-toshiba_14af43.webp" game="Super Mario Bros. 3" scene="animated theatrical title" preset_name="Toshiba 14AF" seconds=4 note="The MP4 file is 1.3 MB." %}

{% include clip.html src="assets/images/showcase/mega-man-2-sony_pvm_14l2.mp4" width=960 height=720 poster="assets/posters/showcase/mega-man-2-sony_pvm_14l2.webp" game="Mega Man 2" scene="rooftop title" preset_name="Sony PVM-14L2" seconds=4 note="The MP4 file is 1.2 MB." %}

All clips run at 60.0988 fps, and consecutive frames keep their own NTSC phases. No clip on this page plays automatically. The [NTSC phase and motion review]({{ '/archive/motion-review/' | relative_url }}) describes the capture method.

## Close-ups and a phase detail

The [Close-ups page]({{ '/gallery/close-ups/' | relative_url }}) has gameplay at full resolution and crops at native pixels that show the beam, the grille and the scanline width changing with brightness. The game captures are 3840×2880, and the title comparison on 4 presets also renders the whole 4:3 image at 3840×2880.

{% include crop.html file="assets/images/showcase/kirby-phase-detail.webp" file_1x="assets/images/showcase/kirby-phase-detail@1x.webp" width=384 height=256 alt="The Kirby's Adventure title in a 24-frame phase detail on the JVC D-Series preset." caption='Kirby&#39;s Adventure, title screen. JVC D-Series preset, composite. 384×256 crop of a 960×720 frame, 24 consecutive frames with no phase averaging, <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR lossless WebP</span>.' %}

The lossless animated detail keeps the changing NTSC phases, and each frame of the clips above is one emulator frame at 60.0988 fps. The GIF previews in the [README of the code repository at af99543]({{ site.project.source_blob }}/README.md) ran at 50 fps, with 20 ms frames, because some players clamp 10 ms GIF frames.

## VHS SP playback

The frame and the clip in this section were rendered before the shadow-grain and chroma-delay tuning of 2026-09-22. The [archived CRT feature comparisons]({{ '/archive/feature-tour/' | relative_url }}) have the updated noise comparison.

{% include pan.html src="assets/images/showcase/4k/contra-vhs-sp.png" width=3840 height=2880 alt="The Contra boss through VHS SP recording and playback on a consumer CRT, the full 3840×2880 frame." caption="Contra, waterfall boss, frame 60. VHS SP playback preset: composite recording and playback into a consumer CRT. 3840×2880 frame with no phase averaging, shown 1:1. SDR PNG, 9.4 MB." %}

To use the preset, select VHS SP playback in OSD → Presets. The composite recording and playback stage softens horizontal detail and spreads color before the picture reaches the consumer CRT. Its settings are under Signal chain → VHS recording / playback.

The preset is a generic recovered VHS response, and no particular VCR was calibrated for it. The frame shows its bandwidth and color effects. The residual timing and phase behavior shows in motion, in [4 s of VHS playback with no averaging]({{ '/assets/images/motion/boss-vhs_sp_consumer.mp4' | relative_url }}). The preset file is [presets/vhs_sp_consumer.json](https://github.com/yaglo/mynes/blob/master/presets/vhs_sp_consumer.json) in the code repository.

The [capture details](https://github.com/yaglo/mynes/blob/master/docs/showcase-captures.json) are in the code repository. The [CRT preset audit]({{ '/archive/presets/' | relative_url }}) covers the presets, and the [beam height measurements]({{ '/gallery/close-ups/' | relative_url }}#beam-height-vs-brightness-on-4-presets) are on the Close-ups page.
