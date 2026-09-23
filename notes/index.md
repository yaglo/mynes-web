---
layout: page
title: Technical notes
permalink: "/notes/"
section: "notes"
description: Hardware evidence, model boundaries and measurements behind the MyNES CRT presets, and the HDR output of the renderer.
redirect_from:
  - "/research/"
---

The technical notes record which parts of the MyNES model rest on published specifications, service manuals and measurement reports, and which parts are estimates. Each note that moved from the code repository names its source file and commit in the footer.

The GPU renderer has 14 video stages. The line below gives their names and order from the stage table in [`frontends/gpu/chain_vis.c` at eb36437]({{ site.project.code_repo }}/blob/eb36437/frontends/gpu/chain_vis.c#L179-L194):

<pre class="pipeline">2C02 DAC → Console Out → Cable → RF Mod/Demod → TV Input → Comb Filter → Chroma Demod → Luma Process → Matrix Decode → Video Amp → Beam → Phosphor → CRT Glass → Environment</pre>

{% assign notes = site.pages | where: "section", "notes" | where_exp: "p", "p.nav_order" | sort: "nav_order" %}
<ul class="notes-list">
{% for note in notes %}<li><a href="{{ note.url | relative_url }}">{{ note.title }}</a>: {{ note.description }}</li>
{% endfor %}</ul>

The [GPU pipeline reference]({{ site.project.blob }}/docs/gpu-pipeline-reference.md), the [benchmark results]({{ site.project.blob }}/docs/gpu-benchmark-results.md) and the [presentation validation]({{ site.project.blob }}/docs/architecture/gpu-realism-validation.md) stay in the code repository.
