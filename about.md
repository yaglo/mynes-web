---
layout: page
title: About MyNES
permalink: /about/
description: What MyNES is, where it came from, its license and how to report problems.
---

MyNES is a NES emulator whose picture is produced the way a television produced it. The PPU's colour codes select the 2C02/2C07 composite waveform; the waveform passes through a modelled console output, cable or RF receiver, sync and burst recovery, Y/C separation and colour decoding; and the decoded RGB drives modelled video amplifiers, an electron beam with current-dependent spot size, phosphor decay, a shadow mask, slot mask or aperture grille, and the glass. Twenty-three presets set up that chain as particular monitors and televisions.

The emulator core is platform-agnostic C11. Its 6502 is generated from a declarative timing DSL by a small Scheme compiler, so every cycle's bus operation is data rather than hand-counted code; the same data derives the DMA helpers that need to know what the CPU would do next. The PPU runs dot by dot. The bundled AccuracyCoin test ROM passes 144 of 144 tests.

There are two composite pipelines: a single-header CPU path used by the SDL2 frontend, the headless renderer and the tests, and the SDL3 GPU path with its fourteen modelled stages. The [blog series]({{ '/blog/' | relative_url }}) explains why both exist.

## Origins

MyNES is a ground-up C11 rewrite of a NES emulator first written in 2012. The original is preserved on the [`legacy`](https://github.com/yaglo/mynes/tree/legacy) branch of the repository. The rewrite combines declarative CPU timing with signal-based video.

## What the pictures on this site are

Every image and clip here is actual output of the emulator, captured offscreen at the stated resolution. Captions state what was and was not measured. The named presets are nominal profiles constrained by published specifications and service documentation, not calibrated copies of individual sets; the [research pages]({{ '/notes/' | relative_url }}) keep the evidence and the estimates apart.

## License

The emulator is released under the [Apache License 2.0]({{ site.project.license }}). No commercial ROMs are distributed with it or on this site.

## Reporting problems

Bugs, build problems and questions go to the [GitHub issue tracker]({{ site.project.issues }}). For picture-related reports it helps to name the preset, the connection, the host display mode (SDR or HDR) and the ROM region.

## Author

MyNES is written by Stanislav Yaglo. The site source is at [github.com/yaglo/mynes-web]({{ site.project.site_repo }}).
