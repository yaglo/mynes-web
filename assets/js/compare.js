/* Comparison slider: two renders of the same crop, one over the other.
 *
 * Markup (_includes/compare.html): .compare holds two .compare-layer
 * elements, each with one img.render of the same pixel size, and a
 * .compare-divider. Without JavaScript the layers are two figures one after
 * the other, each with its label. With it, .compare becomes a one-cell grid:
 * the lower layer shows the right render whole, and the upper layer, a
 * wrapper with overflow: hidden, shows the left render up to --split. No
 * canvas, clip-path, filter, blend mode or opacity touches the renders.
 *
 * --split is always a whole number of device pixels: the range input counts
 * pixels of the crop, which are device pixels on screen, and the CSS length
 * is that count divided by devicePixelRatio. The range works with the arrow keys (1 device pixel,
 * 10 with Shift), Page Up and Page Down (a tenth of the width), Home and End.
 * Dragging on the picture with a mouse or pen moves the divider; "Hold to
 * compare" shows the left render over the whole area while it is held
 * (pointer, Space or Enter). On touch screens a tap moves the divider, and a
 * swipe pans: the page vertically, and the render box sideways when the crop
 * is wider than the window (.is-pannable). Only when the box cannot pan does
 * a sideways swipe move the divider.
 *
 * The pure helpers in `Compare` are exported for tools/test_media.js.
 */
(function (global) {
  'use strict';

  var Compare = {};

  Compare.clamp = function (value, max) { return Math.max(0, Math.min(max, Math.round(value))); };

  /** CSS length of the divider position: value device pixels, rounded up to
   *  the 1/64 CSS px steps of layout. */
  Compare.splitCss = function (value, dpr) { return Math.ceil(value / (dpr > 0 ? dpr : 1) * 64 - 1e-6) / 64; };

  /** Divider position for a pointer at clientX over an element whose left edge is at left. */
  Compare.fromPointer = function (clientX, left, dpr, max) {
    return Compare.clamp((clientX - left) * (dpr > 0 ? dpr : 1), max);
  };

  /** The value after a key, or null for keys the range handles itself or ignores. */
  Compare.keyValue = function (key, shift, value, max) {
    var page = Math.max(1, Math.round(max / 10));
    switch (key) {
      case 'ArrowLeft': case 'ArrowDown': return Compare.clamp(value - (shift ? 10 : 1), max);
      case 'ArrowRight': case 'ArrowUp': return Compare.clamp(value + (shift ? 10 : 1), max);
      case 'PageDown': return Compare.clamp(value - page, max);
      case 'PageUp': return Compare.clamp(value + page, max);
      case 'Home': return 0;
      case 'End': return max;
      default: return null;
    }
  };

  /** Keeps the divider at the same fraction when the width changes. */
  Compare.rescale = function (value, oldMax, newMax) {
    return oldMax > 0 ? Compare.clamp(value / oldMax * newMax, newMax) : Compare.clamp(newMax / 2, newMax);
  };

  Compare.valueText = function (value, max, left, right) {
    var pct = max > 0 ? Math.round(value / max * 100) : 0;
    return left + ' on the left ' + pct + '%, ' + right + ' on the right ' + (100 - pct) + '%';
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Compare;
  if (typeof document === 'undefined') return;

  /* ---- DOM ---------------------------------------------------------------- */

  function dpr() { return global.devicePixelRatio || 1; }

  function Slider(figure) {
    this.figure = figure;
    this.box = figure.querySelector('.compare');
    this.over = figure.querySelector('.compare-over');
    this.range = figure.querySelector('.compare-range');
    this.hold = figure.querySelector('.compare-hold');
    this.img = this.over.querySelector('img.render');
    this.left = this.box.getAttribute('data-left') || 'Left';
    this.right = this.box.getAttribute('data-right') || 'Right';
    this.max = 0;
    this.value = 0;
    this.held = false;
    this.bind();
  }

  Slider.prototype.measure = function () {
    var scroller = this.box.closest('.render-scroll');
    this.pannable = !!scroller && scroller.scrollWidth > scroller.clientWidth + 1;
    this.box.classList.toggle('is-pannable', this.pannable);
    var max = Math.round(+this.img.getAttribute('data-w'));
    if (max !== this.max) {
      this.value = Compare.rescale(this.value, this.max, max);
      this.max = max;
      this.range.max = String(max);
    }
    this.set(this.value);
  };

  Slider.prototype.set = function (value) {
    this.value = Compare.clamp(value, this.max);
    this.range.value = String(this.value);
    this.range.setAttribute('aria-valuetext', Compare.valueText(this.value, this.max, this.left, this.right));
    var v = this.held ? this.max : this.value;
    this.box.style.setProperty('--split', Compare.splitCss(v, dpr()) + 'px');
  };

  Slider.prototype.setHeld = function (held) {
    this.held = held;
    this.hold.setAttribute('aria-pressed', String(held));
    this.set(this.value);
  };

  Slider.prototype.bind = function () {
    var self = this;
    this.box.classList.add('is-live');
    this.figure.querySelector('.compare-controls').hidden = false;

    this.range.addEventListener('input', function () { self.set(+self.range.value); });
    this.range.addEventListener('keydown', function (e) {
      if (e.key !== 'PageUp' && e.key !== 'PageDown' && !(e.shiftKey && /^Arrow/.test(e.key))) return;
      var v = Compare.keyValue(e.key, e.shiftKey, self.value, self.max);
      if (v === null) return;
      e.preventDefault();
      self.set(v);
    });

    var dragging = null, lastType = '';
    this.box.addEventListener('pointerdown', function (e) {
      lastType = e.pointerType;
      if (e.button !== 0) return;
      if (e.pointerType === 'touch') {
        // No capture and no preventDefault: the browser pans (touch-action in
        // style.css), and a vertical swipe leaves the divider where it was.
        if (!self.pannable) dragging = e.pointerId;
        return;
      }
      dragging = e.pointerId;
      self.box.setPointerCapture(e.pointerId);
      self.set(Compare.fromPointer(e.clientX, self.box.getBoundingClientRect().left, dpr(), self.max));
      e.preventDefault();
    });
    this.box.addEventListener('pointermove', function (e) {
      if (dragging !== e.pointerId) return;
      self.set(Compare.fromPointer(e.clientX, self.box.getBoundingClientRect().left, dpr(), self.max));
    });
    var stop = function (e) { if (dragging === e.pointerId) dragging = null; };
    this.box.addEventListener('pointerup', stop);
    this.box.addEventListener('pointercancel', stop);
    // The renders link to their PNG files; in the slider a click moves the divider instead.
    this.box.addEventListener('click', function (e) {
      e.preventDefault();
      if (lastType === 'touch') self.set(Compare.fromPointer(e.clientX, self.box.getBoundingClientRect().left, dpr(), self.max));
    });
    Array.prototype.forEach.call(this.box.querySelectorAll('img'), function (img) {
      img.addEventListener('dragstart', function (e) { e.preventDefault(); });
      img.addEventListener('load', function () { self.measure(); });
    });

    var hold = this.hold;
    hold.addEventListener('pointerdown', function (e) { hold.setPointerCapture(e.pointerId); self.setHeld(true); });
    hold.addEventListener('pointerup', function () { self.setHeld(false); });
    hold.addEventListener('pointercancel', function () { self.setHeld(false); });
    hold.addEventListener('keydown', function (e) {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); self.setHeld(true); }
    });
    hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') self.setHeld(false); });
    hold.addEventListener('blur', function () { if (self.held) self.setHeld(false); });
    this.figure.addEventListener('render:fit', function () { self.measure(); });
    global.addEventListener('resize', function () { self.measure(); });   // the box may start or stop overflowing

    this.measure();
    this.watchRatio();
  };

  Slider.prototype.watchRatio = function () {
    if (!global.matchMedia) return;
    var self = this;
    var mq = global.matchMedia('(resolution: ' + dpr() + 'dppx)');
    if (mq.addEventListener) mq.addEventListener('change', function () { self.measure(); self.watchRatio(); }, { once: true });
  };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('figure.compare-figure'), function (f) {
      if (f.querySelector('.compare-over img.render') && f.querySelector('.compare-range')) f.compareSlider = new Slider(f);
    });
  }

  global.Compare = Compare;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : this);
