---
layout: home
title: MyNES
permalink: /
description: MyNES is a NES emulator that generates the console's composite video waveform, decodes it like a television and models the beam, phosphor, mask and glass of a CRT. 23 CRT presets, cycle-accurate 6502 from a timing DSL.
---

<section class="hero">
{% include tv-switcher.html %}

<h1>A NES emulator that follows the picture from the console's video signal to the glow of a CRT.</h1>

<p class="intro">MyNES generates the NES's composite waveform from PPU colour codes, passes it through a modelled cable or RF receiver and television decoder, and renders the electron beam, phosphors, mask and glass. Change the connection, turn a control or switch televisions while the game keeps running.</p>

<ul class="facts">
<li>Cycle-accurate 6502 generated from a timing DSL; 144 of 144 AccuracyCoin tests pass.</li>
<li>The picture is produced by generating the real composite waveform and decoding it, then modelling beam, phosphor, mask and glass.</li>
<li>23 CRT presets, including the Sony PVM-14L2, JVC D-Series, Toshiba 14AF and RF sets.</li>
</ul>

<div class="buttons">
<a class="btn btn-primary" href="{{ site.project.releases }}">Download</a>
<a class="btn btn-secondary" href="{{ site.project.code_repo }}">Source on GitHub</a>
<a class="btn btn-secondary" href="{{ '/download/' | relative_url }}">Build it yourself</a>
</div>
</section>

## Choose your television

The four main tuning targets, on the Mega Man 2 title at 3840×2880. Commercial names identify nominal references: individual tube condition and many circuit responses remain estimates.

<ul class="tiles">
<li><a class="tile" href="{{ '/archive/presets/' | relative_url }}#sony_pvm_14l2"><img src="{{ '/assets/images/site/tile-sony_pvm_14l2.webp' | relative_url }}" alt="Mega Man 2 title on the Sony PVM-14L2 preset" width="300" height="225"><span>Sony PVM-14L2 · focused beam, fine aperture grille, D65, composite</span></a></li>
<li><a class="tile" href="{{ '/archive/presets/' | relative_url }}#jvc_d_series_2000"><img src="{{ '/assets/images/site/tile-jvc_d_series_2000.webp' | relative_url }}" alt="Mega Man 2 title on the JVC D-Series preset" width="300" height="225"><span>JVC D-Series · cooler whites, slot mask, two-line comb</span></a></li>
<li><a class="tile" href="{{ '/archive/presets/' | relative_url }}#toshiba_14af43"><img src="{{ '/assets/images/site/tile-toshiba_14af43.webp' | relative_url }}" alt="Mega Man 2 title on the Toshiba 14AF preset" width="300" height="225"><span>Toshiba 14AF · softer beam, broader highlights, three-line comb</span></a></li>
<li><a class="tile" href="{{ '/archive/presets/' | relative_url }}#stass_favourite"><img src="{{ '/assets/images/site/tile-stass_favourite.webp' | relative_url }}" alt="Mega Man 2 title on the Stas's Favourite RF preset" width="300" height="225"><span>Stas's Favourite · RF reception, imperfect convergence, recovery</span></a></li>
</ul>

[All 23 presets, reviewed at 4K]({{ '/archive/presets/' | relative_url }}) · [Beam close-ups]({{ '/gallery/close-ups/' | relative_url }}) · [Feature tour]({{ '/archive/feature-tour/' | relative_url }})

## How it works

The composite path starts with PPU colour and emphasis codes, not an RGB palette. They select the 2C02/2C07 voltage waveform, which then passes through the console output, cable or RF receiver, sync and burst recovery, Y/C separation, colour decoding, RGB amplifiers, supply loading, beam deposition, phosphor decay, mask, glass and the host display.

<pre class="pipeline">PPU codes → NES DAC waveform → cable / RF → Y/C separation → decoder
          → RGB amps → beam &amp; phosphor → mask &amp; glass → display</pre>

Composite and RF artefacts emerge from the signal processing rather than from a filter applied to a clean image. Beam width grows with current, bright areas can affect focus, recovery and raster size, and aperture grilles, slot masks and shadow masks give the display its texture. Still images cannot reproduce CRT motion on an LCD, and the presets are not measurements of twenty-three individual televisions; RF is an equivalent baseband model, not a complete tuner simulation. The [pipeline reference]({{ site.project.blob }}/docs/gpu-pipeline-reference.md) records those boundaries alongside the implemented stages.

The blog series explains the main ideas in order:

{% assign series = site.posts | sort: "date" %}
<ol class="series-list">
{% for post in series %}<li><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
{% endfor %}</ol>

[Hardware research and model limits]({{ '/notes/' | relative_url }}) · [About the project]({{ '/about/' | relative_url }})
