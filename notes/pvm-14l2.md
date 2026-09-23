---
layout: "page"
title: "Sony PVM-14L2"
permalink: "/notes/pvm-14l2/"
section: "notes"
description: "What the Sony PVM-14L2 service manual and specifications support in the preset, and which values are estimates."
source: "docs/pvm-14l2-model.md"
updated: 2026-09-23
redirect_from:
  - "/research/pvm-14l2/"
nav_order: 2
nav_title: "Sony PVM-14L2"
---

This note records which parts of the Sony PVM-14L2 preset (`sony_pvm_14l2.json`) rest on the Sony PVM-14L2 service manual and Sony's published specifications, and which values are estimates. The [About page]({{ '/about/#how-the-images-are-made' | relative_url }}) states what the presets are built from.

Out of scope: the other aperture-grille presets. They keep their own settings and are not converted to this chassis.

## Test conditions

- Audit: 2026-09-21, against the documents listed under References. I used no photograph or electrical measurement of my own PVM-14L2.
- Preset: `presets/sony_pvm_14l2.json`.
- Tests: the Metal backend on the development Mac. The source document names no commit or display for the test run.
- Reproduction:

```sh
cmake --build build --target mynes_gpu test_signal_precompute test_presets test_preset_json test_pipeline test_fidelity -j 8
ctest --test-dir build --output-on-failure -R '^gpu_(signal_precompute_tests|preset_tests|preset_control_audit|preset_json_tests|pipeline_test|fidelity_tests)$'
python3 tools/circuits/sweep_pvm_aperture.py /tmp/pvm-aperture
```

## Sources and revision boundary

The note draws on 4 documents: Sony's L2 brochure[^brochure], the PVM-14L2/20L2 service manual in its 2nd edition[^sm], Motorola's MC141627FT datasheet[^mc141627] and Sony's Japanese specifications[^sony-jp].

The cover of the service manual lists the serial numbers SY 2100001 to 2199999, AUS 2600001 to 2699999 and CH 6100001 to 6199999. The serial number and revision of my own unit have not been established. The page references below identify the circuit I inspected, and they do not establish that every production revision is identical.

## Signal routing recovered from the service manual

Printed pages 5-1 and 5-2, and schematic sheets B(1/5) and B(2/5) on printed pages 9-5 and 9-6, give these routes:

1. Composite passes through the selection path of CXA2163AQ IC104 to MC141627FT IC111. The Y/C outputs of IC111 return through FL108 and FL109 to IC104 for decoding.
2. Y/C input bypasses the composite separator and enters the decode path of IC104.
3. Component bypasses composite and chroma decoding and supplies Y/Cb/Cr to CXA1739S IC231. Component reaches the Y aperture path of IC231.
4. RGB is buffered, clamped and switched with the OSD into the separate RGB inputs of IC231, pins 10 to 12. It bypasses the external Y aperture network.

MyNES follows the composite, Y/C and RGB routes. Its component input takes a shortcut that the Limitations section describes. RGB and component cable losses, input clamping and the exact IC matrix have no circuit model.

## Changes supported by specifications

| Mechanism | Preset setting | Implementation and limit |
|---|---|---|
| Horizontal AFC | `h_afc_tau_ms = 1` | First-order phase tracking at the line period of the signal. It runs independently of color-burst acquisition and holds phase through missing sync and vertical retrace. It has no oscillator or phase-detector circuit and no frequency capture model. |
| Aperture range | `aperture_max_db = 6` | Sharpness 0 to 1 maps linearly to 0 to 6 dB of peak gain in the aperture stage alone, and 0 bypasses the stage. The dB-linear knob law and the highpass-shelf frequency shape are assumptions. Losses before and after the stage still set the visible sharpness. |
| RGB bandwidth | `rgb_bandwidth_3db = 1`, R, G and B at 10 MHz | The FIR amplitude is fitted to -3 dB at 10 MHz. The earlier version put the windowed-sinc cutoff at 10 MHz, which gave about -6 dB there. Other frequencies and the group delay are FIR approximations, and the end-to-end optical response at 10 MHz is not guaranteed. |

Presets without the new fields, or with them at 0, render as before. The new settings are saved and loaded with a preset and update live. Picture → Sharpness stays the everyday aperture control. The advanced Video menus show the aperture maximum gain, the AFC time and the bandwidth interpretation. The changes add no per-frame pass and no GPU readback.

The AFC uses `alpha = 1 - exp(-line_period / tau)` and updates the horizontal state only while horizontal sync is valid. The burst and black-level loops keep their generic laws. The time constant changes signal tracking only, and emulation speed, presentation cadence and the NES carrier phase sequence stay the same.

## Aperture network on schematic B(2/5)

Around IC231 (CXA1739S):

- Y enters TP106/JL142 after R583 (100 ohm). The main branch runs through R248 (1.2 kohm), then C240 (47 nF) into pin 3, Y.
- A second feed also starts at TP106, and SHP OUT does not drive it. It passes through R247 (1.8 kohm) in parallel with C234 (39 pF), and R249 (3.9 kohm) shunts the node after them. L230 (15 uH), C239 (20 pF) and R255 (a zero-ohm link) lead to pin 8, SHP IN.
- Pin 5, SHP OUT, has R256 (4.7 kohm) and C201 (220 pF) to ground. C238 (39 pF) couples that output back into the main Y node before C240.
- Pin 6, SHP SET, receives the external aperture control voltage.

The traced network is stronger evidence than the fact that the IC has a sharpening feature. It does not give the active input and output impedances, the polarity, the internal transfer, the gain-vs-control law, the limiting or the tolerances of the complete circuit. The renderer therefore keeps an approximate shelf, and the 6 dB limit makes no claim to reproduce this circuit.

The [partial SPICE deck](https://github.com/yaglo/mynes/blob/master/tools/circuits/pvm14l2_aperture_input.cir) and its [sweep](https://github.com/yaglo/mynes/blob/master/tools/circuits/sweep_pvm_aperture.py) isolate the path between TP106 and SHP IN with 5 hypothetical resistive loads. The ideal L/C resonance is 9.189 MHz. The sampled maxima move from 11.80 MHz up to the sweep's upper limit of 30 MHz as the load changes from 1 to 100 kohm. Neither figure is the aperture peak of the monitor, so 9.189 MHz cannot serve as a calibrated sharpening frequency. The sweep does not import its curves into any preset.

## Comb-chip vertical enhancement is disabled

Schematic sheet B(1/5) connects VH, pin 42 of IC111, directly to +5 V, on the same rail as DVCC on pin 44. R200 (10 kohm) connects that rail to the collector of Q130 and to PAL/NTSC on pin 47. R200 is the pull-up for mode selection, and VH does not follow PAL/NTSC through it. In Motorola's truth table, VH high turns the enhancement off.

The traced revision therefore disables the vertical enhancer in both NTSC and PAL. This is an inference from the schematic, and no probe measurement confirms it. C7, C3 and D7 are strapped high, and the other C and D configuration pins shown are low. MODE0, MODE1 and BYPASS are low in normal operation.

MyNES has no always-on vertical sharpener for this preset, because the traced board disables the one in the MC141627.

## Unknowns in ABL, focus and tube mechanics

Page 5-2 of the manual describes 2 ABL control paths. Q239 (PIC ABL) pulls pin 46 of IC231, and Q235 (BRT ABL) pulls pin 7. The 2 paths have different reference thresholds, Q242 switches the references for the aspect ratio, and a single brightness multiplier cannot stand for them.

Unknown: the ABL input voltage as a function of cathode current, and the control laws of the IC. MyNES does not present its generic rail sag as this ABL circuit, and sag stays off in the PVM-14L2 preset. The model does not use protection trip values as normal ABL activation thresholds.

Page 5-3 labels the focus output circuit of Q501, Q502, Q503 and T501 "PVM-20L2 only", so the PVM-14L2 model leaves it out. The focus adjustment of the PVM-14L2 and the estimated edge-focus and spot-growth behavior of MyNES do not amount to a recovered dynamic-focus transfer function.

The grille count (267.5 mm / 0.25 mm = 1070), the active aspect and the D65 white point have published sources. 600 TVL is horizontal resolution normalized to picture height, and it defines neither 600 stripes nor a scanline width. The spot FWHM, its growth with current, convergence, glass scattering, the phosphor primaries and the phosphor decay are estimates. P22 names a family of phosphors and gives no single set of decay curves or spectra. Beam-current feedback for white balance is a separate mechanism from brightness limiting and EHT regulation.

## Test results

All 6 selected suites passed on the Metal backend of the development Mac:

- The horizontal phase-step response follows the 1 ms exponential at the NTSC and PAL sample rates. It carries over consecutive dispatches, holds during vertical and invalid sync, and recovers with no horizontal snap from burst acquisition. A live parameter update checks the host-to-shader conversion of the time constant.
- Aperture spectra swept at both sample rates match the requested peaks of 0, 1.5, 3, 4.5 and 6 dB within 0.0001 dB, and they keep DC and symmetry. GPU tests keep the luma trap and the chroma routing, and they bypass sharpness for RGB.
- RGB impulse responses on the GPU measure -3.000001 dB at 10 MHz on each channel. CPU sweeps check the -3 dB definition over 2 to 10 MHz at both clocks.
- Preset JSON round trips and the control audit cover the new settings.
- SPICE and a separate complex-impedance calculation agree within 1.4e-15 in absolute complex voltage gain for all 5 passive-network cases.

## Limitations

- Component input: the component route of MyNES is an ideal shortcut that forms RGB before the CRT stages. It skips the receiver's Y filtering and aperture stage, which component Y reaches on the PVM-14L2.
- Comb filter: the shared adaptive NTSC comb of MyNES does not reproduce the proprietary correlation logic of the MC141627. The PAL horizontal separator and delay-line model does not reproduce its PAL comb, and the ADC and DAC quantization at the chip's 4fsc clock is not reproduced.
- Calibration: the tests check how the implementation behaves and do not validate a physical tube. Calibrating a unit needs measurements of aperture multiburst and edge response against the control, and of the decoded color transfer. It also needs spot profiles against current and position, ABL and EHT load steps, grille and geometry alignment, and the temporal and spectral response of the phosphors. The proprietary comb decision logic needs characterization or a detailed enough implementation reference.

## References

[^brochure]: Sony, [L2 brochure MK10009V1IW02NOV](https://www.adcom.it/public/images/pdf/pvm-14l2%20demo.pdf), specification table. The published specifications of the PVM-14L2.
[^sm]: Sony, [PVM-14L2/20L2 service manual, 2nd edition](https://archive.org/download/trinitron_pvm14l2/trinitron_pvm14l2.pdf), printed pages 5-1 to 5-3, 9-5 and 9-6. The signal routing, the ABL and focus circuits, schematic sheets B(1/5) and B(2/5), and the serial ranges on the cover.
[^mc141627]: Motorola, [MC141627FT datasheet](https://pdf.dzsc.com/27F/MC141627FT_1084067.pdf). Pin descriptions, the block diagram and the VH truth table, in an original manufacturer document hosted by a distributor; the internal comb algorithm is unpublished.
[^sony-jp]: Sony, [Japanese specifications SPC_PVM-20N6J](https://www.sony.jp/products/catalog/SPC_PVM-20N6J.PDF). The L2 table, which is separate from the N-series table in the same document.
