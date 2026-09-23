---
layout: page
title: Blog
permalink: /blog/
section: blog
description: Posts about MyNES by year, among them the series on the CPU timing DSL, DMA timing, the composite signal, the GPU pipeline, comb filters, the beam, the presets and the 2 composite pipelines.
---
{%- assign series_posts = site.posts | where_exp: "p", "p.series" -%}

The blog lists posts by year and date, among them the {{ series_posts.size }} parts of the series <cite>{{ series_posts.first.series_title }}</cite>.

Some posts describe code of an earlier prototype. The [GPU pipeline reference]({{ site.project.blob }}/docs/gpu-pipeline-reference.md) in the code repository describes the current implementation. The [Atom feed]({{ '/feed.xml' | relative_url }}) lists new posts.

{% assign years = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in years %}
<h2 id="posts-{{ year.name }}">{{ year.name }}</h2>
{% assign posts = year.items | sort: "date" %}
<ul class="post-list">
{% for post in posts %}<li><time datetime="{{ post.date | date: '%Y-%m-%d' }}">{{ post.date | date: "%Y-%m-%d" }}</time> <a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
{% endfor %}</ul>
{% endfor %}

Pages that newer pages replaced are in the [Archive]({{ '/archive/' | relative_url }}).
