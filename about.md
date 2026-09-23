---
layout: page
title: About MyNES
permalink: /about/
description: What MyNES is, how the images on this site are made, the parts of the code, the project history, credits, license and contact.
updated: 2026-09-23
---
{%- assign facts = site.data.facts -%}
{%- assign release = site.data.release -%}

MyNES is an NES emulator whose GPU frontend encodes the picture as composite or RF video and draws the decoded signal on a simulated CRT. Its core is platform-independent C11 and passes {{ facts.tests.passed }} of {{ facts.tests.total }} tests of the bundled {{ facts.tests.suite }} ROM. The {{ facts.presets.count }} presets set up the signal chain as particular monitors and televisions, and the on-screen menu sets the connection, the preset and every control while a game runs.

## How the images are made

The PPU's color codes select the 2C02 or 2C07 composite waveform. The GPU frontend passes that waveform through the console output, the cable or RF receiver, sync and burst recovery, Y/C separation and color decoding. The decoded RGB drives the video amplifiers and an electron beam whose spot size grows with beam current. The model then applies phosphor decay, a shadow mask, slot mask or aperture grille, and the glass. Bright areas load the supply, which changes focus, black-level recovery and raster size.

The images and clips on this site were written offscreen by the MyNES GPU frontend, at the size each caption gives. Captions state which values were measured. Outside the [Archive]({{ '/archive/' | relative_url }}), crops are cut from the frames without resampling, and the `@1x` file offered to 1× displays is the 2×2 average of its crop. {% if facts.renderer.commit %}The renders come from renderer commit [{{ facts.renderer.commit | slice: 0, 7 }}]({{ site.project.code_repo }}/commit/{{ facts.renderer.commit }}).{% else %}The renders on the site come from several renderer commits.{% endif %}

The named presets are models built from published specifications and service manuals. No individual television was measured. The RF path is an equivalent baseband model with negative AM, channel noise, a generic IF filter and envelope detection, and it simulates no complete tuner. The [technical notes]({{ '/notes/' | relative_url }}) keep the evidence and the estimates apart.

The [HDR output note]({{ '/notes/hdr/' | relative_url }}) describes how the renderer uses the headroom of an HDR display and how the site offers HDR files.{% if site.data.hdr_checks and site.data.hdr_checks.size > 0 %} It lists the browsers and displays the site's HDR files were checked on.{% endif %}

## Components

- `src/cpu/`: the 6502, written as cycle patterns in a timing DSL. A Chicken Scheme compiler, `tools/dsl2c.scm`, generates the C, so each cycle's bus operation is data, and the same data derives the DMA helpers that need the CPU's next bus operation.
- `src/ppu/`: the PPU, stepped dot by dot.
- `src/nes/`: the system bus, the APU, the mappers, ROM loading and `composite.h`, the single-header CPU composite pipeline used by the SDL2 frontend, the headless renderer and the tests.
- `frontends/gpu/`: `mynes_gpu`, the SDL3 frontend with the 14-stage GPU signal chain, the CRT presets and the on-screen menu.
- `frontends/sdl/`: `mynes`, the SDL2 frontend.
- `frontends/shared/`: configuration, the ROM browser and saves.
- `presets/`: the {{ facts.presets.count }} preset files.
- `tools/visualiser/`: Signal Studio, a native macOS editor for the controls of a running `mynes_gpu`.
- `tools/showcase/`: the recording pipeline that renders the clips and stills in the site's `assets/hero/`.
- `tests/`: unit tests, {{ facts.tests.suite }} and other test ROMs.

MyNES has 2 composite pipelines: `composite.h` on the CPU and the 14-stage GPU chain of `mynes_gpu`. [Part 8 of the blog]({{ '/blog/same-pipeline-twice/' | relative_url }}) explains why both exist.

## History

- 2012-06-13: first commit of the original MyNES, kept on the [`legacy` branch](https://github.com/yaglo/mynes/tree/legacy).
- 2026-06-28: first commit of the C11 rewrite, which combines declarative CPU timing with signal-based video.
- 2026-09-20: all 144 {{ facts.tests.suite }} tests pass at the default CPU phase ([8c38bd4]({{ site.project.code_repo }}/commit/8c38bd4)).
- 2026-09-22: first version of this site.
{%- if release.date %}
- {{ release.date | date: "%Y-%m-%d" }}: MyNES {{ release.version }} released.
{%- endif %}

## Credits

- [AccuracyCoin](https://github.com/100thCoin/AccuracyCoin) by 100thCoin: the test ROM, bundled unmodified at revision [46199ae](https://github.com/100thCoin/AccuracyCoin/commit/46199ae43f52e21df6bb3aef8e395beb7e05b325).
- blargg: the CPU, PPU and APU test suites, bundled with other test ROMs in [`tests/nes-test-roms/`]({{ site.project.code_repo }}/tree/master/tests/nes-test-roms).
- NESdev Wiki: the 2C02 and 2C07 output voltage measurements on the [NTSC video](https://www.nesdev.org/wiki/NTSC_video) and [PAL video](https://www.nesdev.org/wiki/PAL_video) pages, which set the DAC waveform tables.
- [Breaks](https://github.com/emu-russia/breaks) by emu-russia: the analysis of the 2C07 PAL decoder behind the PAL vertical sync alignment.
- [SDL](https://www.libsdl.org/): windows, the GPU API, audio and gamepads. The default macOS build downloads SDL 3.4.16 and patches the fence handling and presentation of its Metal backend.
- The service manuals and measurement reports behind each preset are cited in the References of the [technical notes]({{ '/notes/' | relative_url }}).

## License

The emulator is released under the [Apache License 2.0]({{ site.project.license }}). No commercial ROMs are distributed with it or on this site.

## Contact

Report bugs, build problems and questions on the [GitHub issue tracker]({{ site.project.issues }}). For a problem with the picture, give the preset, the connection, the host display mode (SDR or HDR) and the ROM region.

MyNES is written by Stanislav Yaglo. The site source is at [github.com/yaglo/mynes-web]({{ site.project.site_repo }}).
