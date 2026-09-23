---
layout: "page"
title: "Hardware evidence for the curated presets"
permalink: "/notes/hardware/"
section: "notes"
description: "Sources for the 4 curated presets, the limit of the model at each stage, and the changes each source led to."
source: "docs/gpu-hardware-research.md"
updated: 2026-09-23
redirect_from:
  - "/research/hardware/"
nav_order: 1
nav_title: "Hardware evidence"
---

This note gives the published sources behind 4 curated presets: Sony PVM-14L2, JVC D-Series, Toshiba 14AF and Stas's Favourite. It also gives the model changes each source led to, and the limit of the model at each stage of the signal path. The [About page]({{ '/about/#how-the-images-are-made' | relative_url }}) states what the presets are built from. A manufacturer's bandwidth specification, an owner's photograph and a measurement of a particular tube are different kinds of evidence, and the tables below keep them apart.

The [Receiver sharpening and interference]({{ '/notes/sharpening/' | relative_url }}) note records the circuit work still open for each model and covers all {{ site.data.facts.presets.count }} presets. It also tracks the investigation of squiggly lines that come from the console's power circuits, and it separates fixed peaking, user aperture controls and physical scan-velocity modulation. Gameplay crops of 3840×2880 frames and the beam-height measurements are on the [Close-ups page]({{ '/gallery/close-ups/' | relative_url }}), and the earlier gameplay page is in the [archive]({{ '/archive/showcase/' | relative_url }}).

## Test conditions

- Evidence reviewed 2026-09-21.
- Scene: Contra, waterfall boss. A local ROM was run to the boss, and the renders use its captured PPU codes.
- Captures: unaveraged frames and phase pairs at 1280×960 and 3840×2880.
- Presets: the 4 above, plus Bedroom RF 1990 and Dying CRT where a section names them.
- Tests: GPU regression tests in the code repository, named in each section below.
- Machine, display and commit: not recorded.

## Documented and estimated values per target

| Target | Documented characteristics | Model consequence | Values still estimated |
|---|---|---|---|
| Sony PVM-14L2[^sony-spec] [^sony-catalog] | P22 Trinitron; 600 TVL; 0.25 mm grille; 267.5×200.6 mm visible area; 10 MHz RGB; D65 and D93; composite, Y/C and RGB/component inputs | Aperture grille of about 1070 triads, neutral D65, restrained geometry, sharp RGB amplifiers | Beam FWHM, exact phosphor primaries and decay, optics and unit condition |
| JVC AV-27D201[^jvc-archive], modeled by the JVC D-Series preset | 27-inch dark-tinted 1.7R tube, 2-line digital comb, component and Y/C inputs | Curved consumer raster, 2-scanline composite separation, slot mask | Spot growth, regulation, optics. The 661 triads rest on an owner's 0.83 mm tube-pitch entry and on no manufacturer calibration |
| Toshiba 14AF43[^toshiba-sm], modeled by the Toshiba 14AF preset | Flat 14-inch (357 mm) tube, 3-line comb, no velocity modulation; LA76600M separator on the schematic | Nearly flat raster, broad compact-TV beam, 3-scanline separation, slot mask | The 480 triads are an estimate; no measured tube pitch or beam response was found |
| Stas's Favourite | No commercial model claimed; the recovery and breathing of my old TV are the reference | Causal horizontal voltage recovery, modest contraction under load, imperfect convergence, inline slot mask over RF | All defect strengths and time constants are generic preference values |

The JVC owner record[^jvc-owner] adds tube metadata and photographs. Its pitch is treated as provisional.

TVL is horizontal resolving power normalized to picture height. It is neither the number of phosphor triads nor a reason to render 600 horizontal scanlines. These are standard-definition sets, and the repeated non-interlaced field of the NES occupies the same raster lines in every frame. MyNES does not model them as 480p or HD CRTs.

## Luma trap and adaptive comb corrections

The horizontal luma trap removes a fraction of the carrier that the receiver lowpass leaves. Its symmetric correction has zero DC response, so gray levels are kept without renormalizing the requested rejection. At 3.2 MHz bandwidth, 37 taps and 95% notch depth, the carrier response is 0.01651, against 0.33016 for the lowpass alone. An earlier coefficient calculation subtracted a fixed unity-referenced amount and gave -0.61892: a phase-inverted carrier in place of a deep notch. Regression tests sweep 23 to 63 taps, 1.5 to 6 MHz bandwidth and 0 to 100% depth.

This correction changes cross-luma. False color from luminance that enters the chroma decoder is a separate artifact, and the 2 artifacts are evaluated separately in unaveraged frames. Full-resolution Contra comparisons show a small final change in Bedroom RF 1990, whose RF and beam filtering already soften the residual. The PVM-14L2 preset sets horizontal notch depth to zero and is unchanged.

The adaptive separator now recognizes both same-phase high-band detail (luminance) and opposite-phase detail (chroma), from the correlation energy over one carrier cycle. Its earlier decision rejected correlated monochrome detail and fell back to horizontal band separation, which created false color. On a GPU regression chart, chroma RMS falls from 0.141421 to below 0.002, and a separate isoluminant hue-boundary test keeps the current line's chroma. The code repository's [control semantics and HDR measurements](https://github.com/yaglo/mynes/blob/master/docs/gpu-controls.md) describe these controls.

## Decoder ICs and line combs

The PVM-14L2 service manual[^pvm-sm] names the MC141627 for Y/C separation, the CXA2163AQ for chroma decoding and the CXA1739S for drive and cutoff control. It also describes separate picture and brightness ABL circuits. The earlier preset used only a notch and omitted the comb. It now selects a generic adaptive line comb and claims neither the IC's internal algorithm nor an ABL calibration.

Motorola's MC141627 datasheet[^mc141627] describes chroma-band filtering, line memories, correlation processing, an adaptive vertical enhancer, 8-bit conversion and a 4× subcarrier clock. Its NTSC chroma BPF half-width is nominally 0.75 MHz. MyNES uses that width and an approximation of correlation-based separation. Exact quantization, clock jitter, vertical enhancement and coring, and the proprietary decisions are not reproduced.

A 2-line filter has one line delay, and a 3-line filter has 2. The old mode named `3line` averaged 4 full scanlines, and it now uses the center line and its 2 neighbors. Line averaging now works on the chroma band, and its result is subtracted from the original composite signal, which keeps low-frequency vertical luminance detail. GPU tests cover single-line gray detail, carrier cancellation, the 3-line footprint and Y+C reconstruction.

The 2-line topology of the JVC is documented[^tc90a45], and the fixed 2-line mode of MyNES does not reproduce every adaptive choice of its decoder. Sanyo's LA76600M[^la76600m] uses a 2H CCD store, so a 3-line filter is not necessarily digital.

The named consumer presets describe the NTSC versions of their sets. A PAL game keeps its own timing and uses horizontal separation plus the PAL chroma delay line, and the NTSC line-comb modes are off in PAL. This PAL fallback is generic. It does not claim that the North American JVC or Toshiba accepted PAL, or that the PAL comb of the PVM-14L2 is replicated.

## Model limit at each stage

| Stage | Evidence and implementation decision | Limit of the model |
|---|---|---|
| PPU DAC | Codes select measured voltage rails and emphasis; the waveform comes before color decoding | Measurements of particular chips; no interchangeable palette, and no coverage of every PPU revision |
| PPU output impedance | Voltage-dependent RC response adds the published 2C02G phase-distortion estimate; 30 ns at white, editable | Estimated equivalent impedance with no transistor simulation; NTSC composite and RF only |
| Horizontal and vertical raster | Sync, porch, burst, borders and blanking come before reception; native NES timing is kept | The core does not export every border write or exact pulse-length detail |
| Output amplifier | Independent nominal 6 MHz console pole | No evidence that every NES board has exactly this corner |
| Cable | R/C equivalent of a short terminated lead, and an optional echo set explicitly | No frequency-dependent transmission-line solver; cable delay and dBm are not calibrated measurements |
| RF | Negative-AM complex envelope, noise, asymmetric complex IF, detuning and sync-based gain | No sampled VHF carrier or intercarrier sound; the IF is generic, and no NES RF module or tuner was measured |
| AGC, clamp and sync | Sync-based amplitude control, detected porch black and sync timing | Generic loop constants; no free-running vertical oscillator and no rolling when sync is lost |
| Burst and PLL | Measured phase and amplitude, holdover, color kill and reacquisition | No chip-specific PLL loop filter or oscillator phase-noise spectrum |
| Y/C separation | Chroma band followed by notch, 2-line, adaptive or 3-line separation | Generic transfer functions; commercial decoder decisions are approximated |
| Chroma detection | Quadrature demodulation, bandwidth filtering, PAL delay correction | Equal-band axes are equivalent to rotated color-difference axes; the optional unequal bandwidth is a separate legacy approximation |
| Matrix and white balance | Color-difference decoder gains; daylight white points; gun drive and cutoff; nominal 525 phosphor primaries in linear light | Consumer values and spectra are estimates; P22 names a family of phosphors with no single gamut |
| Gun amplifiers | Separate bandwidth per gun; voltage-to-light conversion comes before spatial spreading | Power-law gun transfer and Gaussian spot; exact saturation and amplifier poles are not measured |
| DC recovery and video rail | Causal horizontal bias and gain recovery after the amplifiers | Generic fault model; it does not diagnose my old TV |
| EHT, deflection and focus | Shared line-current state, local load, signed size response and focus growth | No circuit-level EHT or deflection regulation, and no calibrated ABL knee |
| Beam and landing | Pixel-integrated spots, separate gun-current width, convergence and edge focus | No measured asymmetric or non-Gaussian tube spot, and no complete electron optics |
| Phosphors | Recursive fast and optional slow decay per channel in linear light, over the frames that elapsed | Frame-sampled approximation with 2 exponentials; no measured per-tube afterglow or continuous rolling emission |
| Face and mask | Distinct aperture-grille, slot and dot structures; coverage normalized for neutral mean light | Exact dimensions are documented only for selected targets; no LCD subpixel layout is inferred |
| Glass and room | Energy redistribution, optical radius relative to the screen, modest tint and reflection | Generic scatter PSF and ambient term; no glass stack or room was measured |
| Host display | Native drawable geometry, integer panel periods or filtered physical pitch; linear HDR and a final output shoulder | Host gamut, luminance, persistence and compositor limit reproduction; no absolute-nit calibration |
| Audio | APU → console filter → cable → speaker, with shared CPU/GPU state and a bounded queue | Generic cabinet and speaker transfer; no microphone measurement or full RF sound demodulation |

## Sources for cross-stage decisions

- NES timing and phase: the NESdev NTSC video page[^nesdev-ntsc] describes the measured voltage waveforms and the brightness-dependent impedance. The nonlinear output stage runs on the full raster, burst included, and a global hue offset could not replace it. The regression test checks about 14° more phase lag between the lowest and the highest colored voltage rows.
- Transmission and DC restoration: nominal 75 Ω connections need termination[^adi-switch], and AC coupling can shift the baseline and cause droop[^adi-clamp]. An earlier claim, which had no support, that the unused coupling-capacitor control was a sub-Hz effect has been removed.
- Broadcast and NES timing: receiver assumptions come from television timing[^bt470], and the source keeps NES timing. The NTSC fixed 1H store is therefore 2730 samples long, against a 2728-sample NES line.
- Beam and current: measured beam profiles vary in both their central region and their tails[^hitachi-beam]. Conserving integrated energy is necessary, and it does not prove that the Gaussian shape of MyNES matches a particular tube.
- Image-dependent CRT output: measured CRT luminance can depend on pattern orientation, DC restoration and supply regulation[^garcia-peli]. Streaks and loading are therefore modeled before light is emitted, and no decorative overlay draws them.
- Persistence: at low levels phosphor decay need not stay a single exponential, and an LCD's hold interval is a separate limitation[^display-timing]. Reviews use still exposures of 2 frames, and [Motion]({{ '/gallery/motion/' | relative_url }}) says what still images and 60 fps video show of phosphor decay.
- Host pixels: backing pixels and native panel pixels are separate API quantities in AppKit[^apple-backing] and SDL[^sdl-hidpi]. MyNES queries both and offers native fullscreen. This measures nothing about the panel's optics and does not prove its subpixel order.

## Photographs used in review

The supplied photograph of the Contra waterfall boss and a palette-only screenshot are the main visual reference for the scene. A local ROM was run to the same boss and its PPU codes were captured, and no part of the scene is reconstructed from the photograph. Projectile and player states differ. The comparison checks facial ridges, teeth, the bright platform, the black mouth, color bleed, spot growth and mask structure. Camera exposure, white balance, focus and resampling rule out an absolute color or luminance calibration from these photographs.

I also inspected owner photographs of the PVM-14L2[^crtdb-pvm14l2], PVM-20M4U[^crtdb-pvm20m4u], JVC AV-27D201[^jvc-owner] and Toshiba 14AF43[^crtdb-14af43]. A BVM owner's macro photograph with its capture settings[^bvm-macro] helped with grille grouping and spot shape, and its tube dimensions were not transferred to the PVM-14L2. Search results that showed other shaders were excluded as hardware evidence.

The archived [visual review]({{ '/archive/visual-review/' | relative_url }}) holds paired MyNES renders and their limitations. Third-party photos are linked and are not copied into the repository.

## White points and slot mask

The [preset audit]({{ '/archive/presets/' | relative_url }}) lists the color defaults, RF assumptions and response ranges of the 4 curated presets. The PVM-14L2 uses its documented D65 white balance option. The consumer sets have cooler whites, with separate color-difference gain and small tracking errors. These are chosen defaults, and they make no attempt to reproduce the camera white balance of the Contra photograph.

The slot-mask model keeps vertical phosphor stripes and staggers only the bridges between adjacent triads, as the inline slit-mask construction of patent US3973965A does[^slit-patent]. An ablation on the same Contra codes showed that the earlier coarse delta-dot pattern of Stas's Favourite generated the dominant diagonal weave. Its replacement, a less intrusive inline pattern, keeps visible RGB separation. Composite dot crawl can still produce phase-dependent diagonals, which are distinct from random RF noise.

More owner photographs, close-ups of Mario and Adventure Island on a JVC AV-27D201[^sunthar-jvc], show an RGB-modified set. They inform spot and mask structure and give no composite decoder calibration. Analog Devices describes differential gain and phase[^adi-dgdp]. The model includes the level-dependent phase estimate of the measured source. It has no chip-specific curves of differential gain and phase for receivers, and no universal “chroma latching” effect, since no source supports one.

## NES-001 output buffer circuit

The [KiCad sheet and ngspice sweep](https://github.com/yaglo/mynes/blob/master/tools/circuits/README.md) isolate the PNP output buffer of the NES-001 motherboard, using a hardware-checked schematic. They sweep the unknown device and load values and do not present the generic transistor as a measured 2SA937. The buffer's output feeds a further RF and power module, so connecting a 75 Ω jack load directly to this partial model is invalid.

No renderer coefficient is calibrated from this incomplete circuit. The DAC table already comes from terminated-output measurements, and adding another output buffer without defining that measurement boundary risks counting the console path twice. The experiment records this limit and gives reproducible curves for extending the model with the missing module.

## Gun cutoff and dark-raster deposition

The CRT driver sets cathode bias and cutoff before the beam reaches the phosphor, and room reflections are a separate optical contribution. Sections 2.1 and 3 of National's AN-861 CRT video design guide[^an861] describe cathode DC restoration and grid blanking. The guide supports the order of stages in the model. It does not show that the televisions behind the presets contain its monitor driver.

`black_floor` used to clamp the beam image after deposition, which filled dark scanline gaps with uniform light. It now sets the minimum gun drive before the per-channel transfer and the horizontal and vertical spot integration. A blanked raster stays unlit, and ambient glass reflection stays in the display stage. GPU tests check per-channel transfer, integrated energy, dark scanline gaps and zero emission outside the landed raster.

Unaveraged 3840×2880 Contra comparisons show a small shadow correction in Stas's Favourite and Dying CRT, with unchanged highlight peaks. The PVM-14L2 render, with its zero floor, is pixel-identical. The change corrects where light is generated, and it sets no newly measured cutoff value and makes no large preset retuning.

## Voltage range, purity and HDR color

The decoder used to clip each gun-drive channel to the range 0 to 1 before amplifier filtering, which treated nominal video white as an amplifier supply rail. Voltage now keeps superwhite and undershoot until the modeled gun and loading stages, and superwhite also adds to the supply load. The rail and saturation curve of each set are unmeasured. The change removes a clamp that had no support, and it does not establish unlimited amplifier headroom.

Phosphor emission is nonnegative in its own primary basis, and its conversion to extended linear sRGB can need negative coordinates. These coordinates now survive HDR output and the common RGB highlight shoulder, following SDL's extended-linear swapchain contract[^sdl-swapchain] and Apple's extended color representation[^apple-color]. The host performs the final conversion to its display gamut. Headroom and SDR white follow SDL's dynamic window properties[^sdl-props].

The output has no absolute-nit calibration and does not prove a panel's peak luminance for saturated colors. GPU readback tests cover signed primary coordinates, highlight ratios, SDR equal-luminance gamut fitting and mask energy.

Purity error used to add color even to an unexcited black screen. It now redistributes excitation before mask coverage, with smooth spatial variation and zero output for zero input. The description of magnetic beam mislanding in Samsung's CRT construction patent[^samsung-patent] supports this order. The redistribution coefficients are generic, and no magnetic field is solved. Secondary cross-phosphor excitation likewise comes before mask coverage.

The legacy `apl_black_lift` control now changes gun-drive bias before gamma and spot deposition. It used to add uniform display light between scanlines and in the window margins, so its numeric amplitude now has a different transfer than in older custom presets. The 4 curated presets leave this control, purity error and secondary scattering at zero, and they were not retuned to hide these corrections. The scene tracker still estimates brightness from the CPU framebuffer and measures no cathode current. Tests check signed bias, gun cutoff, dark scanline gaps, blanked areas and conservation of nominal excitation.

## Glass scattering and raster sampling

The quarter-resolution halo used to point-sample the full-resolution beam before blurring, which aliased fine scanlines. With one lit row in every 4, a field whose mean is 0.25 gave halo means of either 0 or 0.4995, depending on row position. The test isolates the halo at strength 1, and the errors in the final picture of the normal presets are smaller than these.

The reduction now integrates the source footprint of each destination pixel in linear light. Fractional sizes use area overlap, and integer reductions group 2×2 blocks into exact bilinear averages. Horizontal and vertical scattering then work on that reduced light. The 2 existing scratch textures are reused, and dark BFI refreshes reuse the completed halo. Tests cover both stripe axes, all 4 phases, fractional scaling and gamma-encoded fallback input.

Offscreen halo allocation now follows the requested render size, where it used to follow the hidden window. A regression test of the full frontend changes the hidden window from 400×300 to 1151×863 and requires identical 640×480 captures in the default and SDR output modes. The old build fails this check. Run it with:

```sh
python3 frontends/gpu/tests/test_offscreen_render.py build/bin/mynes_gpu
```

The internal-reflection control used to add local gray light without carrying it into neighboring dark areas. It now adds a bounded scatter fraction through the existing faceplate kernel. Halo tint likewise adjusts the scatter fraction of each primary, and it no longer changes the color of a uniform field or creates energy. Uniform-field, colored-edge and neighboring-black tests run the fragment shader itself.

Section 4.7 of AAPM report TG18[^tg18] describes CRT veiling glare as spatial redistribution, with contributions from both faceplate scattering and electron backscatter. This supports a spatial light model and says nothing about the coefficients MyNES uses. The single Gaussian kernel is an estimate. It does not establish the glass thickness, the long scatter tails or the electron backscatter distribution of the Sony, JVC or Toshiba tubes.

Unaveraged Contra phase pairs were inspected at 1280×960 and 3840×2880 for all 4 curated presets. Their native-pixel crops keep the existing beam and mask structure. The correction is small in this scene and retunes no preset brightness, and pixel pitch and preset gain are unchanged.

## Sony PVM-14L2 circuit

The [Sony PVM-14L2]({{ '/notes/pvm-14l2/' | relative_url }}) note covers one circuit revision. It records the aperture input and output networks, the disabled vertical enhancer of the comb chip and the separate PIC and BRT ABL controls. It also separates the focus of the 14L2 from the dynamic-focus output that only the 20L2 has.

The PVM-14L2 preset now uses a 1 ms horizontal AFC, aperture gain bounded to 0 to 6 dB, and an RGB amplifier fitted to -3 dB at 10 MHz. The rest of those transfer functions is approximate. The passive-network SPICE sweep that comes with the note shows sensitivity to an unknown IC port and gives no calibration data.

## Published optical measurements

The [Published CRT measurements]({{ '/notes/measurements/' | relative_url }}) note adds a sourced glare dataset for the Hitachi 751, a reproducible fit with 2 parameters and GPU dark-disk checks. The selectable preset Lab: measured glass scatter uses that effective scatter with an explicit assumption about physical size. It is a generic receiver and CRT experiment and does not emulate the whole Hitachi monitor. The same note audits the longer NIDL report on the Sony GDM-FW900 and lists the ambiguities that stop a direct fit of its tables.

## Limitations

- The luma trap correction fixes the filter math. It is no calibration against hardware, and it does not fully remove excessive rainbowing.
- The adaptive separator leaves some composite patterns ambiguous and does not reproduce the proprietary MC141627 algorithm.

## References

[^sony-spec]: Sony, [PVM-14L2 specification page](https://www.sony.jp/pro-monitor/products/PVM-14L2/). The documented PVM-14L2 values in the first table.
[^sony-catalog]: Sony, [monitor catalog SPC_PVM-20N6J](https://www.sony.jp/products/catalog/SPC_PVM-20N6J.PDF). Its L2 table also lists the PVM-14L2.
[^jvc-archive]: JVC, [AV-27D201 product archive](https://support.jvc.com/consumer/product.jsp?modelId=MODL020660). The manufacturer's product record for the JVC AV-27D201 row.
[^toshiba-sm]: Toshiba, [14AF43 service manual](https://consolemods.org/wiki/images/f/f7/Toshiba_14AF43_Service_Manual.pdf). The documented features and the schematic, with the LA76600M separator, for the Toshiba 14AF43 row.
[^jvc-owner]: CRT Database, [JVC AV-27D201 owner record](https://crtdatabase.com/crts/jvc/jvc-av-27d201). Owner-entered tube metadata, including the 0.83 mm pitch, and owner photographs.
[^pvm-sm]: Sony, [PVM-L2 service manual](https://consolemods.org/wiki/images/f/fc/PVM-L2_Service_Manual.pdf), theory of operation and parts list. The Y/C, chroma and drive ICs of the PVM-14L2 and its 2 ABL circuits.
[^mc141627]: Motorola, [MC141627 datasheet](https://pdf.dzsc.com/27F/MC141627FT_1084067.pdf). The functions of the comb chip and its 0.75 MHz NTSC chroma BPF half-width.
[^tc90a45]: Sony, [service documentation with the TC90A45 block diagram](https://audiocircuit.dk/downloads/sony/Sony-SBV55A-avs-sm.pdf). The 2-line comb topology cited for the JVC.
[^la76600m]: Sanyo, [LA76600M datasheet](https://www.alldatasheet.net/datasheet-pdf/pdf/200214/SANYO/LA76600M.html). The 2H CCD store of the Toshiba's separator.
[^nesdev-ntsc]: NESdev Wiki, [NTSC video](https://www.nesdev.org/wiki/NTSC_video). The measured voltage waveforms and the brightness-dependent output impedance of the PPU.
[^adi-switch]: Analog Devices, [video interfaces](https://www.analog.com/en/resources/technical-articles/switching-video-using-analog-switches.html). Termination of 75 Ω video connections.
[^adi-clamp]: Analog Devices, [clamping and AC coupling](https://www.analog.com/en/resources/technical-articles/get-a-grip-on-clamps-bias-and-accoupled-video-signals.html). Baseline shift and droop in AC-coupled video.
[^bt470]: ITU-R, [Recommendation BT.470](https://www.itu.int/rec/R-REC-BT.470/en). The television timing behind the receiver's assumptions.
[^hitachi-beam]: [Hitachi beam-profile measurement](https://www.fujipress.jp/jrm/rb/robot000700030238/). Measured CRT beam profiles, center and tails.
[^garcia-peli]: García-Pérez and Peli, [paper on CRT luminance artifacts](https://pelilab.partners.org/papers/monitor/artifacts_cathode.pdf). CRT luminance that depends on pattern orientation, DC restoration and supply regulation.
[^display-timing]: [Display-timing research](https://www.sciencedirect.com/science/article/abs/pii/S0165027010003420). Phosphor decay at low levels, and the hold interval of LCDs.
[^apple-backing]: Apple, [NSWindow backingScaleFactor](https://developer.apple.com/documentation/appkit/nswindow/backingscalefactor). The backing scale of a window in AppKit.
[^sdl-hidpi]: SDL, [high-DPI guidance](https://wiki.libsdl.org/SDL3/README-highdpi). Window size, pixel size and display scale in SDL3.
[^crtdb-pvm14l2]: CRT Database, [Sony PVM-14L2](https://crtdatabase.com/crts/sony/sony-pvm-14l2). Owner photographs of the PVM-14L2.
[^crtdb-pvm20m4u]: CRT Database, [Sony PVM-20M4U](https://crtdatabase.com/crts/sony/sony-pvm-20m4u). Owner photographs of the PVM-20M4U.
[^crtdb-14af43]: CRT Database, [Toshiba 14AF43](https://crtdatabase.com/crts/toshiba/toshiba-14af43). Owner photographs of the 14AF43.
[^bvm-macro]: libretro forums, [BVM owner macro photograph with capture settings](https://forums.libretro.com/t/calling-all-crt-owners-photos-please/36593?page=4). Grille grouping and spot shape on a BVM.
[^slit-patent]: [Patent US3973965A](https://patents.google.com/patent/US3973965A/en). The inline slit-mask construction that the slot-mask model follows.
[^sunthar-jvc]: [JVC AV-27D201 RGB mod guide with close-ups](https://sector.sunthar.com/guides/crt-rgb-mod/jvc-av-27d201.html). Photographs of Mario and Adventure Island on an RGB-modified AV-27D201.
[^adi-dgdp]: Analog Devices, [differential gain and phase](https://www.analog.com/en/resources/technical-articles/2022/07/21/08/24/visual-impact-of-video-parameters-in-video-systems.html). The visible effect of differential gain and phase in video systems.
[^an861]: National Semiconductor, [AN-861 CRT video design guide](https://www.ti.com/lit/an/snoa268/snoa268.pdf), sections 2.1 and 3. Cathode DC restoration and grid blanking.
[^sdl-swapchain]: SDL, [SDL_GPUSwapchainComposition](https://wiki.libsdl.org/SDL3/SDL_GPUSwapchainComposition). The extended-linear swapchain contract.
[^apple-color]: Apple, [determining color values with color spaces](https://developer.apple.com/documentation/uikit/determining-color-values-with-color-spaces). The extended color representation.
[^sdl-props]: SDL, [SDL_GetWindowProperties](https://wiki.libsdl.org/SDL3/SDL_GetWindowProperties). The dynamic window properties that give HDR headroom and SDR white.
[^samsung-patent]: Samsung, [CRT construction patent US6809466B2](https://patents.google.com/patent/US6809466B2/en). Magnetic beam mislanding and where it occurs in the tube.
[^tg18]: AAPM, [report TG18](https://www.aapm.org/pubs/reports/OR_03.pdf), section 4.7. CRT veiling glare as spatial redistribution.
