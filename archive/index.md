---
layout: page
title: Archive
permalink: /archive/
section: archive
description: Gallery pages and reviews of MyNES that newer pages replaced, with the date each was archived.
---

<p>This page lists the gallery pages and reviews that newer pages replaced, by year, with the date each was archived and its replacement. Archived pages keep their images as first published, including reduced previews and images scaled to the column.</p>

{% assign archived = site.pages | where_exp: "p", "p.archived" | sort: "title" | sort: "archived" | reverse %}
{% assign years = archived | group_by_exp: "p", "p.archived | date: '%Y'" %}
{% for year in years %}
<h2 id="archived-{{ year.name }}">{{ year.name }}</h2>
<ul class="archive-list">
{% for p in year.items %}{% assign replacement = site.pages | where: "url", p.replaced_by | where_exp: "r", "r.layout != 'redirect'" | first %}<li><time datetime="{{ p.archived | date: '%Y-%m-%d' }}">{{ p.archived | date: "%Y-%m-%d" }}</time> <a href="{{ p.url | relative_url }}">{{ p.title }}</a>{% if replacement %}, replaced by <a href="{{ replacement.url | relative_url }}">{{ replacement.title }}</a>{% endif %}</li>
{% endfor %}</ul>
{% endfor %}
