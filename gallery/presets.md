---
layout: "page"
title: "CRT presets: 23 looks reviewed at 4K"
permalink: "/gallery/presets/"
section: "gallery"
description: "The 23 CRT presets of MyNES, each with its description, native 4K crops, the audit assessment and its physical settings."
source: "docs/gpu-preset-audit.md"
source_note: "The per-preset table and physical-settings table are expanded into one section per preset; the remaining sections follow the audit"
---

Reviewed and retuned **22 September 2026**, using renderer/core commit `a0f5436`.
The [visual feature tour]({{ '/gallery/feature-tour/' | relative_url }}) presents the results as comparisons. This page adds each preset's description from its preset file and its native crops from the audit.
Generic presets are judged on visual appeal, distinct character and coherent
behavior. They do not need to imitate a named television. Named hardware
profiles have the additional obligation to distinguish published evidence from
assumptions. Reference and lab profiles serve a different purpose again.


## What was actually rendered


Every shipped preset received the same Castlevania III BLK 1-02 framebuffer,
a grayscale/colour/detail chart, and an isolated-scanline chart at
**3840×2160**, SDR, physical CRT mask pitch, with simulated room reflections enabled.
Room reflections now default off in normal playback; **G** restores the room
lighting shown in this audit. The reproduction script explicitly enables it.

Three consecutive frames per input were captured: **207 initial full-resolution images**. Four tuned presets were then
re-rendered on all three inputs (36 replacement captures). Separate 4K grid,
focus, black-signal and 48-frame noise fixtures support the feature tour. Frames 30 and 32 have the same
carrier phase; frame 31 retains the other phase. No phase averaging, extra
exposure correction or individual preset adjustment was used.

The 4:3 television image occupies 2880×2160 inside the UHD target. FW900 uses
its separate 16:10 face with a 4:3 game inside it. Overview thumbnails are for
navigation; the adjacent crops show native pixels. Lossless native game,
colour-field and beam crops are shown in each preset's section below.
[Settings and patch measurements](https://github.com/yaglo/mynes/blob/master/docs/preset-audit-4k.json) record the source hashes.
Full 4K PNGs and render logs are local artifacts in
`/tmp/mynes-preset-audit-4k/{game,chart,beam}`.

Reproduce with:

```sh
python3 tools/review/audit_presets.py --game-codes /path/to/256x240-palette-frame.raw --publish docs
```

This establishes spatial appearance and short-run frame variation. It does not
measure physical panel luminance, prove flicker-free playback, or validate long
VHS transport motion/phosphor decay. The earlier Contra gallery is an explicitly
[historical snapshot]({{ '/gallery/contra/' | relative_url }}), not evidence of current tuning.


## The 23 presets

The four main tuning targets are [Sony PVM-14L2 (nominal)](#sony_pvm_14l2), [JVC D-Series (nominal)](#jvc_d_series_2000), [Toshiba 14AF (nominal)](#toshiba_14af43), [Stas's Favourite](#stass_favourite). All 23 are listed in preset-file order. Each entry shows the preset's own description, the audit's 4K assessment and disposition, and its current physical settings.

<ol class="preset-index">
<li><a href="#arcade_cabinet">Arcade Cabinet</a></li>
<li><a href="#basement_tv">Basement TV</a></li>
<li><a href="#bedroom_rf_1990">Bedroom RF 1990</a></li>
<li><a href="#commodore_1702">Compact video monitor</a></li>
<li><a href="#dying_crt">Dying CRT</a></li>
<li><a href="#famicom_kitchen">Famicom Kitchen</a></li>
<li><a href="#jvc_d_series_2000">JVC D-Series (nominal)</a></li>
<li><a href="#late_crt_wega">Late consumer aperture grille</a></li>
<li><a href="#living_room_1988">Living Room 1988</a></li>
<li><a href="#measured_glare_experiment">Lab: measured glass scatter</a></li>
<li><a href="#nec_xm29_arcade">Large RGB monitor</a></li>
<li><a href="#rca_colortrak_1986">Large consumer shadow mask</a></li>
<li><a href="#reference_composite">Reference composite</a></li>
<li><a href="#retro_gaming_setup">Clean consumer grille</a></li>
<li><a href="#sony_gdm_fw900">Sony GDM-FW900 + scaler</a></li>
<li><a href="#sony_pvm_14l2">Sony PVM-14L2 (nominal)</a></li>
<li><a href="#sony_pvm_20m4u">Fine aperture grille</a></li>
<li><a href="#stass_favourite">Stas's Favourite</a></li>
<li><a href="#studio_pvm">Studio aperture grille</a></li>
<li><a href="#toshiba_14af43">Toshiba 14AF (nominal)</a></li>
<li><a href="#vhs_sp_consumer">VHS SP playback</a></li>
<li><a href="#vivid_living_room">Vivid Living Room</a></li>
<li><a href="#warm_desktop_monitor">Warm Desktop Monitor</a></li>
</ol>

These are the current JSON settings, not measured tube specifications.
FWHM is the configured dark-to-bright vertical beam width in source lines;
FW900 replaces that generic path with its measured raster response. Curvature
values are horizontal/vertical coefficients; vertical zero follows horizontal.
Room values list ambient / external glare. Scatter lists halo fraction / width
as a fraction of picture height; zero width means the legacy 0.006 kernel.

FW900's zero generic triad count selects its separate physical pitch model,
not a missing grille. Other controls and effective defaults are explained below.

For every preset, the settings summary lists the columns of the audit's physical-settings table: input / face, triads, FWHM, H/V curve with overscan per edge, ambient / glare, and halo / width.

### Arcade Cabinet {#arcade_cabinet}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/arcade_cabinet-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/arcade_cabinet-game-native.png' | relative_url }}" alt="Arcade Cabinet: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/arcade_cabinet-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/arcade_cabinet-chart-native.png' | relative_url }}" alt="Arcade Cabinet: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/arcade_cabinet-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/arcade_cabinet-beam-native.png' | relative_url }}" alt="Arcade Cabinet: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Generic RGB arcade monitor with coarse shadow-mask dots, current-dependent spot growth and fine faceplate scatter. Ideal voltage-derived RGB source, not a stock NES output or a PlayChoice-10 palette emulation.</p>

Preset file: [`presets/arcade_cabinet.json`](https://github.com/yaglo/mynes/blob/master/presets/arcade_cabinet.json) · connection `rgb` · mask `shadow`.

**4K assessment and disposition:** Crisp, bright RGB artwork; coarse dots and clear raster add cabinet character. Slight rounding and a modest ambient pedestal. Keep the clean arcade alternative; it is an ideal RGB source, not a stock NES or PlayChoice palette. A cabinet surround would strengthen the name more than extra composite damage.

<dl class="settings">
<dt>Input / face</dt><dd>rgb / shadow</dd>
<dt>Triads</dt><dd>440</dd>
<dt>FWHM</dt><dd>0.4–1.05</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.01/0.012; 1.2%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.03/0</dd>
</dl>

### Basement TV {#basement_tv}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/basement_tv-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/basement_tv-game-native.png' | relative_url }}" alt="Basement TV: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/basement_tv-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/basement_tv-chart-native.png' | relative_url }}" alt="Basement TV: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/basement_tv-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/basement_tv-beam-native.png' | relative_url }}" alt="Basement TV: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Generic worn RF television: mild gun imbalance, reduced glass transmission and regulation, visible raster and current-dependent spot growth. Reception noise enters at RF; no heavy full-screen static overlay.</p>

Preset file: [`presets/basement_tv.json`](https://github.com/yaglo/mynes/blob/master/presets/basement_tv.json) · connection `rf` · mask `shadow`.

**4K assessment and disposition:** Darker, softly rounded, visibly noisy RF with broad but identifiable scanlines. No longer the old indiscriminate heavy static overlay. Keep as a worn, subdued vibe; dimness is intentional, but inspect dark games before reducing contrast further.

<dl class="settings">
<dt>Input / face</dt><dd>rf / shadow</dd>
<dt>Triads</dt><dd>340</dd>
<dt>FWHM</dt><dd>0.48–1.1</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.05/0.08; 2%</dd>
<dt>Ambient / glare</dt><dd>0.002/0</dd>
<dt>Halo / width</dt><dd>0.05/0</dd>
</dl>

### Bedroom RF 1990 {#bedroom_rf_1990}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/bedroom_rf_1990-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/bedroom_rf_1990-game-native.png' | relative_url }}" alt="Bedroom RF 1990: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/bedroom_rf_1990-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/bedroom_rf_1990-chart-native.png' | relative_url }}" alt="Bedroom RF 1990: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/bedroom_rf_1990-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/bedroom_rf_1990-beam-native.png' | relative_url }}" alt="Bedroom RF 1990: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Generic 1990 in-line slot-mask RF TV: soft chroma, distinct current-dependent raster, cool highlights and mild grey-tracking error. Subtle RF snow and cable echo; not a measured chassis.</p>

Preset file: [`presets/bedroom_rf_1990.json`](https://github.com/yaglo/mynes/blob/master/presets/bedroom_rf_1990.json) · connection `rf` · mask `slot`.

**4K assessment and disposition:** Strong domestic-NES identity: RF edge colour, cool grey, slot-mask texture and a visible raster at 4K. Mild curvature and overscan fit the concept. Keep as a principal generic choice; do not replace its character with PVM cleanliness. Black snow is subtle relative to midtone noise.

<dl class="settings">
<dt>Input / face</dt><dd>rf / slot</dd>
<dt>Triads</dt><dd>410</dd>
<dt>FWHM</dt><dd>0.4–0.95</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.05/0.06; 2%</dd>
<dt>Ambient / glare</dt><dd>0.006/0</dd>
<dt>Halo / width</dt><dd>0.04/0</dd>
</dl>

### Compact video monitor {#commodore_1702}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/commodore_1702-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/commodore_1702-game-native.png' | relative_url }}" alt="Compact video monitor: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/commodore_1702-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/commodore_1702-chart-native.png' | relative_url }}" alt="Compact video monitor: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/commodore_1702-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/commodore_1702-beam-native.png' | relative_url }}" alt="Compact video monitor: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Generic compact Y/C video monitor: separated luminance/chroma, focused raster and modest current-dependent spot growth. Filename retained for compatibility; not a measured Commodore 1702.</p>

Preset file: [`presets/commodore_1702.json`](https://github.com/yaglo/mynes/blob/master/presets/commodore_1702.json) · connection `svideo` · mask `shadow`.

**4K assessment and disposition:** Clean Y/C boundaries and tighter detail than the RF sets, with a modest curved dot-mask face. Keep the compact-monitor niche. The compatibility filename `commodore_1702` is not its displayed identity or evidence of a modeled 1702 circuit.

<dl class="settings">
<dt>Input / face</dt><dd>svideo / shadow</dd>
<dt>Triads</dt><dd>520</dd>
<dt>FWHM</dt><dd>0.42–0.9</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.035/0.04; 0%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.04/0</dd>
</dl>

### Dying CRT {#dying_crt}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/dying_crt-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/dying_crt-game-native.png' | relative_url }}" alt="Dying CRT: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/dying_crt-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/dying_crt-chart-native.png' | relative_url }}" alt="Dying CRT: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/dying_crt-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/dying_crt-beam-native.png' | relative_url }}" alt="Dying CRT: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Worn consumer shadow-mask TV: weak blue gun, soft corner focus, poor DC restoration and supply regulation, mild hum. Stable service geometry; generic ageing faults, not a measured specimen.</p>

Preset file: [`presets/dying_crt.json`](https://github.com/yaglo/mynes/blob/master/presets/dying_crt.json) · connection `composite` · mask `shadow`.

**4K assessment and disposition:** Most defocused/warm-weakened picture, very broad bright strokes and muted contrast. Distinct and useful as an extreme aging look, but too destructive as a general recommendation. Keep the expressive name; not every worn tube behaves this way. More defects are unnecessary.

<dl class="settings">
<dt>Input / face</dt><dd>composite / shadow</dd>
<dt>Triads</dt><dd>350</dd>
<dt>FWHM</dt><dd>0.76–1.68</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.045/0.05; 2%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.06/0</dd>
</dl>

### Famicom Kitchen {#famicom_kitchen}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/famicom_kitchen-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/famicom_kitchen-game-native.png' | relative_url }}" alt="Famicom Kitchen: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/famicom_kitchen-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/famicom_kitchen-chart-native.png' | relative_url }}" alt="Famicom Kitchen: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/famicom_kitchen-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/famicom_kitchen-beam-native.png' | relative_url }}" alt="Famicom Kitchen: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Small, cool RF television under a soft kitchen light. Coarse shadow-mask texture, soft focus, grey tracking and a restrained broad reflection on the glass. Generic household character, not a measured tube or room.</p>

Preset file: [`presets/famicom_kitchen.json`](https://github.com/yaglo/mynes/blob/master/presets/famicom_kitchen.json) · connection `rf` · mask `shadow`.

**4K assessment and disposition:** Cool, coarse, softly focused RF picture with grey tracking and modest curve. Has its own character; keep. A broad, cool kitchen-light reflection now gives the dark glass its own atmosphere. Receiver noise stacks with RF noise; any future retune should preserve distinct roles.

<dl class="settings">
<dt>Input / face</dt><dd>rf / shadow</dd>
<dt>Triads</dt><dd>380</dd>
<dt>FWHM</dt><dd>0.6–1.3</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.045/0.05; 1.8%</dd>
<dt>Ambient / glare</dt><dd>0.01/0.005</dd>
<dt>Halo / width</dt><dd>0.07/0</dd>
</dl>

### JVC D-Series (nominal) {#jvc_d_series_2000}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/jvc_d_series_2000-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/jvc_d_series_2000-game-native.png' | relative_url }}" alt="JVC D-Series (nominal): Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/jvc_d_series_2000-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/jvc_d_series_2000-chart-native.png' | relative_url }}" alt="JVC D-Series (nominal): Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/jvc_d_series_2000-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/jvc_d_series_2000-beam-native.png' | relative_url }}" alt="JVC D-Series (nominal): Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">AV-27D201-inspired curved slot tube and two-line composite comb. Standard-like cool white and red push; nominal 525 phosphors. Colour gains and beam are estimates, not factory calibration.</p>

Preset file: [`presets/jvc_d_series_2000.json`](https://github.com/yaglo/mynes/blob/master/presets/jvc_d_series_2000.json) · connection `composite` · mask `slot`.

**4K assessment and disposition:** Good balanced consumer choice: cool highlights, clean low-frequency detail, slot texture and restrained curve. Keep among the main choices. Two-line separation is useful, but colour, spot and optics are estimated rather than a factory calibration.

<dl class="settings">
<dt>Input / face</dt><dd>composite / slot</dd>
<dt>Triads</dt><dd>661</dd>
<dt>FWHM</dt><dd>0.46–0.98</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.025/0.019; 1.2%</dd>
<dt>Ambient / glare</dt><dd>0.008/0</dd>
<dt>Halo / width</dt><dd>0.025/0</dd>
</dl>

### Late consumer aperture grille {#late_crt_wega}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/late_crt_wega-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/late_crt_wega-game-native.png' | relative_url }}" alt="Late consumer aperture grille: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/late_crt_wega-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/late_crt_wega-chart-native.png' | relative_url }}" alt="Late consumer aperture grille: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/late_crt_wega-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/late_crt_wega-beam-native.png' | relative_url }}" alt="Late consumer aperture grille: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Consumer aperture-grille look with firm detail, broad bright scanlines, little horizontal bow and visible composite edge colour. Generic receiver, not a specific WEGA chassis.</p>

Preset file: [`presets/late_crt_wega.json`](https://github.com/yaglo/mynes/blob/master/presets/late_crt_wega.json) · connection `composite` · mask `aperture_grille`.

**4K assessment and disposition:** Firm composite image, visible grille, wider bright lines and less horizontal bow. Keep the generic identity; the strong notch-decoded edge colour is a deliberate receiver character, not evidence of a particular WEGA. Its old boilerplate description is replaced with the actual look.

<dl class="settings">
<dt>Input / face</dt><dd>composite / aperture_grille</dd>
<dt>Triads</dt><dd>680</dd>
<dt>FWHM</dt><dd>0.46–1.05</dd>
<dt>H/V curve; overscan per edge</dt><dd>0/0.03; 1.2%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.03/0</dd>
</dl>

### Living Room 1988 {#living_room_1988}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/living_room_1988-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/living_room_1988-game-native.png' | relative_url }}" alt="Living Room 1988: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/living_room_1988-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/living_room_1988-chart-native.png' | relative_url }}" alt="Living Room 1988: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/living_room_1988-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/living_room_1988-beam-native.png' | relative_url }}" alt="Living Room 1988: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Rounded household composite TV in warm evening light: neutral picture, softer dot-mask raster, moderate beam growth and a faint off-centre lamp reflection. Generic living-room character, not a specific chassis.</p>

Preset file: [`presets/living_room_1988.json`](https://github.com/yaglo/mynes/blob/master/presets/living_room_1988.json) · connection `composite` · mask `shadow`.

**4K assessment and disposition:** Rounded, neutral household composite with a softer dot-mask raster. Pleasant baseline nostalgia. Keep the name and character; it overlaps the large warm consumer profile but is less warm/soft. A faint warm evening reflection now distinguishes its room setting without adding noise.

<dl class="settings">
<dt>Input / face</dt><dd>composite / shadow</dd>
<dt>Triads</dt><dd>440</dd>
<dt>FWHM</dt><dd>0.58–1.22</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.04/0.05; 1.8%</dd>
<dt>Ambient / glare</dt><dd>0.01/0.0025</dd>
<dt>Halo / width</dt><dd>0.04/0</dd>
</dl>

### Lab: measured glass scatter {#measured_glare_experiment}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/measured_glare_experiment-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/measured_glare_experiment-game-native.png' | relative_url }}" alt="Lab: measured glass scatter: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/measured_glare_experiment-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/measured_glare_experiment-chart-native.png' | relative_url }}" alt="Lab: measured glass scatter: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/measured_glare_experiment-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/measured_glare_experiment-beam-native.png' | relative_url }}" alt="Lab: measured glass scatter: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Optics comparison, not a complete TV: Reference composite with a Hitachi 751 two-point veiling-glare fit and assumed 270 mm picture height. Compare with Reference composite to inspect light spill into dark backgrounds; receiver and tube remain generic.</p>

Preset file: [`presets/measured_glare_experiment.json`](https://github.com/yaglo/mynes/blob/master/presets/measured_glare_experiment.json) · connection `composite` · mask `aperture_grille`.

**4K assessment and disposition:** Reference composite plus a wider measured-fit spill kernel. The surrounding light around bright patches is the point; it is not a complete television. Renamed from “Measured glare experiment” and given an explicit comparison description. Keep as a lab tool, not a headline vibe or a falsely named Hitachi set.

<dl class="settings">
<dt>Input / face</dt><dd>composite / aperture_grille</dd>
<dt>Triads</dt><dd>650</dd>
<dt>FWHM</dt><dd>0.38–0.78</dd>
<dt>H/V curve; overscan per edge</dt><dd>0/0; 0%</dd>
<dt>Ambient / glare</dt><dd>0/0</dd>
<dt>Halo / width</dt><dd>0.04829/0.03017</dd>
</dl>

### Large RGB monitor {#nec_xm29_arcade}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/nec_xm29_arcade-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/nec_xm29_arcade-game-native.png' | relative_url }}" alt="Large RGB monitor: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/nec_xm29_arcade-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/nec_xm29_arcade-chart-native.png' | relative_url }}" alt="Large RGB monitor: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/nec_xm29_arcade-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/nec_xm29_arcade-beam-native.png' | relative_url }}" alt="Large RGB monitor: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Regulated large RGB monitor with a fine shadow mask and tighter focus than the arcade cabinet. Ideal voltage-derived RGB source; not a measured NEC model.</p>

Preset file: [`presets/nec_xm29_arcade.json`](https://github.com/yaglo/mynes/blob/master/presets/nec_xm29_arcade.json) · connection `rgb` · mask `shadow`.

**4K assessment and disposition:** Very clean, tightly focused, sharper than Arcade, with subdued fine mask texture and little curve. Keep as the big clean-RGB alternative. No NEC hardware identity is claimed despite the legacy filename.

<dl class="settings">
<dt>Input / face</dt><dd>rgb / shadow</dd>
<dt>Triads</dt><dd>760</dd>
<dt>FWHM</dt><dd>0.38–0.75</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.008/0.009; 0%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Large consumer shadow mask {#rca_colortrak_1986}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/rca_colortrak_1986-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/rca_colortrak_1986-game-native.png' | relative_url }}" alt="Large consumer shadow mask: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/rca_colortrak_1986-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/rca_colortrak_1986-chart-native.png' | relative_url }}" alt="Large consumer shadow mask: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/rca_colortrak_1986-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/rca_colortrak_1986-beam-native.png' | relative_url }}" alt="Large consumer shadow mask: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Large, softly focused consumer dot-mask television: warm whites, broad bright spots and rounded geometry. A mellow household look; not a measured RCA chassis.</p>

Preset file: [`presets/rca_colortrak_1986.json`](https://github.com/yaglo/mynes/blob/master/presets/rca_colortrak_1986.json) · connection `composite` · mask `shadow`.

**4K assessment and disposition:** Warm, broad, rounded, mellow composite. Keep as a cozy large-screen vibe; the softness makes it distinct at native size even where an overview resembles Living Room. Updated the generic boilerplate description accordingly.

<dl class="settings">
<dt>Input / face</dt><dd>composite / shadow</dd>
<dt>Triads</dt><dd>400</dd>
<dt>FWHM</dt><dd>0.62–1.35</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.05/0.06; 1.2%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.04/0</dd>
</dl>

### Reference composite {#reference_composite}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/reference_composite-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/reference_composite-game-native.png' | relative_url }}" alt="Reference composite: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/reference_composite-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/reference_composite-chart-native.png' | relative_url }}" alt="Reference composite: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/reference_composite-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/reference_composite-beam-native.png' | relative_url }}" alt="Reference composite: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Neutral NTSC composite receiver and CRT in a dark room. Baseline for signal, grayscale, mask and motion checks; no simulated wear.</p>

Preset file: [`presets/reference_composite.json`](https://github.com/yaglo/mynes/blob/master/presets/reference_composite.json) · connection `composite` · mask `aperture_grille`.

**4K assessment and disposition:** Dark-room baseline, flat geometry, no wear noise, strong native composite edge signature. Keep for comparisons. “Reference” means a neutral pipeline baseline, not a claim to be the most accurate commercial monitor or the cleanest decoder.

<dl class="settings">
<dt>Input / face</dt><dd>composite / aperture_grille</dd>
<dt>Triads</dt><dd>650</dd>
<dt>FWHM</dt><dd>0.38–0.78</dd>
<dt>H/V curve; overscan per edge</dt><dd>0/0; 0%</dd>
<dt>Ambient / glare</dt><dd>0/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Clean consumer grille {#retro_gaming_setup}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/retro_gaming_setup-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/retro_gaming_setup-game-native.png' | relative_url }}" alt="Clean consumer grille: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/retro_gaming_setup-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/retro_gaming_setup-chart-native.png' | relative_url }}" alt="Clean consumer grille: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/retro_gaming_setup-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/retro_gaming_setup-beam-native.png' | relative_url }}" alt="Clean consumer grille: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Quiet Y/C colour, a moderately focused consumer aperture grille and barely curved geometry. Broader and gentler than the Fine and Studio monitor looks. Generic clean gaming setup; not a named commercial set.</p>

Preset file: [`presets/retro_gaming_setup.json`](https://github.com/yaglo/mynes/blob/master/presets/retro_gaming_setup.json) · connection `svideo` · mask `aperture_grille`.

**4K assessment and disposition:** Clean Y/C consumer grille, moderate beam and little curve, quiet background. Good easy-playing look, but the name is vague. Renamed from “Retro Gaming Setup” to explain that difference; the filename stays compatible.

<dl class="settings">
<dt>Input / face</dt><dd>svideo / aperture_grille</dd>
<dt>Triads</dt><dd>620</dd>
<dt>FWHM</dt><dd>0.44–0.88</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.005/0; 0%</dd>
<dt>Ambient / glare</dt><dd>0/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Sony GDM-FW900 + scaler {#sony_gdm_fw900}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/sony_gdm_fw900-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/sony_gdm_fw900-game-native.png' | relative_url }}" alt="Sony GDM-FW900 + scaler: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/sony_gdm_fw900-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/sony_gdm_fw900-chart-native.png' | relative_url }}" alt="Sony GDM-FW900 + scaler: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/sony_gdm_fw900-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/sony_gdm_fw900-beam-native.png' | relative_url }}" alt="Sony GDM-FW900 + scaler: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">NIDL empirical FW900 spatial and tonal response at 1920x1200. Generic composite decoder and external 5x vertical scaler, 4:3 pillarboxed. Source/host cadence unchanged; not an 85 Hz conversion.</p>

Preset file: [`presets/sony_gdm_fw900.json`](https://github.com/yaglo/mynes/blob/master/presets/sony_gdm_fw900.json) · connection `composite` · mask `aperture_grille`.

**4K assessment and disposition:** The cleanest continuous-looking raster, markedly different tone response and largely unresolved fine grille. Keep: a high-resolution PC monitor with a scaler should not be forced to show broad 240-line gaps. The generic upstream composite decoder still fringes edges. Empirical spatial/tonal model; no measured full optics, 85 Hz conversion or complete FW900 electronics.

<dl class="settings">
<dt>Input / face</dt><dd>composite / aperture_grille</dd>
<dt>Triads</dt><dd>0</dd>
<dt>FWHM</dt><dd>measured PC raster</dd>
<dt>H/V curve; overscan per edge</dt><dd>0/0; 0%</dd>
<dt>Ambient / glare</dt><dd>0/0</dd>
<dt>Halo / width</dt><dd>0/0</dd>
</dl>

### Sony PVM-14L2 (nominal) {#sony_pvm_14l2}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/sony_pvm_14l2-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/sony_pvm_14l2-game-native.png' | relative_url }}" alt="Sony PVM-14L2 (nominal): Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/sony_pvm_14l2-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/sony_pvm_14l2-chart-native.png' | relative_url }}" alt="Sony PVM-14L2 (nominal): Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/sony_pvm_14l2-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/sony_pvm_14l2-beam-native.png' | relative_url }}" alt="Sony PVM-14L2 (nominal): Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">14L2 grille, D65, 1 ms AFC and 10 MHz (-3 dB) RGB. Aperture spans 0-6 dB with approximate shape; generic adaptive comb and nominal phosphor/spot, not an individually measured tube.</p>

Preset file: [`presets/sony_pvm_14l2.json`](https://github.com/yaglo/mynes/blob/master/presets/sony_pvm_14l2.json) · connection `composite` · mask `aperture_grille`.

**4K assessment and disposition:** Strong monitor identity: focused bright beam, restrained geometry, neutral greys and cleaner composite detail. Keep as the main hardware-informed monitor. Full-resolution highlights are not uniformly “too dim” in this check. Grille/size/bandwidth have published backing; beam/decay and much of the receiver remain approximate.

<dl class="settings">
<dt>Input / face</dt><dd>composite / aperture_grille</dd>
<dt>Triads</dt><dd>1070</dd>
<dt>FWHM</dt><dd>0.38–0.9</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.006/0.007; 0%</dd>
<dt>Ambient / glare</dt><dd>0/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Fine aperture grille {#sony_pvm_20m4u}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/sony_pvm_20m4u-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/sony_pvm_20m4u-game-native.png' | relative_url }}" alt="Fine aperture grille: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/sony_pvm_20m4u-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/sony_pvm_20m4u-chart-native.png' | relative_url }}" alt="Fine aperture grille: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/sony_pvm_20m4u-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/sony_pvm_20m4u-beam-native.png' | relative_url }}" alt="Fine aperture grille: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">High-resolution aperture grille with separated Y/C, a 1200-triad face and tightly focused spots. Generic monitor; fine structure needs sufficient output resolution.</p>

Preset file: [`presets/sony_pvm_20m4u.json`](https://github.com/yaglo/mynes/blob/master/presets/sony_pvm_20m4u.json) · connection `svideo` · mask `aperture_grille`.

**4K assessment and disposition:** Very narrow Y/C raster, deep gaps and fine texture. Keep for users who like a clinical, sharply separated raster. At this 4K viewport its colour stripes are already partly unresolved; do not mistake that for a missing mask. Significant overlap with Studio at smaller sizes.

<dl class="settings">
<dt>Input / face</dt><dd>svideo / aperture_grille</dd>
<dt>Triads</dt><dd>1200</dd>
<dt>FWHM</dt><dd>0.28–0.52</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.005/0.005; 0%</dd>
<dt>Ambient / glare</dt><dd>0.004/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Stas's Favourite {#stass_favourite}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/stass_favourite-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/stass_favourite-game-native.png' | relative_url }}" alt="Stas's Favourite: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/stass_favourite-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/stass_favourite-chart-native.png' | relative_url }}" alt="Stas's Favourite: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/stass_favourite-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/stass_favourite-beam-native.png' | relative_url }}" alt="Stas's Favourite: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Worn consumer inline slot-mask TV over channel-3 RF: cool white, mild red push, imperfect grey tracking/convergence, broad bright spots and causal horizontal recovery. Generic aged set; colour and wear parameters are estimates.</p>

Preset file: [`presets/stass_favourite.json`](https://github.com/yaglo/mynes/blob/master/presets/stass_favourite.json) · connection `rf` · mask `slot`.

**4K assessment and disposition:** Distinct worn slot-mask RF: muted cool picture, imperfect tracking, broad highlights and recovery. Keep the personal name and tuning. Slow AGC, noise and load behavior need longer clips for judgment; this short still test is not proof of their temporal accuracy.

<dl class="settings">
<dt>Input / face</dt><dd>rf / slot</dd>
<dt>Triads</dt><dd>440</dd>
<dt>FWHM</dt><dd>0.55–1.42</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.05/0; 0%</dd>
<dt>Ambient / glare</dt><dd>0.002/0</dd>
<dt>Halo / width</dt><dd>0.05/0</dd>
</dl>

### Studio aperture grille {#studio_pvm}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/studio_pvm-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/studio_pvm-game-native.png' | relative_url }}" alt="Studio aperture grille: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/studio_pvm-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/studio_pvm-chart-native.png' | relative_url }}" alt="Studio aperture grille: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/studio_pvm-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/studio_pvm-beam-native.png' | relative_url }}" alt="Studio aperture grille: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Regulated studio aperture grille with separated Y/C, a fine 900-triad face and narrow spots. Generic monitor, not a measured Sony model.</p>

Preset file: [`presets/studio_pvm.json`](https://github.com/yaglo/mynes/blob/master/presets/studio_pvm.json) · connection `svideo` · mask `aperture_grille`.

**4K assessment and disposition:** Quiet Y/C, crisp raster and a slightly less extreme beam than Fine grille. A good clean-monitor vibe. Keep both for now; describe the distinction instead of inventing separate Sony identities.

<dl class="settings">
<dt>Input / face</dt><dd>svideo / aperture_grille</dd>
<dt>Triads</dt><dd>900</dd>
<dt>FWHM</dt><dd>0.32–0.6</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.005/0.006; 0%</dd>
<dt>Ambient / glare</dt><dd>0.004/0</dd>
<dt>Halo / width</dt><dd>0.02/0</dd>
</dl>

### Toshiba 14AF (nominal) {#toshiba_14af43}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/toshiba_14af43-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/toshiba_14af43-game-native.png' | relative_url }}" alt="Toshiba 14AF (nominal): Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/toshiba_14af43-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/toshiba_14af43-chart-native.png' | relative_url }}" alt="Toshiba 14AF (nominal): Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/toshiba_14af43-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/toshiba_14af43-beam-native.png' | relative_url }}" alt="Toshiba 14AF (nominal): Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">14AF43-inspired small flat slot tube, three-line composite comb and broad bright spot. Moderately cool white, nominal 525 phosphors; colour/beam estimates, not measured factory settings.</p>

Preset file: [`presets/toshiba_14af43.json`](https://github.com/yaglo/mynes/blob/master/presets/toshiba_14af43.json) · connection `composite` · mask `slot`.

**4K assessment and disposition:** Soft consumer beam, near-flat face, slot texture and smoother composite colour. Strong complementary choice to JVC/PVM. Keep the broad spot; exact tone/sharpness and phosphor behavior remain estimates.

<dl class="settings">
<dt>Input / face</dt><dd>composite / slot</dd>
<dt>Triads</dt><dd>480</dd>
<dt>FWHM</dt><dd>0.6–1.2</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.002/0.002; 2.2%</dd>
<dt>Ambient / glare</dt><dd>0.008/0</dd>
<dt>Halo / width</dt><dd>0.035/0</dd>
</dl>

### VHS SP playback {#vhs_sp_consumer}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/vhs_sp_consumer-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/vhs_sp_consumer-game-native.png' | relative_url }}" alt="VHS SP playback: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/vhs_sp_consumer-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/vhs_sp_consumer-chart-native.png' | relative_url }}" alt="VHS SP playback: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/vhs_sp_consumer-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/vhs_sp_consumer-beam-native.png' | relative_url }}" alt="VHS SP playback: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">A slightly noisy NTSC SP recording on a Toshiba-style slot-mask CRT: delayed soft colour, horizontal luma grain, gentle transport drift and occasional dropout. Lifted gun bias reveals tape grain in shadows while reduced gain restrains highlights. An authored playback look, not a calibrated deck or a claim that every VHS recording lifts black.</p>

Preset file: [`presets/vhs_sp_consumer.json`](https://github.com/yaglo/mynes/blob/master/presets/vhs_sp_consumer.json) · connection `composite` · mask `slot`.

**4K assessment and disposition:** Clear horizontal chroma softening and trailing colour, with Toshiba's broad slot-mask tube. A coherent tape look. Shadow grain is now visible after the bias/noise retune, and colour delay is clearer. Shortened the menu name, retaining the filename. No claim that all decks have the same delay, snow or black level.

<dl class="settings">
<dt>Input / face</dt><dd>composite / slot</dd>
<dt>Triads</dt><dd>480</dd>
<dt>FWHM</dt><dd>0.6–1.2</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.002/0.002; 2.2%</dd>
<dt>Ambient / glare</dt><dd>0.008/0</dd>
<dt>Halo / width</dt><dd>0.035/0</dd>
</dl>

### Vivid Living Room {#vivid_living_room}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/vivid_living_room-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/vivid_living_room-game-native.png' | relative_url }}" alt="Vivid Living Room: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/vivid_living_room-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/vivid_living_room-chart-native.png' | relative_url }}" alt="Vivid Living Room: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/vivid_living_room-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/vivid_living_room-beam-native.png' | relative_url }}" alt="Vivid Living Room: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Personal vivid composite consumer TV, curated from a saved living-room setup. Cool whites, rich colour and modest red drive; controlled glass scatter and stable geometry. Generic preference profile, not a factory calibration.</p>

Preset file: [`presets/vivid_living_room.json`](https://github.com/yaglo/mynes/blob/master/presets/vivid_living_room.json) · connection `composite` · mask `shadow`.

**4K assessment and disposition:** Lively, cool, colourful composite with visible edge colour and more light spill. Keep as a preference preset; saturation and glow need not match a factory mode. It should remain more exuberant than neutral Living Room.

<dl class="settings">
<dt>Input / face</dt><dd>composite / shadow</dd>
<dt>Triads</dt><dd>480</dd>
<dt>FWHM</dt><dd>0.55–1.15</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.04/0.05; 1.8%</dd>
<dt>Ambient / glare</dt><dd>0.01/0</dd>
<dt>Halo / width</dt><dd>0.08/0</dd>
</dl>

### Warm Desktop Monitor {#warm_desktop_monitor}

<div class="preset-media">
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/warm_desktop_monitor-game-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/warm_desktop_monitor-game-native.png' | relative_url }}" alt="Warm Desktop Monitor: Castlevania III BLK 1-02 framebuffer, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Castlevania III BLK 1-02 framebuffer, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/warm_desktop_monitor-chart-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/warm_desktop_monitor-chart-native.png' | relative_url }}" alt="Warm Desktop Monitor: Grayscale/colour/detail chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Grayscale/colour/detail chart, native 4K crop</figcaption>
</figure>
<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/warm_desktop_monitor-beam-native.png' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/warm_desktop_monitor-beam-native.png' | relative_url }}" alt="Warm Desktop Monitor: Isolated-scanline chart, native 4K crop" width="480" height="160" loading="lazy"></a>
<figcaption class="fig-note">Isolated-scanline chart, native 4K crop</figcaption>
</figure>
</div>

<p class="preset-desc">Personal warm Y/C desktop monitor: warm whites and rich colour, fine shadow mask, restrained supply loading and a soft amber desk-light reflection. Generic preference profile, not a measured Commodore tube.</p>

Preset file: [`presets/warm_desktop_monitor.json`](https://github.com/yaglo/mynes/blob/master/presets/warm_desktop_monitor.json) · connection `svideo` · mask `shadow`.

**4K assessment and disposition:** Warm whites, clean Y/C colour and a softer dot-mask face. Distinct, comfortable and worth keeping. Preserve the warmth rather than normalizing every profile to D65; a soft amber desk-light reflection now completes the generic room setting.

<dl class="settings">
<dt>Input / face</dt><dd>svideo / shadow</dd>
<dt>Triads</dt><dd>520</dd>
<dt>FWHM</dt><dd>0.54–1.1</dd>
<dt>H/V curve; overscan per edge</dt><dd>0.035/0.04; 0%</dd>
<dt>Ambient / glare</dt><dd>0.01/0.003</dd>
<dt>Halo / width</dt><dd>0.05/0</dd>
</dl>

## 4K visual index


These sheets combine a reduced whole-screen view and an unscaled native crop.
Use the lossless native PNGs for fine mask judgments; JPEG sheets are navigation.

<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/game-1.jpg' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/game-1.jpg' | relative_url }}" alt="4K gameplay review: arcade, household RF, compact, aged and kitchen" width="1440" height="1000" loading="lazy"></a>
</figure>

<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/game-2.jpg' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/game-2.jpg' | relative_url }}" alt="4K gameplay review: consumer, lab and large monitors" width="1440" height="1000" loading="lazy"></a>
</figure>

<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/game-3.jpg' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/game-3.jpg' | relative_url }}" alt="4K gameplay review: references, PC, PVM and personal RF" width="1440" height="1000" loading="lazy"></a>
</figure>

<figure class="figure">
<a href="{{ '/assets/images/preset-audit-4k/game-4.jpg' | relative_url }}"><img src="{{ '/assets/images/preset-audit-4k/game-4.jpg' | relative_url }}" alt="4K gameplay review: studio, Toshiba, tape and personal colour" width="1440" height="1000" loading="lazy"></a>
</figure>


## Assessment of the shared engine


**Backgrounds and black:** all 23 current gameplay renders retain the castle
walls and palette detail; no preset loses that background in this fixture.
The neutral PVM's chart code `$10` averages 0.350 relative linear luminance in
the sampled patch; Reference composite is 0.332. These are mid-grey codes,
not peak white. There is no evidence here for a blanket brightness boost.
Basement and Dying deliberately lower it to 0.206 and 0.184. Their muted picture
is part of the look, although Dying sacrifices considerable legibility.

The tube surround is still simple. `ambient_light * 0.15` contributes uniform
reflected light, including the surrounding clear area. It is not a modeled
plastic bezel, room or cabinet. The fixed glass aperture and raster are now
separate, but an unlit tube face, bezel and background environment do not yet
have independently convincing materials. That is a larger experiential gap
than adding another generic colour-temperature preset.

**Noise:** RF and tape noise exist and change between same-phase frames.
They are more visible in midtones than near black. Basement's same-phase
grey-patch difference RMS is 0.0180; Bedroom is 0.0154. Their black-patch values
are about 0.000072 and 0.000063. A quiet black is not proof that noise is absent,
and clean RF reception is a valid condition.

VHS previously had a black-patch difference of approximately 0.000001—almost
entirely hidden by gun cutoff. This review raises playback luma grain RMS
from 0.008 to 0.018 and receiver brightness from 0 to 0.08, then lowers luma
contrast from 1 to 0.94 to restrain highlights. **Black variation is now
0.00119**, with mean linear Y 0.00274; mid-grey variation is 0.00899. White
changes from 0.4314 to 0.4348, less than 1%. No post-display noise is added.
The bias is an authored slightly lifted playback/TV operating point, not a
universal VHS black level or a repaired magnetic-tape/clamp circuit model.
Normal NES black `$0f` and below-black `$0d` are separate chart patches;
`$0d` remains cut off, as intended.

VHS chroma delay also increases from 140 ns to 250 ns (about 1.34 NTSC NES
pixels nominally). This emphasizes the already separate bandwidth, tail,
peaking and transport stages without increasing geometric instability.
The [48-frame animation]({{ '/assets/images/feature-tour/noise.webp' | relative_url }}) retains consecutive
frames, slowed fourfold for inspection. Two-frame differences here are relative
final-render luminance, not calibrated SNR; settling and geometry may contribute.

**Beam and highlights:** the isolated-line captures show useful distinctions
between focused monitors, ordinary consumer sets and the broad Dying tube.
Consumer bright spots grow; bandwidth loss remains horizontal before tube
spreading. Finite vertical beam width is legitimate. Gaussian spots and their
current-growth curves are still approximations. The phosphor pattern should
not be erased merely because a beam gets wider: light spreads across a fixed
mask, and optical scatter softens what the viewer sees afterward. The current
coarse masks remain conspicuous in bright fields; optical refinement should
be evaluated separately from spot growth. SDR compression of local phosphor
peaks also affects appearance and prevents treating these captures as HDR tests.

**Mask sampling:** 4K helps, but a 2880-pixel-wide game contains only 2.4 host
pixels per 1200-triad Fine grille and 2.69 per 1070-triad PVM grille. Individual
RGB stripes cannot all remain cleanly resolved. The physically filtered grille
is therefore restrained; it must not be made coarser just to look more obvious.
Panel-pixels alignment is an available aesthetic compromise, whereas this
review uses physical pitch. Coarse dot masks in Basement/Kitchen/Dying remain
strongly visible at native size. That texture is a valid generic style, not a
claim about the mask of every period household set.

**Curvature:** household profiles have clear rounded raster geometry; Toshiba
is nearly flat, and FW900 is flat. The coefficients are image-domain warps,
not glass radii in metres. In particular, the reflection shader does not derive
reflection direction from those surface normals. “Curved picture” and “curved
glass in a room” remain different levels of modeling.

**Glare and ambiance:** all 23 presets initially had external `glass_glare = 0`.
This review gives Kitchen a broad cool reflection (0.005, 6000 K), Living Room
a faint warm lamp (0.0025, 3200 K), and Warm Desktop an amber desk light
(0.003, 3000 K). Each was checked with a black signal, colour chart, isolated
beam and gameplay at 4K. Other looks retain their previous room conditions.
Internal scatter/halation remains separate from these external reflections.

These are authored generic environments. The room shader is still a procedural
gradient plus a broad light shape; it is not a measured room, glass-surface
ray tracer or cabinet model. Ambient/room controls could usefully become
separable from tube identity so users can keep a favourite tube in another room.

**Decoder, sharpness and motion:** clean Y/C and RGB profiles stay clean;
composite/RF produce edge colour, and the comb profiles preserve more neutral
detail. They are distinct signal paths, not just different palettes. Exact
commercial decoder/sharpening circuits remain incomplete; the
[sharpening worklist]({{ '/notes/sharpening/' | relative_url }}) states those limits. Phosphor decay
is frame sampled, and FW900 does not perform an 85 Hz temporal conversion.
A PAL game selects a generic PAL receiver fallback even for nominal North
American consumer profiles; that is usability, not a claim those sets accepted
PAL. The separate [presentation validation](https://github.com/yaglo/mynes/blob/master/docs/architecture/gpu-realism-validation.md)
records visible host timing and its remaining occasional misses.


## Follow-up priorities


- Preserve the distinct generic and personal looks. Hardware provenance is not
  a prerequisite for an enjoyable preset; invented calibration claims are.
- Give the room, unlit face and surround distinct treatment. Author a few
  intentional room vibes, with optional reflections, separately from tube setup.
- Extend tape transport/clamp validation with longer moving sequences. The
  shadow-grain retune is a preset operating-point change, not a full VCR circuit.
  Keep signal noise separate from screen-space effects.
- Place lab comparisons together when preset categories are introduced. This
  review clarifies the lab, clean-consumer and tape names while keeping stable
  filenames so saved setups continue to load.
- Extend the named profiles' input-specific sharpening and decoder behavior
  where circuit evidence exists. Generic looks may keep generic responses.
- Validate longer motion/noise sequences and live HDR separately. These SDR
  spatial comparisons are not a replacement for display-timestamp testing.


## Setting-by-setting disposition


The following groups the main saved settings; the linked JSON manifest contains
the complete per-preset values. Zero-valued service/diagnostic controls are intentional: normal operation should not include an unrelated collection of defects. The values in the preset files are the authoritative editable settings.

| Settings | Interpretation and review decision |
|---|---|
| `name`, `description` | State generic identity and avoid commercial-model calibration claims. |
| `connection`, `comb_type`, `comb_notch_depth`, `region` | Composite/RF retain modulated colour; Y/C and RGB are ideal modifications. Sony uses adaptive composite separation, JVC two-line and Toshiba three-line; older profiles retain their notch/separated-source choices. Commercial IC transfer functions remain approximate. Live ROM region takes precedence over a preset. |
| `console_variant`, `speaker_type` | Select nominal audio filters and generic speaker families; not a change to the emulated PPU or CPU. |
| `console_amp_bw`, `console_coupling_R`, `console_psu_hum`, `console_phase_distortion_ns` | Generic output pole/source impedance and supply pickup; NTSC profiles use the published 30 ns 2C02G phase-distortion estimate. 6 MHz is a nominal equivalent pole, not a measured chip-wide specification. The imported `console_coupling_C` field is inactive and omitted from shipped profiles. |
| `video_cable.length_meters`, `resistance_per_m`, `capacitance_per_m`, `connector_resistance`, `impedance` | Passive equivalent shunt-capacitance response. Does not claim skin/dielectric loss or full transmission-line propagation. Nominal 75 Ω termination and plausible short-lead values. |
| `video_cable.shield_effectiveness`, `ghost_delay`, `ghost_level` | Generic pickup strength and optional echo in signal samples. No calibrated shielding-to-noise transfer. Basement and Bedroom RF leads have small explicit echoes. |
| `video_cable.num_sections`, `audio_cable.num_sections` | Legacy metadata; GPU video uses one equivalent pole, not a distributed ladder. Not exposed as a working GPU control. |
| `rf.enabled`, `mod_bandwidth`, `agc_attack_ms`, `agc_release_ms` | Enable the baseband RF model, its FIR and sync-keyed gain dynamics. Bandwidth now updates on preset load. Equivalent AM/IF processing, not a complete physical tuner. |
| `rf.carrier_freq`, `carrier_level_dbm`, `noise_floor_dbm` | Frequency is metadata. Carrier/noise power difference sets complex Gaussian noise before an equivalent negative-AM envelope detector; total noise is defined at that injection point. This is not a measured tuner noise figure. |
| `brightness`, `contrast`, `chroma_gain` | Receiver voltage-domain controls. Black and white checks use neutral baselines; worn preferences and the tape-playback look retain deliberate black/contrast changes. |
| `tv.luma_bandwidth`, `chroma_bandwidth`, `fir_ringing`, `luma_peaking`, `luma_notch_depth` | Receiver separation and frequency response. RF/household chroma is narrower than clean Y/C. Ringing/peaking is modest outside deliberately worn receivers. |
| `tv.hue_offset`, `saturation`, `color_temperature`, `r_drive/g_drive/b_drive`, `r_cutoff/g_cutoff/b_cutoff`, `color_killer` | Decoder adjustment, nominal white point, per-gun balance and burst gate. Clean monitors stay neutral; small household tint errors are explicit. |
| `tv.r_bandwidth/g_bandwidth/b_bandwidth`, `gamma` | Gun-voltage bandwidth followed by current transfer. Generic equivalent responses; PVM-14L2 uses Sony's 10 MHz RGB figure. |
| `tv.beam_fwhm_min`, `beam_fwhm_max`, `beam_spot_size`, `bloom_gamma`, `edge_focus`, `velocity_dim` | Spot dimensions, current growth and edge behaviour. FWHM is in scanlines; horizontal sigma remains in signal samples. Bright consumer spots can fill the gaps; focused monitors retain more separation. Gaussian spots omit measured non-Gaussian high-current tails. |
| `tv.convergence_static`, `convergence_dynamic`, `conv_r_x/conv_b_x`, `conv_r_y/conv_b_y` | Small central/edge gun landing errors, larger for worn tubes. Legacy horizontal offsets use signal samples; vertical/generic offsets use drawable pixels, so this part is not a physical millimetre calibration. Nominal PVM is aligned. |
| `tv.beam_current_load`, `video_black_droop`, `video_recovery_us`, `hv_sag`, `focus_breathing` | Causal video-rail/DC restoration and shared supply response. Positive size response contracts the raster; negative expands it. Generic couplings/time constants, not a circuit-component fit. |
| `tv.barrel`, `barrel_v`, `overscan`, `keystone`, `rotation`, `skew_x/skew_y`, `h_pos/v_pos`, `h_size/v_size` | Tube/raster geometry. Household overscan is modest. No preset needs a tilted, sheared trapezoid. Dying CRT is now stable. |
| `tv.h_jitter`, `v_jitter`, `rf_interference`, `geometry_warp`, `scanline_wobble`, `hum_bar_amplitude` | Small explicit timebase/supply faults for worn sets. Decorative quantized RF displacement and sinusoidal line wobble are off throughout the library. |
| `tv.beam_edge_fade`, `beam_edge_overshoot`, `burst_lock_drift`, `burst_lock_drift_width` | Legacy source/edge diagnostics; zero in all shipped presets. They are not required to give a CRT its identity. |
| `tv.mask_type`, `mask_triads`, `mask_pitch_px`, `mask_strength`, `subpixel_layout` | Physical family and total pitch, full mask coverage, host filtering. Host Panel-pixels mode fits integer periods to the current game viewport; CRT-pitch mode preserves nominal density. RGB/BGR ordering is not LCD-subpixel calibration. |
| `tv.persistence_ms`, `persistence_r/g/b`, `motion_threshold` | Generic frame-sampled decay; explicit smoothing is separate. Not a reproduction of a CRT's moving impulse beam on a 60 Hz sample-and-hold panel. Age does not automatically imply huge phosphor trails. |
| `tv.halation`, `halation_tint_r/g/b`, `glass_tint`, `vignette`, `ambient_light`, `black_floor` | Moderate optical spread, neutral scatter colour, glass throughput and room/black level. No arbitrary green glow. Ambient extends into window margins. |
| `tv.glass_glare`, `glass_glare_light_x/y`, `glass_glare_size`, `glass_glare_temp_k` | External procedural room light. Kitchen, Living Room and Warm Desktop use deliberately restrained reflections; neutral and lab comparisons retain their previous room state. Coordinates/size describe the image-space light, not a measured room. |
| `vhs.*` | Recovered luma/chroma bandwidth, colour delay, peaking/tail, signal-domain noise, transport drift, switching and sparse dropout. Generic NTSC composite/RF playback only; the current SP operating point is detailed above. |
| `tv.noise_level` | Receiver output voltage noise, before gun transfer/beam spread. RF snow is separately introduced before decoding. |
| `tv.hdr_gain` | Linear exposure before host adaptation. Does not claim measured nits; actual HDR headroom comes from SDL. |
| `audio_cable.*`, `audio_cable_length_m` | Source resistance plus wire resistance, cable capacitance and length affect the audio pole. Shielding, echo, impedance and ladder sections are compatibility metadata for audio; noise/hum are explicit separate controls. 8 Ω speaker load was removed from cable characteristic impedance. |
| `audio_psu_hum_amplitude`, `audio_noise_floor`, `audio_saturation_drive` | Explicit generic audible wear, reduced to restrained levels. Console/speaker responses are shared between CPU and GPU. |

The PVM reference is [Sony's published specification](https://www.sony.jp/pro-monitor/products/PVM-14L2/). NES signal values come from [terminated voltage measurements](https://www.nesdev.org/wiki/NTSC_video). [Video-amplifier fault descriptions](https://www.repairfaq.org/REPAIR/F_monfaq.html) support the kinds of streaking/regulation defects, not the numerical tuning of an individual preset. Further assumptions and missing physical models are listed in the [pipeline reference](https://github.com/yaglo/mynes/blob/master/docs/gpu-pipeline-reference.md).


## Curated colour and connection defaults


| Profile | Connection | White point | R−Y / B−Y gain offset | Gun gamma | Spot growth at white |
|---|---|---:|---:|---:|---:|
| PVM-14L2 | Composite | D65 | 0 / 0 | 2.4 | 25% |
| JVC D-Series | Composite | 9300 K | +16% / −2% | 2.4, small tracking offsets | 40% |
| Toshiba 14AF43 | Composite | 8000 K | +6% / +2.5% | 2.4, small tracking offsets | 45% |
| Stas's Favourite | RF | 7800 K | +10% / −3.5% | 2.2, worn tracking | 55% |

Consumer colour settings are explicit estimates; they are not extracted factory coefficients. The JVC owner record reports cool Standard mode and red push. Toshiba's service procedure specifies visual white-balance adjustment, without establishing our 8000 K target. PVM D65 is documented. Nominal 525-line phosphor primaries are a standards-based approximation to the unmeasured tubes. Decoder colour-difference gains preserve the gray axis; gun balance and phosphor gamut act at their respective stages.

Stas uses channel-3 metadata, −25 dBm sync-tip carrier, −65 dBm injected channel noise and a 4.1 MHz equivalent video corner. RF can be selected on any display; on the tunerless PVM this represents an external receiver. Stock NES composite/RF and hypothetical modified component/RGB sources are distinct choices.


## Current control audit


All 121 saved TV fields have OSD controls, including conditional legacy focus settings. RF IF and VHS controls are saved and editable under Signal chain. The automated audit checks every shipped preset against the control ranges; this is a consistency check, not evidence that every parameter matches measured hardware. [Model validation and limits](https://github.com/yaglo/mynes/blob/master/docs/architecture/gpu-realism-validation.md).
