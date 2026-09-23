---
layout: "page"
title: "Receiver sharpening and interference"
permalink: "/notes/sharpening/"
section: "notes"
description: "The receiver stages MyNES implements, the hardware evidence for 5 models, the target for each preset and the open work."
source: "docs/gpu-sharpening-audit.md"
updated: 2026-09-23
redirect_from:
  - "/research/sharpening/"
nav_order: 5
nav_title: "Receiver sharpening"
---

This note lists the receiver stages MyNES implements for sharpening and interference, and the hardware evidence for 5 named models. It also gives the target for each of the {{ site.data.facts.presets.count }} presets, the open work, and the mechanisms that can produce squiggly lines on an NES picture.

## Test conditions

- Review: 2026-09-21.
- Sharpness check: a synthetic grayscale-edge capture of 1024×960 on the GPU at Sharpness 0 and 1, on the Basement TV and Reference composite presets.
- Regression tests: the GPU tests in the code repository named in the sections below.
- The source document names no machine, display or commit for these runs.

## Selectable receiver stages

| Stage | Current choices | Limit of the model |
|---|---|---|
| Y/C separation | Horizontal notch, 2-line (1H), adaptive 3-line, 3-line (2H), bypass | Shared equivalent responses; no proprietary chip decision logic and no motion-adaptive 3D comb. PAL uses horizontal separation and its delay line. |
| Luma bandwidth | Cutoff, FIR length and window, trap depth | Windowed FIR approximation; amplitude and group delay are not measured per receiver. |
| Sharpness | Generic horizontal highpass shelf on the recovered Y; 0 bypasses it; optional peak-gain ceiling in dB | No independent peaking frequency or Q, coring, limiter, asymmetric preshoot and overshoot, vertical detail or chip-specific control law. |
| Chroma | I/Q bandwidth, hue, gain, delay-line correction | No model-specific chroma transient improvement and no measured decoder nonlinearity. |
| RGB amplifiers | Bandwidth per channel, optional -3 dB definition, rise and fall approximation, smear | No full transistor or circuit model. The legacy `velocity_mod` adds a luminance derivative to the voltage and leaves beam velocity and dwell unchanged; the OSD now calls it Edge derivative. |
| Tube and supply | Spot width and growth, mask, convergence, recovery, regulation, decay, optics | Shared behavioral equations with estimated parameters that depend on the unit. |

Sharpness now runs after the Y bandwidth filter and trap, and after the chroma branch has read its input. The earlier version added a highpass directly to the separation FIR, which could bring back rejected chroma and out-of-band noise. The new cascade keeps the receiver's rejection. The stage is generic, and its normalized scale of 0 to 1 differs from the factory menu scale of any television.

The RGB and direct inputs bypass receiver sharpening. Their source is an ideal separated-output modification derived from the voltage, and no NESRGB board is simulated. S-Video keeps a luma path. Component takes the same ideal separated-output shortcut and also bypasses receiver sharpening.

## Hardware evidence per model

### Sony PVM-14L2

The [Sony PVM-14L2]({{ '/notes/pvm-14l2/' | relative_url }}) note traces the external aperture network of the CXA1739S and the enable wiring of the MC141627. On the traced revision the vertical enhancer of the comb chip is tied off in both NTSC and PAL. The shared separator of MyNES lacks the comb algorithm of the IC. The preset limits aperture peak gain to 0 to 6 dB and sets the RGB bandwidth to -3 dB at 10 MHz, with a first-order horizontal AFC of 1 ms. These limits do not reproduce the complete responses of the proprietary ICs.

### Sony PVM-20M4U

Sony specifies aperture correction of 0 to +6 dB and states that APERTURE has no effect on RGB[^pvm20m4u]. The published gain range does not give the frequency response or the knob law, and both are still needed.

### Toshiba 14AF43

The 14AF43 has a Sharpness control, and its documentation states that it has no velocity modulation. The schematic in its service manual[^toshiba-sm] separates the LA76600M comb from the M61283FP jungle IC.

At 2.5 MHz, the Video Tone register of the M61283FP has a typical response of −2 dB at its minimum and +10 dB at its maximum[^m61283fp]. Both figures are relative to its center setting. These are test specifications of the IC and give no calibrated mapping of the TV's menu. The IC also has a CTI register, which does not prove that every set enables CTI.

### JVC AV-27D201

The GR2 service manual[^jvc-sm] documents separate DETAIL settings for the TV, external and component inputs, and the APA DL and PR/OVR settings. A single shared symmetric filter cannot reproduce all of these adjustments. The service register values alone are not enough to infer the transfer function of a filter.

### Commodore 1702

The user manual[^c1702-user] lists 7 picture and sound controls, and none of them is a sharpness knob. The internal video path can still have peaking, since the service material[^c1702-sm] includes aperture compensation and peaking components. The fixed path has to come from the correct schematic revision of the 1702. The circuit notes for the related 1701 cannot be assumed to describe the same hardware.

## Target for each preset

The specific targets below are research and implementation targets, and the preset JSON values are not yet calibrated to them. The generic presets for wear and room conditions stay generic, by my decision. File names stay the same so that saved setups keep loading.

| Preset file | Current route | Target and status |
|---|---|---|
| `arcade_cabinet` | RGB | Generic arcade tube; receiver sharpness bypassed. |
| `basement_tv` | RF | Generic worn receiver and tube; keep the limited sharpness effect. |
| `bedroom_rf_1990` | RF | Generic consumer receiver of the period. |
| `commodore_1702` | Y/C | Target: the fixed video response of the Commodore 1702. The quick Sharpness control is an emulator override for now. |
| `dying_crt` | Composite | Generic aged consumer chassis; keep its faults separate from sharpening. |
| `famicom_kitchen` | RF | Generic Japanese compact receiver. |
| `jvc_d_series_2000` | Composite | AV-27D201; implement the GR2 detail response and the input-specific controls. |
| `late_crt_wega` | Composite | Stays generic until a specific WEGA chassis and its SVM path are implemented. |
| `living_room_1988` | Composite | Generic consumer receiver of the period. |
| `measured_glare_experiment` | Composite | Lab glass-scatter comparison; it inherits the neutral receiver and has no sharpening circuit of its own. |
| `sony_gdm_fw900` | Composite + scaler | Generic external decoder, then the measured spatial and tonal path of the PC monitor; no 240-line TV aperture circuit. |
| `nec_xm29_arcade` | RGB | The large-monitor look stays generic; no NEC calibration is invented. |
| `rca_colortrak_1986` | Composite | The large shadow-mask look stays generic; no specific RCA circuit is claimed. |
| `reference_composite` | Composite | Generic neutral receiver by design; it models no commercial TV. |
| `retro_gaming_setup` | Y/C | Generic consumer aperture grille. |
| `sony_pvm_14l2` | Composite | PVM-14L2; the exact separator, enhancer and aperture responses are open. |
| `sony_pvm_20m4u` | Y/C | Target: the aperture response and gain law of the PVM-20M4U. The fine-grille look stays nominal for now. |
| `stass_favourite` | RF | Generic worn slot-mask set of my own; keep the preferred condition independent of the chassis. |
| `studio_pvm` | Y/C | Target: the Y/C input of the PVM-14L2. The studio look stays nominal for now. |
| `toshiba_14af43` | Composite | 14AF43 and M61283FP; implement the tone response; no SVM. |
| `vhs_sp_consumer` | Composite and VHS | Target: the 14AF43 display behind a separate generic tape path. |
| `vivid_living_room` | Composite | Generic personal settings of a consumer TV picture. |
| `warm_desktop_monitor` | Y/C | Target: the 1702 circuit with personal white balance and room settings, which differ from any factory preset. |

## Sharpness check on Basement TV

The earlier sharpness comparison used Basement TV with a 2.8 MHz luma corner and a 4 MHz RF channel corner. Its RGB amplifiers were at 4.2 to 4.8 MHz, and its horizontal beam sigma was 5.5 signal samples. The preset also had convergence error and focus growth, and peaking cannot undo these later losses. A synthetic grayscale-edge capture of 1024×960 on the GPU, at Sharpness 0 and 1, showed a nonzero change in the final light, smaller than on Reference composite. The capture checked that the control works, and it compared nothing with a measured old TV.

After the ordering fix, the linear RGB RMS change of the central grayscale patch was 0.00357 for Basement TV and 0.01626 for Reference composite. These values depend on this synthetic pattern and capture setup as well as on the receiver. Since the consumer-raster retune, the preset uses a horizontal sigma of 3.2 and an FWHM of 0.48 to 1.10 lines, and these RMS results do not measure that newer tuning.

In the GPU regression test, a retained tone rose from 0.092996 to 0.104119, while the rejected carrier stayed below 0.00001 and DC stayed at 0.4. Live-update checks kept the filtered chroma on the composite, line-combed, separated Y/C and PAL routes. The build, signal-precompute, pipeline, fidelity and preset-control checks passed.

## Mechanisms behind squiggly lines

The AtariAge thread on NES squiggly lines[^atariage] has a first-hand report of a similar console repaired by replacing 2 capacitors of 100 µF in its power and RF module. The original poster tried another power supply, and it did not help. The thread reports no completed repair of the original poster's console. The report supports an investigation of the internal supply filtering. It establishes no waveform or frequency, and it does not diagnose every NES edge artifact.

The source has 3 separate paths that can produce such lines:

1. Composite edge structure: `dac_2c02.comp.glsl` emits the palette DAC waveform at the carrier phase that the PPU gives each pixel, line and frame. The receiver's Y/C separation, `receiver_demod.comp.glsl`, the chroma FIRs and the matrix convert it back to RGB. Finite separation and bandwidth, and the phase at color edges, can produce serration and crawl with no power fault at all. Reference composite sets `console_psu_hum`, `hum_bar_amplitude`, `h_jitter`, `v_jitter`, `rf_interference`, `scanline_wobble` and `noise_level` to zero. Its edge-phase regression test runs with noise pickup disabled: the edges still change between carrier phases, and repeated identical phases do not drift.
2. Supply effects: sinusoidal 50 or 60 Hz pickup on the RF path, hum bars in CRT brightness, and generic focus and load effects. None of them models a rectifier, a reservoir capacitor or a regulator. Console hum is injected electrically into the RF signal and does not enter the common composite source, and the same parameter also drives generic CRT effects. That assignment of stages has to be corrected before MyNES can claim to reproduce a console PSU fault.
3. Geometry faults: `deflection.comp.glsl` adds optional per-line jitter, slow sway, and the decorative legacy interference and wobble. They do not represent a failure of a power or RF board, and they are off in Reference composite.

MyNES keeps the PPU color phase running and draws no screen-space squiggle to imitate a fault. Native composite edge structure, a defective console and irregular host presentation each need their own tests. Matching the linked photographs to one mechanism needs better reference evidence.

## Completed work

- Put the existing TV picture controls, including Sharpness, together under Picture.
- Apply sharpening after Y extraction without bypassing its trap and bandwidth filter. Test DC, detail gain, carrier rejection, stopband and RGB bypass on the GPU.
- Label the legacy velocity-modulation control as a voltage derivative, since it does not model physical SVM.

## Roadmap

- Implement separate, selectable circuit responses for the 5 models under [Hardware evidence per model](#hardware-evidence-per-model), with fixed and user-adjustable stages and input bypasses. Add chip-specific peaking frequency and shape, gain law, softening, coring, limiting, preshoot and overshoot, and vertical enhancement only where a source supports them.
- Derive or measure the fixed response of the 1702, the aperture responses of the PVMs, the GR2 detail processing of the JVC and the tone response of the Toshiba. Record the schematic revision, the component or IC source, and which coefficients are still estimates.
- Check each receiver's clamp and AGC, burst PLL, Y/C decisions, decoder matrix, chroma transients, RGB amplifier, ABL and input-specific ordering. Add model choices where the topology differs, since changing parameter values cannot cover a different topology.
- Add a separate fault model of the console's power and RF board for the squiggly-lines investigation. Establish the function of the failing component, the ripple spectrum and the coupling path from schematics and measurements. Investigate rectifier harmonics and higher-frequency pickup separately. Couple upstream faults into both composite and RF where they apply, including the sync and burst response, and keep the fault away from healthy sets and from the TV supply.
- Validate edge serration separately with flat gray and color fields, color boundaries, multiburst and consecutive source phases. Compare RF, composite and separated Y/C, the fault on and off, and the display timestamps. Keep source artifacts apart from slow beats in the presentation.
- Match measured beam, phosphor, optics and supply behavior for each monitor. Record the input, the menu and service settings, the condition of the unit and the capture timing.

## Limitations

- MyNES does not yet reproduce the complete circuits of every named monitor. Working controls, differing preset values and passing tests describe the implementation and do not show that it matches those circuits.
- MyNES makes no model-specific claim until the roadmap items are done.
- Component input: component bypasses receiver sharpening in MyNES. On the PVM-14L2, component Y reaches the aperture circuit.

## References

[^pvm20m4u]: Sony, [PVM-20M4U operation manual](https://pro.sony/s3/cms-static-content/operation-manual/3859663251.pdf), pages 6, 7 and 16. The aperture correction range, and the statement that APERTURE has no effect on RGB.
[^toshiba-sm]: Toshiba, [14AF43 service manual](https://consolemods.org/wiki/images/f/f7/Toshiba_14AF43_Service_Manual.pdf). The Sharpness control, the absence of velocity modulation, and the schematic with the LA76600M comb and the M61283FP jungle IC.
[^m61283fp]: Renesas (Mitsubishi), [M61283FP datasheet](https://www.renesas.com/en/document/dst/m61283fp-rej03f0054-0100z). The Video Tone and CTI registers of the jungle IC and their test specifications.
[^jvc-sm]: JVC, [GR2 service manual for the AV-32D201 and AV-32D501](https://cdn.sunthar.com/documents/shared/3615fded-76e7-4d48-b9c8-53d580242633-JVC_AV-32D201_32D501_SM_EN.pdf), page 17. The DETAIL, APA DL and PR/OVR settings.
[^c1702-user]: Commodore, [1702 user manual](https://manuzoid.com/manuals/0OL5G-Commodore%201702%20User%20manual). The user controls of the 1702.
[^c1702-sm]: Commodore, [1701/1702 service manual](https://www.valoroso.it/file-share/documenti-manuali/Commodore-1701-1702-service-manual.pdf). The aperture compensation and peaking components of the video path.
[^atariage]: AtariAge forums, [NES squiggly lines thread](https://forums.atariage.com/topic/275680-nes-squiggly-lines/). A first-hand repair report for a similar console; I added this thread to the investigation.
