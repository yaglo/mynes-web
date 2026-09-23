---
layout: page
title: Download and build
permalink: /download/
description: MyNES downloads by platform, the build steps for macOS and Linux with CMake, the controls, ROMs and tests.
updated: 2026-09-23
---
{%- assign release = site.data.release -%}
{%- assign mac_files = release.files | where: "platform", "macOS" -%}
{%- assign linux_files = release.files | where: "platform", "Linux" -%}
{% if release.date %}
<p class="release-line">MyNES {{ release.version }}, released <time datetime="{{ release.date | date: '%Y-%m-%d' }}">{{ release.date | date: "%Y-%m-%d" }}</time>{% if release.commit %}, commit <a href="{{ site.project.code_repo }}/commit/{{ release.commit }}">{{ release.commit | slice: 0, 7 }}</a>{% endif %}.{% if release.notes %} <a href="{{ release.notes }}">Release notes for MyNES {{ release.version }}</a>.{% endif %}</p>
{% else %}
<p class="release-line">MyNES {{ release.version }} has no published release yet. Build it from source with the steps on this page.</p>
{% endif %}
The source is at [github.com/yaglo/mynes]({{ site.project.code_repo }}) under the Apache License 2.0. The GPU frontend (`mynes_gpu`) is the main program: it contains the signal chain, the CRT presets and the on-screen menu. The repository also has a smaller SDL2 frontend, `mynes`.

## macOS

{% if mac_files.size > 0 %}The macOS build runs on Apple Silicon Macs with macOS 12.0 or later.

<ul class="downloads">{% for f in mac_files %}
<li><a class="btn btn-primary" href="{{ f.url }}">Download MyNES {{ release.version }} for macOS ({{ f.name }})</a> SHA-256: <code>{{ f.sha256 }}</code></li>{% endfor %}
</ul>
{% else %}No macOS binary of MyNES {{ release.version }} is published. Build it with the steps in [Build on macOS](#build-on-macos).
{% endif %}
## Linux

{% if linux_files.size > 0 %}The Linux build needs Vulkan and an x86-64 CPU with AVX2 and FMA.

<ul class="downloads">{% for f in linux_files %}
<li><a class="btn btn-primary" href="{{ f.url }}">Download MyNES {{ release.version }} for Linux ({{ f.name }})</a> SHA-256: <code>{{ f.sha256 }}</code></li>{% endfor %}
</ul>
{% else %}No Linux binary of MyNES {{ release.version }} is published. Build it with the steps in [Build on Linux](#build-on-linux).
{% endif %}
## Windows

MyNES has no Windows binary, and the build is untested on Windows.

## Build from source

### Build on macOS

Apple Silicon is the main development platform. The first configure downloads a pinned SDL 3 and builds it statically, so it needs network access. The default build ignores Homebrew's SDL. The shader tools (`glslc` from shaderc, `spirv-cross`) are optional: the compiled shaders are committed and used when the tools are absent.

```bash
brew install cmake
git clone https://github.com/yaglo/mynes.git
cd mynes
cmake -S . -B build        # first run downloads SDL3
cmake --build build -j
./build/bin/mynes_gpu path/to/game.nes
```

`scripts/make-macos-app.sh` wraps the build into `MyNES.app` and a `.dmg`, and `scripts/release-macos.sh` builds a portable tarball. [docs/dev/release.md]({{ site.project.blob }}/docs/dev/release.md) describes both.

### Build on Linux

```bash
sudo apt install cmake libsdl2-dev libvulkan-dev
git clone https://github.com/yaglo/mynes.git
cd mynes
cmake -S . -B build -DMYNES_BUNDLED_SDL3=ON
cmake --build build -j
./build/bin/mynes_gpu path/to/game.nes
```

The GPU frontend uses SDL 3 over Vulkan. Without `-DMYNES_BUNDLED_SDL3=ON`, CMake looks for a system SDL3 (`libsdl3-dev` where your distribution ships it). Only the SDL2 frontend needs `libsdl2-dev`. `-DNES_BUILD_GPU_FRONTEND=OFF` disables the GPU frontend, and `-DNES_BUILD_FRONTENDS=OFF` disables all graphical frontends. The headless recipe used by CI is in [docs/dev/commands.md]({{ site.project.blob }}/docs/dev/commands.md).

## Controls

The full map is in the repository's [`docs/gpu-controls.md`]({{ site.project.blob }}/docs/gpu-controls.md).

| Action | Keyboard | Gamepad |
|---|---|---|
| D-pad, A, B | Arrows, X, Z | D-pad or left stick, East, South |
| Select, Start | Tab, Return | Back, Start |
| Menu | Escape or M | Guide |
| Pause | Space | |
| Fast-forward (hold) | ` (grave) | Right shoulder |
| Save state, load state, next slot | F5, F7, F6 | |
| Reset, room reflections, next preset | R, G, P | |
| ROM browser, fullscreen, screenshot | O, F, F12 | |

Player 2 uses W/A/S/D with J, H, U and Y, or the second gamepad. Up to 2 gamepads hot-plug and take players 1 and 2 in the order they connect.

## ROMs

MyNES includes no ROMs, and the repository distributes no commercial games. Keep your own legally obtained ROMs outside the source tree. Git ignores a `roms/` directory next to the build.

## Tests

```bash
ctest --test-dir build --output-on-failure
./build/bin/accuracy_coin        # all 144 AccuracyCoin tests; failures return nonzero
```

## Quick start

1. Build MyNES with the steps for [macOS](#build-on-macos) or [Linux](#build-on-linux).
2. Start the GPU frontend. Without a ROM path it opens the ROM browser.

   ```bash
   ./build/bin/mynes_gpu                  # open the ROM browser
   ./build/bin/mynes_gpu path/to/game.nes # run a ROM directly
   ```

3. Press Escape or M for the menu, and P for the next preset.

Settings, recent ROMs, battery saves and save states live under `~/.config/mynes/` (`config.json`, `saves/`, `states/`). Bundled presets load relative to the executable, and personal presets live in `~/.config/mynes/presets`.

Releases are listed on the [GitHub releases page]({{ site.project.releases }}), and the 2012 version of MyNES is on the [`legacy` branch](https://github.com/yaglo/mynes/tree/legacy).
