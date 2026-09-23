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

<p class="intro">MyNES is an NES emulator whose GPU frontend encodes the picture as composite or RF video and draws the decoded signal on a simulated CRT.</p>
{% if release.date %}
<p class="release-line">MyNES {{ release.version }}, released <time datetime="{{ release.date | date: '%Y-%m-%d' }}">{{ release.date | date: "%Y-%m-%d" }}</time>{% if release.commit %}, commit <a href="{{ site.project.code_repo }}/commit/{{ release.commit }}">{{ release.commit | slice: 0, 7 }}</a>{% endif %}.</p>
{% endif %}
<ul class="facts">
<li>The 6502 core is generated from a <a href="{{ '/blog/timing-is-data/' | relative_url }}">timing DSL</a> and passes {{ facts.tests.passed }} of {{ facts.tests.total }} {{ facts.tests.suite }} tests.</li>
<li>The {{ facts.presets.count }} CRT presets include the Sony PVM-14L2, JVC D-Series, Toshiba 14AF and sets fed by RF.</li>
<li>Gallery frames are {{ facts.frame.width }}×{{ facts.frame.height }}, and clips run at {{ facts.clip.fps_short }} fps with one emulator frame per video frame.</li>
</ul>

<p class="buttons">{% if release.date %}<a class="btn btn-primary" href="{{ '/download/' | relative_url }}">Download MyNES {{ release.version }}{% if release.platforms %} for {{ release.platforms | join: " and " }}{% endif %}</a> <a class="btn btn-secondary" href="{{ '/download/#build-from-source' | relative_url }}">Build from source</a>{% else %}<a class="btn btn-primary" href="{{ '/download/#build-from-source' | relative_url }}">Build MyNES {{ release.version }} from source</a> <a class="btn btn-secondary" href="{{ site.project.code_repo }}">Source on GitHub</a>{% endif %}</p>
</section>

## How the picture is made

The PPU's color and emphasis codes select the NES DAC waveform, and the GPU frontend passes that waveform through the cable or RF receiver and a television decoder. Composite and RF artifacts such as dot crawl and color bleed come from that signal processing. The decoded RGB drives the simulated beam, whose spot grows with beam current, and then the phosphors, the mask and the glass.

<pre class="pipeline">PPU codes → NES DAC waveform → cable / RF → Y/C separation → decoder
          → RGB amps → beam &amp; phosphor → mask &amp; glass → display</pre>

The [technical notes]({{ '/notes/' | relative_url }}) give the evidence behind each stage.

## Sony PVM-14L2 and Stas's Favourite on Mega Man 2

{% include compare.html a="mega-man-2-title-sony-pvm-14l2-rooftop" b="mega-man-2-title-stass-favourite-rooftop" note="Look at the mask: the aperture grille on the left repeats every 4 px across the frame, and the slot mask on the right every 9 px." %}

[Gallery]({{ '/gallery/' | relative_url }}) · [Technical notes]({{ '/notes/' | relative_url }}) · [Download and build]({{ '/download/' | relative_url }})
