#!/usr/bin/env node
/* Tests for the pure helpers of assets/js/render.js, viewer.js and
 * compare.js (1:1 sizing, source and poster choice, pan and divider
 * positions on whole device pixels), and static checks of the includes.
 * Run: node tools/test_media.js
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const Render = require(path.join(root, 'assets/js/render.js'));
const PanView = require(path.join(root, 'assets/js/viewer.js'));
const Compare = require(path.join(root, 'assets/js/compare.js'));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let n = 0;
function test(name, fn) {
  try { fn(); n++; } catch (e) { e.message = name + ': ' + e.message; throw e; }
}
const isWhole = (v) => Math.abs(v - Math.round(v)) < 1e-9;
const RATIOS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];

/* ---- render.js ---- */
test('fileScale tells the @1x file from the crop', () => {
  assert.strictEqual(Render.fileScale('/a/crop-1440-1080-960x720@1x.png'), 2);
  assert.strictEqual(Render.fileScale('/a/crop-hdr@1x.avif?v=2'), 2);
  assert.strictEqual(Render.fileScale('/a/crop-1440-1080-960x720.png'), 1);
  assert.strictEqual(Render.fileScale('/a/x@1x.png/other.png'), 1);
  assert.strictEqual(Render.fileScale(''), 1);
});

test('cssSize puts one file pixel on one device pixel', () => {
  assert.deepStrictEqual(Render.cssSize(960, 720, 2), { width: 480, height: 360 });
  assert.deepStrictEqual(Render.cssSize(960, 720, 1), { width: 960, height: 720 });
  assert.deepStrictEqual(Render.cssSize(960, 720, 0), { width: 960, height: 720 });
  for (const r of RATIOS) {
    const c = Render.cssSize(1500, 1124, r);
    assert.ok(c.width * r >= 1500 - 1e-9 && c.width * r - 1500 < r / 64 + 1e-9, 'width at ratio ' + r);
    assert.ok(c.height * r >= 1124 - 1e-9 && c.height * r - 1124 < r / 64 + 1e-9, 'height at ratio ' + r);
  }
});

test('cssLength rounds up to the 1/64 px layout step, never down', () => {
  assert.strictEqual(Render.cssLength(1280, 3), 426.671875);
  assert.strictEqual(Render.cssLength(960, 2), 480);
  assert.strictEqual(Render.cssLength(1124, 1.5), 749.34375);
  for (const r of RATIOS) for (const px of [1, 399, 400, 684, 1024, 1123, 1280, 3840]) {
    const css = Render.cssLength(px, r);
    assert.ok(css * r >= px - 1e-9 && css * r - px < r / 64 + 1e-9, `${px} px at ${r}`);
    assert.ok(Number.isInteger(css * 64), `${px} px at ${r} is not a layout step`);
    assert.strictEqual(PanView.cssLength(px, r), css);
  }
});

test('gridNudge moves a box onto the next whole device pixel', () => {
  assert.strictEqual(Render.gridNudge(10, 2), 0);
  assert.strictEqual(Render.gridNudge(10.25, 2), 0.25);
  assert.strictEqual(Render.gridNudge(8.1, 3), 0.234375);   // (1 - 0.3) / 3 = 0.2333, up to 15/64
  for (const r of RATIOS) for (const pos of [0, 3.3, 17.84, 409.28, 409.296875]) {
    const n = Render.gridNudge(pos, r), end = (pos + n) * r;
    assert.ok(Number.isInteger(n * 64), `${pos} at ${r}: not a layout step`);
    assert.ok(end - Math.round(end) >= -1e-9 && end - Math.round(end) < r / 64 + 1e-9, `${pos} at ${r} lands at ${end}`);
    assert.ok(n * r < 1 + r / 64, 'about one device pixel at most');
  }
});

test('chosenSize halves data-w and data-h for the @1x file', () => {
  assert.deepStrictEqual(Render.chosenSize(960, 720, 'c@1x.png'), { width: 480, height: 360 });
  assert.deepStrictEqual(Render.chosenSize(960, 720, 'c.png'), { width: 960, height: 720 });
  // At ratio 1 the browser picks the @1x file: CSS size = attributes (half the crop).
  const one = Render.chosenSize(960, 720, 'c@1x.png');
  assert.deepStrictEqual(Render.cssSize(one.width, one.height, 1), { width: 480, height: 360 });
  // At ratio 2 the crop itself: the same CSS size.
  const two = Render.chosenSize(960, 720, 'c.png');
  assert.deepStrictEqual(Render.cssSize(two.width, two.height, 2), { width: 480, height: 360 });
});

test('caption fields follow the chosen file', () => {
  assert.strictEqual(Render.scaleText('c.png'), 'shown 1:1');
  assert.strictEqual(Render.scaleText('c@1x.png'), '2×2 average, shown 1:1');
  assert.strictEqual(Render.rangeText('c.png'), 'SDR PNG');
  assert.strictEqual(Render.rangeText('c-hdr@1x.avif'), 'HDR PQ AVIF');
  assert.strictEqual(Render.rangeText('c.webp'), null);
});

test('codecs and the clip file field', () => {
  assert.strictEqual(Render.codecName('video/mp4; codecs="hvc1.2.4.L153.B0"'), 'HEVC');
  assert.strictEqual(Render.codecName('video/mp4; codecs="av01.0.12M.10.0.110.09.16.09.0"'), 'AV1');
  assert.strictEqual(Render.codecName('video/mp4; codecs="avc1.640033"'), 'H.264');
  assert.strictEqual(Render.codecName('video/mp4'), 'H.264');
  assert.strictEqual(Render.codecName('video/webm; codecs="vp09.00.10.08"'), 'VP9');
  assert.strictEqual(Render.fileText({ type: 'video/mp4; codecs="hvc1.2.4.L153.B0"', width: 1920, height: 1440, hdr: true }),
    'HEVC, 1920×1440, HDR10');
  assert.strictEqual(Render.fileText({ type: 'video/mp4', width: 960, height: 720, hdr: false }), 'H.264, 960×720, SDR');
});

test('posters: only one with the source pixel size is kept', () => {
  const posters = Render.parsePosters('/p/960.webp 960w, /p/1920.webp 1920w,  ');
  assert.deepStrictEqual(posters, [{ url: '/p/960.webp', width: 960 }, { url: '/p/1920.webp', width: 1920 }]);
  assert.strictEqual(Render.choosePoster(posters, 1920).url, '/p/1920.webp');
  assert.strictEqual(Render.choosePoster(posters, 960).url, '/p/960.webp');
  assert.strictEqual(Render.choosePoster(posters, 1280), null);
  assert.deepStrictEqual(Render.parsePosters('/p/x.webp'), [{ url: '/p/x.webp', width: null }]);
});

test('pickSource follows media queries, then types, in order', () => {
  const sources = [
    { media: '(dynamic-range: high) and (min-resolution: 2dppx)', type: 'video/mp4; codecs="hvc1"' },
    { media: '(dynamic-range: high)', type: 'video/mp4; codecs="hvc1"' },
    { media: '(min-resolution: 2dppx)', type: 'video/mp4; codecs="avc1"' },
    { media: null, type: 'video/mp4; codecs="avc1"' }
  ];
  const env = (hdr, dppx, hevc) => [
    (m) => m.split(' and ').every((q) => (q === '(dynamic-range: high)' ? hdr : q === '(min-resolution: 2dppx)' ? dppx >= 2 : false)),
    (t) => (/hvc1/.test(t) ? hevc : true)
  ];
  assert.strictEqual(Render.pickSource(sources, ...env(true, 2, true)), 0);
  assert.strictEqual(Render.pickSource(sources, ...env(true, 1, true)), 1);
  assert.strictEqual(Render.pickSource(sources, ...env(true, 2, false)), 2);
  assert.strictEqual(Render.pickSource(sources, ...env(false, 2, true)), 2);
  assert.strictEqual(Render.pickSource(sources, ...env(false, 1, true)), 3);
  assert.strictEqual(Render.pickSource([{ media: '(dynamic-range: high)', type: 'x' }], ...env(false, 1, true)), -1);
});

/* ---- viewer.js ---- */
test('snapStep is a whole number of device and CSS pixels', () => {
  assert.deepStrictEqual([1, 1.25, 1.5, 1.75, 2, 2.5, 3].map(PanView.snapStep), [1, 4, 2, 4, 1, 2, 1]);
  assert.strictEqual(PanView.snapStep(1.1), 1);   // no step up to 8 px: whole CSS pixels
  for (const r of RATIOS) assert.ok(isWhole(PanView.snapStep(r) * r), 'ratio ' + r);
});

test('snap clamps to the content and keeps whole steps', () => {
  assert.strictEqual(PanView.maxScroll(1920, 960, 1), 960);
  assert.strictEqual(PanView.maxScroll(1281, 960, 2), 320);
  assert.strictEqual(PanView.maxScroll(500, 960, 1), 0);
  assert.strictEqual(PanView.snap(-40, 1920, 960, 1), 0);
  assert.strictEqual(PanView.snap(5000, 1920, 960, 1), 960);
  assert.strictEqual(PanView.snap(101, 3072, 900, 4), 100);
  assert.strictEqual(PanView.snap(103, 3072, 900, 4), 104);
  for (const r of RATIOS) {
    const step = PanView.snapStep(r);
    for (const v of [0, 13.3, 250.5, 777, 1e6]) assert.ok(isWhole(PanView.snap(v, 3840 / r, 800, step) * r), `ratio ${r} value ${v}`);
  }
});

test('mediaSize: the frame at its pixel size, zoom replicates whole pixels', () => {
  assert.deepStrictEqual(PanView.mediaSize(3840, 2880, 2, 1), { width: 1920, height: 1440 });
  assert.deepStrictEqual(PanView.mediaSize(3840, 2880, 1, 1), { width: 3840, height: 2880 });
  assert.deepStrictEqual(PanView.mediaSize(3840, 2880, 2, 4), { width: 7680, height: 5760 });
  for (const r of RATIOS) for (const z of PanView.ZOOMS) {
    const m = PanView.mediaSize(3840, 2880, r, z);
    assert.ok(m.width * r >= 3840 * z - 1e-9 && m.width * r - 3840 * z < r / 64 + 1e-9, `ratio ${r} zoom ${z}`);
  }
});

test('centerOn and centerOf', () => {
  const media = PanView.mediaSize(3840, 2880, 2, 1), view = { width: 960, height: 700 };
  assert.deepStrictEqual(PanView.centerOn(1920, 1440, 3840, 2880, media, view, 1), { left: 480, top: 370 });
  assert.deepStrictEqual(PanView.centerOn(0, 0, 3840, 2880, media, view, 1), { left: 0, top: 0 });
  assert.deepStrictEqual(PanView.centerOn(3840, 2880, 3840, 2880, media, view, 1), { left: 960, top: 740 });
  const c = PanView.centerOf({ left: 480, top: 370 }, 3840, 2880, media, view);
  assert.deepStrictEqual(c, { x: 1920, y: 1440 });
  // Zooming keeps the centre: 2:1 around the same source pixel.
  const m2 = PanView.mediaSize(3840, 2880, 2, 2);
  const s2 = PanView.centerOn(c.x, c.y, 3840, 2880, m2, view, 1);
  assert.deepStrictEqual(PanView.centerOf(s2, 3840, 2880, m2, view), { x: 1920, y: 1440 });
  // A frame smaller than the view stays at 0.
  assert.deepStrictEqual(PanView.centerOn(100, 100, 400, 300, { width: 200, height: 150 }, view, 1), { left: 0, top: 0 });
});

test('the map outlines the visible part and moves the view', () => {
  const media = { width: 1920, height: 1440 }, view = { width: 960, height: 720 };
  assert.deepStrictEqual(PanView.mapRect({ left: 480, top: 360 }, view, media, 96, 72), { left: 24, top: 18, width: 48, height: 36 });
  assert.deepStrictEqual(PanView.mapRect({ left: 0, top: 0 }, { width: 3000, height: 3000 }, media, 96, 72),
    { left: 0, top: 0, width: 96, height: 72 });
  assert.deepStrictEqual(PanView.fromMap(48, 36, 96, 72, 3840, 2880, media, view, 1), { left: 480, top: 360 });
  assert.deepStrictEqual(PanView.fromMap(0, 0, 96, 72, 3840, 2880, media, view, 1), { left: 0, top: 0 });
});

test('keys pan and zoom', () => {
  const s = { left: 100, top: 100 }, view = { width: 800, height: 600 }, media = { width: 1920, height: 1440 };
  assert.deepStrictEqual(PanView.keyMove('ArrowRight', false, s, view, media), { left: 180, top: 100 });
  assert.deepStrictEqual(PanView.keyMove('ArrowUp', true, s, view, media), { left: 100, top: -200 });
  assert.deepStrictEqual(PanView.keyMove('PageDown', false, s, view, media), { left: 100, top: 700 });
  assert.deepStrictEqual(PanView.keyMove('End', false, s, view, media), { left: 1920, top: 1440 });
  assert.strictEqual(PanView.keyMove('a', false, s, view, media), null);
  assert.deepStrictEqual(['1', '2', '4', '3'].map((k) => PanView.keyZoom(k, 1)), [1, 2, 4, null]);
  assert.deepStrictEqual([PanView.keyZoom('+', 1), PanView.keyZoom('+', 4), PanView.keyZoom('-', 2), PanView.keyZoom('-', 1)], [2, 4, 1, 1]);
});

/* ---- compare.js ---- */
test('the divider sits on whole device pixels', () => {
  assert.strictEqual(Compare.deviceWidth(960, 'a.png'), 960);
  assert.strictEqual(Compare.deviceWidth(960, 'a@1x.png'), 480);
  for (const r of RATIOS) for (const v of [0, 1, 239, 480, 959]) {
    const css = Compare.splitCss(v, r);
    assert.ok(css * r >= v - 1e-9 && css * r - v < r / 64 + 1e-9 && Number.isInteger(css * 64), `ratio ${r} value ${v}`);
  }
  assert.strictEqual(Compare.fromPointer(100.25, 0, 2, 960), 201);
  assert.strictEqual(Compare.fromPointer(-5, 0, 2, 960), 0);
  assert.strictEqual(Compare.fromPointer(900, 10, 2, 960), 960);
});

test('keys and rescaling', () => {
  assert.strictEqual(Compare.keyValue('ArrowLeft', false, 10, 960), 9);
  assert.strictEqual(Compare.keyValue('ArrowRight', true, 955, 960), 960);
  assert.strictEqual(Compare.keyValue('PageUp', false, 480, 960), 576);
  assert.strictEqual(Compare.keyValue('PageDown', false, 50, 960), 0);
  assert.strictEqual(Compare.keyValue('Home', false, 50, 960), 0);
  assert.strictEqual(Compare.keyValue('End', false, 50, 960), 960);
  assert.strictEqual(Compare.keyValue('x', false, 50, 960), null);
  assert.strictEqual(Compare.rescale(240, 480, 960), 480);
  assert.strictEqual(Compare.rescale(0, 0, 960), 480);
  assert.strictEqual(Compare.valueText(240, 960, 'Sony PVM-14L2', 'JVC D-Series'),
    'Sony PVM-14L2 on the left 25%, JVC D-Series on the right 75%');
});

/* ---- includes and CSS ---- */
test('no canvas, no clip-path or filters on renders', () => {
  for (const f of ['assets/js/render.js', 'assets/js/viewer.js', 'assets/js/compare.js']) {
    const code = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/canvas|getContext|drawImage/i.test(code), f + ' uses a canvas');
  }
  for (const f of ['_includes/crop.html', '_includes/pan.html', '_includes/compare.html', '_includes/clip.html']) {
    const html = read(f).replace(/\{%-? comment -?%\}[\s\S]*?\{%-? endcomment -?%\}/g, '');
    assert.ok(!/<canvas|clip-path|filter:|mix-blend|opacity/i.test(html), f);
    assert.ok(!/\bsizes=|\d+w"/.test(html.replace(/data-posters="[^"]*"/, '')), f + ' uses width descriptors');
  }
  const css = read('assets/css/style.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/clip-path|mix-blend-mode|backdrop-filter/.test(css), 'style.css: clip-path, blend or backdrop filter');
  assert.ok(/img:not\(\.render\), video:not\(\.render\) \{ max-width: 100%; height: auto; \}/.test(css), 'column fit only for non-renders');
  assert.ok(!/(^|\})\s*img, video \{[^}]*max-width: 100%/.test(css), 'global img, video max-width is gone');
  assert.ok(/\.compare\.is-live > \.compare-over \{[^}]*overflow: hidden/.test(css), 'slider clips by overflow');
});

test('crop markup: 2x file at half size, @1x candidate, HDR source first', () => {
  const html = read('_includes/crop.html');
  assert.ok(/srcset="\{\{ c_file_1x_url \}\} 1x, \{\{ c_file_url \}\} 2x"/.test(html));
  assert.ok(/width="\{\{ c_half_w \}\}" height="\{\{ c_half_h \}\}" data-w="\{\{ c_w \}\}" data-h="\{\{ c_h \}\}"/.test(html));
  assert.ok(/<source media="\(dynamic-range: high\)" type="image\/avif"/.test(html));
  assert.ok(/class="render-scroll"/.test(html) && /<span class="render-scale">shown 1:1<\/span>/.test(html));
});

console.log('media: ' + n + ' tests passed');
