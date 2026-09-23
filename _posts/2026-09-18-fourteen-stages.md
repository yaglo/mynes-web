---
layout: "post"
title: "Part 4: The 14 stages of the GPU pipeline"
date: "2026-09-18"
updated: "2026-09-23"
series: 4
slug: "fourteen-stages"
permalink: "/blog/fourteen-stages/"
teaser: "The MyNES GPU pipeline models the NES signal path and a CRT television as 14 compute shaders run by one data-driven runner."
description: "The MyNES GPU pipeline models the NES signal path and a CRT television as 14 compute shaders run by one data-driven runner."
source: "docs/blog/04-fourteen-stages.md"
---

Updated 2026-09-23: the 3-line comb now uses the center line and its 2 neighbors. The prototype this post first described averaged 4 scanlines.

[Part 3: The composite waveform]({{ '/blog/signal-nobody-sees/' | relative_url }}) described the waveform that the 2C02 outputs. This part describes the GPU pipeline that processes it in MyNES: 14 compute shaders, one per stage of the signal path.

A CRT television has 14 stages of analog electronics between the video input and the phosphor screen, and each stage adds its own artifacts. The artifacts interact, and they depend on the composite waveform, so MyNES runs one compute shader per stage on that waveform.

Chroma bleed is one example. The comb filter separates luma from chroma incompletely. The residual cross-color enters the chroma demodulator, which phase-shifts it by the subcarrier angle at that sample position. The matrix decode then maps the shifted values to specific wrong colors that depend on the original palette index. These colors come from the math of the stages.

## The 14 stages

| Stage | Name | Domain | What it models |
|-------|------|--------|----------------|
| 1 | 2C02 DAC | Signal | Palette index to composite waveform |
| 2 | Console output | Signal | Coupling cap, amplifier bandwidth, PSU hum |
| 3 | Cable | Signal | RC transmission line, ghosting |
| 4 | RF modulator | Signal | RF channel simulation (RF path only) |
| 5 | TV input | Signal | Coupling cap, automatic gain control |
| 6 | Comb filter | Signal | Y/C separation |
| 7 | Chroma demodulator | Signal | I/Q recovery via quadrature multiplication |
| 8 | Luma processing | Signal | FIR bandwidth limiting |
| 9 | Matrix decode | Signal | YIQ to RGB conversion |
| 10 | Video amplifier | Display | Per-gun bandwidth, gamma |
| 11 | Electron beam | Display | Bloom, convergence, noise, geometry |
| 12 | Phosphor screen | Display | Temporal persistence, dot crawl cancellation |
| 13 | CRT glass | Display | Halation, barrel distortion, tint |
| 14 | Environment | Display | Vignette, ambient light, tone mapping |

Each stage is a separate GPU compute shader. The signal domain (stages 1 to 9) operates on 491,520 float samples: 2048 samples per scanline, 240 scanlines. The display domain (stages 10 to 14) converts the samples into the output resolution with the CRT physics.

## Stages active per connection type

Different cables physically bypass different stages, and the pipeline bypasses the same stages as the hardware does when the cable changes.

| Connection | Active stages | Reason |
|------------|--------------|-----|
| RF | All 14 | Full signal path through RF modulator and TV tuner |
| Composite | 1 to 3, 5 to 14 | Skips RF mod/demod (no carrier) |
| S-Video | 1 to 3, 5 (bypass comb), 7 to 14 | Y/C pre-separated by cable |
| Component | 1 to 3, 5, 8 to 14 | Baseband Cb/Cr, no chroma modulation |
| RGB | 1 to 3, 10 to 14 | No color space conversion needed |
| Direct | 1 and 2, 10 to 14 | No cable, shortest path |

An S-Video cable carries luma and chroma on separate wires. The 2 signals are never combined, so there is no composite signal to comb-filter. The comb filter stage is absent from the S-Video signal path, independent of any quality setting, and an S-Video connection shows no composite artifacts.

One function decides which stages are active:

```c
bool video_chain_stage_active(const VideoChain *chain, int stage) {
    VideoConnectionType c = chain->connection;
    switch (stage) {
    case 4:  return c == VIDEO_CONN_RF;
    case 6:  return c == VIDEO_CONN_RF || c == VIDEO_CONN_COMPOSITE
                  || c == VIDEO_CONN_SVIDEO;
    case 7:  return c == VIDEO_CONN_RF || c == VIDEO_CONN_COMPOSITE
                  || c == VIDEO_CONN_SVIDEO;
    case 9:  return c != VIDEO_CONN_RGB && c != VIDEO_CONN_DIRECT;
    // ...
    }
}
```

Switching from RF to S-Video while the emulator runs toggles the `enabled` flags in the stage array. The runner and the shaders stay the same.

## The signal chain runner

A generic, data-driven runner handles all dispatch boilerplate, for the video chain and for the audio chain.

```c
typedef struct {
    const char     *name;           // human-readable (for visualiser)
    ChainKernelType kernel_type;    // which compute shader
    bool            enabled;        // false = skip
    bool            bypass;         // user-toggled (visualiser B key)
    uint8_t         params[128];    // uniform data
    uint32_t        params_size;
    uint32_t        dispatch_x, dispatch_y, dispatch_z;
    double          timing_us;      // wall-clock dispatch time
    bool            needs_carry;    // RC filter: inter-block state
    bool            needs_taps;     // FIR: tap coefficient buffer
    bool            dual_output;    // modulator IQ: writes 2 buffers
} ChainStage;
```

Adding a stage means appending a struct, and no other C code changes. The runner iterates over the array, dispatches the kernel of each enabled stage and routes the buffers. It contains no code specific to any stage.

## Ping-pong buffers

The runner alternates 2 GPU buffers as input and output. Stage N reads from buffer A and writes to buffer B, and stage N+1 reads from buffer B and writes to buffer A. The runner tracks which buffer holds the current data.

Some kernels work in place. The RC filter processes each scanline sequentially and reads and writes the same buffer, because its IIR feedback needs the previous output sample. The runner does not swap buffers for these stages.

Some kernels write 2 outputs. The comb filter writes Y to one buffer and C to another, and the modulator in IQ mode writes I and Q at the same time. Up to 4 auxiliary buffers beyond the ping-pong pair hold these outputs. Flags on the `ChainStage` struct route them automatically: `dual_output` for the modulator and `reads_secondary` for stages that read the second output.

The same runner processes audio through 10 stages (coupling cap, feedback network, amplifier saturation, PSU hum, cable capacitance, speaker model, decimation). An audio frame is about 29,829 float samples and a video frame 491,520, and the dispatch code is the same for both.

## Sources of the CRT artifacts

No CRT artifact in the pipeline has special-case code. Each one comes out of the signal processing of a stage.

Dot crawl comes from the 3.579545 MHz subcarrier phase, which advances between frames. The DAC shader (stage 1) encodes this phase, and the comb filter (stage 6) does not cancel it fully. The residual shows up as a crawling rainbow pattern, and no code adds dot crawl.

Chroma bleed comes from the FIR bandwidth in stage 7, which is set to 1 MHz for a composite connection. At that bandwidth, low-frequency I/Q components spread 4 to 5 pixels horizontally. A PVM with 1.5 MHz chroma bandwidth has less bleed, and the difference is one float in a uniform buffer.

Rainbow shimmer on horizontal stripes comes from the 1-line comb filter, which averages 2 scanlines. Where vertical detail changes quickly, the luma estimate is wrong and the error leaks into the chroma channel. A 3-line comb uses the center line and its 2 neighbors and removes most of the shimmer, at the cost of some vertical softening.

Convergence fringing comes from the offset of the red and blue electron beams from green. The beam shader (stage 11) reads RGB values from shifted sample positions. The offset is largest at the screen edges, scaled by `edge_factor = cx^2 + cy^2`. On a well-calibrated PVM the offsets are near zero, while the Basement TV preset sets `conv_r_x = 6.0, conv_b_x = -5.0` and shows red-blue fringing on every edge.

The pipeline simulates the electronics that drive a CRT, and the behavior of the CRT, artifacts included, follows from that simulation.
