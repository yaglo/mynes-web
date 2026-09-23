---
layout: "post"
title: "Part 6: Beam spot size"
date: "2026-09-20"
updated: "2026-09-23"
series: 6
slug: "beam-is-not-a-line"
permalink: "/blog/beam-is-not-a-line/"
description: "Stage 11 of the MyNES GPU pipeline: a Gaussian beam profile whose width depends on brightness, convergence error, Gaussian noise, mains hum and other beam effects."
source: "docs/blog/06-beam-is-not-a-line.md"
---

[Part 5]({{ '/blog/separating-colors/' | relative_url }}) covered stages 6 and 7 of the GPU pipeline, and this part covers stage 11, the electron beam. The beam shader models the spot profile, per-channel convergence error, Gaussian noise, mains hum and 5 smaller effects.

Most CRT shaders darken every other row, and every pixel in the dark row gets the same factor, such as 0.3 or 0.5. The result is a uniform grid of dark horizontal bars over the image. A CRT shows a different pattern, because its electron beam has a Gaussian cross-section whose width depends on brightness.

A dark pixel produces a narrow beam, and the unlit phosphor between scanlines shows as a dark gap. A bright pixel produces a wide beam that blooms into the adjacent lines and fills the gap between them with light. For this reason, CRT photographs of bright scenes never show visible scanlines: the beam is wide enough to fill the gaps.

Beam width that varies with brightness accounts for most of the difference between CRT footage and the output of CRT shaders. Stage 11 of the pipeline models it.

## Beam profile

Each output pixel sums the contributions of 3 adjacent NES scanlines: the current line and its 2 neighbors. For each scanline, the shader computes a Gaussian weight whose width depends on brightness.

The core of `beam_profile.comp.glsl`:

```glsl
for (int soff = -1; soff <= 1; soff++) {
    // Read RGB from the pre-blurred signal buffer
    float lR = rgb_in[(uint(r_line) * signal_w + uint(r_sx)) * 3u + 0u];
    float lG = rgb_in[(uint(g_line) * signal_w + uint(g_sx)) * 3u + 1u];
    float lB = rgb_in[(uint(b_line) * signal_w + uint(b_sx)) * 3u + 2u];

    // Luminance determines beam width
    float lY = clamp(0.299 * lR + 0.587 * lG + 0.114 * lB, 0.0, 1.0);
    float bloom_t = pow(lY, bloom_gamma);
    float sv = sigma_narrow + (sigma_wide - sigma_narrow) * bloom_t;
    float inv2s = 1.0 / (2.0 * sv * sv);

    // Gaussian beam intensity at this vertical distance
    R += lR * exp(-(rd * rd) * inv2s);
    G += lG * exp(-(gd * gd) * inv2s);
    B += lB * exp(-(bd * bd) * inv2s);
}
```

The `bloom_gamma` parameter sets the curve of the bloom. At `bloom_gamma = 1.0` the relationship is linear, and beam width scales directly with brightness. At the default of `bloom_gamma = 1.5`, moderate brightness gives narrower beams, and most of the bloom happens in the upper range of brightness. A CRT beam behaves the same way: it broadens faster as the beam current increases.

`sigma_narrow` and `sigma_wide` set the range. Dark pixels use `sigma_narrow = 0.20`, a tight Gaussian that barely extends beyond the scanline center. Full-brightness pixels use `sigma_wide = 0.70`, wide enough for adjacent scanlines to overlap considerably. The interpolation `sigma = sigma_narrow + (sigma_wide - sigma_narrow) * bloom_t` maps the full brightness range onto this range of sigma.

The Gaussian `exp(-d^2 / 2*sigma^2)` gives the beam intensity at vertical distance `d` from the scanline center. With a small sigma (a dark pixel) the falloff is steep, and almost no energy reaches the adjacent line. With a large sigma (a bright pixel) the falloff is gradual, and a large part of the energy spreads up and down into the gap between scanlines.

The close-ups gallery shows both cases in a [1:1 crop of the Mega Man 2 title lettering]({{ '/gallery/close-ups/#mega-man-2-title-screen-on-4-presets' | relative_url }}) on the Sony PVM-14L2 preset. It also measures the [beam height at 3 brightness levels on 4 presets]({{ '/gallery/close-ups/#beam-height-vs-brightness-on-4-presets' | relative_url }}).

## Per-channel convergence error

A color CRT has 3 electron guns, for red, green and blue, set apart in the tube neck. Each gun's beam passes through the shadow mask or aperture grille and lands on the phosphor dots of its color. The guns are aligned so that the 3 beams converge on the same triad at every position on the screen.

Exact convergence over the whole screen is impossible, because the deflection geometry makes an alignment set at the center drift at the edges. The beam shader models this as per-channel offsets that grow with distance from the center:

```glsl
float edge_factor = cx * cx + cy * cy;
float r_cx_off = conv_r_x * edge_factor;
float r_cy_off = conv_r_y * edge_factor;
float b_cx_off = conv_b_x * edge_factor;
float b_cy_off = conv_b_y * edge_factor;
```

Green is the reference channel and reads from the unshifted sample position. Red and blue read from offset positions, horizontally in signal samples and vertically in output rows. The offset is zero at the screen center (`edge_factor = 0`) and largest at the corners.

A well-calibrated PVM has convergence offsets near zero, and the error shows only on a test pattern. The Basement TV preset sets `conv_r_x = 6.0, conv_b_x = -5.0`: red shifts by 6 signal samples and blue by 5 samples in the opposite direction, and the shift grows toward the corners. Every sharp edge gets visible red and blue fringes, and white text on black gets colored halos.

## Per-pixel Gaussian noise

Electronic noise in a CRT signal path, such as thermal noise in resistors and shot noise in transistors, has a Gaussian distribution. Most shaders use uniform random noise, which has the wrong distribution. The difference on screen is small but visible: Gaussian noise has occasional larger excursions, which give the snow its texture.

The shader generates 6 independent hash streams per pixel with Murmur3, then converts the uniform random values to Gaussian ones with the Box-Muller transform:

```glsl
float nr = sqrt(-2.0 * log(u1)) * cos(u2);
float ng = sqrt(-2.0 * log(u3)) * cos(u4);
float nb = sqrt(-2.0 * log(u5)) * cos(u6);
```

That gives 3 independent Gaussian samples, one per channel. Local luminance modulates the noise amplitude:

```glsl
float noise_scale = noise_level * (1.0 - 0.8 * clamp(luma, 0.0, 1.0));
```

Shadows get more noise than highlights. This models the signal-to-noise ratio: the noise floor is constant, and bright areas have more signal, so the noise is proportionally less visible there. Dark areas, where the signal is weakest, show the most snow.

## Mains hum

The power supply's 60 Hz ripple modulates the beam brightness. A cheap TV with poor power supply filtering shows a slowly rolling hum bar: a horizontal band of slightly different brightness that drifts up through the frame over several seconds.

Hum from a rectifier has harmonics above its fundamental:

```glsl
float hum_wave = sin(hum_phase)
               + 0.40 * sin(2.0 * hum_phase + 0.8)
               + 0.15 * sin(3.0 * hum_phase + 1.5);
```

The wave has the fundamental at 60 Hz, a second harmonic at 120 Hz with 40% amplitude and a third harmonic at 180 Hz with 15%. The phase offsets of 0.8 and 1.5 radians model the non-ideal phase relationships in a full-wave rectifier. The bar rolls slowly because `frame_counter * 0.006` advances the phase by a fraction of a radian per frame.

## Other beam effects

The shader models 5 more physical effects, each in a few lines of GLSL.

### Horizontal timebase jitter

The sum of 2 incommensurate sine waves moves the whole image sideways in a slow, irregular sway, as on a CRT whose horizontal oscillator capacitors are drifting. `h_jitter` sets the amplitude. PVMs have a stable timebase (`h_jitter = 0.0`), and a cheap TV has visible wobble.

### Edge focus

The beam defocuses at the screen edges because of the longer throw distance and the astigmatism of the yoke. `edge_focus` widens the beam sigma by a factor of `(1 + edge_factor * edge_focus)`. A value of 0.3 makes text in the corners visibly softer than text in the center.

### Velocity dimming

With nonlinear deflection, the beam sweeps faster at the edges of the screen, and a faster sweep deposits less energy per pixel. The attenuation is `1.0 - edge_factor * velocity_dim`. Vignette is a separate effect that models the optical `cos^4` falloff of illumination.

### Geometry warp

Pincushion distortion and S-correction are applied as horizontal position shifts modulated by vertical position. The Wega preset has `barrel = 0.0` for its flat tube. The Basement TV has `barrel = 0.05, barrel_v = 0.08`, much more vertical curvature from an aged deflection yoke.

### RF interference

Electromagnetic interference from nearby electronics produces a stepped vertical zigzag, `floor(sin(sy * 0.45) * rf_interference + 0.5)`. The `floor` keeps each shift a whole number of pixels, which is how RF interference displaces the picture on a CRT.

## Output format

The beam shader writes packed `float16x4`: 2 `uint32` values per pixel, which hold RGBA as half-precision floats packed with `packHalf2x16`. Values above 1.0 are kept, because the phosphor can overshoot SDR white during bloom. The later stages (glass halation, tone mapping) need that full dynamic range. A soft clamp at 4.0 prevents numerical fireflies.

## Decoded RGB with and without the beam profile

Without the beam profile, a composite decode that produced exact RGB values would look like an LCD with a color filter. Every earlier stage (the DAC, the cable model, the comb filter and the chroma demodulator) feeds into this one. With the beam profile, dark areas show scanline structure, bright areas fill the gaps between scanlines, and edges have soft fringes from convergence error. The shadows also get a faint snow of Gaussian noise.

The beam profile shader is about 200 lines of GLSL, and it has the largest visible effect of the 14 stages. It treats the beam spot as a probability distribution whose parameters depend on the signal.
