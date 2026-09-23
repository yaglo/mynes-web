---
layout: "page"
title: "NTSC phase and motion review"
permalink: "/archive/motion-review/"
section: "archive"
description: "Contra boss clips with no phase averaging, 60.1 fps clips, lossless phase details, frame-to-frame measurements and the limits of these checks."
source: "docs/gpu-motion-review.md"
updated: 2026-09-23
archived: 2026-09-23
replaced_by: "/gallery/motion/"
sitemap: false
---

This review shows the NTSC color phase changing between frames on a frozen Contra boss frame, in 960×720 clips at 60.0988 fps and in lossless animated details. It also measures the change between frames.

The alternation between frames is part of the picture MyNES presents. An average of 2 frames helps compare color, but it hides the chroma structure that changes between frames. It can also broaden beams that sit on different rows in the 2 frames. The README of the code repository shows animations with no averaging next to single-frame close-ups at native pixels.

## Contra boss phase clips

{% include clip.html src="assets/images/motion/boss-sony_pvm_14l2.mp4" width=960 height=720 poster="assets/posters/motion/boss-sony_pvm_14l2.webp" game="Contra" scene="waterfall boss, frames 60 to 299" preset_name="Sony PVM-14L2" seconds=4 flicker=true %}

{% include clip.html src="assets/images/motion/boss-stass_favourite.mp4" width=960 height=720 poster="assets/posters/motion/boss-stass_favourite.webp" game="Contra" scene="waterfall boss, frames 60 to 299" preset_name="Stas's Favourite" seconds=4 flicker=true note="RF input." %}

Both clips also exist as 640×480 GIF files: the [Sony PVM-14L2 GIF]({{ '/assets/images/motion/boss-sony_pvm_14l2.gif' | relative_url }}) and the [Stas's Favourite GIF]({{ '/assets/images/motion/boss-stass_favourite.gif' | relative_url }}). Each GIF holds 24 consecutive rendered frames with one fixed 256-color palette and no dithering, and the palette reduction loses some mask and chroma detail.

A GIF frame lasts 20 ms, which is 50 fps, so the 24 frames play 20% longer than at the 60.1 fps of the emulator. GIF frames of 10 ms would come closer, but some players clamp them. The GIFs loop after 0.48 s because of how they were exported, and the loop is no evidence that RF noise repeats in the emulator.

These clips play at the emulator's frame rate:

- [Sony PVM-14L2 (left) and Stas's Favourite RF (right) in sync, 4 s]({{ '/assets/images/showcase/sony-vs-rf.mp4' | relative_url }}).
- [Reel of 5 games, 20 s]({{ '/assets/images/showcase/showcase-reel.mp4' | relative_url }}).
- Contra boss phase clips: [Sony PVM-14L2, 4 s]({{ '/assets/images/motion/boss-sony_pvm_14l2.mp4' | relative_url }}), [Stas's Favourite RF, 4 s]({{ '/assets/images/motion/boss-stass_favourite.mp4' | relative_url }}), [JVC D-Series, 2 s]({{ '/assets/images/motion/boss-jvc_d_series_2000.mp4' | relative_url }}) and [Toshiba 14AF, 2 s]({{ '/assets/images/motion/boss-toshiba_14af43.mp4' | relative_url }}). All run at 60.0988 fps.

The MP4 files are H.264 at CRF 16 with 4:2:0 chroma, so common players decode them, and the 4:2:0 conversion can soften fine chroma. The details below are lossless animated RGB WebP files and skip that conversion. Their frame durations alternate between 16 and 17 ms, so the running time stays close to the emulator's frame rate.

{% include crop.html file="assets/images/motion/boss-sony_pvm_14l2-detail.webp" file_1x="assets/images/motion/boss-sony_pvm_14l2-detail@1x.webp" width=384 height=256 alt="Contra waterfall boss in a 24-frame phase detail on the Sony PVM-14L2 preset." caption='Contra, waterfall boss. Sony PVM-14L2 preset, composite. 384×256 crop of a 960×720 frame, 24 consecutive frames, <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR lossless WebP</span>.' %}

{% include crop.html file="assets/images/motion/boss-stass_favourite-detail.webp" file_1x="assets/images/motion/boss-stass_favourite-detail@1x.webp" width=384 height=256 alt="Contra waterfall boss in a 24-frame phase detail on the Stas's Favourite preset." caption='Contra, waterfall boss. Stas&#39;s Favourite preset, channel 3 RF. 384×256 crop of a 960×720 frame, 24 consecutive frames, <span class="render-scale">shown 1:1</span>. <span class="render-range">SDR lossless WebP</span>.' %}

## Color fringes on the 4 presets

At 960×720, color fringes that alternate between frames are visible around the teeth, the shoulder highlights and other fine edges. In this scene the Sony PVM-14L2 keeps the strongest local alternation of the 4 presets, and the JVC D-Series and, more so, the Toshiba 14AF smooth it. Stas's Favourite adds visibly less orderly fine texture and convergence error. In an average of the 2 phases these differences shrink or disappear.

## Frame-to-frame measurements

The boss frame is frozen, so the changes between frames come from the signal and the CRT model and include no game motion. In the refreshed captures, the median linear RGB RMS difference between adjacent frames is:

| Preset | Median adjacent-frame linear RGB RMS |
|---|---:|
| Sony PVM-14L2 | 0.0506 |
| JVC D-Series | 0.0457 |
| Toshiba 14AF | 0.0319 |
| Stas's Favourite | 0.0396 |

In the channel with the largest change, the whole-image mean changes by 0.00096 peak to peak. The change is mostly local, and the picture as a whole shows no exposure pulse.

The review inspected the decoded frame sequences, measured the changes over time and played the refreshed reel in a native player.

## VHS SP playback

{% include clip.html src="assets/images/motion/boss-vhs_sp_consumer.mp4" width=960 height=720 poster="assets/posters/motion/boss-vhs_sp_consumer.webp" game="Contra" scene="waterfall boss" preset_name="VHS SP playback" seconds=4 flicker=true %}

VHS SP playback is a separate preset. Its 4 s clip shows the recovered luma and chroma bandwidth, small line-correlated residual errors in timing and phase, and playback noise added before the CRT. The boss frame is frozen, so the changes come from the state of the signal and the CRT model. The [lossless phase detail at native pixels]({{ '/assets/images/motion/boss-vhs_sp_consumer-detail.webp' | relative_url }}) and the [640×480 GIF]({{ '/assets/images/motion/boss-vhs_sp_consumer.gif' | relative_url }}) are separate files.

## Contra gameplay, attract-mode frames 900 to 1019

Contra attract-mode frames 900 to 1019 add scrolling terrain, animated soldiers and projectiles to the phase test: [Sony PVM-14L2 clip]({{ '/assets/images/motion/contra-gameplay-sony_pvm_14l2.mp4' | relative_url }}) and [Stas's Favourite RF clip]({{ '/assets/images/motion/contra-gameplay-stass_favourite.mp4' | relative_url }}).

In the inspected sequence the terrain moves across an output mask that stays fixed. The Sony PVM-14L2 keeps harder edges, and Stas's Favourite spreads moving detail wider. Neither sampled sequence shows a long retained copy of the terrain.

The [sequence measurements](https://github.com/yaglo/mynes/blob/master/docs/gpu-motion-metrics.json) list every source frame number and the light statistics of each frame. The file records the refreshed clips of 120 or 240 frames, including the clips of all 5 games in the reel.

## Capture method

All clips come from the GPU renderer with Panel-pixels mask alignment, a 960×720 offscreen drawable and a common linear exposure of 0.6 before sRGB encoding. The boss input is frozen while the carrier phase, the noise and the temporal state keep advancing. The 240-frame Sony PVM-14L2 and Stas's Favourite captures contain every frame from 60 to 299 with no gaps. Screenshot readback can run slower than real time, so the exported video follows the emulated frame cadence and ignores the disk-write timestamps. No optical-flow interpolation or frame averaging is applied.

```sh
./build/bin/mynes_gpu --simulate-frame /path/to/contra-boss.bin \
  --offscreen 960x720 --mask-alignment pixels --preset sony_pvm_14l2 \
  --screenshot-after 60 --screenshot-frames 120 --screenshot-path /tmp/boss.ppm
```

The fixed-exposure previews are made from the linear PFM files written with each screenshot. The [still comparison of all presets]({{ '/archive/contra/' | relative_url }}) and the [pipeline limitations](https://github.com/yaglo/mynes/blob/master/docs/gpu-pipeline-reference.md) give the spatial and hardware context.

## Limitations

- The measurements describe the frames and do not measure the flicker a viewer perceives on a particular panel.
- The checks in this review do not stand in for a person judging flicker or motion on the built-in MacBook panel.
- A player and a display can convert the cadence of a clip, independently of the emulator's timing.
- The Contra gameplay review is short, and its phosphor decay was not calibrated against measurements.
