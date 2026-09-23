---
layout: "post"
title: "Part 8: The CPU and GPU composite pipelines"
date: "2026-09-22"
updated: "2026-09-23"
series: 8
slug: "same-pipeline-twice"
permalink: "/blog/same-pipeline-twice/"
description: "MyNES has a CPU composite pipeline in composite.h and a 14-stage GPU pipeline; what each models, the signal math they share, and why both are kept."
source: "docs/blog/08-same-pipeline-twice.md"
---

The presets in [part 7]({{ '/blog/living-room-1988/' | relative_url }}) configure the GPU pipeline, and MyNES has a second complete composite video pipeline that runs on the CPU. The CPU path is in `src/nes/composite.h`, and the GPU path is in `frontends/gpu/`. Both take the same indexed framebuffer as input. Both produce NTSC composite artifacts: dot crawl, chroma bleed and rainbow shimmer on high-contrast edges. This part describes each path and the reasons to build the same signal processing chain twice.

## CPU path

The CPU composite pipeline is a single header file, `composite.h`, of about 2,500 lines including all SIMD paths. It has no external dependencies beyond `math.h`. It runs a single-pass pipeline per scanline: waveform generation from the 2C02's palette index, FIR bandwidth limiting, Y/I/Q demodulation, matrix decode to RGB and scanline darkening. The output is RGB888, written directly to the framebuffer.

The hot path is the FIR filter, a Hamming-windowed sinc lowpass. It is applied symmetrically, which halves the multiplies, since `taps[k] == taps[n-1-k]`. The CPU path has explicit SIMD for it: NEON on ARM, AVX2 with FMA on x86, and a scalar fallback everywhere else.

The NEON inner loop from `comp_fir_symmetric`:

```c
#if defined(__ARM_NEON)
    for (; x + 4 <= w; x += 4) {
        const float *pw = p_in + x - half;
        float32x4_t a0 = vdupq_n_f32(0.0f);
        float32x4_t a1 = vdupq_n_f32(0.0f);
        float32x4_t a2 = vdupq_n_f32(0.0f);
        float32x4_t a3 = vdupq_n_f32(0.0f);
        int k = 0;
        for (; k + 4 <= n; k += 4) {
            a0 = vfmaq_n_f32(a0, vld1q_f32(pw + k + 0), tps[k + 0]);
            a1 = vfmaq_n_f32(a1, vld1q_f32(pw + k + 1), tps[k + 1]);
            a2 = vfmaq_n_f32(a2, vld1q_f32(pw + k + 2), tps[k + 2]);
            a3 = vfmaq_n_f32(a3, vld1q_f32(pw + k + 3), tps[k + 3]);
        }
        float32x4_t acc = vaddq_f32(vaddq_f32(a0, a1), vaddq_f32(a2, a3));
        for (; k < n; k++) {
            acc = vfmaq_n_f32(acc, vld1q_f32(pw + k), tps[k]);
        }
        vst1q_f32(&out_p[x], acc);
    }
```

The loop keeps 4 independent accumulators (`a0` to `a3`), each advancing through the taps by 4, so no dependency chain is carried across iterations. On an M1, the CPU can dispatch 4 FMAs per cycle through this loop. The AVX2 path processes 8 pixels per iteration with the same 4-way ILP pattern.

The SDL2 frontend, the headless renderer and the test runner use the CPU path, as does anything else that needs composite output and has no GPU.

## GPU path

The GPU pipeline is a chain of separate compute shader stages, and each stage models one physical component in the analog signal path. The full chain for an RF connection has 14 stages:

1. 2C02 DAC: palette index to composite waveform (same Bisqwit model)
2. Console output: coupling capacitor, amplifier bandwidth
3. Cable: RC low-pass from distributed capacitance (80 pF/m for cheap RCA)
4. RF modulator and demodulator: vestigial sideband modulation, AGC, thermal noise
5. TV input: coupling, automatic gain control
6. Comb filter: Y/C separation (none, 1-line, 2-line, or bypass for S-Video)
7. Chroma demodulator: QAM decode of I and Q, with FIR on each channel
8. Luma processing: bandwidth limiting, FIR filtering
9. Matrix decode: YIQ to RGB with color temperature and gun drive controls
10. Video amplifier: per-channel bandwidth limiting
11. Electron beam: spot profile, convergence, bloom
12. Phosphor screen: shadow mask or aperture grille, persistence
13. CRT glass: halation, barrel distortion, glass tint
14. Environment: vignette, ambient light, black floor

Each stage is one compute dispatch. The connection type determines which stages are active:

- S-Video skips the comb filter, because Y and C arrive already separated.
- RGB skips the comb filter, chroma demodulation and matrix decode.
- Direct mode skips everything between the DAC and the display domain.

The chain queries `video_chain_stage_active()` for each stage and skips the dispatch when it returns false.

The GPU path requires SDL3 GPU, which means Vulkan, Metal or D3D12. The GPU frontend and the SwiftUI app use it.

## Reasons for keeping both paths

### Portability vs fidelity

The CPU path runs anywhere with a C compiler, with no GPU and no graphics API. It compiles on ARM, x86 and any other target with a C99 toolchain. For headless testing, CI runners and embedded targets, the CPU path is the only option. The GPU path needs modern graphics hardware and a specific backend.

### Correctness verification

With 2 implementations of the same signal processing, a difference between them points to a bug in one. The waveform generation, FIR coefficients and demodulation math should produce identical Y, I and Q values at the decode stage. If the GPU path produces different cross-color patterns from the CPU path on the same input, one of them is wrong.

The CPU path was written first and verified against known-good reference output. The GPU path was then verified against the CPU path. With both in place, a regression in the GPU shader chain can be caught by comparing its output with the CPU reference.

### Stages the CPU path leaves out

The CPU path is single-pass and fast, and it cannot model interactions between stages. It feeds the waveform straight into the FIR, with no cable RC filter between the console output and the TV input. It has no comb filter modes, because it only does simple bandpass Y/C separation. It also has no RF simulation, temporal phosphor persistence, beam bloom or convergence error.

The GPU path models all of these, because each stage is a separate dispatch with its own physical parameters. That costs 14 compute dispatches plus render passes per frame, and it requires a GPU.

### Shared signal math

Both paths use the same underlying signal model. The GPU path's `signal_precompute.h` was extracted from the precomputation functions in `composite.h`, so that the GPU frontend has no dependency on the CPU composite pipeline, and the math is the same. Both build a 512-entry signal table (64 palette colors times 8 emphasis states, 24 phase slots each) using Bisqwit's 2C02 voltage model. Both design their FIR taps as Hamming-windowed sinc functions normalized to unit DC gain. The GPU path runs each step of that math as a separate compute dispatch, with physically modeled stages between them.

## Where the 2 paths match and differ

The paths meet at the signal table and the FIR design. Both use 12-phase composite waveforms and the same normalized sinc formula:

```c
float sinc = (m == 0)
    ? 2.0f * cutoff
    : sinf(2.0f * M_PI * cutoff * (float)m)
      / (M_PI * (float)m);
float w = 0.54f - 0.46f * cosf(2.0f * M_PI * (float)k / (float)(n - 1));
taps[k] = sinc * w;
```

The cutoff frequencies, the window function and the normalization are the same. With cable, RF and display effects disabled, a frame decoded by the CPU path and the same frame decoded by the GPU path should produce visually identical output.

The paths diverge in everything after the decode. The CPU path runs waveform, FIR, demodulation and matrix in a tight scanline loop and writes RGB. The GPU path splits these into individual dispatches, with cable RC filtering, comb filter Y/C separation, RF modulation and AGC between them. It then continues with 5 more stages that the CPU path does not model: video amplifier, electron beam, phosphor screen, CRT glass and environment.

The CPU path handles scanline darkening and a few post-processing effects: barrel distortion, ghosting, snow and hum bars. These are simple screen-space operations without the component values of a physical model.

## How the 2 paths are compared

The test `gpu_pipeline_test` ([`frontends/gpu/tests/test_pipeline.c`](https://github.com/yaglo/mynes/blob/master/frontends/gpu/tests/test_pipeline.c)) runs a known composite waveform through the GPU stages and decodes the same waveform on the CPU inside the test, with the same FIR taps. For the luma, I and Q buffers it prints the largest and the mean absolute difference and the number of samples that differ by more than 0.01 and by more than 0.1. It sets no pass threshold, and it does not call `composite.h`, so no test compares the 2 production paths directly.
