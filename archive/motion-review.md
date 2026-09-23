---
layout: "page"
title: "NTSC phase and motion review"
permalink: "/archive/motion-review/"
section: "archive"
description: "Unaveraged NTSC phase animations, 60.1 fps clips, lossless phase details and what the sequences do and do not establish."
source: "docs/gpu-motion-review.md"
archived: 2026-09-23
replaced_by: "/gallery/motion/"
sitemap: false
---

The alternating picture is part of the presentation. Two-frame averages can help compare colour but hide the frame-to-frame chroma structure and can broaden displaced beams. The README provides **unaveraged animations** alongside native single-frame close-ups.

## Watch the phases

<figure class="figure">
<a href="{{ '/assets/images/motion/boss-sony_pvm_14l2.mp4' | relative_url }}"><img src="{{ '/assets/images/motion/boss-sony_pvm_14l2.gif' | relative_url }}" alt="Sony PVM-14L2 phase animation" width="640" height="480" loading="lazy"></a>
</figure>

<figure class="figure">
<a href="{{ '/assets/images/motion/boss-stass_favourite.mp4' | relative_url }}"><img src="{{ '/assets/images/motion/boss-stass_favourite.gif' | relative_url }}" alt="Stas's Favourite RF phase animation" width="640" height="480" loading="lazy"></a>
</figure>

These GIFs preserve 24 individual rendered frames with one fixed 256-colour palette and no dithering. Each frame lasts 20 ms: **50 fps**, making the excerpt approximately 20% longer than those same frames at the live 60.1 fps cadence. This avoids relying on 10 ms GIF frames, which some players clamp. They loop after 0.48 seconds; that loop is an export choice, not evidence that RF noise repeats in the emulator. GIF palette reduction also loses some mask/chroma detail.

Watch the actual frame cadence:

- [Synchronized Sony (left) versus RF (right), four seconds]({{ '/assets/images/showcase/sony-vs-rf.mp4' | relative_url }}).
- [Five-game showcase reel, 20 seconds]({{ '/assets/images/showcase/showcase-reel.mp4' | relative_url }}).
- Individual Contra phase clips: [Sony, four seconds]({{ '/assets/images/motion/boss-sony_pvm_14l2.mp4' | relative_url }}), [Stas RF, four seconds]({{ '/assets/images/motion/boss-stass_favourite.mp4' | relative_url }}), [JVC, two seconds]({{ '/assets/images/motion/boss-jvc_d_series_2000.mp4' | relative_url }}), [Toshiba, two seconds]({{ '/assets/images/motion/boss-toshiba_14af43.mp4' | relative_url }}). All run at 60.0988 fps.

MP4 uses H.264, CRF 16, 4:2:0 for common-player compatibility; it can soften fine chroma. These **lossless RGB animated details** avoid that conversion and preserve near-native cadence through cumulative 16/17 ms WebP durations:

<figure class="figure">
<a href="{{ '/assets/images/motion/boss-sony_pvm_14l2-detail.webp' | relative_url }}"><img src="{{ '/assets/images/motion/boss-sony_pvm_14l2-detail.webp' | relative_url }}" alt="Sony lossless phase detail" width="384" height="256" loading="lazy"></a>
</figure>

<figure class="figure">
<a href="{{ '/assets/images/motion/boss-stass_favourite-detail.webp' | relative_url }}"><img src="{{ '/assets/images/motion/boss-stass_favourite-detail.webp' | relative_url }}" alt="RF lossless phase detail" width="384" height="256" loading="lazy"></a>
</figure>

## What the sequences show

At 960×720, alternating colour fringes are visible around the teeth, shoulder highlights and other fine edges. Sony retains the strongest local alternation of the four in this scene; JVC and especially Toshiba smooth it more. Stas adds visibly less orderly fine texture and convergence. These differences disappear or diminish in the two-phase average.

The frozen boss separates signal motion from game motion. In the refreshed captures, median adjacent-frame linear RGB RMS is Sony 0.0506, JVC 0.0457, Toshiba 0.0319, Stas 0.0396. The largest channel's peak-to-peak whole-image mean change is 0.00096. The change is principally local, rather than a global exposure pulse. This does **not** measure perceived flicker on a particular panel.

This review inspected decoded frame sequences, measured temporal changes and checked the refreshed reel in native player playback. These checks do not establish a human-equivalent judgment of flicker or motion on the built-in MacBook panel. Playing the clips can also introduce player/display cadence conversion, independently of emulator timing.

## VHS playback

<figure class="figure">
<a href="{{ '/assets/images/motion/boss-vhs_sp_consumer.mp4' | relative_url }}"><img src="{{ '/assets/images/motion/boss-vhs_sp_consumer.gif' | relative_url }}" alt="VHS phase preview" width="640" height="480" loading="lazy"></a>
</figure>

[Four seconds of the separate VHS SP preset]({{ '/assets/images/motion/boss-vhs_sp_consumer.mp4' | relative_url }})
show recovered luma/chroma bandwidth, small line-correlated residual timing and
phase errors, and playback noise before the CRT. The boss frame is frozen;
changes come from signal/CRT state. [Lossless native phase detail]({{ '/assets/images/motion/boss-vhs_sp_consumer-detail.webp' | relative_url }}).

## Scrolling and sprites

Real Contra attract-mode frames **900–1019** add scrolling terrain, animated soldiers and projectiles to the phase test. [Sony clip]({{ '/assets/images/motion/contra-gameplay-sony_pvm_14l2.mp4' | relative_url }}) · [Stas RF clip]({{ '/assets/images/motion/contra-gameplay-stass_favourite.mp4' | relative_url }}).

The inspected sequence shows terrain moving across a fixed output mask. Sony keeps the harder edges; Stas spreads moving detail more broadly. Neither sampled sequence shows a long retained copy of the terrain, although this short review is not a measured phosphor-decay calibration.

[Sequence measurements](https://github.com/yaglo/mynes/blob/master/docs/gpu-motion-metrics.json) include all source frame numbers and per-frame light statistics. The file now records the refreshed 120- or 240-frame clips, including all five showcase games.

## Capture method

All clips use the actual GPU path, Panel-pixels mask alignment, a 960×720 offscreen drawable and common 0.6 linear exposure before sRGB encoding. The boss input is frozen, while the carrier phase, noise and temporal state continue advancing. The extended Sony/RF captures verify every frame from 60 through 299 without gaps. Screenshot readback may run slower than real time; the exported video uses emulated-frame cadence, not disk-write timestamps. No optical-flow interpolation or frame averaging is applied.

```sh
./build/bin/mynes_gpu --simulate-frame /path/to/contra-boss.bin \
  --offscreen 960x720 --mask-alignment pixels --preset sony_pvm_14l2 \
  --screenshot-after 60 --screenshot-frames 120 --screenshot-path /tmp/boss.ppm
```

The linear PFM companions are the source for the fixed-exposure previews. [All-preset still comparison]({{ '/archive/contra/' | relative_url }}) and [pipeline limitations](https://github.com/yaglo/mynes/blob/master/docs/gpu-pipeline-reference.md) provide the spatial/hardware context.
