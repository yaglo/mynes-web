---
layout: page
title: Research
permalink: /research/
section: research
description: Hardware evidence, model boundaries and measurements behind the MyNES CRT presets.
---

These pages record what published specifications, service manuals and measurement reports support in the model, and what remains an estimate. They are working documents from the code repository and keep the same caveats.

<ul class="cards">
<li><a class="card-title" href="{{ '/research/hardware/' | relative_url }}">Hardware research and model decisions</a><p>Monitor identities, receiver filter validation, a stage-by-stage audit of the whole path and the evidence for each decision.</p></li>
<li><a class="card-title" href="{{ '/research/pvm-14l2/' | relative_url }}">Sony PVM-14L2</a><p>Signal routing and the aperture network recovered from the service manual, and what the nominal profile does with them.</p></li>
<li><a class="card-title" href="{{ '/research/fw900/' | relative_url }}">Sony GDM-FW900</a><p>An empirical 1920×1200 monitor model fitted to the NIDL evaluation report.</p></li>
<li><a class="card-title" href="{{ '/research/measurements/' | relative_url }}">Published CRT measurements</a><p>The Hitachi 751 veiling-glare fit and the FW900 spatial and tonal target.</p></li>
<li><a class="card-title" href="{{ '/research/sharpening/' | relative_url }}">Receiver sharpening audit</a><p>Implemented receiver stages, per-model evidence, all 23 looks and the open worklist.</p></li>
</ul>

The [GPU pipeline reference]({{ site.project.blob }}/docs/gpu-pipeline-reference.md), [benchmark results]({{ site.project.blob }}/docs/gpu-benchmark-results.md) and [presentation validation]({{ site.project.blob }}/docs/architecture/gpu-realism-validation.md) stay in the code repository.
