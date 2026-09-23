---
layout: "page"
title: "CRT preset audit at 3840×2160"
permalink: "/archive/presets/"
section: "archive"
description: "The audit of the 23 CRT presets of MyNES on 2026-09-22: each preset's description, 3 native crops of 3840×2160 renders, the assessment and the physical settings."
source: "docs/gpu-preset-audit.md"
source_note: "The audit's per-preset table and physical-settings table are split into one section per preset, and the other sections follow the audit"
archived: 2026-09-23
replaced_by: "/gallery/televisions/"
sitemap: false
updated: 2026-09-23
redirect_from:
  - "/gallery/presets/"
---

This page records the audit of the 23 CRT presets of MyNES made on 2026-09-22, which retuned several of them. The renders come from renderer and core commit [a0f5436](https://github.com/yaglo/mynes/commit/a0f543639eff3c7c1eb34b07f9face460aedb740), and the retuned presets were committed in [2968fab](https://github.com/yaglo/mynes/commit/2968fab6cbb2075dbba3844405f51ac425d716d0). Each preset has a description, 3 native crops, the audit's assessment and its physical settings. The [archived feature tour]({{ '/archive/feature-tour/' | relative_url }}) shows the results as comparisons, and [How the images are made]({{ '/about/#how-the-images-are-made' | relative_url }}) says what the presets are built from.

The audit judged generic presets by their look, by how far each differs from the others and by whether their settings behave consistently; they need not imitate a named television. Presets named after hardware must also keep published evidence apart from assumptions. Reference and lab presets exist for comparisons.

## Test conditions

Every shipped preset rendered the same 3 inputs at 3840×2160 in SDR: the Castlevania III framebuffer of block 1-02, a grayscale, color and detail chart, and an isolated-scanline chart. The mask was drawn at its physical CRT pitch, and the simulated room reflections were on. Normal playback now starts with room reflections off; the G key turns on the room lighting shown here, and the reproduction script turns it on.

The audit captured 3 consecutive frames, 30 to 32, of each input, which gave 207 full-resolution images. After tuning, 4 presets were rendered again on all 3 inputs, replacing 36 captures. Frames 30 and 32 have the same carrier phase, and frame 31 has the other phase. The captures use no phase averaging, exposure correction or per-preset adjustment. Separate 3840×2160 grid, focus, black-signal and 48-frame noise fixtures were rendered for the feature tour.

The 4:3 picture fills 2880×2160 of the 3840×2160 frame. Sony GDM-FW900 + scaler draws its own 16:10 face, with the 4:3 game inside it. Each preset section shows 3 lossless 480×160 crops at (1680, 1000) of frame 30, one per input. The [settings and patch measurements](https://github.com/yaglo/mynes/blob/master/docs/preset-audit-4k.json) record the hashes of the inputs. The full 3840×2160 PNG files and the render logs stayed local, in `/tmp/mynes-preset-audit-4k/{game,chart,beam}`.

Reproduce the audit with:

```sh
python3 tools/review/audit_presets.py --game-codes /path/to/256x240-palette-frame.raw --publish docs
```

The [Contra gallery]({{ '/archive/contra/' | relative_url }}) is an earlier snapshot and does not show this tuning.

## The 23 presets

The 4 main tuning targets are [Sony PVM-14L2](#sony_pvm_14l2), [JVC D-Series](#jvc_d_series_2000), [Toshiba 14AF](#toshiba_14af43) and [Stas's Favourite](#stass_favourite). In the menu the first 3 names end in “(nominal)”. The list follows the order of the preset files.

<ol class="preset-index">
<li><a href="#arcade_cabinet">Arcade Cabinet</a></li>
<li><a href="#basement_tv">Basement TV</a></li>
<li><a href="#bedroom_rf_1990">Bedroom RF 1990</a></li>
<li><a href="#commodore_1702">Compact video monitor</a></li>
<li><a href="#dying_crt">Dying CRT</a></li>
<li><a href="#famicom_kitchen">Famicom Kitchen</a></li>
<li><a href="#jvc_d_series_2000">JVC D-Series</a></li>
<li><a href="#late_crt_wega">Late consumer aperture grille</a></li>
<li><a href="#living_room_1988">Living Room 1988</a></li>
<li><a href="#measured_glare_experiment">Lab: measured glass scatter</a></li>
<li><a href="#nec_xm29_arcade">Large RGB monitor</a></li>
<li><a href="#rca_colortrak_1986">Large consumer shadow mask</a></li>
<li><a href="#reference_composite">Reference composite</a></li>
<li><a href="#retro_gaming_setup">Clean consumer grille</a></li>
<li><a href="#sony_gdm_fw900">Sony GDM-FW900 + scaler</a></li>
<li><a href="#sony_pvm_14l2">Sony PVM-14L2</a></li>
<li><a href="#sony_pvm_20m4u">Fine aperture grille</a></li>
<li><a href="#stass_favourite">Stas's Favourite</a></li>
<li><a href="#studio_pvm">Studio aperture grille</a></li>
<li><a href="#toshiba_14af43">Toshiba 14AF</a></li>
<li><a href="#vhs_sp_consumer">VHS SP playback</a></li>
<li><a href="#vivid_living_room">Vivid Living Room</a></li>
<li><a href="#warm_desktop_monitor">Warm Desktop Monitor</a></li>
</ol>

The settings of each preset are the values recorded in the audit's JSON manifest. They are the columns of the audit's physical-settings table:

<dl class="settings">
<dt>Input / face</dt><dd>The connection and the mask type.</dd>
<dt>Triads</dt><dd>The number of mask triads across the picture. On Sony GDM-FW900 + scaler, 0 selects the preset's separate physical pitch model, which still draws a grille.</dd>
<dt>FWHM (source lines)</dt><dd>The configured vertical beam width for a dark and for a bright signal. Sony GDM-FW900 + scaler replaces this generic beam with its measured raster response.</dd>
<dt>H/V curve; overscan per edge</dt><dd>The horizontal and vertical curvature coefficients, and the overscan at each edge. A vertical value of 0 follows the horizontal one.</dd>
<dt>Ambient / glare</dt><dd>The room light: ambient level and external glare.</dd>
<dt>Halo / width</dt><dd>The scatter: halo fraction, and halo width as a fraction of picture height. A width of 0 selects the legacy 0.006 kernel.</dd>
</dl>

The [table of decisions by setting](#decisions-by-setting) explains the other controls and their effective defaults.

### Arcade Cabinet {#arcade_cabinet}

A generic RGB arcade monitor with coarse shadow-mask dots, spot growth with beam current and fine faceplate scatter. The source is ideal RGB derived from the console's video voltages; a stock NES has no such output, and the preset does not emulate the PlayChoice-10 palette.

{% include crop.html file="assets/images/preset-audit-4k/arcade_cabinet-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Arcade Cabinet" signal="RGB" %}

{% include crop.html file="assets/images/preset-audit-4k/arcade_cabinet-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Arcade Cabinet" signal="RGB" %}

{% include crop.html file="assets/images/preset-audit-4k/arcade_cabinet-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Arcade Cabinet" signal="RGB" %}

Audit assessment: Sharp, bright RGB artwork, with coarse dots and a clear raster that suit a cabinet. The geometry is slightly rounded, and the ambient light adds a small pedestal. Kept as the clean arcade preset with its ideal RGB source. A cabinet surround would suit the name better than more composite damage.

Preset file: [`presets/arcade_cabinet.json`](https://github.com/yaglo/mynes/blob/master/presets/arcade_cabinet.json).

<dl class="settings">
<dt>Input / face</dt><dd>rgb / shadow</dd>
<dt>Triads</dt><dd>440</dd>
<dt>FWHM (source lines)</dt><dd>0.4 to 1.05</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.01/0.012; 1.2%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.03/0</dd>
</dl>

### Basement TV {#basement_tv}

A generic worn RF television with mild gun imbalance, reduced glass transmission, reduced regulation, a visible raster and spot growth with beam current. Reception noise enters at the RF stage, and no heavy full-screen static is laid over the picture.

{% include crop.html file="assets/images/preset-audit-4k/basement_tv-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Basement TV" signal="RF" %}

{% include crop.html file="assets/images/preset-audit-4k/basement_tv-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Basement TV" signal="RF" %}

{% include crop.html file="assets/images/preset-audit-4k/basement_tv-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Basement TV" signal="RF" %}

Audit assessment: A darker, softly rounded picture with visible RF noise and broad scanlines that stay distinct. The heavy static overlay of earlier versions is gone. Kept as a dim, worn look: the dimness is intended, and dark games should be checked before contrast goes any lower.

Preset file: [`presets/basement_tv.json`](https://github.com/yaglo/mynes/blob/master/presets/basement_tv.json).

<dl class="settings">
<dt>Input / face</dt><dd>rf / shadow</dd>
<dt>Triads</dt><dd>340</dd>
<dt>FWHM (source lines)</dt><dd>0.48 to 1.1</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.05/0.08; 2%</dd>
<dt>Ambient / glare</dt><dd>0.002/0</dd>
<dt>Halo / width</dt><dd>0.05/0</dd>
</dl>

### Bedroom RF 1990 {#bedroom_rf_1990}

A generic 1990 RF television with an in-line slot mask, soft chroma, a distinct raster that changes with beam current, cool highlights and a mild gray-tracking error. It adds faint RF snow and a cable echo.

{% include crop.html file="assets/images/preset-audit-4k/bedroom_rf_1990-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Bedroom RF 1990" signal="RF" %}

{% include crop.html file="assets/images/preset-audit-4k/bedroom_rf_1990-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Bedroom RF 1990" signal="RF" %}

{% include crop.html file="assets/images/preset-audit-4k/bedroom_rf_1990-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Bedroom RF 1990" signal="RF" %}

Audit assessment: A household NES look, with RF edge color, cool grays, slot-mask texture and a raster that shows at 3840×2160. Mild curvature and overscan fit the concept. Kept as a main generic preset, without making it as clean as the PVM. Snow in black areas is faint next to the noise in the midtones.

Preset file: [`presets/bedroom_rf_1990.json`](https://github.com/yaglo/mynes/blob/master/presets/bedroom_rf_1990.json).

<dl class="settings">
<dt>Input / face</dt><dd>rf / slot</dd>
<dt>Triads</dt><dd>410</dd>
<dt>FWHM (source lines)</dt><dd>0.4 to 0.95</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.05/0.06; 2%</dd>
<dt>Ambient / glare</dt><dd>0.006/0</dd>
<dt>Halo / width</dt><dd>0.04/0</dd>
</dl>

### Compact video monitor {#commodore_1702}

A generic compact Y/C video monitor with separate luma and chroma, a focused raster and modest spot growth with beam current. The file name is kept for compatibility, and the preset does not model the Commodore 1702.

{% include crop.html file="assets/images/preset-audit-4k/commodore_1702-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Compact video monitor" signal="S-Video" %}

{% include crop.html file="assets/images/preset-audit-4k/commodore_1702-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Compact video monitor" signal="S-Video" %}

{% include crop.html file="assets/images/preset-audit-4k/commodore_1702-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Compact video monitor" signal="S-Video" %}

Audit assessment: Clean Y/C edges and finer detail than the RF presets, on a slightly curved dot-mask face. Kept as the compact monitor. The menu shows the name Compact video monitor; the file name `commodore_1702` is kept for compatibility and implies no model of the 1702 circuit.

Preset file: [`presets/commodore_1702.json`](https://github.com/yaglo/mynes/blob/master/presets/commodore_1702.json).

<dl class="settings">
<dt>Input / face</dt><dd>svideo / shadow</dd>
<dt>Triads</dt><dd>520</dd>
<dt>FWHM (source lines)</dt><dd>0.42 to 0.9</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.035/0.04; 0%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.04/0</dd>
</dl>

### Dying CRT {#dying_crt}

A worn consumer shadow-mask television with a weak blue gun, soft focus in the corners, poor DC restoration and supply regulation, and mild hum. The geometry is stable, as after a service adjustment. The faults are generic aging faults.

{% include crop.html file="assets/images/preset-audit-4k/dying_crt-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Dying CRT" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/dying_crt-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Dying CRT" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/dying_crt-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Dying CRT" signal="composite" %}

Audit assessment: The most defocused picture of the 23, warm and weakened, with muted contrast and broad bright strokes from the largest configured beam width (1.68 lines FWHM). It works as an extreme aging look and costs too much legibility for general play. Kept with its name, which marks it as extreme: not every worn tube behaves this way. It needs no more defects.

Preset file: [`presets/dying_crt.json`](https://github.com/yaglo/mynes/blob/master/presets/dying_crt.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / shadow</dd>
<dt>Triads</dt><dd>350</dd>
<dt>FWHM (source lines)</dt><dd>0.76 to 1.68</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.045/0.05; 2%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.06/0</dd>
</dl>

### Famicom Kitchen {#famicom_kitchen}

A small, cool RF television under a soft kitchen light, with coarse shadow-mask texture, soft focus, gray-tracking error and a faint, broad reflection on the glass. The household character is generic.

{% include crop.html file="assets/images/preset-audit-4k/famicom_kitchen-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Famicom Kitchen" signal="RF" %}

{% include crop.html file="assets/images/preset-audit-4k/famicom_kitchen-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Famicom Kitchen" signal="RF" %}

{% include crop.html file="assets/images/preset-audit-4k/famicom_kitchen-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Famicom Kitchen" signal="RF" %}

Audit assessment: A cool RF picture with a coarse mask, soft focus, gray-tracking error and a modest curve, with a character of its own. Kept. A broad, cool reflection of the kitchen light now shows on the dark glass. Receiver noise adds to the RF noise, and a later retune should keep the 2 sources apart.

Preset file: [`presets/famicom_kitchen.json`](https://github.com/yaglo/mynes/blob/master/presets/famicom_kitchen.json).

<dl class="settings">
<dt>Input / face</dt><dd>rf / shadow</dd>
<dt>Triads</dt><dd>380</dd>
<dt>FWHM (source lines)</dt><dd>0.6 to 1.3</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.045/0.05; 1.8%</dd>
<dt>Ambient / glare</dt><dd>0.01/0.005</dd>
<dt>Halo / width</dt><dd>0.07/0</dd>
</dl>

### JVC D-Series {#jvc_d_series_2000}

A curved slot-mask tube after the JVC AV-27D201, with a 2-line composite comb filter. White is cool, like the set's Standard mode, with red push, and the phosphors are the nominal 525-line primaries. The color gains and the beam are estimates made without factory calibration data.

{% include crop.html file="assets/images/preset-audit-4k/jvc_d_series_2000-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="JVC D-Series" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/jvc_d_series_2000-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="JVC D-Series" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/jvc_d_series_2000-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="JVC D-Series" signal="composite" %}

Audit assessment: A balanced consumer picture with cool highlights, clean low-frequency detail, slot texture and a slight curve. Kept among the main presets. The 2-line comb separation helps; color, spot and optics are estimates without a factory calibration.

Preset file: [`presets/jvc_d_series_2000.json`](https://github.com/yaglo/mynes/blob/master/presets/jvc_d_series_2000.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / slot</dd>
<dt>Triads</dt><dd>661</dd>
<dt>FWHM (source lines)</dt><dd>0.46 to 0.98</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.025/0.019; 1.2%</dd>
<dt>Ambient / glare</dt><dd>0.008/0</dd>
<dt>Halo / width</dt><dd>0.025/0</dd>
</dl>

### Late consumer aperture grille {#late_crt_wega}

A consumer aperture-grille television with firm detail, broad bright scanlines, little horizontal bow and visible composite edge color. The receiver is generic and follows no specific WEGA chassis.

{% include crop.html file="assets/images/preset-audit-4k/late_crt_wega-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Late consumer aperture grille" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/late_crt_wega-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Late consumer aperture grille" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/late_crt_wega-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Late consumer aperture grille" signal="composite" %}

Audit assessment: A firm composite picture with a visible grille, wider bright lines and less horizontal bow. Kept with its generic identity. The strong edge color from the notch decoder is a chosen receiver character and says nothing about a particular WEGA. The audit replaced the old boilerplate description with one of the preset's look.

Preset file: [`presets/late_crt_wega.json`](https://github.com/yaglo/mynes/blob/master/presets/late_crt_wega.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / aperture_grille</dd>
<dt>Triads</dt><dd>680</dd>
<dt>FWHM (source lines)</dt><dd>0.46 to 1.05</dd>
<dt>H/V curve; overscan per edge</dt><dd>0/0.03; 1.2%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.03/0</dd>
</dl>

### Living Room 1988 {#living_room_1988}

A rounded household composite television in warm evening light, with a neutral picture, a softer dot-mask raster, moderate beam growth and a faint lamp reflection off center. The living-room character is generic and follows no specific chassis.

{% include crop.html file="assets/images/preset-audit-4k/living_room_1988-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Living Room 1988" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/living_room_1988-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Living Room 1988" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/living_room_1988-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Living Room 1988" signal="composite" %}

Audit assessment: A rounded, neutral household composite picture with a softer dot-mask raster, suited as the household baseline. Kept with its name and character. It overlaps Large consumer shadow mask and is less warm and less soft. A faint, warm evening reflection now sets its room apart without adding noise.

Preset file: [`presets/living_room_1988.json`](https://github.com/yaglo/mynes/blob/master/presets/living_room_1988.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / shadow</dd>
<dt>Triads</dt><dd>440</dd>
<dt>FWHM (source lines)</dt><dd>0.58 to 1.22</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.04/0.05; 1.8%</dd>
<dt>Ambient / glare</dt><dd>0.01/0.0025</dd>
<dt>Halo / width</dt><dd>0.04/0</dd>
</dl>

### Lab: measured glass scatter {#measured_glare_experiment}

An optics comparison built on Reference composite: it adds a 2-point veiling-glare fit to the Hitachi 751 measurement and assumes a picture height of 270 mm. The receiver and the tube stay generic, so the preset covers the optics only. Compare it with Reference composite to see light spill into dark backgrounds.

{% include crop.html file="assets/images/preset-audit-4k/measured_glare_experiment-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Lab: measured glass scatter" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/measured_glare_experiment-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Lab: measured glass scatter" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/measured_glare_experiment-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Lab: measured glass scatter" signal="composite" %}

Audit assessment: Reference composite with a wider spill kernel fitted to the measurement; the light around bright patches is what the preset shows. The audit renamed it from “Measured glare experiment” and gave it a description that says it is a comparison. Kept as a lab tool, outside the main looks and without a Hitachi name.

Preset file: [`presets/measured_glare_experiment.json`](https://github.com/yaglo/mynes/blob/master/presets/measured_glare_experiment.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / aperture_grille</dd>
<dt>Triads</dt><dd>650</dd>
<dt>FWHM (source lines)</dt><dd>0.38 to 0.78</dd>
<dt>H/V curve; overscan per edge</dt><dd>0/0; 0%</dd>
<dt>Ambient / glare</dt><dd>0/0</dd>
<dt>Halo / width</dt><dd>0.04829/0.03017</dd>
</dl>

### Large RGB monitor {#nec_xm29_arcade}

A regulated large RGB monitor with a fine shadow mask and tighter focus than Arcade Cabinet. The source is ideal RGB derived from the console's video voltages.

{% include crop.html file="assets/images/preset-audit-4k/nec_xm29_arcade-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Large RGB monitor" signal="RGB" %}

{% include crop.html file="assets/images/preset-audit-4k/nec_xm29_arcade-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Large RGB monitor" signal="RGB" %}

{% include crop.html file="assets/images/preset-audit-4k/nec_xm29_arcade-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Large RGB monitor" signal="RGB" %}

Audit assessment: A clean, tightly focused picture, sharper than Arcade Cabinet, with subdued fine mask texture and little curve. Kept as the large clean RGB preset. The legacy file name `nec_xm29_arcade` claims no NEC hardware identity, and the preset models no NEC monitor.

Preset file: [`presets/nec_xm29_arcade.json`](https://github.com/yaglo/mynes/blob/master/presets/nec_xm29_arcade.json).

<dl class="settings">
<dt>Input / face</dt><dd>rgb / shadow</dd>
<dt>Triads</dt><dd>760</dd>
<dt>FWHM (source lines)</dt><dd>0.38 to 0.75</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.008/0.009; 0%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Large consumer shadow mask {#rca_colortrak_1986}

A large, softly focused consumer dot-mask television with warm whites, broad bright spots and rounded geometry, for a mellow household look. The file name mentions RCA; the preset follows no RCA chassis.

{% include crop.html file="assets/images/preset-audit-4k/rca_colortrak_1986-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Large consumer shadow mask" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/rca_colortrak_1986-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Large consumer shadow mask" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/rca_colortrak_1986-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Large consumer shadow mask" signal="composite" %}

Audit assessment: A warm, mellow composite picture with broad spots and rounded geometry. Kept as the large-screen household look. At native size its softness sets it apart from Living Room 1988, which it resembles in a reduced overview. The audit replaced the generic boilerplate description to match.

Preset file: [`presets/rca_colortrak_1986.json`](https://github.com/yaglo/mynes/blob/master/presets/rca_colortrak_1986.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / shadow</dd>
<dt>Triads</dt><dd>400</dd>
<dt>FWHM (source lines)</dt><dd>0.62 to 1.35</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.05/0.06; 1.2%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.04/0</dd>
</dl>

### Reference composite {#reference_composite}

A neutral NTSC composite receiver and CRT in a dark room, with no simulated wear. It is the baseline for signal, grayscale, mask and motion checks.

{% include crop.html file="assets/images/preset-audit-4k/reference_composite-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Reference composite" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/reference_composite-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Reference composite" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/reference_composite-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Reference composite" signal="composite" %}

Audit assessment: A dark-room baseline with flat geometry, no wear noise and strong composite edge artifacts at native size. Kept for comparisons. The name Reference marks the neutral baseline of the pipeline. It does not claim that the preset matches commercial monitors best or decodes most cleanly.

Preset file: [`presets/reference_composite.json`](https://github.com/yaglo/mynes/blob/master/presets/reference_composite.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / aperture_grille</dd>
<dt>Triads</dt><dd>650</dd>
<dt>FWHM (source lines)</dt><dd>0.38 to 0.78</dd>
<dt>H/V curve; overscan per edge</dt><dd>0/0; 0%</dd>
<dt>Ambient / glare</dt><dd>0/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Clean consumer grille {#retro_gaming_setup}

Quiet Y/C color, a moderately focused consumer aperture grille and barely curved geometry. The look is broader and gentler than Fine aperture grille and Studio aperture grille. It is a generic clean gaming setup and follows no named commercial set.

{% include crop.html file="assets/images/preset-audit-4k/retro_gaming_setup-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Clean consumer grille" signal="S-Video" %}

{% include crop.html file="assets/images/preset-audit-4k/retro_gaming_setup-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Clean consumer grille" signal="S-Video" %}

{% include crop.html file="assets/images/preset-audit-4k/retro_gaming_setup-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Clean consumer grille" signal="S-Video" %}

Audit assessment: A clean Y/C consumer grille with a moderate beam, little curve and a quiet background, easy to play on. The old name, “Retro Gaming Setup”, was vague, so the audit renamed the preset to state how it differs from the monitor presets. The file name stays for compatibility.

Preset file: [`presets/retro_gaming_setup.json`](https://github.com/yaglo/mynes/blob/master/presets/retro_gaming_setup.json).

<dl class="settings">
<dt>Input / face</dt><dd>svideo / aperture_grille</dd>
<dt>Triads</dt><dd>620</dd>
<dt>FWHM (source lines)</dt><dd>0.44 to 0.88</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.005/0; 0%</dd>
<dt>Ambient / glare</dt><dd>0/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Sony GDM-FW900 + scaler {#sony_gdm_fw900}

The FW900's spatial and tonal response at 1920×1200, from the empirical NIDL measurements, fed by a generic composite decoder and an external 5× vertical scaler, with the 4:3 picture pillarboxed. The source and host frame cadence stays the same, and the preset does no 85 Hz conversion.

{% include crop.html file="assets/images/preset-audit-4k/sony_gdm_fw900-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Sony GDM-FW900 + scaler" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/sony_gdm_fw900-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Sony GDM-FW900 + scaler" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/sony_gdm_fw900-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Sony GDM-FW900 + scaler" signal="composite" %}

Audit assessment: The most continuous raster of the 23, a clearly different tone response and a fine grille that is mostly unresolved. Kept: a high-resolution PC monitor behind a scaler shows no broad 240-line gaps, and the preset should not be made to. The generic composite decoder ahead of it still fringes edges. The model covers spatial and tonal response only, with no measured full optics, no 85 Hz conversion and no complete FW900 electronics.

Preset file: [`presets/sony_gdm_fw900.json`](https://github.com/yaglo/mynes/blob/master/presets/sony_gdm_fw900.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / aperture_grille</dd>
<dt>Triads</dt><dd>0</dd>
<dt>FWHM (source lines)</dt><dd>measured PC raster</dd>
<dt>H/V curve; overscan per edge</dt><dd>0/0; 0%</dd>
<dt>Ambient / glare</dt><dd>0/0</dd>
<dt>Halo / width</dt><dd>0/0</dd>
</dl>

### Sony PVM-14L2 {#sony_pvm_14l2}

The PVM-14L2's grille, D65 white point, 1 ms AFC and 10 MHz (−3 dB) RGB bandwidth. The aperture control spans 0 to 6 dB with an approximate response shape. The comb filter is a generic adaptive one, and the phosphors and the spot are nominal.

{% include crop.html file="assets/images/preset-audit-4k/sony_pvm_14l2-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Sony PVM-14L2" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/sony_pvm_14l2-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Sony PVM-14L2" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/sony_pvm_14l2-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Sony PVM-14L2" signal="composite" %}

Audit assessment: A monitor look with a focused bright beam, restrained geometry, neutral grays and cleaner composite detail. Kept as the main preset built on hardware documents. In this check the full-resolution highlights are not uniformly “too dim”. The grille, size and bandwidth have published sources; the beam, the decay and much of the receiver are approximations.

Preset file: [`presets/sony_pvm_14l2.json`](https://github.com/yaglo/mynes/blob/master/presets/sony_pvm_14l2.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / aperture_grille</dd>
<dt>Triads</dt><dd>1070</dd>
<dt>FWHM (source lines)</dt><dd>0.38 to 0.9</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.006/0.007; 0%</dd>
<dt>Ambient / glare</dt><dd>0/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Fine aperture grille {#sony_pvm_20m4u}

A high-resolution aperture grille with separate Y/C, a 1200-triad face and tightly focused spots. The monitor is generic, and its fine structure needs a high output resolution to show.

{% include crop.html file="assets/images/preset-audit-4k/sony_pvm_20m4u-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Fine aperture grille" signal="S-Video" %}

{% include crop.html file="assets/images/preset-audit-4k/sony_pvm_20m4u-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Fine aperture grille" signal="S-Video" %}

{% include crop.html file="assets/images/preset-audit-4k/sony_pvm_20m4u-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Fine aperture grille" signal="S-Video" %}

Audit assessment: A narrow Y/C raster with deep gaps and fine texture. Kept for players who want a sharply separated raster. In this 2880×2160 viewport its color stripes are already partly unresolved, and the mask is still there. At smaller sizes it overlaps Studio aperture grille closely.

Preset file: [`presets/sony_pvm_20m4u.json`](https://github.com/yaglo/mynes/blob/master/presets/sony_pvm_20m4u.json).

<dl class="settings">
<dt>Input / face</dt><dd>svideo / aperture_grille</dd>
<dt>Triads</dt><dd>1200</dd>
<dt>FWHM (source lines)</dt><dd>0.28 to 0.52</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.005/0.005; 0%</dd>
<dt>Ambient / glare</dt><dd>0.004/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Stas's Favourite {#stass_favourite}

A worn consumer television with an in-line slot mask on channel 3 RF: cool white, mild red push, imperfect gray tracking and convergence, broad bright spots and causal horizontal recovery. The aged set is generic, and its color and wear parameters are estimates.

{% include crop.html file="assets/images/preset-audit-4k/stass_favourite-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Stas's Favourite" signal="RF" %}

{% include crop.html file="assets/images/preset-audit-4k/stass_favourite-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Stas's Favourite" signal="RF" %}

{% include crop.html file="assets/images/preset-audit-4k/stass_favourite-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Stas's Favourite" signal="RF" %}

Audit assessment: A worn slot-mask RF picture, muted and cool, with imperfect tracking, broad highlights and visible recovery. Kept with its personal name and tuning. Slow AGC, noise and load behavior need longer clips to judge; this short test of stills does not establish their behavior over time.

Preset file: [`presets/stass_favourite.json`](https://github.com/yaglo/mynes/blob/master/presets/stass_favourite.json).

<dl class="settings">
<dt>Input / face</dt><dd>rf / slot</dd>
<dt>Triads</dt><dd>440</dd>
<dt>FWHM (source lines)</dt><dd>0.55 to 1.42</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.05/0; 0%</dd>
<dt>Ambient / glare</dt><dd>0.002/0</dd>
<dt>Halo / width</dt><dd>0.05/0</dd>
</dl>

### Studio aperture grille {#studio_pvm}

A regulated studio aperture-grille monitor with separate Y/C, a fine 900-triad face and narrow spots. The monitor is generic and follows no Sony model.

{% include crop.html file="assets/images/preset-audit-4k/studio_pvm-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Studio aperture grille" signal="S-Video" %}

{% include crop.html file="assets/images/preset-audit-4k/studio_pvm-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Studio aperture grille" signal="S-Video" %}

{% include crop.html file="assets/images/preset-audit-4k/studio_pvm-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Studio aperture grille" signal="S-Video" %}

Audit assessment: Quiet Y/C, a crisp raster and a beam a little less extreme than Fine aperture grille, for a clean monitor look. Both presets are kept for now, and their descriptions state how they differ in place of inventing a Sony identity for each.

Preset file: [`presets/studio_pvm.json`](https://github.com/yaglo/mynes/blob/master/presets/studio_pvm.json).

<dl class="settings">
<dt>Input / face</dt><dd>svideo / aperture_grille</dd>
<dt>Triads</dt><dd>900</dd>
<dt>FWHM (source lines)</dt><dd>0.32 to 0.6</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.005/0.006; 0%</dd>
<dt>Ambient / glare</dt><dd>0.004/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Toshiba 14AF {#toshiba_14af43}

A small flat slot-mask tube after the Toshiba 14AF43, with a 3-line composite comb filter and a broad bright spot. White is moderately cool, the phosphors are the nominal 525-line primaries, and the color and beam values are estimates made without factory settings.

{% include crop.html file="assets/images/preset-audit-4k/toshiba_14af43-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Toshiba 14AF" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/toshiba_14af43-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Toshiba 14AF" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/toshiba_14af43-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Toshiba 14AF" signal="composite" %}

Audit assessment: A soft consumer beam, a nearly flat face, slot texture and smoother composite color, which complement JVC D-Series and Sony PVM-14L2. Kept with its broad spot. Exact tone, sharpness and phosphor behavior are estimates.

Preset file: [`presets/toshiba_14af43.json`](https://github.com/yaglo/mynes/blob/master/presets/toshiba_14af43.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / slot</dd>
<dt>Triads</dt><dd>480</dd>
<dt>FWHM (source lines)</dt><dd>0.6 to 1.2</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.002/0.002; 2.2%</dd>
<dt>Ambient / glare</dt><dd>0.008/0</dd>
<dt>Halo / width</dt><dd>0.035/0</dd>
</dl>

### VHS SP playback {#vhs_sp_consumer}

A slightly noisy NTSC SP recording played on a slot-mask CRT like that of Toshiba 14AF, with delayed soft color, horizontal luma grain, gentle transport drift and occasional dropouts. A lifted gun bias shows tape grain in the shadows, and reduced gain holds back the highlights. The playback look is authored, and no deck was calibrated.

{% include crop.html file="assets/images/preset-audit-4k/vhs_sp_consumer-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="VHS SP playback" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/vhs_sp_consumer-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="VHS SP playback" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/vhs_sp_consumer-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="VHS SP playback" signal="composite" %}

Audit assessment: Clear horizontal chroma softening and trailing color on the broad slot-mask tube of Toshiba 14AF, a consistent tape look. After the bias and noise retune, grain shows in the shadows and the color delay is clearer. The audit shortened the menu name and kept the file name.

Preset file: [`presets/vhs_sp_consumer.json`](https://github.com/yaglo/mynes/blob/master/presets/vhs_sp_consumer.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / slot</dd>
<dt>Triads</dt><dd>480</dd>
<dt>FWHM (source lines)</dt><dd>0.6 to 1.2</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.002/0.002; 2.2%</dd>
<dt>Ambient / glare</dt><dd>0.008/0</dd>
<dt>Halo / width</dt><dd>0.035/0</dd>
</dl>

### Vivid Living Room {#vivid_living_room}

A personal, vivid composite consumer television taken from a saved living-room setup, with cool whites, rich color, modest red drive, controlled glass scatter and stable geometry. It is a generic preference profile and follows no factory calibration.

{% include crop.html file="assets/images/preset-audit-4k/vivid_living_room-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Vivid Living Room" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/vivid_living_room-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Vivid Living Room" signal="composite" %}

{% include crop.html file="assets/images/preset-audit-4k/vivid_living_room-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Vivid Living Room" signal="composite" %}

Audit assessment: A saturated, cool composite picture with visible edge color and more light spill. Kept as a preference preset, whose saturation and scatter need not match a factory mode. It should stay more vivid than the neutral Living Room 1988.

Preset file: [`presets/vivid_living_room.json`](https://github.com/yaglo/mynes/blob/master/presets/vivid_living_room.json).

<dl class="settings">
<dt>Input / face</dt><dd>composite / shadow</dd>
<dt>Triads</dt><dd>480</dd>
<dt>FWHM (source lines)</dt><dd>0.55 to 1.15</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.04/0.05; 1.8%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.08/0</dd>
</dl>

### Warm Desktop Monitor {#warm_desktop_monitor}

A personal, warm Y/C desktop monitor with warm whites, rich color, a fine shadow mask, restrained supply loading and a soft amber reflection of a desk light. It is a generic preference profile and models no Commodore tube.

{% include crop.html file="assets/images/preset-audit-4k/warm_desktop_monitor-game-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Castlevania III" scene="block 1-02, frame 30" preset_name="Warm Desktop Monitor" signal="S-Video" %}

{% include crop.html file="assets/images/preset-audit-4k/warm_desktop_monitor-chart-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Grayscale, color and detail chart" scene="frame 30" preset_name="Warm Desktop Monitor" signal="S-Video" %}

{% include crop.html file="assets/images/preset-audit-4k/warm_desktop_monitor-beam-native.png" width=480 height=160 x=1680 y=1000 frame_width=3840 frame_height=2160 game="Isolated-scanline chart" scene="frame 30" preset_name="Warm Desktop Monitor" signal="S-Video" %}

Audit assessment: Warm whites, clean Y/C color and a softer dot-mask face, distinct from the other presets. Kept. Its warm white stays, since the audit moves no preset to D65 for uniformity. A soft amber desk-light reflection now completes the generic room setting.

Preset file: [`presets/warm_desktop_monitor.json`](https://github.com/yaglo/mynes/blob/master/presets/warm_desktop_monitor.json).

<dl class="settings">
<dt>Input / face</dt><dd>svideo / shadow</dd>
<dt>Triads</dt><dd>520</dd>
<dt>FWHM (source lines)</dt><dd>0.54 to 1.1</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.035/0.04; 0%</dd>
<dt>Ambient / glare</dt><dd>0.01/0.003</dd>
<dt>Halo / width</dt><dd>0.05/0</dd>
</dl>

## Overview sheets

The 4 JPEG overview sheets, 1440×1000 pixels each, hold 6 presets each, and the last one 5, in the order of the preset files. For each preset a sheet puts a reduced view of the whole screen above a 480×160 native crop. The sheets are lossy and scaled, so they are for finding a preset; the PNG crops in the preset sections show the mask.

- [Overview sheet 1]({{ '/assets/images/preset-audit-4k/game-1.jpg' | relative_url }}): Arcade Cabinet, Basement TV, Bedroom RF 1990, Compact video monitor, Dying CRT and Famicom Kitchen.
- [Overview sheet 2]({{ '/assets/images/preset-audit-4k/game-2.jpg' | relative_url }}): JVC D-Series, Late consumer aperture grille, Living Room 1988, Lab: measured glass scatter, Large RGB monitor and Large consumer shadow mask.
- [Overview sheet 3]({{ '/assets/images/preset-audit-4k/game-3.jpg' | relative_url }}): Reference composite, Clean consumer grille, Sony GDM-FW900 + scaler, Sony PVM-14L2, Fine aperture grille and Stas's Favourite.
- [Overview sheet 4]({{ '/assets/images/preset-audit-4k/game-4.jpg' | relative_url }}): Studio aperture grille, Toshiba 14AF, VHS SP playback, Vivid Living Room and Warm Desktop Monitor.

## Assessment of the shared engine

### Backgrounds and black level

All 23 gameplay renders keep the castle walls and the palette detail; no preset loses that background in this fixture. In the sampled patch of chart code `$10`, the neutral PVM preset averages 0.350 relative linear luminance and Reference composite 0.332. The code is a mid-gray, well below peak white, and these values give no reason for a general brightness boost. Basement TV and Dying CRT lower it on purpose, to 0.206 and 0.184. Their muted picture is part of the look, although Dying CRT gives up much of its legibility.

The surround of the tube is still simple. `ambient_light * 0.15` adds uniform reflected light, the clear area around the picture included, and no plastic bezel, room or cabinet is modeled. The fixed glass aperture and the raster are now separate. Materials for the unlit tube face, the bezel and the background that look right on their own would change the picture more than one more generic color-temperature preset would.

### Noise

RF and tape noise change between frames of the same phase and show more in the midtones than near black. The RMS difference between same-phase frames in the gray patch is 0.0180 on Basement TV and 0.0154 on Bedroom RF 1990. In the black patch the values are about 0.000072 and 0.000063. A quiet black does not show that noise is absent, and clean RF reception is a valid condition too.

Before the audit, VHS SP playback had a black-patch difference of about 0.000001, because the gun cutoff hid almost all of it. The audit raised the playback luma grain RMS from 0.008 to 0.018 and the receiver brightness from 0 to 0.08. It then lowered luma contrast from 1 to 0.94 to hold back the highlights. The black variation is now 0.00119, with a mean linear Y of 0.00274, and the mid-gray variation is 0.00899. White changes from 0.4314 to 0.4348, which is 0.0034 more and 0.8% above the earlier value.

No noise is added after the display stage. The bias is an authored playback and TV operating point, slightly lifted. It sets no universal VHS black level and models no repaired tape or clamp circuit. Normal NES black `$0f` and below-black `$0d` are separate chart patches, and `$0d` stays cut off, as intended.

The audit also raised the VHS chroma delay from 140 ns to 250 ns, nominally about 1.34 NES pixels at NTSC timing. The longer delay brings out the bandwidth, tail, peaking and transport stages, which were already separate, and adds no geometric instability. The [48-frame noise animation]({{ '/assets/images/feature-tour/noise.webp' | relative_url }}) keeps consecutive frames and plays them at a quarter of their speed.

### Beam and highlights

The isolated-line captures separate the focused monitors, the ordinary consumer sets and the broad beam of Dying CRT. Bright spots grow on the consumer presets, and bandwidth loss stays horizontal, ahead of the spread in the tube. A finite vertical beam width is physically justified. The Gaussian spots and their growth curves with beam current are approximations.

A wider beam still lights a fixed mask, so the phosphor pattern should stay when the beam grows; optical scatter then softens what the viewer sees. The coarse masks stand out in bright fields, and changes to the optics should be judged apart from spot growth.

### Mask sampling

The 3840×2160 output helps. Still, a game 2880 pixels wide gets only 2.4 host pixels per triad on the 1200-triad Fine aperture grille, and 2.69 on the 1070-triad Sony PVM-14L2 grille. At those pitches the RGB stripes cannot all stay resolved. The physically filtered grille therefore looks faint, and it should not be made coarser to stand out. Panel pixels alignment is available as a compromise for the look; this audit uses the physical pitch.

The coarse dot masks of Basement TV, Famicom Kitchen and Dying CRT stay clearly visible at native size. That texture is a generic style.

### Curvature

The household presets have a clearly rounded raster; Toshiba 14AF is nearly flat, and Sony GDM-FW900 + scaler is flat. The coefficients are warps in image space and give no glass radius in meters. The reflection shader does not derive the reflection direction from those surface normals. A curved picture and curved glass in a room are modeled at different levels.

### Glare and room light

Before the audit all 23 presets had an external `glass_glare = 0`. The audit added 3 reflections, given here as `glass_glare` and color temperature:

- Famicom Kitchen: a broad cool reflection, 0.005 at 6000 K.
- Living Room 1988: a faint warm lamp, 0.0025 at 3200 K.
- Warm Desktop Monitor: an amber desk light, 0.003 at 3000 K.

Each was checked at 3840×2160 with a black signal, the color chart, the isolated beam and gameplay. The other presets keep their earlier room conditions. Internal scatter and halation stay separate from these external reflections.

The rooms are authored and generic. The room shader draws a procedural gradient and a broad light shape; it measures no room, traces no rays off the glass and models no cabinet. Ambient and room controls that are independent of the tube would let a player move a favorite tube to another room.

### Decoder, sharpness and motion

The clean Y/C and RGB presets stay clean, composite and RF produce edge color, and the presets with comb filters keep more neutral detail. These are separate signal paths, each more than a change of palette. The exact decoder and sharpening circuits of commercial sets are incomplete, and the [receiver sharpening note]({{ '/notes/sharpening/' | relative_url }}) lists those limits.

Phosphor decay is sampled once per frame, and Sony GDM-FW900 + scaler does no 85 Hz conversion. A PAL game selects a generic PAL receiver even on the presets that follow North American consumer sets. This is for usability and makes no claim that those sets accepted PAL. The separate [presentation validation](https://github.com/yaglo/mynes/blob/master/docs/architecture/gpu-realism-validation.md) records the visible host timing and the misses that still occur.

## Follow-up work

- Keep the distinct generic and personal looks. A preset needs no hardware source to be worth using, and no preset should claim a calibration it lacks.
- Treat the room, the unlit face and the surround separately. Author a few rooms, with optional reflections, apart from the tube settings.
- Validate the tape transport and the clamp with longer moving sequences. The shadow-grain retune changed the preset's operating point and models no complete VCR circuit. Keep signal noise separate from screen-space effects.
- Group the lab comparisons when the menu gets preset categories. The audit renamed the lab, clean consumer and tape presets and kept their file names, so saved setups still load.
- Extend the input-specific sharpening and decoder behavior of the presets named after hardware where circuit evidence exists. Generic presets can keep generic responses.
- Validate longer motion and noise sequences and live HDR output separately, with display timestamps.

## Decisions by setting

The table groups the main saved settings, and the [JSON manifest](https://github.com/yaglo/mynes/blob/master/docs/preset-audit-4k.json) holds every value of every preset. Service and diagnostic controls set to zero are intended, so that normal play shows no unrelated collection of defects. The preset files hold the values that count, and a user can edit them.

| Settings | Meaning and decision |
|---|---|
| `name`, `description` | Give the generic identity and claim no calibration to a commercial model. |
| `connection`, `comb_type`, `comb_notch_depth`, `region` | Composite and RF keep the modulated color; Y/C and RGB are ideal modifications. Sony PVM-14L2 uses adaptive composite separation, JVC D-Series a 2-line comb and Toshiba 14AF a 3-line comb; older presets keep their notch or separated-source choices. The transfer functions of commercial ICs are approximations. The region of the running ROM takes precedence over the preset's. |
| `console_variant`, `speaker_type` | Select nominal audio filters and generic speaker families; the emulated PPU and CPU stay the same. |
| `console_amp_bw`, `console_coupling_R`, `console_psu_hum`, `console_phase_distortion_ns` | Generic output pole, source impedance and supply pickup. NTSC presets use the published estimate of 30 ns phase distortion for the 2C02G. The 6 MHz pole is a nominal equivalent, chosen without a measured specification for the whole chip. The imported `console_coupling_C` field is inactive and left out of the shipped presets. |
| `video_cable.length_meters`, `resistance_per_m`, `capacitance_per_m`, `connector_resistance`, `impedance` | Passive equivalent shunt-capacitance response, with no skin or dielectric loss and no full transmission-line propagation. Nominal 75 Ω termination and plausible values for a short lead. |
| `video_cable.shield_effectiveness`, `ghost_delay`, `ghost_level` | Generic pickup strength and an optional echo, in signal samples. The shielding-to-noise transfer is uncalibrated. The RF leads of Basement TV and Bedroom RF 1990 have small explicit echoes. |
| `video_cable.num_sections`, `audio_cable.num_sections` | Legacy metadata. GPU video uses one equivalent pole in place of a distributed ladder, and the GPU frontend has no working control for these fields. |
| `rf.enabled`, `mod_bandwidth`, `agc_attack_ms`, `agc_release_ms` | Enable the baseband RF model, its FIR filter and its sync-keyed gain dynamics. The bandwidth now updates when a preset loads. The AM and IF processing is an equivalent model of a tuner, without the full physical circuit. |
| `rf.carrier_freq`, `carrier_level_dbm`, `noise_floor_dbm` | The frequency is metadata. The difference between carrier and noise power sets complex Gaussian noise ahead of an equivalent negative-AM envelope detector, and the total noise is defined at that injection point. No tuner noise figure was measured. |
| `brightness`, `contrast`, `chroma_gain` | Receiver controls in the voltage domain. The black and white checks use neutral baselines; the worn preference presets and the tape playback look keep their deliberate black and contrast changes. |
| `tv.luma_bandwidth`, `chroma_bandwidth`, `fir_ringing`, `luma_peaking`, `luma_notch_depth` | Receiver separation and frequency response. Chroma on the RF and household presets is narrower than on clean Y/C. Ringing and peaking are modest except on the deliberately worn receivers. |
| `tv.hue_offset`, `saturation`, `color_temperature`, `r_drive/g_drive/b_drive`, `r_cutoff/g_cutoff/b_cutoff`, `color_killer` | Decoder adjustment, nominal white point, balance of each gun and the burst gate. The clean monitors stay neutral, and the small tint errors of the household presets are set explicitly. |
| `tv.r_bandwidth/g_bandwidth/b_bandwidth`, `gamma` | Bandwidth of the gun voltages, followed by the current transfer. The responses are generic equivalents; Sony PVM-14L2 uses Sony's 10 MHz RGB figure. |
| `tv.beam_fwhm_min`, `beam_fwhm_max`, `beam_spot_size`, `bloom_gamma`, `edge_focus`, `velocity_dim` | Spot size, growth with current and behavior at the edges. FWHM is in scanlines, and the horizontal sigma stays in signal samples. Bright spots on the consumer presets can fill the gaps between lines, and the focused monitors keep more separation. The Gaussian spots leave out the measured non-Gaussian tails at high current. |
| `tv.convergence_static`, `convergence_dynamic`, `conv_r_x/conv_b_x`, `conv_r_y/conv_b_y` | Small landing errors of the guns at the center and the edges, larger on worn tubes. Legacy horizontal offsets are in signal samples, and vertical and generic offsets in drawable pixels, so this part has no physical calibration in millimeters. Sony PVM-14L2 is aligned. |
| `tv.beam_current_load`, `video_black_droop`, `video_recovery_us`, `hv_sag`, `focus_breathing` | Causal video rail and DC restoration, and the shared supply response. A positive size response contracts the raster, and a negative one expands it. The couplings and time constants are generic and fitted to no circuit components. |
| `tv.barrel`, `barrel_v`, `overscan`, `keystone`, `rotation`, `skew_x/skew_y`, `h_pos/v_pos`, `h_size/v_size` | Tube and raster geometry. Overscan on the household presets is modest. No preset needs a tilted, sheared trapezoid, and Dying CRT is now stable. |
| `tv.h_jitter`, `v_jitter`, `rf_interference`, `geometry_warp`, `scanline_wobble`, `hum_bar_amplitude` | Small explicit timebase and supply faults for worn sets. The decorative quantized RF displacement and the sinusoidal line wobble are off in every preset. |
| `tv.beam_edge_fade`, `beam_edge_overshoot`, `burst_lock_drift`, `burst_lock_drift_width` | Legacy source and edge diagnostics, zero in all shipped presets. No preset needs them for its identity. |
| `tv.mask_type`, `mask_triads`, `mask_pitch_px`, `mask_strength`, `subpixel_layout` | Mask family and total pitch, full mask coverage and host filtering. The host's Panel pixels mode fits whole periods to the current game viewport, and CRT pitch mode keeps the nominal density. The RGB or BGR order does not calibrate the mask to LCD subpixels. |
| `tv.persistence_ms`, `persistence_r/g/b`, `motion_threshold` | Generic decay, sampled once per frame; explicit smoothing is separate. The moving impulse beam of a CRT is not reproduced, and [Motion]({{ '/gallery/motion/' | relative_url }}) says what 60 fps output shows of it. Age alone does not mean long phosphor trails. |
| `tv.halation`, `halation_tint_r/g/b`, `glass_tint`, `vignette`, `ambient_light`, `black_floor` | Moderate optical spread, neutral scatter color, glass throughput, and the room and black levels. No preset adds an arbitrary green halation. The ambient light extends into the window margins. |
| `tv.glass_glare`, `glass_glare_light_x/y`, `glass_glare_size`, `glass_glare_temp_k` | External procedural room light. Famicom Kitchen, Living Room 1988 and Warm Desktop Monitor use deliberately restrained reflections; the neutral and lab presets keep their earlier room state. Position and size describe the light in image space and come from no measured room. |
| `vhs.*` | Recovered luma and chroma bandwidth, color delay, peaking and tail, noise in the signal domain, transport drift, switching and sparse dropouts. Generic NTSC composite and RF playback only; the [noise findings](#noise) give the current SP operating point. |
| `tv.noise_level` | Voltage noise at the receiver output, ahead of the gun transfer and the beam spread. RF snow enters separately, before decoding. |
| `tv.hdr_gain` | Linear exposure before the host adapts the picture. The value is uncalibrated in nits, and the HDR headroom comes from SDL. |
| `audio_cable.*`, `audio_cable_length_m` | Source resistance, wire resistance, cable capacitance and length set the audio pole. Shielding, echo, impedance and ladder sections are compatibility metadata for audio, and noise and hum have their own controls. The 8 Ω speaker load was removed from the cable's characteristic impedance. |
| `audio_psu_hum_amplitude`, `audio_noise_floor`, `audio_saturation_drive` | Explicit generic audible wear, turned down to restrained levels. The CPU and GPU frontends share the console and speaker responses. |

The Sony PVM-14L2 values come from [Sony's published specification](https://www.sony.jp/pro-monitor/products/PVM-14L2/). The NES signal levels come from [terminated voltage measurements](https://www.nesdev.org/wiki/NTSC_video). [Video-amplifier fault descriptions](https://www.repairfaq.org/REPAIR/F_monfaq.html) support the kinds of streaking and regulation defects and set no number of any preset. The [pipeline reference](https://github.com/yaglo/mynes/blob/master/docs/gpu-pipeline-reference.md) lists further assumptions and missing physical models.

## Color and connection defaults of the 4 main presets

| Preset | Connection | White point | R−Y / B−Y gain offset | Gun gamma | Spot growth at white |
|---|---|---:|---:|---:|---:|
| Sony PVM-14L2 | Composite | D65 | 0 / 0 | 2.4 | 25% |
| JVC D-Series | Composite | 9300 K | +16% / −2% | 2.4, small tracking offsets | 40% |
| Toshiba 14AF | Composite | 8000 K | +6% / +2.5% | 2.4, small tracking offsets | 45% |
| Stas's Favourite | RF | 7800 K | +10% / −3.5% | 2.2, worn tracking | 55% |

The color settings of the consumer presets are estimates, and no factory coefficients were extracted. The JVC owner record reports a cool Standard mode and red push. Toshiba's service procedure specifies a visual white-balance adjustment and does not establish the 8000 K target used here. The PVM-14L2's D65 is documented. The nominal 525-line phosphor primaries approximate the tubes from the standards, since the tubes were not measured.

The decoder's color-difference gains keep the gray axis, and gun balance and phosphor gamut act at their own stages. Stas's Favourite uses channel 3 metadata, a sync-tip carrier of −25 dBm, injected channel noise of −65 dBm and an equivalent video corner of 4.1 MHz. RF can be selected on any display; on the PVM-14L2, which has no tuner, it stands for an external receiver. Stock NES composite and RF and the hypothetical modified component and RGB sources are separate choices.

## Control audit

All 121 saved TV fields have OSD controls, including the conditional legacy focus settings. The RF IF and VHS controls are saved and editable under Signal chain. The automated audit checks every shipped preset against the control ranges. That check covers consistency, and [model validation and limits](https://github.com/yaglo/mynes/blob/master/docs/architecture/gpu-realism-validation.md) covers how far the parameters match measured hardware.

## Limitations

- The audit covers the spatial look and the variation over 3 frames. It measures no panel luminance and validates neither flicker-free playback nor long VHS transport motion and phosphor decay.
- The 2-frame noise differences are relative luminance values of the final render, uncalibrated as a signal-to-noise ratio, and settling and geometry can add to them.
- The captures are SDR, so the audit does not test HDR output. The [HDR output note]({{ '/notes/hdr/' | relative_url }}) covers the phosphor peaks above SDR white.
- The presets have changed since the audit, and the preset files in the code repository hold the current values.
