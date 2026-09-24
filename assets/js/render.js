/* Renders at one source pixel per device pixel.
 *
 * Crops (_includes/crop.html and compare.html) are <img class="render">
 * with one file, the crop, width and height at half its pixel size, and its
 * size in data-w and data-h. At device pixel ratios 1 and 2 the markup and
 * style.css already show it 1:1. At other ratios (phones at 3, laptops at
 * 1.25 or 1.5, browser zoom) this script sets the CSS size to the file's
 * pixel size divided by devicePixelRatio, and again whenever the ratio
 * changes, and moves each render onto whole device pixels. It only sets
 * sizes and offsets; nothing is redrawn. Renders are drawn nearest-neighbor
 * (style.css), so the 1/64 CSS px that layout rounding can add moves no
 * pixel.
 *
 * Clips (_includes/clip.html) are <video class="render"> whose <source>
 * elements carry their pixel size in data-w and data-h. The script finds the
 * source the browser plays (or will play: media query and type, in order,
 * so the size is right before a preload="none" clip loads), sizes the video
 * the same way, and keeps the poster only when it has that source's pixel
 * size (data-posters lists them as srcset-style "url 960w").
 *
 * Captions carry the fields that depend on the file the browser chose:
 * .render-range ("SDR PNG" or "HDR PQ AVIF") and, for clips, .render-file
 * (codec, size and range of the source that plays).
 *
 * The pan viewer (viewer.js) sizes its own media. The pure helpers in
 * `Render` have no DOM dependency and are exported for tools/test_media.js.
 */
(function (global) {
  'use strict';

  var Render = {};

  function clean(url) { return String(url || '').split(/[?#]/)[0]; }

  /** A CSS length of px device pixels. Browsers lay out in 1/64 CSS px, and
   *  px / dpr often falls between two such steps (1280 / 3 = 426.67); the
   *  length is rounded up to the next step, so the image is at most 1/64 CSS
   *  px larger and, sampled nearest-neighbor, keeps every pixel. Rounding
   *  down would drop a row or column. */
  Render.cssLength = function (px, dpr) {
    var r = dpr > 0 ? dpr : 1;
    return Math.ceil(px / r * 64 - 1e-6) / 64;
  };

  /** CSS size that shows a w x h pixel file at one pixel per device pixel. */
  Render.cssSize = function (w, h, dpr) {
    return { width: Render.cssLength(w, dpr), height: Render.cssLength(h, dpr) };
  };

  Render.rangeText = function (url) {
    var u = clean(url).toLowerCase();
    if (/\.avif$/.test(u)) return 'HDR PQ AVIF';
    if (/\.png$/.test(u)) return 'SDR PNG';
    return null;
  };

  /** Codec name for a MIME type with a codecs parameter. */
  Render.codecName = function (type) {
    var m = /codecs\s*=\s*"?([a-z0-9]+)/i.exec(String(type || ''));
    var c = m ? m[1].toLowerCase() : '';
    if (c === 'hvc1' || c === 'hev1') return 'HEVC';
    if (c === 'av01') return 'AV1';
    if (c === 'avc1' || c === 'avc3') return 'H.264';
    if (c === 'vp09' || c === 'vp9') return 'VP9';
    return /mp4/i.test(String(type || '')) ? 'H.264' : null;
  };

  /** The text of a clip's .render-file field. */
  Render.fileText = function (source) {
    var parts = [];
    var codec = Render.codecName(source.type);
    if (codec) parts.push(codec);
    if (source.width && source.height) parts.push(source.width + '×' + source.height);
    parts.push(source.hdr ? 'HDR10' : 'SDR');
    return parts.join(', ');
  };

  /** [{url, width}] from "url 960w, url 1920w". */
  Render.parsePosters = function (value) {
    return String(value || '').split(',').map(function (part) {
      var bits = part.trim().split(/\s+/);
      var w = bits[1] ? parseInt(bits[1], 10) : NaN;
      return bits[0] ? { url: bits[0], width: isFinite(w) ? w : null } : null;
    }).filter(Boolean);
  };

  /** The poster with exactly the given pixel width, or null. */
  Render.choosePoster = function (posters, width) {
    for (var i = 0; i < posters.length; i++) if (posters[i].width === width) return posters[i];
    return null;
  };

  /** Index of the source a browser plays: the first whose media query matches
   *  and whose type it can play; -1 when none. matches(media) and canPlay(type)
   *  are supplied by the caller. */
  Render.pickSource = function (sources, matches, canPlay) {
    for (var i = 0; i < sources.length; i++) {
      var s = sources[i];
      if (s.media && !matches(s.media)) continue;
      if (s.type && !canPlay(s.type)) continue;
      return i;
    }
    return -1;
  };

  /** CSS px to add before a box at CSS position pos so that it starts exactly
   *  on a whole device pixel. Layout positions are whole 1/64 CSS px steps
   *  (WebKit, Chrome) or 1/60 steps (Firefox), and at a ratio such as 1.5 or
   *  1.25 most device pixels fall between those steps. A box that lands just
   *  past a device pixel is painted with its first row or column cut or
   *  doubled, and at 1.5 Chrome samples the whole image half a pixel off. So
   *  the box moves to the next position that is both a 1/4 CSS px step
   *  (exact in both kinds of layout unit) and a whole device pixel: every
   *  2 CSS px at 1.5, every 4 at 1.25, every 0.5 at 2. When no such position is within 10 CSS px (unusual zoom
   *  factors), it lands on the next 1/64 step at or just past a device pixel. */
  Render.gridNudge = function (pos, dpr) {
    var r = dpr > 0 ? dpr : 1, p = Math.round(pos * 64);
    for (var k = 0; k <= 640; k++) {
      var q = p + k, d = q * r / 64;
      if (q % 16 === 0 && Math.abs(d - Math.round(d)) < 1e-6) return k / 64;
    }
    var dd = pos * r, f = dd - Math.floor(dd + 1e-4);
    return f < 1e-4 ? 0 : Math.ceil((1 - f) / r * 64 - 1e-6) / 64;
  };

  /** CSS px to add below a page of layout height `height` in a viewport of
   *  `view` CSS px, so that the largest scroll offset is a whole number of
   *  device pixels. Browsers clamp that offset to the page height (rounded to
   *  a whole CSS px) minus the viewport height; at ratio 1.5 an odd number of
   *  CSS px ends half a device pixel off, and every render in view at the end
   *  of the page is then painted between device pixels. 0 when no page height
   *  within 24 CSS px works (unusual zoom factors) or the page does not scroll. */
  Render.endPad = function (height, view, dpr) {
    var r = dpr > 0 ? dpr : 1, n = Math.ceil(height - 1e-6);
    if (n <= view) return 0;
    for (var k = 0; k < 24; k++, n++) {
      var m = (n - view) * r;
      if (Math.abs(m - Math.round(m)) < 1e-6) return Math.max(0, n - height);
    }
    return 0;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Render;
  if (typeof document === 'undefined') return;

  /* ---- DOM ---------------------------------------------------------------- */

  function dpr() { return global.devicePixelRatio || 1; }

  function setText(root, selector, text) {
    if (!root || text == null) return;
    var n = root.querySelector(selector);
    if (n && n.textContent !== text) n.textContent = text;
  }

  function setSize(el, css) {
    el.style.width = css.width + 'px';
    el.style.height = css.height + 'px';
  }

  function fitImage(img) {
    var w = +img.getAttribute('data-w'), h = +img.getAttribute('data-h');
    var url = img.currentSrc || img.src;
    if (!(w > 0 && h > 0) || !url) return;
    setSize(img, Render.cssSize(w, h, dpr()));
    setText(img.closest('figure'), '.render-range', Render.rangeText(url));
    img.dispatchEvent(new CustomEvent('render:fit', { bubbles: true }));
  }

  function videoSources(video) {
    return Array.prototype.map.call(video.querySelectorAll('source'), function (s) {
      return {
        el: s, src: s.src, media: s.getAttribute('media'), type: s.getAttribute('type'),
        width: +s.getAttribute('data-w') || null, height: +s.getAttribute('data-h') || null,
        hdr: s.getAttribute('data-hdr') === 'true'
      };
    });
  }

  function fitVideo(video) {
    var sources = videoSources(video);
    var chosen = null;
    if (video.currentSrc) {
      chosen = sources.filter(function (s) { return s.src === video.currentSrc; })[0] || null;
    }
    if (!chosen) {
      var i = Render.pickSource(sources, function (m) { return global.matchMedia(m).matches; },
        function (t) { return video.canPlayType(t) !== ''; });
      chosen = i >= 0 ? sources[i] : null;
    }
    var w = video.videoWidth || (chosen && chosen.width) || +video.getAttribute('data-w');
    var h = video.videoHeight || (chosen && chosen.height) || +video.getAttribute('data-h');
    if (!(w > 0 && h > 0)) return;
    setSize(video, Render.cssSize(w, h, dpr()));
    var posters = Render.parsePosters(video.getAttribute('data-posters'));
    if (posters.length) {
      var p = Render.choosePoster(posters, w);
      if (p) { if (video.getAttribute('poster') !== p.url) video.setAttribute('poster', p.url); }
      else video.removeAttribute('poster');
    }
    if (chosen) setText(video.closest('figure'), '.render-file', Render.fileText({
      type: chosen.type, width: w, height: h, hdr: chosen.hdr }));
  }

  function fitAll() {
    Array.prototype.forEach.call(document.querySelectorAll('img.render:not(.pan-media)'), fitImage);
    Array.prototype.forEach.call(document.querySelectorAll('video.render:not(.pan-media)'), fitVideo);
    alignAll();
  }

  /* Text above a render can leave it at a fraction of a device pixel (line
     heights and margins in rem), and the browser would then spread each file
     pixel over two device pixels. Each render box (.render-scroll, .pan) is
     moved by relative positioning, less than one device pixel down and to the
     right, onto the grid. Relative offsets leave the layout of everything
     else alone, so the boxes can be aligned in any order. */
  var aligning = false;
  function alignAll() {
    if (aligning) return;
    aligning = true;
    var boxes = document.querySelectorAll('.render-scroll, .pan');
    Array.prototype.forEach.call(boxes, function (b) { b.style.top = ''; b.style.left = ''; });
    Array.prototype.forEach.call(boxes, function (b) {
      var r = b.getBoundingClientRect(), d = dpr();
      var dy = Render.gridNudge(r.top + global.scrollY, d), dx = Render.gridNudge(r.left + global.scrollX, d);
      b.style.top = dy ? dy + 'px' : '';
      b.style.left = dx ? dx + 'px' : '';
    });
    padEnd();
    aligning = false;
  }

  /* The last scroll offset of the page must land on a whole device pixel too
     (Render.endPad); a few CSS px of padding under the footer do that. */
  function padEnd() {
    var root = document.documentElement;
    if (!document.querySelector('.render-scroll, .pan')) return;
    root.style.paddingBottom = '';
    var pad = Render.endPad(root.getBoundingClientRect().height, root.clientHeight, dpr());
    if (pad) root.style.paddingBottom = pad + 'px';
  }
  var alignTimer = 0;
  function alignSoon() { clearTimeout(alignTimer); alignTimer = setTimeout(alignAll, 50); }

  function watchRatio() {
    if (!global.matchMedia) return;
    var mq = global.matchMedia('(resolution: ' + dpr() + 'dppx)');
    var again = function () { fitAll(); watchRatio(); };
    if (mq.addEventListener) mq.addEventListener('change', again, { once: true });
    else if (mq.addListener) mq.addListener(function h() { mq.removeListener(h); again(); });
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('img.render:not(.pan-media)'), function (img) {
      img.addEventListener('load', function () { fitImage(img); alignSoon(); });
      if (img.complete) fitImage(img);
    });
    Array.prototype.forEach.call(document.querySelectorAll('video.render:not(.pan-media)'), function (v) {
      v.addEventListener('loadedmetadata', function () { fitVideo(v); alignSoon(); });
      fitVideo(v);
    });
    alignAll();
    global.addEventListener('resize', alignSoon);
    global.addEventListener('load', alignAll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignAll);
    if (global.ResizeObserver) new ResizeObserver(alignSoon).observe(document.body);
    watchRatio();
  }

  global.Render = Render;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : this);
