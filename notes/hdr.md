---
layout: page
title: HDR output
permalink: /notes/hdr/
section: notes
nav_order: 6
nav_title: HDR output
description: How MyNES renders HDR highlights, how the site offers HDR files, and how to check a display.
---

<!-- TODO(copy): the whole note. The sections below are its structure, in order; each TODO says what goes there. -->
<p class="hdr-detect" data-yes="This display reports HDR: the site offers it the HDR files." data-no="This display does not report HDR: the site offers it the SDR files.">The HDR check needs JavaScript.</p>
<script>
(function () {
  var p = document.querySelector('.hdr-detect');
  if (!p || !window.matchMedia) return;
  var mq = window.matchMedia('(dynamic-range: high)');
  var show = function () { p.textContent = p.getAttribute(mq.matches ? 'data-yes' : 'data-no'); };
  show();
  if (mq.addEventListener) mq.addEventListener('change', show);
})();
</script>

## SDR control image

<!-- TODO(copy): an SDR render first, with the sentence "This image should look dimmer than the HDR images below it." (crop include with an SDR-only render), then the HDR renders. -->

## Test conditions

<!-- TODO(copy): browsers, OS versions and displays tested, with the test date; one self-check sentence. -->

## Display settings

<!-- TODO(copy): the display settings to turn off (dynamic contrast, active tone mapping). -->

## Reference white and peak luminance

<!-- TODO(copy): the SDR reference white and the peak luminance in nits of the site's HDR files, from the hero manifest's hdr data. -->

## HDR output of the beam simulation

<!-- TODO(copy): the MyNES position on HDR output for the beam simulation, stated once. -->

## SDR screens and screenshots

<!-- TODO(copy): the one sentence, for the whole site, that SDR screens and SDR screenshots cannot show the highlights. -->
