---
layout: page
title: HDR output
permalink: /notes/hdr/
section: notes
nav_order: 6
nav_title: HDR output
description: How the MyNES renderer uses the headroom of an HDR display, the reference white and peak luminance of its HDR recordings, and how the site offers HDR files.
updated: 2026-09-23
---
{%- comment -%}
The parts about the site's own HDR files come from the hero data
(_data/hero.json, manifest version 2): a clip's `hdr` block and its `crop`
with `hdr` and `sdr` files. Browser and display checks of those files go in
_data/hdr_checks.yml as a list of {date, browser, os, display, result}. Each
part shows a plain line until its data exists.
{%- endcomment -%}
{%- assign hdr_n = 0 -%}{%- assign hdr_crop_game = nil -%}{%- assign hdr_crop_preset = nil -%}
{%- for g in site.data.hero.games -%}{%- for p in site.data.hero.presets -%}
{%- assign c = site.data.hero.clips[g.id][p.id] -%}
{%- if c.hdr.white_nits -%}{%- assign hdr_n = hdr_n | plus: 1 -%}{%- endif -%}
{%- if c.crop.hdr and c.crop.sdr and hdr_crop_game == nil -%}{%- assign hdr_crop_game = g.id -%}{%- assign hdr_crop_preset = p.id -%}{%- endif -%}
{%- endfor -%}{%- endfor -%}
{%- assign checks = site.data.hdr_checks -%}

This note covers how the MyNES GPU frontend uses the headroom of an HDR display, the reference white and peak luminance of its HDR recordings, and how this site offers HDR files.

<p class="hdr-detect" data-yes="This display reports HDR: the site offers it the HDR files." data-no="This display does not report HDR: the site offers it the SDR files.">The HDR check needs JavaScript.</p>
<script>
(function () {
  var p = document.querySelector('.hdr-detect');
  if (!p || !window.matchMedia) return;
  var mq = window.matchMedia('(dynamic-range: high)');
  var show = function () { p.textContent = p.getAttribute(mq.matches ? 'data-yes' : 'data-no'); };
  show();
  if (mq.addEventListener) mq.addEventListener('change', show);
})();
</script>
{% if hdr_crop_game %}
## SDR control image

{% include hero-clip.html game=hdr_crop_game preset=hdr_crop_preset %}
This image should look dimmer than the HDR images below it.

{% capture sdr_alt %}{{ hc_game.title }}, {{ hc_game.scene }}, on the {{ hc_preset.name }} preset, SDR control image{% endcapture %}
{% include crop.html file=hc_crop.sdr file_1x=hc_crop.sdr_1x width=hc_crop.width height=hc_crop.height x=hc_crop.x y=hc_crop.y frame_width=hc_still_w frame_height=hc_still_h full=hc_still game=hc_game.title scene=hc_game.scene preset=hc_preset.id signal=hc_signal alt=sdr_alt anchor="sdr-control" %}
{% capture hdr_alt %}{{ hc_game.title }}, {{ hc_game.scene }}, on the {{ hc_preset.name }} preset, HDR file{% endcapture %}
{% include crop.html file=hc_crop.sdr file_1x=hc_crop.sdr_1x hdr=hc_crop.hdr hdr_1x=hc_crop.hdr_1x width=hc_crop.width height=hc_crop.height x=hc_crop.x y=hc_crop.y frame_width=hc_still_w frame_height=hc_still_h full=hc_still game=hc_game.title scene=hc_game.scene preset=hc_preset.id signal=hc_signal alt=hdr_alt anchor="hdr-image" %}
{% endif %}
## Test conditions

- Renderer: MyNES at [20224a3]({{ site.project.code_repo }}/commit/20224a3) on macOS with Metal. The gain figures come from `docs/gpu-pipeline-reference.md` and the recording figures from `docs/gpu-controls.md` at that commit.
- Display for the gain figures: a MacBook panel with a headroom of 2.0 over SDR white.
{% if checks and checks.size > 0 %}- Browsers and displays checked with the site's HDR files:
{% for k in checks %}  - {{ k.date }}: {{ k.browser }} on {{ k.os }}, {{ k.display }}. {{ k.result }}
{% endfor %}{% else %}- Browsers and displays checked with the site's HDR files: none yet.
{% endif %}
## Display settings
{% if hdr_crop_game %}
If the [HDR file](#hdr-image) looks no brighter than the [SDR control image](#sdr-control), the browser or the display shows it as SDR.
{% endif %}
On a television or monitor with HDR picture modes, turn off dynamic contrast and dynamic tone mapping before comparing files. Both change the luminance of a highlight according to the rest of the picture.

## Reference white and peak luminance

An HDR recording (`--record-hdr`) encodes SDR white at 203 nits, the reference white of ITU-R BT.2408[^bt2408], unless `--record-hdr-white` sets another value. It renders with a headroom of 4.0 over SDR white unless `--record-headroom` sets another, so its brightest possible value is 812 nits. The recorder writes BT.2020 primaries with the SMPTE ST 2084 (PQ) transfer[^st2084]. Its sidecar file gives MaxCLL and MaxFALL[^cta861], the brightest pixel and the brightest frame average of the clip in nits.
{% if hdr_n > 0 %}
The site's HDR files were recorded with these values:

| Game | Preset | SDR white | Headroom | MaxCLL | MaxFALL |
|---|---|---:|---:|---:|---:|
{% for g in site.data.hero.games %}{% for p in site.data.hero.presets %}{% assign c = site.data.hero.clips[g.id][p.id] %}{% if c.hdr.white_nits %}| {{ g.title }} | {{ p.name }} | {{ c.hdr.white_nits }} nits | {{ c.hdr.headroom }} | {{ c.hdr.max_cll }} nits | {{ c.hdr.max_fall }} nits |
{% endif %}{% endfor %}{% endfor %}
{% endif %}
## HDR output of the beam simulation

The renderer computes emitted light in linear units, with SDR white at 1.0. The mask and the scanlines put the light of a white field into stripe or dot centers on line centers, which are brighter than the field's average. MyNES spends the headroom of an HDR display on these peaks and treats its output as relative luminance, with no calibration in nits.

With HDR gain set to Auto under M, Host display (the default), the frontend reads the display's headroom and SDR white each frame. It scales the emitted light so that the brightest phosphor of a full-white field reaches 95% of the display's peak, with a gain of at most 4. Above that point a shoulder that keeps the ratios between R, G and B compresses the values toward the display's peak. On a panel with a headroom of 2.0, Auto sets the Sony PVM-14L2 preset to a gain of 0.53 with panel subpixels on and 0.35 with them off. White then averages about half of SDR white, and stripe centers reach 1.9 times SDR white.

At a gain of 1.0 on the same panel, the shoulder flattens those peaks. The preset's scanlines, 0.52 of a line tall at half maximum, measure 0.65 of a line, and the gaps between them rise from 0.20 to 0.35 of the peak. SDR output has no headroom above SDR white and uses a gain of 1, so the shoulder compresses the stripe and line peaks there as well.

## HDR files on this site

Where the display reports HDR (`(dynamic-range: high)`) and the browser can decode the file, the site shows PQ AVIF crops and stills (10-bit, BT.2020) and 10-bit HEVC or AV1 clips with PQ. Elsewhere it shows the renderer's own SDR output of the same frame: lossless PNG files and H.264 clips.{% if hdr_n == 0 and hdr_crop_game == nil %} The site has no HDR files yet. The recording pipeline adds them to the switcher, the gallery and this page when it installs its next media.{% endif %}

## SDR screens and screenshots

An SDR display or an SDR screenshot cannot show the highlights above SDR white that the HDR files hold.

## References

[^bt2408]: ITU-R, [Recommendation BT.2408, Guidance for operational practices in HDR television production](https://www.itu.int/rec/R-REC-BT.2408). Sets the HDR reference white at 203 nits.
[^st2084]: SMPTE, [ST 2084:2014, High Dynamic Range Electro-Optical Transfer Function of Mastering Reference Displays](https://doi.org/10.5594/SMPTE.ST2084.2014). Defines the PQ curve up to 10000 nits.
[^cta861]: CTA, [CTA-861.3, HDR Static Metadata Extensions](https://shop.cta.tech/products/cta-861-3). Defines MaxCLL and MaxFALL.
