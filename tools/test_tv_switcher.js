#!/usr/bin/env node
/* Tests for the pure helpers of assets/js/tv-switcher.js and a check of
 * assets/hero/manifest.json against the schema in assets/hero/README.md.
 * Run from the site root: node tools/test_tv_switcher.js
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const TV = require(path.join(root, 'assets/js/tv-switcher.js'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/hero/manifest.json'), 'utf8'));

let n = 0;
function test(name, fn) { fn(); n++; }
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

/* ---- manifest schema and files ---- */
test('manifest shape', () => {
  assert.strictEqual(typeof manifest.fps, 'number');
  assert.deepStrictEqual(manifest.aspect, [4, 3]);
  assert.ok(Array.isArray(manifest.presets) && manifest.presets.length >= 1);
  assert.ok(Array.isArray(manifest.games) && manifest.games.length >= 1);
  const presetIds = new Set();
  for (const p of manifest.presets) {
    assert.ok(p.id && p.name, 'preset needs id and name');
    assert.ok(!presetIds.has(p.id), 'duplicate preset ' + p.id); presetIds.add(p.id);
  }
  const gameIds = new Set();
  for (const g of manifest.games) {
    assert.ok(g.id && g.title, 'game needs id and title');
    assert.ok(!gameIds.has(g.id), 'duplicate game ' + g.id); gameIds.add(g.id);
    assert.ok(presetIds.has(g.default_preset), g.id + ': default_preset unknown');
    assert.ok(manifest.clips[g.id], g.id + ': no clips entry');
  }
  for (const [gid, byPreset] of Object.entries(manifest.clips)) {
    assert.ok(gameIds.has(gid), 'clips for unknown game ' + gid);
    for (const [pid, c] of Object.entries(byPreset)) {
      assert.ok(presetIds.has(pid), gid + ': clip for unknown preset ' + pid);
      for (const k of Object.keys(c)) assert.ok(['video', 'poster', 'still', 'still_size', 'full'].includes(k), gid + '/' + pid + ': unknown key ' + k);
      for (const k of ['video', 'poster', 'still', 'full']) {
        if (!c[k]) continue;
        assert.ok(!c[k].startsWith('/'), gid + '/' + pid + ': ' + k + ' must be site-relative without a leading slash');
        assert.ok(fs.existsSync(path.join(root, c[k])), gid + '/' + pid + ': missing file ' + c[k]);
      }
      if (c.still_size) assert.ok(c.still_size.length === 2 && c.still, gid + '/' + pid + ': still_size without still');
      assert.ok(TV.hasMedia(c), gid + '/' + pid + ': clip has no media');
    }
  }
  // Every game must offer at least one preset, and its default must be one of them.
  for (const g of manifest.games) {
    const avail = TV.available(manifest, g.id);
    assert.ok(avail.length >= 1, g.id + ': nothing to show');
    assert.ok(avail.includes(g.default_preset), g.id + ': default preset has no clip');
  }
});

/* ---- selection helpers ---- */
test('clipFor / hasMedia', () => {
  assert.ok(TV.clipFor(manifest, 'mega-man-2-title', 'sony_pvm_14l2').video);
  assert.strictEqual(TV.clipFor(manifest, 'mega-man-2-title', 'vhs_sp_consumer'), null);
  assert.strictEqual(TV.clipFor({}, 'x', 'y'), null);
  assert.strictEqual(TV.hasMedia(null), false);
  assert.strictEqual(TV.hasMedia({ full: 'a.png' }), false);
  assert.strictEqual(TV.hasMedia({ still: 'a.webp' }), true);
});

test('available: manifest order, disabled presets, broken videos', () => {
  assert.deepStrictEqual(TV.available(manifest, 'mega-man-2-title'),
    ['sony_pvm_14l2', 'jvc_d_series_2000', 'toshiba_14af43', 'stass_favourite']);
  assert.deepStrictEqual(TV.available(manifest, 'kirby-title'), ['jvc_d_series_2000']);
  assert.deepStrictEqual(TV.available(manifest, 'no-such-game'), []);
  // A 404ed video with a poster stays selectable (poster shown); one without any fallback drops out.
  const m = { presets: [{ id: 'a' }, { id: 'b' }], clips: { g: { a: { video: 'a.mp4', poster: 'a.webp' }, b: { video: 'b.mp4' } } } };
  assert.deepStrictEqual(TV.available(m, 'g', { 'g/a': true, 'g/b': true }), ['a']);
});

test('choosePreset: keep, default, first, none', () => {
  assert.strictEqual(TV.choosePreset(manifest, 'mega-man-2-title', 'toshiba_14af43'), 'toshiba_14af43');
  assert.strictEqual(TV.choosePreset(manifest, 'kirby-title', 'toshiba_14af43'), 'jvc_d_series_2000');
  assert.strictEqual(TV.choosePreset(manifest, 'darkwing-bridge', null), 'stass_favourite');
  const m = { presets: [{ id: 'a' }, { id: 'b' }], games: [{ id: 'g', default_preset: 'zz' }], clips: { g: { b: { video: 'b.mp4' } } } };
  assert.strictEqual(TV.choosePreset(m, 'g', 'a'), 'b');
  assert.strictEqual(TV.choosePreset(m, 'nothing', 'a'), null);
});

test('step wraps, keyPreset honours availability', () => {
  const l = ['a', 'b', 'c'];
  assert.strictEqual(TV.step(l, 'c', 1), 'a');
  assert.strictEqual(TV.step(l, 'a', -1), 'c');
  assert.strictEqual(TV.step(l, 'zz', 1), 'a');
  assert.strictEqual(TV.step([], 'a', 1), null);
  const avail = TV.available(manifest, 'mega-man-2-title');
  assert.strictEqual(TV.keyPreset('1', manifest, avail), 'sony_pvm_14l2');
  assert.strictEqual(TV.keyPreset('4', manifest, avail), 'stass_favourite');
  assert.strictEqual(TV.keyPreset('5', manifest, avail), null);   // reference_composite: not rendered yet
  assert.strictEqual(TV.keyPreset('9', manifest, avail), null);
  assert.strictEqual(TV.keyPreset('0', manifest, avail), null);
  assert.strictEqual(TV.keyPreset('a', manifest, avail), null);
});

/* ---- lens geometry ---- */
test('contentRect letterboxes and pillarboxes', () => {
  let r = TV.contentRect(800, 600, 960, 720);       // same aspect: fills
  assert.deepStrictEqual(r, { x: 0, y: 0, w: 800, h: 600 });
  r = TV.contentRect(800, 600, 1600, 900);          // wider source: letterbox
  assert.ok(near(r.w, 800) && near(r.h, 450) && near(r.y, 75) && near(r.x, 0));
  r = TV.contentRect(800, 600, 600, 600);           // taller source: pillarbox
  assert.ok(near(r.w, 600) && near(r.x, 100) && near(r.h, 600));
  r = TV.contentRect(0, 0, 960, 720);               // degenerate stage
  assert.deepStrictEqual(r, { x: 0, y: 0, w: 0, h: 0 });
});

test('sourcePoint maps stage CSS px to source px for both tiers', () => {
  const rect = TV.contentRect(848, 636, 960, 720);
  let p = TV.sourcePoint(424, 318, rect, 960, 720);
  assert.ok(near(p.x, 480) && near(p.y, 360));
  p = TV.sourcePoint(424, 318, rect, 3840, 2880);   // the 4K still of the same picture
  assert.ok(near(p.x, 1920) && near(p.y, 1440));
  p = TV.sourcePoint(0, 0, rect, 960, 720);
  assert.ok(near(p.x, 0) && near(p.y, 0));
  const lb = TV.contentRect(800, 600, 1600, 900);
  p = TV.sourcePoint(0, 75, lb, 1600, 900);
  assert.ok(near(p.x, 0) && near(p.y, 0));
});

test('liveScale: 3x over the stage scale', () => {
  const rect = TV.contentRect(848, 636, 960, 720);
  const spp = TV.liveScale(rect, 960, 2, 3);
  assert.ok(near(spp, 960 / (848 * 3 * 2)));
  // one source pixel covers 3 * stage-scale device pixels
  assert.ok(near(1 / spp, 3 * (848 / 960) * 2));
});

test('lensView: centred, 1:1 at zoom 1, clipped at the edges', () => {
  let v = TV.lensView({ x: 1920, y: 1440 }, 3840, 2880, 480, 1);
  assert.deepStrictEqual(v, { sx: 1680, sy: 1200, sw: 480, sh: 480, dx: 0, dy: 0, dw: 480, dh: 480 });
  v = TV.lensView({ x: 1920, y: 1440 }, 3840, 2880, 480, 0.25);   // 4:1
  assert.deepStrictEqual(v, { sx: 1860, sy: 1380, sw: 120, sh: 120, dx: 0, dy: 0, dw: 480, dh: 480 });
  v = TV.lensView({ x: 0, y: 0 }, 3840, 2880, 480, 1);            // top-left corner
  assert.deepStrictEqual(v, { sx: 0, sy: 0, sw: 240, sh: 240, dx: 240, dy: 240, dw: 240, dh: 240 });
  v = TV.lensView({ x: 3840, y: 2880 }, 3840, 2880, 480, 1);      // bottom-right corner
  assert.deepStrictEqual(v, { sx: 3600, sy: 2640, sw: 240, sh: 240, dx: 0, dy: 0, dw: 240, dh: 240 });
  assert.strictEqual(TV.lensView({ x: -1000, y: 0 }, 3840, 2880, 480, 1), null);
  // live tier: fractional spp keeps the destination the full lens
  const spp = 960 / (848 * 3 * 2);
  v = TV.lensView({ x: 480, y: 360 }, 960, 720, 480, spp);
  assert.ok(near(v.dw, 480, 1e-6) && near(v.dh, 480, 1e-6) && near(v.sw, 480 * spp, 1e-6));
});

test('lensBox stays inside the stage; touch version sits above the finger', () => {
  assert.deepStrictEqual(TV.lensBox(400, 300, 240, 848, 636, false), { x: 280, y: 180 });
  assert.deepStrictEqual(TV.lensBox(0, 0, 240, 848, 636, false), { x: 0, y: 0 });
  assert.deepStrictEqual(TV.lensBox(848, 636, 240, 848, 636, false), { x: 608, y: 396 });
  const t = TV.lensBox(400, 300, 160, 360, 270, true);
  assert.ok(t.x === 200 && near(t.y, 108));   // x clamped to the right edge, y = 300 - 80 - (96 + 16)
  const t2 = TV.lensBox(180, 260, 160, 360, 270, true);
  assert.ok(near(t2.y, 260 - 80 - (160 * 0.6 + 16)));
});

/* ---- policy and text ---- */
test('prefetchAllowed', () => {
  assert.strictEqual(TV.prefetchAllowed(undefined), true);
  assert.strictEqual(TV.prefetchAllowed({ effectiveType: '4g' }), true);
  assert.strictEqual(TV.prefetchAllowed({ effectiveType: '3g' }), false);
  assert.strictEqual(TV.prefetchAllowed({ effectiveType: '2g' }), false);
  assert.strictEqual(TV.prefetchAllowed({ effectiveType: 'slow-2g' }), false);
  assert.strictEqual(TV.prefetchAllowed({ saveData: true, effectiveType: '4g' }), false);
  assert.strictEqual(TV.prefetchAllowed({}), true);
});

test('caption and lens label', () => {
  const g = TV.gameById(manifest, 'mega-man-2-title'), p = TV.presetById(manifest, 'sony_pvm_14l2');
  assert.strictEqual(TV.caption(g, p), 'Mega Man 2 · Rooftop title · Sony PVM-14L2 — Focused beam, fine aperture grille, D65, composite');
  assert.strictEqual(TV.caption({ title: 'G' }, { name: 'P' }), 'G ·  · P');
  assert.strictEqual(TV.lensLabel('still', 1, 'Sony PVM-14L2'), '1:1 · Sony PVM-14L2');
  assert.strictEqual(TV.lensLabel('still', 4, 'X'), '4:1 · X');
  assert.strictEqual(TV.lensLabel('live', 1, 'X'), '3× live · X');
  assert.strictEqual(TV.gameById(manifest, 'nope'), null);
  assert.strictEqual(TV.presetById(manifest, 'nope'), null);
});

console.log('tv-switcher: ' + n + ' tests passed');
