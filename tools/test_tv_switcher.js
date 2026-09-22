#!/usr/bin/env node
/* Tests for the pure helpers of assets/js/tv-switcher.js, a check of the
 * live manifest (assets/hero/manifest.json) and of the version 2 fixture
 * (tools/tv-fixture/manifest.json) against assets/hero/README.md, and static
 * checks of the markup and CSS.
 * Run: node tools/test_tv_switcher.js
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const TV = require(path.join(root, 'assets/js/tv-switcher.js'));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const liveRaw = JSON.parse(read('assets/hero/manifest.json'));
const fixtureRaw = JSON.parse(read('tools/tv-fixture/manifest.json'));
const live = TV.normalize(liveRaw);
const fixture = TV.normalize(fixtureRaw);

let n = 0;
const pending = [];
function test(name, fn) {
  const fail = (e) => { e.message = name + ': ' + e.message; throw e; };
  let r;
  try { r = fn(); } catch (e) { fail(e); }
  if (r && typeof r.then === 'function') pending.push(r.then(() => { n++; }, fail));
  else n++;
}
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const isInt = (v) => Math.abs(v - Math.round(v)) < 1e-9;
const FPS = 60.0988;

/* ---- image headers, for the sizes a manifest claims ---- */
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b.slice(1, 4).toString() === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') {
    const kind = b.slice(12, 16).toString();
    if (kind === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
    if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (kind === 'VP8X') return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
  }
  return null;
}

const haveFfprobe = spawnSync('ffprobe', ['-version']).status === 0;
function videoInfo(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries',
    'stream=width,height,nb_read_frames,color_transfer,color_primaries', '-of', 'json', file], { encoding: 'utf8' });
  return JSON.parse(r.stdout).streams[0];
}

/* ---- manifest checks, both versions ---- */
function checkManifest(raw, label) {
  const version = raw.version === undefined ? 1 : raw.version;
  assert.ok(version === 1 || version === 2, label + ': version must be 1 or 2');
  assert.strictEqual(typeof raw.fps, 'number');
  assert.deepStrictEqual(raw.aspect, [4, 3]);
  assert.ok(Array.isArray(raw.presets) && raw.presets.length >= 1);
  assert.ok(Array.isArray(raw.games) && raw.games.length >= 1);
  const presetIds = new Set();
  for (const p of raw.presets) {
    assert.ok(p.id && p.name, label + ': preset needs id and name');
    assert.ok(!presetIds.has(p.id), label + ': duplicate preset ' + p.id); presetIds.add(p.id);
  }
  const gameIds = new Set();
  for (const g of raw.games) {
    assert.ok(g.id && g.title, label + ': game needs id and title');
    assert.ok(!gameIds.has(g.id), label + ': duplicate game ' + g.id); gameIds.add(g.id);
    assert.ok(presetIds.has(g.default_preset), g.id + ': default_preset unknown');
    assert.ok(raw.clips[g.id], g.id + ': no clips entry');
  }
  const file = (where, p) => {
    assert.strictEqual(typeof p, 'string', where + ': path must be a string');
    assert.ok(!p.startsWith('/'), where + ': ' + p + ' must be site-relative without a leading slash');
    const abs = path.join(root, p);
    assert.ok(fs.existsSync(abs), where + ': missing file ' + p);
    return abs;
  };
  const keys = version === 1 ? ['video', 'poster', 'still', 'still_size', 'full'] : ['poster', 'stage', 'lens', 'still', 'hdr'];
  for (const [gid, byPreset] of Object.entries(raw.clips)) {
    assert.ok(gameIds.has(gid), label + ': clips for unknown game ' + gid);
    for (const [pid, c] of Object.entries(byPreset)) {
      const where = label + ' ' + gid + '/' + pid;
      assert.ok(presetIds.has(pid), where + ': unknown preset');
      for (const k of Object.keys(c)) assert.ok(keys.includes(k), where + ': unknown key ' + k);
      if (version === 1) {
        for (const k of ['video', 'poster', 'still', 'full']) if (c[k]) file(where, c[k]);
        if (c.still_size) assert.ok(c.still_size.length === 2 && c.still, where + ': still_size without still');
      } else {
        const posters = TV.normalizePosters(c.poster);
        for (const p of posters) {
          const size = imageSize(file(where, p.src));
          if (p.width) assert.deepStrictEqual(size, [p.width, p.height], where + ': poster ' + p.src + ' size');
        }
        const media = (list, kind) => {
          assert.ok(Array.isArray(list), where + ': ' + kind + ' must be a list');
          for (const s of list) {
            const abs = file(where, s.src);
            assert.ok(/^video\/mp4; codecs="[^"]+"$/.test(s.type), where + ': ' + s.src + ' type ' + s.type);
            assert.strictEqual(typeof s.hdr, 'boolean', where + ': ' + s.src + ' hdr flag');
            assert.ok(Number.isInteger(s.width) && Number.isInteger(s.height), where + ': ' + s.src + ' size');
            assert.strictEqual(s.width * 3, s.height * 4, where + ': ' + s.src + ' is not 4:3');
            assert.strictEqual(s.bytes, fs.statSync(abs).size, where + ': ' + s.src + ' bytes');
            if (kind === 'lens') assert.deepStrictEqual([s.width, s.height], [3840, 2880], where + ': lens size');
          }
        };
        if (c.stage) media(c.stage, 'stage');
        if (c.lens) media(c.lens, 'lens');
        if (c.lens && c.lens.length) assert.ok(c.stage && c.stage.length, where + ': lens clips need stage clips');
        if (c.still) {
          assert.ok(c.still.hdr || c.still.sdr, where + ': still without files');
          assert.ok(Number.isInteger(c.still.frame) && c.still.frame >= 0, where + ': still frame');
          if (c.still.hdr) { file(where, c.still.hdr); assert.ok(c.still.hdr.endsWith('.avif'), where + ': HDR still must be AVIF'); }
          if (c.still.sdr) {
            assert.ok(c.still.sdr.endsWith('.png'), where + ': SDR still must be a lossless PNG');
            assert.deepStrictEqual(imageSize(file(where, c.still.sdr)), [c.still.width, c.still.height], where + ': still size');
          }
        }
        if ((c.stage || []).some((s) => s.hdr)) assert.ok(c.hdr && c.hdr.white_nits > 0, where + ': HDR clips need the hdr block');
        // Stage and lens clips of one preset share frame count; HDR files carry PQ BT.2020 tags.
        if (haveFfprobe && (c.stage || []).length) {
          const all = (c.stage || []).concat(c.lens || []);
          const infos = all.map((s) => videoInfo(path.join(root, s.src)));
          infos.forEach((info, i) => {
            assert.deepStrictEqual([info.width, info.height], [all[i].width, all[i].height], where + ': ' + all[i].src + ' probed size');
            assert.strictEqual(info.nb_read_frames, infos[0].nb_read_frames, where + ': ' + all[i].src + ' frame count');
            if (all[i].hdr) assert.deepStrictEqual([info.color_transfer, info.color_primaries], ['smpte2084', 'bt2020'], where + ': ' + all[i].src + ' HDR tags');
          });
        }
      }
    }
  }
  const m = TV.normalize(raw);
  assert.strictEqual(m.version, version);
  for (const g of m.games) {
    const avail = TV.available(m, g.id);
    assert.ok(avail.length >= 1, label + ' ' + g.id + ': nothing to show');
    assert.ok(avail.includes(g.default_preset), label + ' ' + g.id + ': default preset has no clip');
  }
}

test('live manifest', () => checkManifest(liveRaw, 'live'));
test('fixture manifest', () => checkManifest(fixtureRaw, 'fixture'));

/* ---- normalisation ---- */
test('normalize: version 1 seed', () => {
  assert.strictEqual(live.version, 1);
  const k = TV.clipFor(live, 'kirby-title', 'jvc_d_series_2000');
  assert.deepStrictEqual(k.stage, [{ src: 'assets/images/showcase/kirby-jvc_d_series_2000.mp4', type: 'video/mp4', hdr: false, width: null, height: null, bytes: null }]);
  assert.deepStrictEqual(k.lens, []);
  assert.strictEqual(k.still, null);
  const mm = TV.clipFor(live, 'mega-man-2-title', 'sony_pvm_14l2');
  // The lossless PNG stands in for the still; frame 0 is the frame the seed still shows.
  assert.deepStrictEqual(mm.still, { hdr: null, sdr: 'assets/images/showcase/4k/sony_pvm_14l2.png', width: 3840, height: 2880, frame: 0 });
  assert.strictEqual(mm.full, 'assets/images/showcase/4k/sony_pvm_14l2.png');
  assert.deepStrictEqual(TV.clipFor(live, 'mega-man-2-title', 'jvc_d_series_2000').stage, []);
  assert.strictEqual(TV.normalizeClip({ still: 'a.webp', still_size: [3840, 2880] }, 1).still.sdr, 'a.webp');
});

test('normalize: version 2 fixture', () => {
  assert.strictEqual(fixture.version, 2);
  const g = TV.clipFor(fixture, 'test-pattern', 'fixture_grille');
  assert.strictEqual(g.stage.length, 6);
  assert.strictEqual(g.lens.length, 3);
  assert.deepStrictEqual(g.posters.map((p) => p.width), [960, 1920]);
  assert.strictEqual(g.still.frame, 30);
  assert.strictEqual(g.hdr.white_nits, 203);
  assert.strictEqual(g.full, g.still.sdr);
  const s = TV.clipFor(fixture, 'test-pattern', 'fixture_slot');
  assert.deepStrictEqual(s.posters, [{ src: 'tools/tv-fixture/test-pattern/fixture_slot/poster.webp', width: null, height: null }]);
  assert.strictEqual(TV.clipFor(fixture, 'test-pattern', 'fixture_dots').still, null);
  assert.strictEqual(TV.clipFor(fixture, 'test-pattern', 'fixture_missing'), null);
});

test('normalize: bad input', () => {
  const e = TV.normalize(null);
  assert.deepStrictEqual([e.version, e.fps, e.aspect, e.presets, e.games, e.clips], [1, 60.0988, [4, 3], [], [], {}]);
  const m = TV.normalize({
    version: 2, fps: 'x', aspect: [0, 3],
    presets: [{ id: 'a', name: 'A' }, { id: 'a', name: 'dup' }, null, { name: 'no id' }, { id: 'b' }],
    games: [{ id: 'g', title: 'G', default_preset: 'a' }, { id: 'g' }],
    clips: {
      g: {
        a: { stage: [{ src: 'a.mp4', codecs: 'avc1.640028', width: '960', height: 720, bytes: -1 }, { type: 'video/mp4' }], lens: 'nope',
          poster: { src: 'p.webp', width: 960, height: 720 }, still: { width: 1 }, hdr: 5 },
        b: { stage: [], still: { hdr: 'h.avif', frame: -3.5 } },
        c: {}, d: null
      },
      h: 'junk'
    }
  });
  assert.deepStrictEqual(m.presets, [{ id: 'a', name: 'A', blurb: '' }, { id: 'b', name: 'b', blurb: '' }]);
  assert.deepStrictEqual(m.games, [{ id: 'g', title: 'G', scene: '', default_preset: 'a' }]);
  assert.strictEqual(m.fps, 60.0988);
  assert.deepStrictEqual(m.aspect, [4, 3]);
  const a = m.clips.g.a;
  assert.deepStrictEqual(a.stage, [{ src: 'a.mp4', type: 'video/mp4; codecs="avc1.640028"', hdr: false, width: 960, height: 720, bytes: null }]);
  assert.deepStrictEqual(a.lens, []);
  assert.deepStrictEqual(a.posters, [{ src: 'p.webp', width: 960, height: 720 }]);
  assert.strictEqual(a.still, null);
  assert.strictEqual(a.hdr, null);
  assert.deepStrictEqual(m.clips.g.b.still, { hdr: 'h.avif', sdr: null, width: null, height: null, frame: 0 });
  assert.deepStrictEqual(Object.keys(m.clips.g), ['a', 'b']);   // clips without media are dropped
  assert.strictEqual(m.clips.h, undefined);
  assert.deepStrictEqual(TV.normalizePosters(['a.webp', '', { src: 'b.webp', width: 1920 }, {}]),
    [{ src: 'a.webp', width: null, height: null }, { src: 'b.webp', width: 1920, height: null }]);
});

/* ---- selection helpers ---- */
test('available: manifest order, disabled presets, broken videos', () => {
  assert.deepStrictEqual(TV.available(live, 'mega-man-2-title'),
    ['sony_pvm_14l2', 'jvc_d_series_2000', 'toshiba_14af43', 'stass_favourite']);
  assert.deepStrictEqual(TV.available(live, 'kirby-title'), ['jvc_d_series_2000']);
  assert.deepStrictEqual(TV.available(live, 'no-such-game'), []);
  assert.deepStrictEqual(TV.available(fixture, 'test-pattern'), ['fixture_grille', 'fixture_slot', 'fixture_dots']);
  // A clip whose videos all failed stays selectable with a poster; one without any fallback drops out.
  const m = TV.normalize({ presets: [{ id: 'a' }, { id: 'b' }], clips: { g: { a: { video: 'a.mp4', poster: 'a.webp' }, b: { video: 'b.mp4' } } } });
  assert.deepStrictEqual(TV.available(m, 'g', { 'g/a': true, 'g/b': true }), ['a']);
});

test('choosePreset: keep, default, first, none', () => {
  assert.strictEqual(TV.choosePreset(live, 'mega-man-2-title', 'toshiba_14af43'), 'toshiba_14af43');
  assert.strictEqual(TV.choosePreset(live, 'kirby-title', 'toshiba_14af43'), 'jvc_d_series_2000');
  assert.strictEqual(TV.choosePreset(live, 'darkwing-bridge', null), 'stass_favourite');
  const m = TV.normalize({ presets: [{ id: 'a' }, { id: 'b' }], games: [{ id: 'g', default_preset: 'zz' }], clips: { g: { b: { video: 'b.mp4' } } } });
  assert.strictEqual(TV.choosePreset(m, 'g', 'a'), 'b');
  assert.strictEqual(TV.choosePreset(m, 'nothing', 'a'), null);
});

test('step wraps, keyPreset honours availability', () => {
  const l = ['a', 'b', 'c'];
  assert.strictEqual(TV.step(l, 'c', 1), 'a');
  assert.strictEqual(TV.step(l, 'a', -1), 'c');
  assert.strictEqual(TV.step(l, 'zz', 1), 'a');
  assert.strictEqual(TV.step([], 'a', 1), null);
  const avail = TV.available(live, 'mega-man-2-title');
  assert.strictEqual(TV.keyPreset('1', live, avail), 'sony_pvm_14l2');
  assert.strictEqual(TV.keyPreset('4', live, avail), 'stass_favourite');
  assert.strictEqual(TV.keyPreset('5', live, avail), null);   // reference_composite: not rendered yet
  assert.strictEqual(TV.keyPreset('9', live, avail), null);
  assert.strictEqual(TV.keyPreset('0', live, avail), null);
  assert.strictEqual(TV.keyPreset('a', live, avail), null);
});

/* ---- source choice ---- */
const grille = TV.clipFor(fixture, 'test-pattern', 'fixture_grille');
const slot = TV.clipFor(fixture, 'test-pattern', 'fixture_slot');
const dots = TV.clipFor(fixture, 'test-pattern', 'fixture_dots');
const capsAll = (clip, over) => {
  const caps = {};
  clip.stage.concat(clip.lens).forEach((s) => { caps[TV.capKey(s)] = Object.assign({ supported: true, smooth: true, powerEfficient: true }, over ? over(s) : {}); });
  return caps;
};
const name = (s) => s && path.basename(s.src);

test('chooseStage: the width that matches the display', () => {
  const caps = capsAll(grille);
  const sdr = (dpr, availW) => name(TV.chooseStage(grille.stage, { dpr, availW, hdrDisplay: false, caps }));
  assert.strictEqual(sdr(1, 960), 'stage-960-sdr.mp4');
  assert.strictEqual(sdr(2, 960), 'stage-1920-sdr.mp4');
  assert.strictEqual(sdr(3, 960), 'stage-1920-sdr.mp4');     // 640 CSS px
  assert.strictEqual(sdr(1.5, 960), 'stage-960-sdr.mp4');    // 1920 would need 1280 CSS px
  assert.strictEqual(sdr(2, 900), 'stage-960-sdr.mp4');      // narrow window: 1920 no longer fits
  assert.strictEqual(sdr(2, 343), 'stage-960-sdr.mp4');      // phone: nothing fits, smallest is scaled
  assert.strictEqual(sdr(3, 358), 'stage-960-sdr.mp4');      // 3x phone: 960 fits at 320 CSS px
});

test('chooseStage: HDR when the display and decoder allow it', () => {
  const caps = capsAll(grille);
  const env = { dpr: 2, availW: 960, hdrDisplay: true, caps };
  assert.strictEqual(name(TV.chooseStage(grille.stage, env)), 'stage-1920-hdr-hevc.mp4');
  // A power-efficient decoder wins over manifest order.
  const av1 = capsAll(grille, (s) => ({ powerEfficient: /av01/.test(s.type) }));
  assert.strictEqual(name(TV.chooseStage(grille.stage, { dpr: 2, availW: 960, hdrDisplay: true, caps: av1 })), 'stage-1920-hdr-av1.mp4');
  // No PQ decode: SDR.
  const noPq = capsAll(grille, (s) => ({ supported: !s.hdr }));
  assert.strictEqual(name(TV.chooseStage(grille.stage, { dpr: 2, availW: 960, hdrDisplay: true, caps: noPq })), 'stage-1920-sdr.mp4');
  // HDR sources are never used without a positive probe.
  assert.strictEqual(name(TV.chooseStage(grille.stage, { dpr: 2, availW: 960, hdrDisplay: true, caps: {} })), 'stage-1920-sdr.mp4');
  // A failed file is skipped.
  const broken = { [grille.stage[0].src]: true };
  assert.strictEqual(name(TV.chooseStage(grille.stage, Object.assign({ broken }, env))), 'stage-1920-hdr-av1.mp4');
  // Size before range: an SDR-only width that fits beats an HDR width that does not.
  const mixed = [
    { src: 'hdr-960.mp4', type: 't', hdr: true, width: 960, height: 720 },
    { src: 'sdr-1920.mp4', type: 't', hdr: false, width: 1920, height: 1440 }
  ];
  const capsMixed = { [TV.capKey(mixed[0])]: { supported: true }, [TV.capKey(mixed[1])]: { supported: true } };
  assert.strictEqual(TV.chooseStage(mixed, { dpr: 2, availW: 960, hdrDisplay: true, caps: capsMixed }).src, 'sdr-1920.mp4');
});

test('chooseStage: version 1 and nothing playable', () => {
  const k = TV.clipFor(live, 'kirby-title', 'jvc_d_series_2000');
  assert.strictEqual(TV.chooseStage(k.stage, { dpr: 2, availW: 960, hdrDisplay: true, caps: {} }).src, k.stage[0].src);
  const none = capsAll(dots, () => ({ supported: false }));
  assert.strictEqual(TV.chooseStage(dots.stage, { dpr: 1, availW: 960, hdrDisplay: false, caps: none }), null);
  assert.strictEqual(TV.chooseStage([], { dpr: 1, availW: 960 }), null);
});

test('bySize and choosePoster', () => {
  const p = grille.posters;
  assert.deepStrictEqual(TV.bySize(p, 1, 960).map((x) => x.width), [960]);
  assert.deepStrictEqual(TV.bySize(p, 2, 960).map((x) => x.width), [1920]);
  assert.deepStrictEqual(TV.bySize(p, 2, 300).map((x) => x.width), [960]);
  assert.strictEqual(TV.choosePoster(p, 1920).width, 1920);
  assert.strictEqual(TV.choosePoster(p, 960).width, 960);
  assert.strictEqual(TV.choosePoster(p, 1600), null);             // a poster of another size is not shown
  assert.strictEqual(TV.choosePoster(slot.posters, 1920).src, slot.posters[0].src);   // unknown size: checked after load
  assert.strictEqual(TV.choosePoster([], 960), null);
});

test('chooseLens and chooseStill', () => {
  const caps = capsAll(grille);
  assert.strictEqual(name(TV.chooseLens(grille.lens, { hdrDisplay: true, caps })), 'lens-hdr-hevc.mp4');
  assert.strictEqual(name(TV.chooseLens(grille.lens, { hdrDisplay: false, caps })), 'lens-sdr-hevc.mp4');
  const noHevc = capsAll(grille, (s) => ({ supported: !/hvc1/.test(s.type) }));
  assert.strictEqual(name(TV.chooseLens(grille.lens, { hdrDisplay: true, caps: noHevc })), 'lens-hdr-av1.mp4');
  assert.strictEqual(TV.chooseLens(grille.lens, { hdrDisplay: false, caps: noHevc }), null);
  const s = slot.still;
  assert.strictEqual(name(TV.chooseStill(s, { hdrDisplay: true })), 'still-hdr.avif');
  assert.strictEqual(TV.chooseStill(s, { hdrDisplay: true }).hdr, true);
  assert.strictEqual(name(TV.chooseStill(s, { hdrDisplay: true, avif: false })), 'still-sdr.png');
  assert.strictEqual(name(TV.chooseStill(s, { hdrDisplay: false })), 'still-sdr.png');
  assert.strictEqual(name(TV.chooseStill({ hdr: 'x/h.avif', sdr: null, frame: 0 }, { hdrDisplay: false })), 'h.avif');
  assert.strictEqual(TV.chooseStill(null, {}), null);
  // A file that failed is skipped: the HDR AVIF falls back to the PNG, then nothing is left.
  assert.strictEqual(name(TV.chooseStill(s, { hdrDisplay: true, broken: { [s.hdr]: true } })), 'still-sdr.png');
  assert.strictEqual(TV.chooseStill(s, { hdrDisplay: true, broken: { [s.hdr]: true, [s.sdr]: true } }), null);
  assert.strictEqual(name(TV.chooseStill(s, { hdrDisplay: false, broken: { [s.sdr]: true } })), 'still-hdr.avif');
});

test('inspectTier after lens files fail: the next lens clip, then the still', () => {
  const caps = capsAll(grille);
  const env = (broken) => ({ dpr: 2, availW: 960, hdrDisplay: true, caps, broken });
  const stage = TV.chooseStage(grille.stage, env({}));
  const lens = (b) => { const t = TV.inspectTier(grille, env(b), stage); return t.tier === 'lens' ? name(t.lens) : t.tier + ':' + name(t.still); };
  const src = (n) => grille.lens.find((x) => name(x) === n).src;
  assert.strictEqual(lens({}), 'lens-hdr-hevc.mp4');
  assert.strictEqual(lens({ [src('lens-hdr-hevc.mp4')]: true }), 'lens-hdr-av1.mp4');
  assert.strictEqual(lens({ [src('lens-hdr-hevc.mp4')]: true, [src('lens-hdr-av1.mp4')]: true }), 'lens-sdr-hevc.mp4');
  const all = {};
  grille.lens.forEach((x) => { all[x.src] = true; });
  assert.strictEqual(lens(all), 'still:still-hdr.avif');
  all[grille.still.hdr] = true;
  assert.strictEqual(lens(all), 'still:still-sdr.png');
  all[grille.still.sdr] = true;
  assert.strictEqual(TV.inspectTier(grille, env(all), stage).tier, 'none');
});

test('inspectTier: lens, still, none', () => {
  const env = { dpr: 2, availW: 960, hdrDisplay: false, caps: capsAll(grille) };
  const stage = TV.chooseStage(grille.stage, env);
  let t = TV.inspectTier(grille, env, stage);
  assert.strictEqual(t.tier, 'lens');
  assert.strictEqual(name(t.lens), 'lens-sdr-hevc.mp4');
  assert.strictEqual(TV.inspectNote(t), '3840×2880 clip, ' + TV.formatBytes(t.lens.bytes));
  t = TV.inspectTier(grille, env, null);                   // no stage clip to follow: the still
  assert.strictEqual(t.tier, 'still');
  t = TV.inspectTier(slot, env, TV.chooseStage(slot.stage, env));
  assert.deepStrictEqual([t.tier, t.still.frame, name(t.still)], ['still', 30, 'still-sdr.png']);
  assert.strictEqual(TV.inspectNote(t), '3840×2880 frame');
  t = TV.inspectTier(dots, env, TV.chooseStage(dots.stage, env));
  assert.deepStrictEqual(t, { tier: 'none', reason: 'Full-resolution capture not rendered yet' });
  assert.strictEqual(TV.inspectNote(t), 'Full-resolution capture not rendered yet');
  const noLens = { dpr: 2, availW: 960, hdrDisplay: false, caps: capsAll(grille, (s) => ({ supported: s.width !== 3840 })) };
  const lensOnly = Object.assign({}, grille, { still: null });
  assert.strictEqual(TV.inspectTier(lensOnly, noLens, stage).reason, TV.NO_DECODER);
  assert.strictEqual(TV.inspectTier(null, env, null).tier, 'none');
  // Version 1: the Mega Man clips have the 4K PNG, the others nothing.
  const e1 = { dpr: 2, availW: 960, hdrDisplay: true, caps: {} };
  const mm = TV.clipFor(live, 'mega-man-2-title', 'sony_pvm_14l2');
  t = TV.inspectTier(mm, e1, TV.chooseStage(mm.stage, e1));
  assert.deepStrictEqual([t.tier, t.still.src, t.still.hdr], ['still', 'assets/images/showcase/4k/sony_pvm_14l2.png', false]);
  const k = TV.clipFor(live, 'kirby-title', 'jvc_d_series_2000');
  assert.strictEqual(TV.inspectTier(k, e1, TV.chooseStage(k.stage, e1)).tier, 'none');
});

test('decodingConfig', () => {
  const hdr = grille.stage.find((s) => s.hdr && s.width === 1920);
  const c = TV.decodingConfig(hdr, FPS);
  assert.strictEqual(c.type, 'file');
  assert.deepStrictEqual([c.video.contentType, c.video.width, c.video.height, c.video.framerate, c.video.transferFunction, c.video.colorGamut],
    [hdr.type, 1920, 1440, FPS, 'pq', 'rec2020']);
  assert.ok(c.video.bitrate > 0);
  const sdr = TV.decodingConfig(grille.stage.find((s) => !s.hdr), FPS);
  assert.strictEqual(sdr.video.transferFunction, undefined);
  assert.strictEqual(TV.decodingConfig({ type: 'video/mp4', hdr: false }, FPS), null);   // version 1: no codec named
});

test('probeSource: decodingInfo answers, rejects, throws or is missing', async () => {
  const hdr = grille.stage.find((s) => s.hdr), sdr = grille.stage.find((s) => !s.hdr);
  const yes = () => true;
  const mcs = {
    answers: { decodingInfo: () => Promise.resolve({ supported: true, smooth: true, powerEfficient: false }) },
    rejects: { decodingInfo: () => Promise.reject(new TypeError('bad config')) },
    throws: { decodingInfo: () => { throw new TypeError('not a promise API'); } },
    returnsJunk: { decodingInfo: () => undefined },
    notAFunction: { decodingInfo: 5 }
  };
  const results = {};
  for (const [k, mc] of Object.entries(mcs)) {
    for (const s of [hdr, sdr]) {
      let r;
      assert.doesNotThrow(() => { r = TV.probeSource(s, FPS, yes, mc); }, k);
      results[k + (s.hdr ? ' hdr' : ' sdr')] = await Promise.resolve(r);
    }
  }
  assert.deepStrictEqual(results['answers hdr'], { supported: true, smooth: true, powerEfficient: false });
  for (const k of ['rejects', 'throws', 'notAFunction']) {
    assert.deepStrictEqual(results[k + ' hdr'], { supported: false }, k);
    assert.deepStrictEqual(results[k + ' sdr'], { supported: true }, k);
  }
  assert.deepStrictEqual(results['returnsJunk hdr'], { supported: false, smooth: false, powerEfficient: false });
  assert.deepStrictEqual(TV.probeSource(hdr, FPS, () => false, mcs.answers), { supported: false });
  assert.deepStrictEqual(TV.probeSource(hdr, FPS, yes, undefined), { supported: false });
  assert.deepStrictEqual(TV.probeSource({ src: 'v1.mp4', type: 'video/mp4', hdr: false }, FPS, yes, mcs.throws), { supported: true });
});

/* ---- stage size and snapping ---- */
test('stageSize: native pixels, scaled only when nothing fits', () => {
  for (const [w, h, dpr, avail, cssW, cssH] of [
    [960, 720, 1, 960, 960, 720], [1920, 1440, 2, 960, 960, 720], [1920, 1440, 3, 960, 640, 480],
    [960, 720, 2, 960, 480, 360], [960, 720, 3, 358, 320, 240], [960, 720, 1.5, 960, 640, 480]
  ]) {
    const s = TV.stageSize(w, h, dpr, avail);
    assert.ok(!s.scaled, w + '@' + dpr);
    assert.ok(near(s.w, cssW) && near(s.h, cssH), w + '@' + dpr + ': ' + s.w + 'x' + s.h);
    assert.ok(near(s.w * dpr, w) && near(s.h * dpr, h), 'one source pixel per device pixel');
  }
  const p = TV.stageSize(960, 720, 2, 343.5);                     // phone
  assert.ok(p.scaled);
  assert.strictEqual(p.devW, 687);
  assert.strictEqual(p.devH, 515);
  assert.ok(near(p.w, 343.5) && p.w <= 343.5 && isInt(p.w * 2) && isInt(p.h * 2));
  const q = TV.stageSize(960, 720, 3, 300);
  assert.ok(q.scaled && q.devW === 900 && q.devH === 675);
});

test('availWidth: whole device pixels, never wider than the box', () => {
  assert.strictEqual(TV.availWidth(960, 2), 960);
  assert.strictEqual(TV.availWidth(959.6, 2), 959.5);            // 1919.2 device px: the 1920 clip does not fit
  assert.strictEqual(TV.availWidth(357.6, 2), 357.5);
  assert.strictEqual(TV.availWidth(959.9996, 2), 960);           // layout rounding noise
  assert.ok(near(TV.availWidth(872.7, 2.2), 1919 / 2.2));
  assert.strictEqual(TV.availWidth(0, 2), 0);
  for (const dpr of [1, 1.1, 1.25, 1.5, 1.75, 2, 2.2, 2.5, 3]) {
    for (const w of [343.5, 357.6, 480.3, 767.99, 959.59375, 960]) {
      const a = TV.availWidth(w, dpr);
      assert.ok(a <= w + 1e-3 / dpr && isInt(a * dpr) && w - a < 1 / dpr + 1e-9, w + '@' + dpr);
    }
  }
  // With the floored width the chosen clip fits: 959.6 px at 2x takes the 960 clip at 480 CSS px.
  const caps = capsAll(grille);
  const pick = (w) => name(TV.chooseStage(grille.stage, { dpr: 2, availW: TV.availWidth(w, 2), hdrDisplay: false, caps }));
  assert.strictEqual(pick(959.6), 'stage-960-sdr.mp4');
  assert.strictEqual(pick(960), 'stage-1920-sdr.mp4');
  const s = TV.stageSize(960, 720, 2, TV.availWidth(357.6, 2));
  assert.ok(s.scaled && s.devW === 715 && s.w <= 357.6);
});

test('snapOffset puts the stage on whole device pixels', () => {
  for (const dpr of [1, 1.25, 1.5, 2, 3]) {
    for (const pos of [0, 0.5, 16.25, 60.8, 123.4567, 480.3333333]) {
      const off = TV.snapOffset(pos, dpr);
      assert.ok(isInt((pos + off) * dpr), pos + '@' + dpr);
      assert.ok(Math.abs(off) <= 0.5 / dpr + 1e-9, 'moves by at most half a device pixel');
    }
  }
  assert.strictEqual(TV.snapOffset(100, 2), 0);
});

/* ---- lens geometry ---- */
test('lensSize: 240 CSS px, 160 on narrow windows, at most 60 % of a small stage', () => {
  assert.strictEqual(TV.lensSize(960, 720, false), 240);
  assert.strictEqual(TV.lensSize(480, 360, false), 216);      // 960x720 source at 2x
  assert.strictEqual(TV.lensSize(320, 240, false), 144);      // 960x720 source at 3x
  assert.strictEqual(TV.lensSize(358, 268.5, true), 160);     // phone, scaled stage
  assert.strictEqual(TV.lensSize(80, 60, false), 64);
});

test('lensDiameter: even device pixels', () => {
  assert.deepStrictEqual(TV.lensDiameter(240, 1), { dev: 240, css: 240 });
  assert.deepStrictEqual(TV.lensDiameter(240, 2), { dev: 480, css: 240 });
  assert.deepStrictEqual(TV.lensDiameter(240, 3), { dev: 720, css: 240 });
  assert.strictEqual(TV.lensDiameter(240, 1.1).dev, 264);
  assert.strictEqual(TV.lensDiameter(160, 1.25).dev, 200);
});

test('lensGeometry at DPR 1, 2 and 3: 1:1 by default, whole device pixels, pointer at the centre', () => {
  for (const dpr of [1, 2, 3]) {
    const stageSrc = dpr === 1 ? 960 : 1920;
    const st = TV.stageSize(stageSrc, stageSrc * 3 / 4, dpr, 960);
    for (const zoom of [1, 2, 4]) {
      for (const [x, y] of [[0, 0], [st.w / 2, st.h / 2], [st.w, st.h], [123.37, 45.9], [st.w - 1, 7]]) {
        for (const touch of [false, true]) {
          const g = TV.lensGeometry({ x, y, stageW: st.w, stageH: st.h, srcW: 3840, srcH: 2880, dpr, zoom, lens: 240, touch });
          const where = `dpr ${dpr} zoom ${zoom} at ${x},${y}${touch ? ' touch' : ''}`;
          for (const k of ['size', 'x', 'y', 'mx', 'my', 'mw', 'mh']) assert.ok(Number.isInteger(g.dev[k]), where + ': ' + k);
          assert.ok(isInt(g.box.x * dpr) && isInt(g.box.y * dpr), where + ': box on device pixels');
          assert.ok(isInt(g.media.x * dpr) && isInt(g.media.y * dpr), where + ': media on device pixels');
          assert.strictEqual(g.dev.mw, 3840 * zoom, where + ': zoom device pixels per source pixel');
          assert.ok(near(g.media.w * dpr, 3840 * zoom, 1e-6) && near(g.media.h * dpr, 2880 * zoom, 1e-6));
          assert.strictEqual(g.dev.size, 240 * dpr);
          // The lens stays inside the stage.
          assert.ok(g.dev.x >= 0 && g.dev.y >= 0, where);
          assert.ok(g.dev.x + g.dev.size <= Math.round(st.w * dpr) && g.dev.y + g.dev.size <= Math.round(st.h * dpr), where);
          // The source pixel under the pointer sits at the lens centre, within half a source pixel.
          const cx = (g.dev.size / 2 - g.dev.mx) / zoom, cy = (g.dev.size / 2 - g.dev.my) / zoom;
          assert.ok(Math.abs(cx - g.source.x) <= 0.5 / zoom + 1e-9 && Math.abs(cy - g.source.y) <= 0.5 / zoom + 1e-9, where + ': centre');
          assert.ok(near(g.source.x, x / st.w * 3840) && near(g.source.y, y / st.h * 2880));
        }
      }
    }
  }
  // Mouse lens centred on the pointer; finger lens above it.
  const m = TV.lensGeometry({ x: 480, y: 360, stageW: 960, stageH: 720, srcW: 3840, srcH: 2880, dpr: 2, zoom: 1, lens: 240 });
  assert.deepStrictEqual(m.box, { x: 360, y: 240 });
  // The pointer is on source pixel (1920, 1440), which lands on the lens centre, 240 device pixels in.
  assert.deepStrictEqual(m.dev, { size: 480, x: 720, y: 480, mx: 240 - 1920, my: 240 - 1440, mw: 3840, mh: 2880 });
  const t = TV.lensGeometry({ x: 480, y: 360, stageW: 960, stageH: 720, srcW: 3840, srcH: 2880, dpr: 2, zoom: 1, lens: 240, touch: true });
  assert.ok(near(t.box.y, Math.round((360 - (240 * 0.6 + 16) - 120) * 2) / 2));
  assert.ok(near(t.box.x, 360));
  // Scaled phone stage: the lens still shows the 3840 source at 1:1.
  const p = TV.stageSize(960, 720, 2, 343.5);
  const g = TV.lensGeometry({ x: p.w / 2, y: p.h / 2, stageW: p.w, stageH: p.h, srcW: 3840, srcH: 2880, dpr: 2, zoom: 1, lens: 160, touch: true });
  assert.strictEqual(g.dev.mw, 3840);
  assert.ok(isInt(g.box.x * 2) && isInt(g.media.x * 2));
});

/* ---- sync ---- */
test('syncDecision: seek above 1.5 frames, nudge within 3 %, hold below a quarter frame', () => {
  const f = 1 / FPS, dur = 90 / FPS;
  let d = TV.syncDecision(1.0, 1.0 + 1.6 * f, FPS, dur);
  assert.deepStrictEqual([d.action, d.to, d.rate], ['seek', 1.0, 1]);
  d = TV.syncDecision(1.0, 1.0 - 1.6 * f, FPS, dur);
  assert.strictEqual(d.action, 'seek');
  d = TV.syncDecision(1.0, 1.0 + 1.4 * f, FPS, dur);
  assert.strictEqual(d.action, 'rate');
  assert.ok(d.rate < 1 && d.rate >= 0.97, 'lens ahead: slow down');
  d = TV.syncDecision(1.0, 1.0 - 1.4 * f, FPS, dur);
  assert.ok(d.action === 'rate' && d.rate > 1 && d.rate <= 1.03, 'lens behind: speed up');
  d = TV.syncDecision(1.0, 1.0 + 0.2 * f, FPS, dur);
  assert.deepStrictEqual([d.action, d.rate], ['hold', 1]);
  for (let k = -1.5; k <= 1.5; k += 0.05) {
    const x = TV.syncDecision(0.5, 0.5 + k * f, FPS, dur);
    assert.ok(x.rate >= 0.97 && x.rate <= 1.03, 'rate within 3 % at ' + k.toFixed(2));
    assert.notStrictEqual(x.action, 'seek');
  }
  // Across the loop point: the stage just wrapped, the lens is about to.
  d = TV.syncDecision(0.004, dur - 0.004, FPS, dur);
  assert.ok(near(d.drift, -0.008, 1e-9) && d.action === 'rate');
  d = TV.syncDecision(dur - 0.002, 0.003, FPS, dur);
  assert.ok(near(d.drift, 0.005, 1e-9) && d.action === 'rate');
  d = TV.syncDecision(0.1, dur / 2, FPS, dur);
  assert.strictEqual(d.action, 'seek');
  assert.ok(near(TV.wrap(dur * 0.75, dur), -dur / 4) && near(TV.wrap(-0.01, 0), -0.01));
});

/* Stub clips and timers for TV.syncStep. */
function stubVideo(t, dur) {
  const v = { currentTime: t, duration: dur, paused: false, seeking: false, playbackRate: 1, on: {} };
  v.addEventListener = (type, fn, opt) => { (v.on[type] = v.on[type] || []).push({ fn, once: !!(opt && opt.once) }); };
  v.fire = (type) => { const l = v.on[type] || []; v.on[type] = l.filter((x) => !x.once); l.forEach((x) => x.fn()); };
  return v;
}
function stubTimers() {
  let now = 0, list = [];
  return {
    later: (fn, ms) => { list.push({ fn, at: now + ms }); },
    advance(ms) {
      now += ms;
      const due = list.filter((x) => x.at <= now).sort((a, b) => a.at - b.at);
      list = list.filter((x) => x.at > now);
      due.forEach((x) => x.fn());
    }
  };
}

test('syncStep: seek, nudge, hold, and the seek lock', () => {
  const f = 1 / FPS, dur = 60 / FPS;
  const timers = stubTimers();
  let live = true;
  const o = (extra) => Object.assign({ fps: FPS, frozen: false, current: () => live, later: timers.later }, extra);
  const sv = stubVideo(0.5, dur), lv = stubVideo(0.5 + 15 * f, dur);
  const ins = { lead: 0.08, busy: false, rec: null };
  let d = TV.syncStep(sv, lv, ins, o());
  assert.strictEqual(d.action, 'seek');
  assert.ok(ins.busy && ins.seeks === 1 && near(lv.currentTime, 0.58) && lv.playbackRate === 1);
  assert.strictEqual(TV.syncStep(sv, lv, ins, o()), null, 'no second seek while the first is in flight');
  // The sync is restarted (resize, font load) before the seek lands: the lock is still released.
  live = false;
  lv.fire('seeked');
  timers.advance(100);
  assert.strictEqual(ins.busy, false, 'lock released after a restart');
  assert.strictEqual(ins.lead, 0.08, 'no lead update from a replaced run');
  live = true;
  lv.currentTime = 0.5 + 12 * f;
  d = TV.syncStep(sv, lv, ins, o());
  assert.ok(d.action === 'seek' && ins.seeks === 2, 'the restarted sync seeks again');
  // A seek that lands: the drift 100 ms later adjusts the lead.
  sv.currentTime = 0.55; lv.currentTime = 0.58;
  lv.fire('seeked');
  timers.advance(99);
  assert.ok(ins.busy, 'held until 100 ms after seeked');
  timers.advance(1);
  assert.ok(!ins.busy && near(ins.lead, TV.nextLead(0.08, 0.03)));
  // A seek that never reports back: released after 2 s.
  lv.currentTime = sv.currentTime + 10 * f;
  TV.syncStep(sv, lv, ins, o());
  assert.ok(ins.busy);
  timers.advance(1999);
  assert.ok(ins.busy);
  timers.advance(1);
  assert.strictEqual(ins.busy, false);
  timers.advance(5000);   // the late 'seeked' timer of the lock above finds nothing to do
  // Small drift: nudge the rate; tiny drift: rate 1.
  sv.currentTime = 0.3; lv.currentTime = 0.3 + f;
  d = TV.syncStep(sv, lv, ins, o());
  assert.ok(d.action === 'rate' && lv.playbackRate < 1 && lv.playbackRate >= 0.97);
  lv.currentTime = 0.3 + 0.1 * f;
  TV.syncStep(sv, lv, ins, o());
  assert.strictEqual(lv.playbackRate, 1);
  // Paused, frozen, seeking or no duration: nothing compared.
  lv.currentTime = 0.9;
  for (const [obj, k, val] of [[sv, 'paused', true], [lv, 'paused', true], [lv, 'seeking', true], [sv, 'duration', NaN]]) {
    const old = obj[k]; obj[k] = val;
    assert.strictEqual(TV.syncStep(sv, lv, ins, o()), null, k);
    obj[k] = old;
  }
  assert.strictEqual(TV.syncStep(sv, lv, ins, o({ frozen: true })), null);
  // With a recent lens frame callback both positions come from the same display time.
  ins.rec = { mediaTime: 0.3, at: 1000 };
  d = TV.syncStep(sv, lv, ins, o({ meta: { mediaTime: 0.3 + 0.016, expectedDisplayTime: 1016 } }));
  assert.ok(Math.abs(d.drift) < 1e-3 && d.action === 'hold', 'drift from the frame callbacks: ' + d.drift);
});

test('seekTarget, nextLead, frameTime', () => {
  const dur = 90 / FPS;
  assert.ok(near(TV.seekTarget(1.0, 0.08, dur), 1.08));
  assert.ok(near(TV.seekTarget(dur - 0.02, 0.08, dur), 0.06));
  assert.strictEqual(TV.seekTarget(0.5, 0.1, NaN), 0.6);
  assert.ok(near(TV.nextLead(0.08, -0.05), 0.13));   // landed 50 ms behind: lead more
  assert.ok(near(TV.nextLead(0.08, 0.02), 0.06));
  assert.strictEqual(TV.nextLead(0.1, 1), 0);
  assert.strictEqual(TV.nextLead(0.4, -1), 0.5);
  for (let i = 0; i < 2000; i++) assert.strictEqual(TV.frameIndex(TV.frameTime(i, FPS), FPS), i);
  assert.ok(near(TV.frameTime(30, FPS), 30.5 / FPS));
  assert.strictEqual(TV.frameIndex(0, FPS), 0);
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

test('caption, labels, sizes', () => {
  const g = TV.gameById(live, 'mega-man-2-title'), p = TV.presetById(live, 'sony_pvm_14l2');
  assert.strictEqual(TV.caption(g, p), 'Mega Man 2 · Rooftop title · Sony PVM-14L2 · Focused beam, fine aperture grille, D65, composite');
  assert.strictEqual(TV.caption({ title: 'G' }, { name: 'P' }), 'G · P');
  assert.strictEqual(TV.lensLabel(1, 'Sony PVM-14L2'), '1:1 · Sony PVM-14L2');
  assert.strictEqual(TV.lensLabel(4, ''), '4:1');
  assert.strictEqual(TV.formatBytes(48012345), '48.0 MB');
  assert.strictEqual(TV.formatBytes(262188), '262 kB');
  assert.strictEqual(TV.formatBytes(0), '');
  assert.strictEqual(TV.loadingText('clip', 3840, 2880, 48000000), 'Loading the 3840×2880 clip, 48.0 MB');
  assert.strictEqual(TV.loadingText('frame', 3840, 2880, 0), 'Loading the 3840×2880 frame');
  assert.strictEqual(TV.loadingText('frame', null, null, null), 'Loading the full-resolution frame');
  // Progress: nothing before the first byte, then percent, or bytes without a total.
  assert.strictEqual(TV.loadedText(0, 48000000), '');
  assert.strictEqual(TV.loadedText(12400000, 48000000), ' · 25 %');
  assert.strictEqual(TV.loadedText(48000000, 48000000), ' · 100 %');
  assert.strictEqual(TV.loadedText(50000000, 48000000), ' · 100 %');   // Content-Length and manifest disagree
  assert.strictEqual(TV.loadedText(2e6, 0), ' · 2.0 MB');
  assert.strictEqual(TV.gameById(live, 'nope'), null);
  assert.strictEqual(TV.presetById(live, 'nope'), null);
});

test('stageControl: play, freeze, inspect a still, or nothing', () => {
  const still = { tier: 'still', still: { width: 3840, height: 2880 } }, none = { tier: 'none', reason: TV.NO_CAPTURE };
  const lens = { tier: 'lens', lens: {} };
  const sc = (o) => TV.stageControl(Object.assign({ video: true, playing: true, frozen: false, inspecting: false, tier: lens }, o));
  assert.deepStrictEqual(sc({ playing: false }), { mode: 'play', label: 'Play the clip', pressed: false, off: false });
  assert.deepStrictEqual(sc({}), { mode: 'freeze', label: 'Freeze the picture', pressed: false, off: false });
  assert.deepStrictEqual(sc({ frozen: true }), { mode: 'freeze', label: 'Resume the clip', pressed: true, off: false });
  assert.strictEqual(sc({ tier: still }).mode, 'freeze');                 // a clip and a still: the stage freezes the clip
  // No clip: the stage opens the still, whether or not playback has started.
  for (const playing of [true, false]) {
    assert.deepStrictEqual(sc({ video: false, playing, tier: still }), { mode: 'inspect', label: 'Inspect the 3840×2880 frame', pressed: false, off: false });
  }
  assert.strictEqual(sc({ video: false, tier: still, inspecting: true, frozen: true }).pressed, true);
  assert.strictEqual(sc({ video: false, tier: { tier: 'still', still: {} } }).label, 'Inspect the full-resolution frame');
  assert.deepStrictEqual(sc({ video: false, tier: none }), { mode: 'none', label: 'Freeze the picture', pressed: false, off: true });
});

test('rangeChip', () => {
  const hdr = grille.stage.find((s) => s.hdr);
  const c = TV.rangeChip(hdr, grille, { hdrDisplay: true });
  assert.deepStrictEqual(c, { text: 'HDR', title: 'HDR10 source (PQ, BT.2020), SDR white at 203 nits, brightest pixel 812 nits' });
  const sdr = grille.stage.find((s) => !s.hdr);
  assert.strictEqual(TV.rangeChip(sdr, grille, { hdrDisplay: false }).title, 'SDR source: this display does not report HDR');
  assert.strictEqual(TV.rangeChip(sdr, grille, { hdrDisplay: true }).title, 'SDR source: this browser cannot decode the HDR file');
  assert.strictEqual(TV.rangeChip(dots.stage[0], dots, { hdrDisplay: true }).title, 'SDR source: no HDR render of this clip yet');
  assert.strictEqual(TV.rangeChip(null, slot, { hdrDisplay: true }).text, 'SDR');
});

/* ---- markup and CSS ---- */
test('no canvas, no media effects, CSS moved to tv.css', () => {
  const js = read('assets/js/tv-switcher.js'), html = read('_includes/tv-switcher.html');
  const css = read('assets/css/tv.css').replace(/\/\*[\s\S]*?\*\//g, '');   // rules only, not the comments
  assert.ok(!/canvas|getContext|drawImage/i.test(js.replace(/\/\*[\s\S]*?\*\//g, '')), 'script uses no canvas');
  assert.ok(!/<canvas/i.test(html), 'markup has no canvas');
  assert.ok(!/clip-path|mix-blend-mode|backdrop-filter|(^|[\s;{])filter\s*:/m.test(css), 'no clip-path, filters or blend modes');
  // opacity below 1 only on controls, never on the stage, lens or their media.
  for (const m of css.matchAll(/([^{}]+)\{[^}]*opacity\s*:\s*([\d.]+)/g)) {
    if (Number(m[2]) < 1) assert.ok(/^\s*\.tv-(chip|btn)\b/.test(m[1].trim().split('\n').pop()), 'opacity on ' + m[1].trim());
  }
  assert.ok(/\.tv-lens\s*\{[^}]*border-radius:\s*50%[^}]*overflow:\s*hidden/.test(css), 'round lens by radius and overflow');
  assert.ok(/\.tv-video, \.tv-frame\s*\{[^}]*dynamic-range-limit:\s*no-limit/.test(css), 'stage media: no HDR limit');
  assert.ok(/\.tv-lens-media\s*\{[^}]*dynamic-range-limit:\s*no-limit/.test(css), 'lens media: no HDR limit');
  assert.ok(/\.tv-lens-media\.is-zoomed\s*\{\s*image-rendering:\s*pixelated/.test(css), 'pixelated above 1:1');
  assert.ok(!/\.tv[-\s.{]/.test(read('assets/css/style.css')), 'no .tv rules left in style.css');
  assert.ok(html.includes("'/assets/css/tv.css' | relative_url"), 'include links tv.css');
  assert.ok(html.includes(TV.FIT_NOTE), 'fit note text');
  assert.ok(/<noscript>/.test(html), 'noscript fallback');
  // The notice is a live region; its progress counter is not.
  assert.ok(html.includes('<p class="tv-notice" role="status" hidden><span class="tv-notice-text"></span><span class="tv-notice-bytes" aria-hidden="true"></span></p>'), 'notice markup');
  // Controls that can become unavailable keep their focus: aria-disabled, never the disabled property.
  assert.ok(!/<button[^>]*\sdisabled[\s>]/.test(html), 'no disabled buttons in the markup');
  assert.ok(!/\.disabled\s*=/.test(js), 'the script never sets .disabled');
});

test('seed poster: 2x media query and the no-script fit note', () => {
  const html = read('_includes/tv-switcher.html'), css = read('assets/css/tv.css');
  const inc = /tv_media_2x = "([^"]+)"/.exec(html);
  assert.ok(inc && html.includes('<source media="{{ tv_media_2x }}"'), 'include: <source> with the 2x media query');
  const rule = /@media ([^{]+)\{\s*\.tv\[data-width2\]\s*\{\s*--tv-sw:\s*var\(--tv-w2\);\s*--tv-sh:\s*var\(--tv-h2\);/.exec(css);
  assert.ok(rule, 'tv.css: stage sized from --tv-w2 under a media query');
  assert.strictEqual(rule[1].trim(), inc[1]);
  // The query holds where the 2x poster fits the switcher (min(960px, 100vw - 2 gutters)) at
  // each --tv-dpr step of tv.css: 1920/2 = 960 CSS px needs a 992 px window, 1920/3 = 640 needs 672.
  const gutter = Number(/--gutter:\s*(\d+)px/.exec(read('assets/css/style.css'))[1]);
  const steps = [...css.matchAll(/@media \(min-resolution: [\d.]+dppx\) \{ \.tv \{ --tv-dpr: ([\d.]+); \} \}/g)].map((m) => Number(m[1]));
  assert.deepStrictEqual(steps, [1.25, 1.5, 2, 3]);
  const expect = [1, ...steps].filter((d) => 1920 / d <= 960).map((d) => `(min-resolution: ${d}dppx) and (min-width: ${1920 / d + 2 * gutter}px)`);
  assert.strictEqual(inc[1], expect.join(', '));
  // Without JavaScript the note under the poster shows except where the 960 poster (or the 2x
  // poster, which uses a subset of these windows) is at one pixel per device pixel.
  const note = /@media ([^{]+)\{\s*\.tv-fit-static \{ display: none; \}/.exec(css);
  assert.ok(note, 'tv.css: rule that hides the static fit note');
  assert.strictEqual(note[1].replace(/\s+/g, ' ').trim(),
    [1, ...steps].map((d) => `(resolution: ${d}dppx) and (min-width: ${960 / d + 2 * gutter}px)`).join(', '));
  assert.ok(/<noscript><p class="tv-fit tv-fit-static">[^<]+<\/p><\/noscript>/.test(html), 'include: static fit note in <noscript>');
  // The fixture page seeds both posters of its first clip.
  const page = read('tools/tv-fixture/index.html');
  const g = TV.clipFor(fixture, 'test-pattern', 'fixture_grille');
  assert.strictEqual(TV.choosePoster(g.posters, 960).src, /poster="([^"]+)"/.exec(page)[1]);
  assert.strictEqual(TV.choosePoster(g.posters, 1920).src, /poster_2x="([^"]+)"/.exec(page)[1]);
});

Promise.all(pending).then(() => {
  console.log('tv-switcher: ' + n + ' tests passed' + (haveFfprobe ? '' : ' (ffprobe not found: clip probes skipped)'));
}, (e) => { console.error(e); process.exit(1); });
