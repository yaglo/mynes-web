---
layout: home
title: MyNES
permalink: /
description: MyNES is an NES emulator whose GPU frontend encodes the picture as composite or RF video and draws the decoded signal on a simulated CRT.
---
{%- assign facts = site.data.facts -%}
{%- assign release = site.data.release -%}
<section class="hero">
{% include tv-switcher.html %}

<h1>MyNES</h1>

<!-- TODO(copy): the one sentence that says what MyNES is. -->
<p class="intro">MyNES is an NES emulator whose GPU frontend encodes the picture as composite or RF video and draws the decoded signal on a simulated CRT.</p>

<!-- TODO(copy): three facts, each with its number; the numbers come from _data/facts.yml. -->
<ul class="facts">
<li>{{ facts.tests.passed }} of {{ facts.tests.total }} {{ facts.tests.suite }} tests pass. The 6502 core is generated from a timing DSL.</li>
<li>{{ facts.presets.count }} CRT presets, among them the Sony PVM-14L2, JVC D-Series and Toshiba 14AF, and sets fed by RF.</li>
<li>Frames are rendered at {{ facts.frame.width }}×{{ facts.frame.height }}, and clips run at {{ facts.clip.fps_short }} fps with one emulator frame per video frame.</li>
</ul>

<!-- TODO(copy): once the release is published (_data/release.yml has a date), the button names the version and the platforms. -->
<p class="buttons">{% if release.date %}<a class="btn btn-primary" href="{{ release.notes | default: site.project.releases }}">Download MyNES {{ release.version }}{% if release.platforms %} for {{ release.platforms | join: " and " }}{% endif %}</a>{% else %}<a class="btn btn-primary" href="{{ site.project.releases }}">Download from GitHub</a>{% endif %} <a class="btn btn-secondary" href="{{ '/download/' | relative_url }}">Build from source</a></p>
</section>

## How the picture is made

<!-- TODO(copy): two or three sentences on the signal path, from the technical notes; no caveats here (they are on the About page). -->
The PPU's color and emphasis codes select the NES DAC waveform. The waveform passes through the cable or RF receiver and a television decoder, and the decoded RGB drives the simulated beam, phosphors, mask and glass of a CRT.

<pre class="pipeline">PPU codes → NES DAC waveform → cable / RF → Y/C separation → decoder
          → RGB amps → beam &amp; phosphor → mask &amp; glass → display</pre>

The [technical notes]({{ '/notes/' | relative_url }}) give the evidence behind each stage.

## Sony PVM-14L2 and Stas's Favourite on Mega Man 2

<!-- TODO(copy): the caption's last sentence: what to look at, with a number where there is one. -->
{% include compare.html a="mega-man-2-title-sony-pvm-14l2-rooftop" b="mega-man-2-title-stass-favourite-rooftop" %}

[Gallery]({{ '/gallery/' | relative_url }}) · [Technical notes]({{ '/notes/' | relative_url }}) · [Download and build]({{ '/download/' | relative_url }})
