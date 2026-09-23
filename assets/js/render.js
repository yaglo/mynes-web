/* Renders at one source pixel per device pixel.
 *
 * Crops (_includes/crop.html and compare.html) are <img class="render">
 * with a 1x candidate (the @1x file, a 2x2 average of the crop) and a 2x
 * candidate (the crop), width and height at half the crop's pixel size, and
 * the crop's size in data-w and data-h. At device pixel ratios 1 and 2 the
 * browser's choice is already 1:1. At other ratios (phones at 3, laptops at
 * 1.25 or 1.5, browser zoom) this script sets the CSS size to the chosen
 * file's pixel size divided by devicePixelRatio, and again whenever the ratio
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
 * .render-scale ("shown 1:1" or "2×2 average, shown 1:1"), .render-range
 * ("SDR PNG" or "HDR PQ AVIF") and, for clips, .render-file (codec, size and
 * range of the source that plays).
 *
 * The pan viewer (viewer.js) sizes its own media. The pure helpers in
 * `Render` have no DOM dependency and are exported for tools/test_media.js.
 */
(function (global) {
  'use strict';

  var Render = {};

  function clean(url) { return String(url || '').split(/[?#]/)[0]; }

  /** 2 when a file is the @1x variant of a crop (half its size), else 1. */
  Render.fileScale = function (url) { return /@1x\.[a-z0-9]+$/i.test(clean(url)) ? 2 : 1; };

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

  /** Pixel size of the file an img.render shows, from its data-w/data-h (the 2x file) and currentSrc. */
  Render.chosenSize = function (dataW, dataH, url) {
    var k = Render.fileScale(url);
    return { width: dataW / k, height: dataH / k };
  };

  Render.scaleText = function (url) {
    return Render.fileScale(url) === 2 ? '2×2 average, shown 1:1' : 'shown 1:1';
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

  /** CSS px to add before a box at CSS position pos so that it starts on a
   *  whole device pixel: less than one device pixel, rounded up to the 1/64
   *  CSS px steps of layout, so the box lands on the pixel or just past it. */
  Render.gridNudge = function (pos, dpr) {
    var r = dpr > 0 ? dpr : 1, d = pos * r, f = d - Math.floor(d + 1e-4);
    return f < 1e-4 ? 0 : Math.ceil((1 - f) / r * 64 - 1e-6) / 64;
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
    var size = Render.chosenSize(w, h, url);
    setSize(img, Render.cssSize(size.width, size.height, dpr()));
    var fig = img.closest('figure');
    setText(fig, '.render-scale', Render.scaleText(url));
    setText(fig, '.render-range', Render.rangeText(url));
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
    aligning = false;
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
