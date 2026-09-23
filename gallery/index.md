---
layout: page
title: Gallery
permalink: /gallery/
section: gallery
redirect_from:
  - /archive/
description: Clips, crops and full frames from the MyNES GPU frontend by game and by television preset, shown at one image pixel per device pixel.
---

<p>The gallery holds clips, crops and full frames written by the MyNES GPU frontend, sorted by game and by television preset. Each render is shown at one image pixel per device pixel, and each crop links to the full-size PNG frame it was cut from. A render wider than the window scrolls sideways. The About page says <a href="{{ '/about/#how-the-images-are-made' | relative_url }}">how the images are made</a>.</p>

## Games

{% include gallery-games.html %}

## Televisions

{% include gallery-televisions.html %}

## Close-ups

<p><a href="{{ '/gallery/close-ups/' | relative_url }}">Close-ups</a>: 1:1 crops of gameplay frames, and the beam spot height measured at 3 brightness levels on 4 presets.</p>

## Motion

<p><a href="{{ '/gallery/motion/' | relative_url }}">Motion</a>: one clip per game at {{ site.data.hero.fps }} fps, one emulator frame per video frame.</p>
