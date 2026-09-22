---
layout: page
title: Download and build
permalink: /download/
description: Get MyNES from the GitHub releases page, or build it on macOS or Linux with CMake.
---

## Releases

Prebuilt downloads are published on the **[GitHub releases page]({{ site.project.releases }})**. The source is at [github.com/yaglo/mynes]({{ site.project.code_repo }}) under the Apache License 2.0.

The GPU frontend (`mynes_gpu`) is the main program: it contains the signal chain, the CRT presets and the on-screen menu. A lightweight SDL2 frontend (`mynes`) remains available.

## Build on macOS

Apple Silicon is the main development platform. The first configure downloads a pinned SDL 3 and builds it statically, so it needs network access; Homebrew's SDL is not used by the default build. The shader tools (`glslc` from shaderc, `spirv-cross`) are optional: the compiled shaders are committed and used when the tools are absent.

```bash
brew install cmake
git clone https://github.com/yaglo/mynes.git
cd mynes
cmake -S . -B build        # first run downloads SDL3
cmake --build build -j
./build/bin/mynes_gpu path/to/game.nes
```

`scripts/make-macos-app.sh` wraps the build into `MyNES.app` and a `.dmg`; `scripts/release-macos.sh` builds a portable tarball. Both are described in [docs/dev/release.md]({{ site.project.blob }}/docs/dev/release.md).

## Build on Linux

```bash
sudo apt install cmake libsdl2-dev libvulkan-dev
git clone https://github.com/yaglo/mynes.git
cd mynes
cmake -S . -B build -DMYNES_BUNDLED_SDL3=ON
cmake --build build -j
./build/bin/mynes_gpu path/to/game.nes
```

The GPU frontend uses SDL 3 over Vulkan. Without `-DMYNES_BUNDLED_SDL3=ON`, CMake looks for a system SDL3 (`libsdl3-dev` where your distribution ships it). `libsdl2-dev` is only needed for the SDL2 frontend. `-DNES_BUILD_GPU_FRONTEND=OFF` disables the GPU frontend and `-DNES_BUILD_FRONTENDS=OFF` all graphical frontends. The headless recipe used by CI is in [docs/dev/commands.md]({{ site.project.blob }}/docs/dev/commands.md).

## Running

```bash
./build/bin/mynes_gpu                  # open the ROM browser
./build/bin/mynes_gpu path/to/game.nes # run a ROM directly
```

Settings, recent ROMs, battery saves and save states live under `~/.config/mynes/` (`config.json`, `saves/`, `states/`). Bundled presets load relative to the executable; personal presets live in `~/.config/mynes/presets`.

## Controls

The complete map is in the repository's [`docs/gpu-controls.md`]({{ site.project.blob }}/docs/gpu-controls.md). The essentials:

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

Player 2 uses W/A/S/D with J, H, U and Y, or the second gamepad. Two gamepads hot-plug in the order they connect.

## ROMs

No ROMs are included. The repository does not distribute commercial games; keep your own legally obtained ROMs outside the source tree (a `roms/` directory next to the build is ignored by git).

## Tests

```bash
ctest --test-dir build --output-on-failure
./build/bin/accuracy_coin        # all 144 AccuracyCoin tests; failures return nonzero
```
