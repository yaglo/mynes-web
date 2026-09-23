---
layout: "page"
title: "Published CRT measurements"
permalink: "/notes/measurements/"
section: "notes"
description: "Hitachi 751 veiling-glare fit, the GPU check against it, and the FW900 spatial and tonal target."
source: "docs/crt-measurements.md"
updated: 2026-09-23
redirect_from:
  - "/research/measurements/"
nav_order: 4
nav_title: "Published measurements"
---

This note covers 2 published sets of CRT measurements that MyNES uses: the veiling glare of a Hitachi SuperScan Elite 751 monitor, and the NIDL evaluation of the Sony GDM-FW900. It gives the glare fit and the Lab: measured glass scatter preset built from it. It also gives the GPU check against the paper, and the checks of the FW900 report made before fitting.

## Test conditions

- GPU check: 2026-09-22, `test_display_fidelity.c` at output sizes of 512×512 and 1024×1024.
- Visual check: unaveraged 1280×960 captures of Contra at the same phase.
- The source document names no machine, display or commit for these runs.
- Reproduction of the fit:

```sh
python3 tools/measurements/fit_crt_glare.py
```

- Reproduction of the Lab: measured glass scatter preset:

```sh
python3 tools/measurements/fit_crt_glare.py \
  --base-preset presets/reference_composite.json \
  --picture-height-mm 270 \
  --output-preset presets/measured_glare_experiment.json
```

## Veiling glare of the Hitachi 751

Tables 1 and 2 of Flynn and Badano (1999)[^flynn] report measurements of a Hitachi SuperScan Elite 751 color monitor. The [transcribed dataset](https://github.com/yaglo/mynes/blob/master/tools/measurements/hitachi_751_glare.json) records the geometry, the black subtraction, the repeatability and the reflection coefficients. Figure 2 of the paper is a simulated monochrome example and does not show the measured point-spread function of this monitor. Total veiling glare has electronic and optical contributions, and the dataset cannot separate them.

MyNES approximates the effective glare with:

```
K = (1 - a) delta + a G_sigma
G_sigma = exp(-r² / (2 sigma²)) / (2 pi sigma²)
q(r) = a [exp(-r² / (2 sigma²)) - exp(-R² / (2 sigma²))]
       / [1 - a exp(-R² / (2 sigma²))]
glare_ratio = 1 / q(r)
```

Here `r` is the radius of the dark disk, `R` the outer radius of the bright disk, and `q` the center luminance divided by the bright reference. Both terms of `K` have unit integrated energy before weighting. The model redistributes light and does not raise the luminance of a uniform field. It assumes linearity and shift invariance, with a narrow direct component and a Gaussian scatter tail. It does not solve electron trajectories or internal optical reflections.

The fit script has no dependencies, and its command is under Test conditions. It gives `sigma = 8.144620194 mm` and `a = 0.048294485894`. These are parameters fitted under the assumptions above, and they do not measure a spot size.

## Halo width in the renderer

The renderer accepts `tv.halation_sigma`, the scatter sigma divided by the picture height. The Glass menu labels it Halo width / height (0=auto). A positive width selects a normalized separable Gaussian of 33 taps with support of 4 sigma. A width of 0 keeps the existing kernel and width, so older presets render as before. The implementation reuses the 3 existing halo passes and their scratch textures.

## Glare preset built from the fit

The Lab: measured glass scatter preset is a generic composite receiver with the fitted effective scatter. It assumes a physical picture height of 270 mm, which gives `halation_sigma = 0.03016526` (8.144620194 mm / 270 mm). The preset does not reproduce the receiver, scanning system, phosphor, mask or beam of the Hitachi, and those parts keep the Reference composite settings. Its command is under Test conditions.

A different assumed picture height changes the width in image coordinates, and resizing the host window leaves that physical assumption unchanged. The preset uses a neutral scatter tint. It turns off the generic internal-scatter contribution, so that no second scatter fraction is added on top of the fit. The reflection coefficients stay as recorded data and set nothing in the renderer, because converting them needs an illumination model and absolute luminance units.

## GPU check against the published glare ratios

`test_display_fidelity.c` renders area-covered disks, reads back linear RGBA16F output and compares the center luminance with a separate rendering of the bright disk. Beam, mask, ambient light and output tone mapping are left out to isolate this stage. The 400 mm square of the test is a coordinate domain and has nothing to do with the dimensions of the monitor.

| Output size | Dark diameter | Published ratio | GPU ratio | Difference |
|---|---:|---:|---:|---:|
| 512×512 | 10 mm | 25 | 24.6812 | −0.3188 (−1.28%) |
| 512×512 | 20 mm | 44 | 42.0167 | −1.9833 (−4.51%) |
| 1024×1024 | 10 mm | 25 | 24.8121 | −0.1879 (−0.75%) |
| 1024×1024 | 20 mm | 44 | 43.6402 | −0.3598 (−0.82%) |

Percentages are of the published ratio. The test tolerance of 5% covers quadrature, reduction, pixel coverage and the finite readback area. At the higher resolution the difference is below 1%. Separate uniform-field checks confirm that energy is preserved. The JSON round trip, the compatibility with missing fields and the preset and control audits pass.

Unaveraged 1280×960 captures of Contra at the same phase show wider light spill into black regions around bright objects. The overall difference is small.

## Sony GDM-FW900 report

The NIDL evaluation of the Sony GDM-FW900[^ntis], publication 751810601-120 of 2001-09-06, gives grayscale response, spatial contrast modulation, uniformity, color and halation results at 1920×1200. The [full report](https://archive.org/download/DTIC_ADA415156/DTIC_ADA415156.pdf) is public. For a fully measured model of a computer monitor it is a stronger basis than an arbitrary television with only a service schematic.

Checks of the source before fitting:

- Printed pages 10 to 12 disagree on the halation normalization. The measured center values are 1.015 and 19.54 foot-lamberts. Their ratio gives the reported 5.19%, and the printed formula, which uses the luminance difference, gives 5.48%.
- In the same section, the nominal patch area of 0.01% and the patch side of 11 pixels do not agree with the stated raster. No physical kernel is fitted to that geometry until this is resolved.
- Contrast modulation at a single pattern frequency does not give a full MTF curve.
- A grayscale measurement with changing surrounds can include regulation and stray light, so it is not used directly as the isolated gun EOTF.

MyNES implements a separate FW900 raster path. The [Sony GDM-FW900]({{ '/notes/fw900/' | relative_url }}) note describes its scaler, transfer, resolution fits, physical grille, GPU comparisons and the temporal and optical limits that remain. The path is separate from the TV model, and renaming a TV preset would not have produced it.

## Limitations

- The glare fit has 2 parameters for 2 observations, which leaves no point for independent validation. A long-tailed kernel, or one with several components, could also fit these data.
- The 5% test tolerance is larger than the repeatability that the paper reports, so the GPU check does not show agreement within the measurement uncertainty.
- The Contra captures show no large improvement of the complete CRT image.

## References

[^flynn]: Flynn and Badano (1999), [paper on CRT veiling glare](https://doi.org/10.1007/BF03168843), tables 1 and 2. The veiling-glare measurements, geometry, black subtraction, repeatability and reflection coefficients of the Hitachi SuperScan Elite 751.
[^ntis]: NTIS, [catalog entry ADA415156](https://ntrl.ntis.gov/NTRL/dashboard/searchResults/titleDetail/ADA415156.xhtml). The catalog record of the NIDL evaluation of the Sony GDM-FW900.
