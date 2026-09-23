---
layout: "page"
title: "Consumer CRT review, 2026-09-22"
permalink: "/archive/consumer-crt/"
section: "archive"
description: "Retuning of 4 generic consumer presets: raster profiles, mask resolution, a brightness check and matched image checks."
source: "docs/consumer-crt-review.md"
updated: 2026-09-23
archived: 2026-09-23
replaced_by: "/gallery/televisions/"
sitemap: false
redirect_from:
  - "/gallery/consumer-crt/"
---

This review retuned 4 generic consumer presets whose raster profiles were too broad and whose phosphor patterns resolved too cleanly. The changes are tuning assumptions, and no specific combination of tube and chassis was measured for them.

## Changes per preset

| Preset | Changes |
|---|---|
| Bedroom RF 1990 | In-line slot mask; dark and white FWHM 0.40 and 0.95 source lines; less peripheral defocus; horizontal spot growth 0.30; light fine surface scatter; RF noise floor -52 dBm and a 0.6% short echo. The existing Y/C decoder stays. |
| Basement TV | FWHM 0.48 and 1.10 lines, a smaller horizontal spot with growth, less glass attenuation and less gun imbalance. Voltage noise lowered from 0.025 to 0.003 and the RF noise floor from -44 to -50 dBm. Less lifted black and a smaller broad halo. |
| Compact video monitor (`commodore_1702.json`) | Smaller horizontal spot, FWHM 0.42 and 0.90 lines, less convergence error, modest horizontal growth. The separated Y/C path stays. The preset stays explicitly generic, and no 1702 was measured. |
| Arcade Cabinet | Narrower dark spot, horizontal growth 0.45, modest fine surface scatter. RGB stays an explicitly ideal source derived from the voltages, and it models neither a stock NES output nor the PlayChoice-10 palette. |

The echo is a generic impairment of the reception path, and its delay is not calculated from the preset's short cable. Fine surface scatter uses the existing post-mask filter, whose coefficients are nominal, and it leaves the mask holes the same size when the electron beam grows. Electron spot growth and optical spreading are separate mechanisms. No mask erasure that depends on beam current was added.

A CRT beam has a finite width on both axes. The [AAPM TG18 report](https://www.aapm.org/pubs/reports/or_03.pdf), for example, discusses how spot size depends on beam current and how continuous and structured phosphor screens differ. Applying RF luma filtering as a 2D image blur would add a vertical bandwidth blur. MyNES keeps the receiver bandwidth filter horizontal, before the beam deposits light on the tube.

RF noise already enters in the RF path. Clean RF reception is possible, so each preset sets its noise as a reception condition.

## Brightness check

The Contra platform on the Sony PVM-14L2 preset uses NES code `0x10`, which is below peak white. The measured DAC rails in the emulator give it a relative voltage of `(840 - 312)/(1100 - 312) = 0.67005`, which is about 0.383 in linear emitted light at gamma 2.4. In the 1280×960 SDR capture of this review, the flat region at x 550 to 629, y 510 to 529 averages about 0.371 after sRGB decoding. Its encoded channels average about 157/255, 52 levels above 105/255.

A different crop, an older build, another host output mode or scaling of the image can change these numbers. This check does not establish the conditions under which the review image was made.

The beam kernels and the normalized masks conserve linear energy. An average of encoded screenshot bytes does not measure luminance. No global compensating gain and no retune of the PVM decoder were applied without evidence for them. SDR highlight compression can still lose energy where resolved phosphor peaks exceed the host's headroom, and HDR output and the physical mask density change how much.

## Matched image checks

All 4 presets render the same Contra PPU framebuffer at phase 4 in 1280×960 SDR, with integer mask periods, a 60 Hz hold and frame 60. The samples are linear-light luminance values from the images and are not calibrated photometer measurements. In a small flat platform region at x 555 to 599, y 510 to 529, the row-average modulation `(max-min)/(max+min)` changed as follows:

| Preset | Modulation before | Modulation after | Mean linear Y before / after |
|---|---:|---:|---:|
| Bedroom RF 1990 | 0.121 | 0.284 | 0.430 / 0.427 |
| Basement TV | 0.070 | 0.162 | 0.211 / 0.303 |
| Compact video monitor (Y/C) | 0.121 | 0.222 | 0.368 / 0.368 |
| Arcade Cabinet (RGB) | 0.100 | 0.208 | 0.384 / 0.384 |

The raster is clearer, and the added contrast comes with no global loss of light. Basement TV is brighter because its excessive preset attenuation was removed. Compare masks at 1:1: scaling encoded screenshots can create color moiré that 6-column linear-light averages of the source do not show.
