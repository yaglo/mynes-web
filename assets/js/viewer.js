/* Pan viewer: a full frame (3840x2880) at one source pixel per device pixel.
 *
 * Markup (_includes/pan.html): a scroll box .pan holding one img or video
 * .pan-media whose pixel size is in data-w and data-h, the start position in
 * source pixels in data-x and data-y, and a .pan-bar with zoom buttons and a
 * small overview map. Without JavaScript the box is a native scroll box and
 * CSS sizes the media for the common pixel ratios (1, 1.25, 1.5, 2, 3).
 *
 * The script sizes the media to data-w x data-h device pixels (times the
 * zoom), pans on pointer drag and on the arrow, Page, Home and End keys, and
 * rounds every scroll position to a whole number of device pixels that is
 * also a whole number of CSS pixels, so the media stays on the device pixel
 * grid whether or not the browser keeps fractional scroll offsets. Zoom
 * steps are 1:1, 2:1 and 4:1 (integer replication, image-rendering:
 * pixelated). The map outlines the visible part of the frame; it holds no
 * copy of the image. Links marked data-pan-src (other presets of the same
 * frame) swap the media in place and keep the position.
 *
 * No canvas: the media is shown by the browser as it is. The pure helpers
 * in `PanView` are exported for tools/test_media.js.
 */
(function (global) {
  'use strict';

  var PanView = {};
  PanView.ZOOMS = [1, 2, 4];

  /** Smallest CSS length (1 to 8 px) that is a whole number of device pixels. */
  PanView.snapStep = function (dpr) {
    var r = dpr > 0 ? dpr : 1;
    for (var n = 1; n <= 8; n++) {
      var d = n * r;
      if (Math.abs(d - Math.round(d)) < 1e-6) return n;
    }
    return 1;
  };

  /** Largest scroll offset, rounded down to the step. */
  PanView.maxScroll = function (content, view, step) {
    return Math.max(0, Math.floor((content - view) / step + 1e-9) * step);
  };

  /** A scroll offset clamped to the content and rounded to the step. */
  PanView.snap = function (value, content, view, step) {
    var max = PanView.maxScroll(content, view, step);
    var v = Math.round(value / step) * step;
    return Math.max(0, Math.min(max, v));
  };

  /** CSS length of px device pixels, rounded up to the 1/64 CSS px steps of layout
   *  (see Render.cssLength in render.js). */
  PanView.cssLength = function (px, dpr) {
    var r = dpr > 0 ? dpr : 1;
    return Math.ceil(px / r * 64 - 1e-6) / 64;
  };

  /** CSS size of the media: srcW x srcH device pixels, each source pixel zoom x zoom. */
  PanView.mediaSize = function (srcW, srcH, dpr, zoom) {
    var z = zoom || 1;
    return { width: PanView.cssLength(srcW * z, dpr), height: PanView.cssLength(srcH * z, dpr) };
  };

  /** Scroll offsets that put source pixel (px, py) at the centre of the view. */
  PanView.centerOn = function (px, py, srcW, srcH, media, view, step) {
    return {
      left: PanView.snap(px * media.width / srcW - view.width / 2, media.width, view.width, step),
      top: PanView.snap(py * media.height / srcH - view.height / 2, media.height, view.height, step)
    };
  };

  /** The source pixel at the centre of the view. */
  PanView.centerOf = function (scroll, srcW, srcH, media, view) {
    return {
      x: (scroll.left + Math.min(view.width, media.width) / 2) * srcW / media.width,
      y: (scroll.top + Math.min(view.height, media.height) / 2) * srcH / media.height
    };
  };

  /** The visible part of the frame as a rectangle on a map of mapW x mapH. */
  PanView.mapRect = function (scroll, view, media, mapW, mapH) {
    var sx = mapW / media.width, sy = mapH / media.height;
    var w = Math.min(view.width, media.width) * sx, h = Math.min(view.height, media.height) * sy;
    return {
      left: Math.max(0, Math.min(mapW - w, scroll.left * sx)),
      top: Math.max(0, Math.min(mapH - h, scroll.top * sy)),
      width: w, height: h
    };
  };

  /** Scroll offsets for a point (mx, my) on the map: that point goes to the centre. */
  PanView.fromMap = function (mx, my, mapW, mapH, srcW, srcH, media, view, step) {
    return PanView.centerOn(mx / mapW * srcW, my / mapH * srcH, srcW, srcH, media, view, step);
  };

  /** Scroll change for a key, or null for keys the viewer leaves alone. */
  PanView.keyMove = function (key, shift, scroll, view, media) {
    var sx = Math.max(8, Math.round(view.width * (shift ? 0.5 : 0.1)));
    var sy = Math.max(8, Math.round(view.height * (shift ? 0.5 : 0.1)));
    switch (key) {
      case 'ArrowLeft': return { left: scroll.left - sx, top: scroll.top };
      case 'ArrowRight': return { left: scroll.left + sx, top: scroll.top };
      case 'ArrowUp': return { left: scroll.left, top: scroll.top - sy };
      case 'ArrowDown': return { left: scroll.left, top: scroll.top + sy };
      case 'PageUp': return { left: scroll.left, top: scroll.top - view.height };
      case 'PageDown': return { left: scroll.left, top: scroll.top + view.height };
      case 'Home': return { left: 0, top: 0 };
      case 'End': return { left: media.width, top: media.height };
      default: return null;
    }
  };

  /** Zoom for a key: 1, 2 or 4 for those digits, the next or previous step for + and -. */
  PanView.keyZoom = function (key, zoom) {
    var i = PanView.ZOOMS.indexOf(zoom);
    if (key === '1' || key === '2' || key === '4') return +key;
    if (key === '+' || key === '=') return PanView.ZOOMS[Math.min(PanView.ZOOMS.length - 1, i + 1)];
    if (key === '-' || key === '_') return PanView.ZOOMS[Math.max(0, i - 1)];
    return null;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = PanView;
  if (typeof document === 'undefined') return;

  /* ---- DOM ---------------------------------------------------------------- */

  function Viewer(figure) {
    this.figure = figure;
    this.box = figure.querySelector('.pan');
    this.media = figure.querySelector('.pan-media');
    this.bar = figure.querySelector('.pan-bar');
    this.map = figure.querySelector('.pan-map');
    this.mapView = figure.querySelector('.pan-map-view');
    this.readout = figure.querySelector('.pan-zoom-now');
    this.srcW = +this.media.getAttribute('data-w');
    this.srcH = +this.media.getAttribute('data-h');
    this.zoom = 1;
    this.started = false;
    this.bind();
  }

  Viewer.prototype.dpr = function () { return global.devicePixelRatio || 1; };
  Viewer.prototype.step = function () { return PanView.snapStep(this.dpr()); };
  Viewer.prototype.mediaCss = function () { return PanView.mediaSize(this.srcW, this.srcH, this.dpr(), this.zoom); };
  Viewer.prototype.view = function () { return { width: this.box.clientWidth, height: this.box.clientHeight }; };
  Viewer.prototype.scroll = function () { return { left: this.box.scrollLeft, top: this.box.scrollTop }; };

  Viewer.prototype.layout = function () {
    var m = this.mediaCss();
    this.media.style.width = m.width + 'px';
    this.media.style.height = m.height + 'px';
    this.media.classList.toggle('is-zoomed', this.zoom > 1);
    // The box is at most 70% of the window tall and never taller than the media.
    var boxH = Math.min(m.height, Math.round(global.innerHeight * 0.7));
    this.box.style.height = boxH + 'px';
    this.box.style.setProperty('--pan-map-ratio', String(this.srcH / this.srcW));
    return m;
  };

  Viewer.prototype.scrollTo = function (pos) {
    var m = this.mediaCss(), v = this.view(), s = this.step();
    this.box.scrollLeft = PanView.snap(pos.left, m.width, v.width, s);
    this.box.scrollTop = PanView.snap(pos.top, m.height, v.height, s);
    // The source pixel at the centre, to keep when the window or the pixel ratio changes.
    this.center = PanView.centerOf(this.scroll(), this.srcW, this.srcH, m, v);
    this.drawMap();
  };

  Viewer.prototype.drawMap = function () {
    if (!this.map || !this.mapView) return;
    var r = PanView.mapRect(this.scroll(), this.view(), this.mediaCss(), this.map.clientWidth, this.map.clientHeight);
    this.mapView.style.left = r.left + 'px';
    this.mapView.style.top = r.top + 'px';
    this.mapView.style.width = r.width + 'px';
    this.mapView.style.height = r.height + 'px';
  };

  Viewer.prototype.setZoom = function (zoom) {
    if (PanView.ZOOMS.indexOf(zoom) < 0 || zoom === this.zoom) return;
    var c = PanView.centerOf(this.scroll(), this.srcW, this.srcH, this.mediaCss(), this.view());
    this.zoom = zoom;
    var m = this.layout();
    this.scrollTo(PanView.centerOn(c.x, c.y, this.srcW, this.srcH, m, this.view(), this.step()));
    var buttons = this.figure.querySelectorAll('[data-pan-zoom]');
    Array.prototype.forEach.call(buttons, function (b) {
      b.setAttribute('aria-pressed', String(+b.getAttribute('data-pan-zoom') === zoom));
    });
    if (this.readout) this.readout.textContent = zoom + ':1';
  };

  Viewer.prototype.start = function () {
    var m = this.layout();
    var c = this.center;
    if (!this.started) {
      var x = +this.box.getAttribute('data-x'), y = +this.box.getAttribute('data-y');
      c = { x: isFinite(x) ? x : this.srcW / 2, y: isFinite(y) ? y : this.srcH / 2 };
      this.started = true;
    }
    this.scrollTo(PanView.centerOn(c.x, c.y, this.srcW, this.srcH, m, this.view(), this.step()));
  };

  Viewer.prototype.swap = function (link) {
    var src = link.getAttribute('data-pan-src');
    if (!src) return;
    var pos = this.scroll();
    var picture = this.media.parentNode && this.media.parentNode.tagName === 'PICTURE' ? this.media.parentNode : null;
    var hdr = link.getAttribute('data-pan-hdr');
    if (picture) {
      var source = picture.querySelector('source');
      if (source && hdr) source.setAttribute('srcset', hdr);
      else if (source) source.parentNode.removeChild(source);
      else if (hdr) {
        source = document.createElement('source');
        source.setAttribute('media', '(dynamic-range: high)');
        source.setAttribute('type', 'image/avif');
        source.setAttribute('srcset', hdr);
        picture.insertBefore(source, this.media);
      }
    }
    this.media.setAttribute('src', src);
    if (link.getAttribute('data-pan-alt')) this.media.setAttribute('alt', link.getAttribute('data-pan-alt'));
    var caption = this.figure.querySelector('.pan-caption');
    if (caption && link.getAttribute('data-pan-caption')) caption.textContent = link.getAttribute('data-pan-caption');
    var file = this.figure.querySelector('.pan-file');
    if (file) file.setAttribute('href', link.getAttribute('href'));
    Array.prototype.forEach.call(this.figure.querySelectorAll('[data-pan-src]'), function (a) {
      if (a === link) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    var self = this;
    var keep = function () { self.scrollTo(pos); };  // same frame size: the same offsets
    this.media.addEventListener('load', keep, { once: true });
    keep();
  };

  Viewer.prototype.bind = function () {
    var self = this, box = this.box;
    if (this.bar) this.bar.hidden = false;
    this.figure.classList.add('is-live');

    var drag = null;
    box.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.button !== 0) return;  // touch scrolls natively
      drag = { x: e.clientX, y: e.clientY, left: box.scrollLeft, top: box.scrollTop, id: e.pointerId };
      box.setPointerCapture(e.pointerId);
      box.classList.add('is-dragging');
      box.focus({ preventScroll: true });  // preventDefault below also cancels the focus change, and the keys need it
      e.preventDefault();
    });
    box.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      self.scrollTo({ left: drag.left - (e.clientX - drag.x), top: drag.top - (e.clientY - drag.y) });
    });
    var end = function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      box.classList.remove('is-dragging');
    };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    this.media.addEventListener('dragstart', function (e) { e.preventDefault(); });

    box.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var z = PanView.keyZoom(e.key, self.zoom);
      if (z) { e.preventDefault(); self.setZoom(z); return; }
      var to = PanView.keyMove(e.key, e.shiftKey, self.scroll(), self.view(), self.mediaCss());
      if (to) { e.preventDefault(); self.scrollTo(to); }
    });

    // Wheel and touch scrolling are native; round the position once they stop.
    var timer = 0;
    box.addEventListener('scroll', function () {
      self.drawMap();
      if (drag) return;
      clearTimeout(timer);
      timer = setTimeout(function () { self.scrollTo(self.scroll()); }, 120);
    }, { passive: true });

    Array.prototype.forEach.call(this.figure.querySelectorAll('[data-pan-zoom]'), function (b) {
      b.addEventListener('click', function () { self.setZoom(+b.getAttribute('data-pan-zoom')); });
    });
    Array.prototype.forEach.call(this.figure.querySelectorAll('a[data-pan-src]'), function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        self.swap(a);
      });
    });

    if (this.map) {
      var mapDrag = false;
      var toMap = function (e) {
        var r = self.map.getBoundingClientRect();
        self.scrollTo(PanView.fromMap(e.clientX - r.left, e.clientY - r.top, r.width, r.height,
          self.srcW, self.srcH, self.mediaCss(), self.view(), self.step()));
      };
      this.map.addEventListener('pointerdown', function (e) {
        mapDrag = true;
        self.map.setPointerCapture(e.pointerId);
        toMap(e);
        e.preventDefault();
      });
      this.map.addEventListener('pointermove', function (e) { if (mapDrag) toMap(e); });
      this.map.addEventListener('pointerup', function () { mapDrag = false; });
      this.map.addEventListener('pointercancel', function () { mapDrag = false; });
    }

    var play = this.figure.querySelector('.pan-play');
    if (play && this.media.tagName === 'VIDEO') {
      play.hidden = false;
      play.addEventListener('click', function () {
        if (self.media.paused) self.media.play(); else self.media.pause();
      });
      this.media.addEventListener('play', function () { play.setAttribute('aria-pressed', 'true'); play.textContent = 'Pause'; });
      this.media.addEventListener('pause', function () { play.setAttribute('aria-pressed', 'false'); play.textContent = 'Play'; });
    }

    global.addEventListener('resize', function () { self.start(); });
    this.watchRatio();
    this.start();
  };

  Viewer.prototype.watchRatio = function () {
    if (!global.matchMedia) return;
    var self = this;
    var mq = global.matchMedia('(resolution: ' + this.dpr() + 'dppx)');
    var again = function () { self.start(); self.watchRatio(); };
    if (mq.addEventListener) mq.addEventListener('change', again, { once: true });
  };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('figure.pan-figure'), function (f) {
      if (f.querySelector('.pan') && f.querySelector('.pan-media')) f.panViewer = new Viewer(f);
    });
  }

  global.PanView = PanView;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : this);
