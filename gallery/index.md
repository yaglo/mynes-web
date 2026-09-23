---
layout: page
title: Gallery
permalink: /gallery/
section: gallery
description: Clips, crops and full frames from MyNES, by game and by television preset, each shown at one source pixel per screen pixel.
---

<!-- TODO(copy): first paragraph: what the gallery holds and how it is shown; the image caveats live on the About page. -->
<p>Clips, crops and full frames from the MyNES GPU frontend, by game and by television preset, each shown at one source pixel per screen pixel.</p>

## Games

{% include gallery-games.html %}

## Televisions

{% include gallery-televisions.html %}

## Close-ups

<!-- TODO(copy): one line on the close-ups page. -->
<p><a href="{{ '/gallery/close-ups/' | relative_url }}">Close-ups</a>: native-pixel gameplay crops and measured brightness-dependent beam height on four presets.</p>

## Motion

<!-- TODO(copy): one line on the motion page. -->
<p><a href="{{ '/gallery/motion/' | relative_url }}">Motion</a>: one clip per game at {{ site.data.hero.fps }} fps, one emulator frame per video frame.</p>

Older galleries and reviews are in the [archive]({{ '/archive/' | relative_url }}).
