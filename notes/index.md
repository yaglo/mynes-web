---
layout: page
title: Technical notes
permalink: "/notes/"
section: "notes"
description: Hardware evidence, model boundaries and measurements behind the MyNES CRT presets.
redirect_from:
  - "/research/"
---

These pages record what published specifications, service manuals and measurement reports support in the model, and what remains an estimate. They are working documents from the code repository and keep the same caveats.

<!-- TODO(copy): the processing pipeline as one line copied from the renderer source goes here, before the list. -->
{% assign notes = site.pages | where: "section", "notes" | where_exp: "p", "p.nav_order" | sort: "nav_order" %}
<ul class="notes-list">
{% for note in notes %}<li><a href="{{ note.url | relative_url }}">{{ note.title }}</a>: {{ note.description }}</li>
{% endfor %}</ul>

The [GPU pipeline reference]({{ site.project.blob }}/docs/gpu-pipeline-reference.md), [benchmark results]({{ site.project.blob }}/docs/gpu-benchmark-results.md) and [presentation validation]({{ site.project.blob }}/docs/architecture/gpu-realism-validation.md) stay in the code repository.
