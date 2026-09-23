---
layout: "post"
title: "Part 3: The composite waveform"
date: "2026-09-17"
updated: "2026-09-23"
series: 3
slug: "signal-nobody-sees"
permalink: "/blog/signal-nobody-sees/"
teaser: "The NES 2C02 PPU outputs one composite waveform, and the MyNES GPU pipeline generates it from Bisqwit's voltage model."
description: "The NES 2C02 PPU outputs one composite waveform, and the MyNES GPU pipeline generates it from Bisqwit's voltage model."
source: "docs/blog/03-signal-nobody-sees.md"
---

[Part 2: DMC DMA timing from the CPU DSL]({{ '/blog/compiler-knows-more/' | relative_url }}) was about the CPU and the DMC DMA. This part covers the composite video signal of the NES and how the MyNES GPU pipeline generates it.

The NES has no RGB output. Its 2C02 PPU outputs a composite waveform: one analog signal on one wire that encodes brightness and color at the same time through phase modulation. The signal varies between about 0.35 V and 1.55 V and changes shape 3.58 million times per second.

An emulator that decodes the 2C02's 64-entry palette to RGB through a lookup table never has this signal. The lookup is convenient and fast. Composite artifacts such as dot crawl, chroma bleed and rainbow shimmer on sharp edges then have to be faked as post-effects. What a TV does to the NES signal cannot be simulated without the signal. To reproduce the NES picture on a CRT, the emulator has to generate the waveform first.

## Composite video

NTSC composite video is a luminance (Y) base signal plus a chrominance (C) signal modulated onto a 3.579545 MHz subcarrier. The color is encoded as the phase and amplitude of this subcarrier relative to a reference burst: phase sets the hue and amplitude sets the saturation. This is quadrature amplitude modulation (QAM), which WiFi, cellular radio and digital TV also use. The 1953 NTSC committee chose a standard modulation scheme that happened to be compatible with existing black-and-white sets.

At any moment, the composite signal is the sum of 2 components:

- Luma (Y): the brightness, which varies slowly (DC to about 4.2 MHz). A black-and-white TV displays only this.
- Chroma (C): a burst of 3.579545 MHz oscillation whose instantaneous phase and amplitude encode hue and saturation. The TV's demodulator multiplies it by a reference cosine and sine to extract the I (in-phase, orange-cyan axis) and Q (quadrature, green-magenta axis) color difference signals.

The TV separates Y and C from the combined signal with a comb filter, the main source of the look of composite video. The separation is always incomplete. Some luma leaks into chroma (rainbow shimmer on sharp horizontal edges), and some chroma leaks into luma (dot patterns on saturated color fields).

## Bisqwit's voltage model

The 2C02 generates the composite waveform directly from its palette decoder, with no internal RGB stage. The 6-bit palette index and the 3 emphasis bits select its voltage levels.

For each subcarrier phase slot, the PPU's output circuit selects one of 2 voltage levels. It compares the palette color value (0 to 13) with the current phase position (0 to 11). Gray entries produce a flat line with no chroma. Saturated colors produce a square-ish wave whose phase offset relative to the colorburst encodes the hue.

MyNES precomputes its signal table from Bisqwit's voltage model. This is the precomputation in `signal_precompute.h`:

```c
static inline void signal_precompute_ntsc(SignalPrecompute *sp) {
    static const float levels[8] = {
        0.350f, 0.518f, 0.962f, 1.550f,   /* signal low,  luma 0..3 */
        1.094f, 1.506f, 1.962f, 1.962f,   /* signal high, luma 0..3 */
    };
    const int emph_oct = 0264513;
    const float blacklo = levels[1];
    const float whitehi = levels[7];
    const float norm = 1.0f / (whitehi - blacklo);

    for (int pal_idx = 0; pal_idx < 64; pal_idx++) {
        int color = pal_idx & 0x0F;
        int level = (pal_idx >> 4) & 0x03;
        if (color > 13) level = 1;

        for (int emph = 0; emph < 8; emph++) {
            int entry = (emph << 6) | pal_idx;
            for (int p = 0; p < 12; p++) {
                int in_hi = (color < 13) && (((color + p) % 12) < 6);
                if (color == 0) in_hi = 1;
                float sig = levels[level + (in_hi ? 4 : 0)];
                int octant = (p % 12) >> 1;
                int mask = (emph_oct >> (3 * octant)) & 0x07;
                if (emph & mask) sig *= 0.746f;
                float norm_sig = (sig - blacklo) * norm;
                sp->table[entry][p] = norm_sig;
                sp->table[entry][p + 12] = norm_sig;
            }
        }
    }
}
```

The complete 2C02 video output model has 8 voltage levels, a high or low comparison per phase slot, and emphasis bits that scale selected phase octants by 0.746. The colors the NES displays and its dot crawl and rainbow patterns all follow from these numbers and the signal processing after them.

The table has 512 entries (64 palette values times 8 emphasis combinations), each producing 12 phase slots. The slots are duplicated to 24 so that an 8-sample read starting at any offset stays in bounds without a modulo.

Example waveforms:

- Palette $0F (black): all 12 slots at the minimum level. The flat line carries no chroma, and the TV sees only a low luminance signal.
- Palette $30 (white): all 12 slots at the maximum level. The line is flat again, but high, and carries only luminance.
- Palette $16 (red): 6 slots high and 6 slots low, phased to align with the red axis of the subcarrier. The TV's demodulator sees strong I-channel energy at the red hue angle.
- Palette $12 (blue): the same square wave, phase-shifted 180 degrees from red. It gives strong negative I and positive Q.
- Palette $16 with emphasis bits $40: the red waveform, with the slots in the attenuated octant multiplied by 0.746. The lower amplitude at those phases shifts the decoded color a little and reduces saturation.

## Samples per pixel

The NES emits 8 waveform samples per pixel at a sample rate derived from the master oscillator. The subcarrier completes one full cycle every 12 phase slots, so each NES pixel spans 8/12 = 2/3 of a subcarrier cycle.

The NTSC standard defines the relationship between the pixel clock and the colorburst frequency, and the NES master oscillator produces both from the same crystal. The 2/3 ratio is the relationship on NTSC hardware.

PAL uses 10 samples per pixel at 12 phase slots per cycle, which gives 10/12 = 5/6 of a cycle per pixel. Both regions use the same 12-slot color wheel and sample it at different rates.

On the GPU, the DAC shader converts the 256×240 palette index buffer into a float waveform of 2048×240 (NTSC) or 2560×240 (PAL) samples:

```glsl
void main() {
    uint px = gl_LocalInvocationID.x;     // pixel 0..255
    uint sy = gl_WorkGroupID.y;           // scanline 0..239

    // Read palette + emphasis from packed uint16 buffer
    uint flat_idx = sy * 256 + px;
    uint packed = index_data[flat_idx / 2];
    uint pixel_val = (flat_idx & 1u) == 0u
                     ? (packed & 0xFFFFu)
                     : (packed >> 16u);
    uint entry = pixel_val & 0x1FFu;

    // Compute per-pixel subcarrier phase
    uint line_phase = (phase_base + sy * phase_line_adv) % 12u;
    uint pixel_phase = (line_phase + px * samples_per_pixel) % 12u;

    // Look up signal table and emit samples
    uint table_base = entry * 24u + pixel_phase;
    uint wave_base = sy * samples_per_line + px * samples_per_pixel;

    for (uint s = 0; s < samples_per_pixel; s++) {
        waveform[wave_base + s] = signal_table[table_base + s];
    }
}
```

The shader runs 240 workgroups (one per scanline) of 256 threads (one per NES pixel), 61,440 threads in total. Each thread reads one palette index, computes the subcarrier phase at that pixel position and writes 8 (or 10) float samples. One dispatch generates the whole 2048×240 waveform.

## Dot crawl

The subcarrier phase advances between frames. The `phase_base` uniform tracks it and advances by `phase_field_adv` slots per frame. The phase relationship between the pixel grid and the subcarrier changes with every frame, so the visible chroma artifacts shift position. At sharp color transitions, such as palette index $16 (red) next to $30 (white), the incomplete Y/C separation in the TV's comb filter leaves visible dots at the chroma frequency. The dots crawl across the screen as the phase cycles.

Dot crawl is inherent to NTSC, and the NES and the TV both work as designed when it appears. The subcarrier frequency was chosen to be an odd multiple of half the line rate so that the phase alternates between frames. Temporal averaging then makes the chroma artifacts less visible, and dot crawl is the visible trace of that design choice.

On a static NES screen, a TV shows the dots shifting over a cycle of 2 to 3 frames. Some TVs with 3D comb filters or frame buffers cancel it entirely, and cheap TVs with no comb filter show strong crawling. The GPU pipeline reproduces this because it tracks the phase offset per frame and feeds it into the DAC shader.

PAL has a different dot crawl pattern because the V phase inverts on every scanline (the Phase Alternating Line that gives PAL its name). The CPU composite path keeps 2 signal tables, one for even scanlines and one for odd, with the V component flipped:

```c
float signal_table[COMP_SIGNAL_ENTRIES][COMP_TABLE_STRIDE];
float signal_table_alt[COMP_SIGNAL_ENTRIES][COMP_TABLE_STRIDE];
```

The emission loop picks the table by scanline parity, which models the 2C07's per-line V-phase inversion at the encoder.

A dot crawl pattern cannot be added to an RGB image afterwards, so reproducing the NES on a TV has to start from the waveform. The pattern depends on the subcarrier phase at each pixel position. That phase depends on where the pixel sits in the 12-slot color wheel, which depends on the scanline and the frame counter.

The artifacts carry information. Experienced NES players learned to read them. Faint color fringing showed that a sprite was one pixel away from a background tile, and a dot pattern showed a specific palette combination. Game artists used them on purpose. They placed specific palette indices next to each other so that the composite signal would blend them into colors that the NES palette does not contain.

Every later stage processes this waveform: the comb filter, the demodulator and the CRT beam. The artifacts come out of the math in those stages with no special-case code, so an error in the waveform carries into every stage after it. The GPU pipeline's 14 stages of signal processing start from this waveform and end at the phosphor screen.
