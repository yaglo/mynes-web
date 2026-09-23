---
layout: "post"
title: "Part 5: Comb filters"
date: "2026-09-19"
updated: "2026-09-23"
series: 5
slug: "separating-colors"
permalink: "/blog/separating-colors/"
description: "Stages 6 and 7 of the MyNES GPU pipeline: the comb filter modes, I/Q demodulation, chroma bandwidth and dot crawl."
source: "docs/blog/05-separating-colors.md"
---

Updated 2026-09-23: the shader code in this post is from the prototype. The current shader has a horizontal notch, a 2-line (1H) comb, an adaptive 3-line comb, a 3-line (2H) comb and a bypass, and its 3-line comb uses the center line and its 2 neighbors.

[Part 4]({{ '/blog/fourteen-stages/' | relative_url }}) listed the 14 stages of the GPU pipeline, and this part covers stages 6 and 7. They separate luma from chroma, demodulate the chroma and limit its bandwidth. These 2 stages produce most of the artifacts people associate with "the NES look".

In NTSC composite video, luminance and chrominance occupy overlapping frequency bands. The color information is amplitude modulation on a 3.579545 MHz subcarrier, and it sits on top of the high-frequency luma detail. The television has to pull the 2 apart. Because the bands overlap, the separation is always incomplete, and each imperfection shows on screen.

## Comb filtering

The NTSC subcarrier inverts its phase by 180 degrees on every scanline. The engineers who wrote the NTSC color standard in 1953 chose this on purpose, because it lets a receiver separate Y and C without an ideal bandpass filter.

Take 2 adjacent scanlines at the same horizontal position. They carry about the same luma, since the image changes little between adjacent lines, and their chroma subcarriers have opposite phase:

```
scanline[n]   = Y + C
scanline[n-1] = Y - C    (subcarrier inverted)
```

Adding the 2 lines cancels the chroma: `(Y + C) + (Y - C) = 2Y`. Subtracting them cancels the luma: `(Y + C) - (Y - C) = 2C`. This is a comb filter, named for its frequency response, which has evenly spaced teeth like a comb.

## Comb filter modes in the shader

The prototype shader had 4 modes, a bypass for S-Video and 3 comb filters, each modeling a different class of TV hardware:

```glsl
switch (mode) {
    case 0u: /* Bypass: S-Video input, Y/C already separated */
        y = signal;
        c = 0.0;
        break;

    case 1u: /* 1-line comb: cheap TV */
    {
        int prev_idx = int(tid) - int(samples_per_line);
        float prev_signal = (prev_idx >= 0) ? signal_in[prev_idx] : signal;
        y = (signal + prev_signal) * 0.5;
        c = blend * (signal - prev_signal) * 0.5;
        break;
    }

    case 2u: /* 2-line comb: decent TV */
    {
        // Uses current + 2-lines-ago (same phase) for cleaner luma
        y = (signal + prev2) * 0.5;
        c = blend * (signal - y);
        break;
    }

    case 3u: /* 3-line comb: PVM-grade */
    {
        // Average 4 scanlines -- chroma cancels over 2 complete cycles
        y = (signal + prev1 + prev2 + prev3) * 0.25;
        c = blend * (signal - y);
        break;
    }
}
```

Each comb has its own failure pattern. The list starts with the notch filter, which the prototype left out.

No comb filter
: The prototype had no mode for this case, where the TV separates Y and C with a notch filter alone; the current shader has one. Cross-color appears on every transition where luma detail reaches the subcarrier frequency, and thin horizontal lines shimmer with rainbow colors. The cheapest TVs work this way, and they show the most cross-color of the 4 cases.

1-line comb
: Keeps horizontal detail. The assumption that adjacent scanlines have the same luma fails at vertical edges: a sharp horizontal boundary, such as the border of a status bar, gives lines N and N-1 different luma. The filter treats that luma difference as chroma, and every horizontal edge gets rainbow fringes. This is the artifact most people remember from the NES on composite video.

2-line comb
: Uses the current scanline and the one 2 lines back, which has the same subcarrier phase, and skips the line between them, which has the opposite phase. The luma estimate improves, and vertical detail that changes over 2 lines still disturbs it.

3-line comb
: The prototype averaged 4 consecutive scanlines, which cancels the chroma over 2 complete subcarrier cycles and averages 4 lines of luma. The current mode uses the center line and its 2 neighbors. It averages only the chroma band and subtracts the result from the composite signal, which keeps low-frequency vertical luma detail. A Sony PVM with a 3D comb filter compares across frames and separates Y and C better still, and the 3-line mode already leaves little cross-color.

The `blend` uniform sets the comb strength from 0 to 1. At `blend = 0` no chroma is extracted, and at `blend = 1.0` the comb works at full strength. Values in between let the pipeline model TVs with weak comb circuits.

## Quadrature demodulation of I and Q

The chroma signal that leaves the comb filter still holds the color in encoded form. The I component (in-phase, the orange-cyan axis) and the Q component (quadrature, the green-magenta axis) are amplitude-modulated onto cosine and sine carriers at the subcarrier frequency. Each is recovered by multiplying by its carrier and filtering out the residual at twice the carrier frequency.

The modulator shader does both channels at once in its I/Q demodulation mode (mode 3):

```glsl
case 3u: /* I/Q demodulation */
{
    float gain = param_a;
    float s = x * gain;
    data_out[tid]  = s * cos(p);   // I channel
    data_out2[tid] = s * sin(p);   // Q channel
    break;
}
```

The shader computes the phase `p` of each sample from the subcarrier frequency and the sample rate, `dp = 2*pi * 3579545 / sample_rate`, and resets it at the start of each scanline:

```glsl
if (samples_per_line > 0u) {
    uint scanline = tid / samples_per_line;
    uint sample_in_line = tid % samples_per_line;
    p = phase + float(scanline) * line_phase_inc
      + float(sample_in_line) * dp;
}
```

The PPU's subcarrier phase advances by a fixed amount on each scanline, and the `line_phase_inc` uniform holds that amount. The demodulator has to track it exactly. With a wrong value the recovered color drifts, and the whole screen shows a slowly rotating hue.

After demodulation, I and Q each pass through a FIR lowpass filter, which is the bandwidth limiting of stage 7. The filter removes the double-frequency component of the multiplication: in `cos(w)*cos(w) = 0.5 + 0.5*cos(2w)`, the `cos(2w)` term has to go. The filter's bandwidth also sets how far color spreads horizontally.

## Chroma bandwidth and color bleed

A consumer TV on composite input typically has a chroma bandwidth of 1 MHz. Its FIR filter keeps frequency content up to 1 MHz and suppresses everything above. The video signal is sampled at about 21.5 MHz, so 1 MHz corresponds to about 21 samples per cycle. The impulse response of the FIR spreads over several samples in each direction.

On screen, a sharp color transition at pixel N spreads its I/Q energy over pixels N-4 to N+4, and the color bleeds. The bleed is a physical consequence of the bandwidth. A PVM with 1.5 MHz of chroma bandwidth has a tighter impulse response, so its colors bleed less and its color transitions are sharper. In the code, the difference between consumer TV color bleed and PVM sharpness is one float, `chroma_bandwidth`:

```c
if (conn <= VIDEO_CONN_COMPOSITE) {
    tv->chroma_bandwidth = 1.0e6f;    /* 1.0 MHz */
} else {
    tv->chroma_bandwidth = 1.5e6f;    /* 1.5 MHz */
}
```

## Dot crawl

The subcarrier phase inverts between scanlines and also shifts between frames. Over a cycle of 2 frames (or 3, depending on the phase relationship), the cross-color pattern at a given pixel rotates through different phases. On a static image this shows as a crawling rainbow pattern along sharp luma transitions.

Phosphor decay and visual integration can soften the frame-to-frame structure, but CRTs do not all cancel dot crawl. The result depends on source timing, decoder separation, phosphor response, scene motion and viewing conditions. Temporal comb filtering is a separate operation in the receiver, and its effect should not be attributed to phosphor persistence.

## Limitations

The current renderer keeps the phase alternation and models the afterglow of each channel in linear light. Its decay is sampled once per frame and approximates P22 phosphor without a measured P22 impulse response. Some diagnostic stills average 2 frames, and the videos on the archived [Showcase page]({{ '/archive/showcase/' | relative_url }}) keep the individual phases of consecutive frames. The [GPU pipeline reference in the code repository](https://github.com/yaglo/mynes/blob/master/docs/gpu-pipeline-reference.md) lists the implemented stages and their limits.
