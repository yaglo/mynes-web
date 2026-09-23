---
layout: page
title: Building a NES Emulator That Thinks Like Hardware
permalink: /blog/
section: blog
description: An eight-part series on the ideas behind MyNES, from timing as data to the CRT beam.
---

Eight posts, in series order. They cover the CPU timing DSL, the DMA behaviour derived from it, the composite signal, the fourteen-stage GPU pipeline, comb filtering, the electron beam, the presets and why the CPU and GPU pipelines both exist. Some posts describe an earlier prototype; where the current implementation differs, the post says so and links to the current documentation. There is an [RSS feed]({{ '/feed.xml' | relative_url }}).

{% assign years = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in years %}
<h2 id="posts-{{ year.name }}">{{ year.name }}</h2>
{% assign posts = year.items | sort: "date" %}
<ul class="post-list">
{% for post in posts %}<li><time datetime="{{ post.date | date: '%Y-%m-%d' }}">{{ post.date | date: "%Y-%m-%d" }}</time> <a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
{% endfor %}</ul>
{% endfor %}

Pages that newer pages replaced are in the [archive]({{ '/archive/' | relative_url }}).
