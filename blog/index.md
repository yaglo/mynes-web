---
layout: page
title: Building a NES Emulator That Thinks Like Hardware
permalink: /blog/
section: blog
description: An eight-part series on the ideas behind MyNES, from timing as data to the CRT beam.
---

Eight posts, in series order. They cover the CPU timing DSL, the DMA behaviour derived from it, the composite signal, the fourteen-stage GPU pipeline, comb filtering, the electron beam, the presets and why the CPU and GPU pipelines both exist. Some posts describe an earlier prototype; where the current implementation differs, the post says so and links to the current documentation. There is an [RSS feed]({{ '/feed.xml' | relative_url }}).

{% assign series = site.posts | sort: "date" %}
<ol class="post-list">
{% for post in series %}<li>
<span class="num">Part {{ post.series }}</span> <a class="title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
<p class="teaser">{{ post.teaser }}</p>
<span class="date"><time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%-d %B %Y" }}</time></span>
</li>
{% endfor %}</ol>
