/* MyNES television switcher: the landing-page hero.
 *
 * One game recording plays on a stack of <video> elements, one per CRT
 * preset that has a clip. All clips of a game come from the same input
 * replay, so switching presets seeks the new clip to the old clip's time and
 * raises it: the television changes while the game goes on.
 *
 * The stage shows a clip at one source pixel per device pixel. Of the stage
 * sources the widest one that fits the window at the display's pixel ratio
 * is used (1920 px on a 2x display, 960 px on a 1x display); its CSS size is
 * the source size divided by devicePixelRatio and its page position is
 * rounded to whole device pixels. Only when no source fits is the picture
 * scaled down, and a note under it says so.
 *
 * Inspect opens a round lens over the stage. It never magnifies the stage
 * clip. With a lens clip for the preset, the lens holds the 3840x2880 clip,
 * kept in step with the stage through requestVideoFrameCallback. With only a
 * still, the stage freezes on the still's frame and the lens holds the
 * still. The lens media sits in the lens element at 1:1 (or 2:1, 4:1),
 * placed with a CSS translate on whole device pixels. There is no canvas.
 *
 * HDR sources are used when the display matches (dynamic-range: high) and
 * the browser reports that it can decode PQ BT.2020 for the file; otherwise
 * the SDR render.
 *
 * Vanilla ES2018, no dependencies. Data comes from assets/hero/manifest.json
 * (version 1 or 2, schema in assets/hero/README.md). The pure helpers in `TV`
 * have no DOM dependency and are exported for tools/test_tv_switcher.js.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Pure helpers                                                        */
  /* ------------------------------------------------------------------ */
  var TV = {};

  TV.DEFAULT_FPS = 60.0988;
  TV.NO_CAPTURE = 'Full-resolution capture not rendered yet';
  TV.NO_DECODER = 'This browser cannot decode the full-resolution clip';
  TV.FIT_NOTE = 'Scaled to fit this window. Inspect shows 1:1.';

  function num(v) { var n = Number(v); return v !== null && v !== '' && isFinite(n) && n > 0 ? n : null; }
  function str(v) { return typeof v === 'string' && v ? v : null; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---- Manifest ------------------------------------------------------ */

  /** One media file: {src, type, hdr, width, height, bytes}; null when unusable. */
  TV.normalizeSource = function (s) {
    if (typeof s === 'string') s = { src: s };
    if (!s || !str(s.src)) return null;
    var type = str(s.type) || 'video/mp4';
    if (str(s.codecs) && type.indexOf('codecs') < 0) type += '; codecs="' + s.codecs + '"';
    return { src: s.src, type: type, hdr: s.hdr === true, width: num(s.width), height: num(s.height), bytes: num(s.bytes) };
  };

  /** Posters as a list of {src, width, height}: v2 allows a path, an object or a list of either. */
  TV.normalizePosters = function (p) {
    return (Array.isArray(p) ? p : p ? [p] : []).map(function (x) {
      if (typeof x === 'string') return x ? { src: x, width: null, height: null } : null;
      return x && str(x.src) ? { src: x.src, width: num(x.width), height: num(x.height) } : null;
    }).filter(Boolean);
  };

  /**
   * A clip in the shape the component uses, from either manifest version:
   * {stage[], lens[], posters[], still, hdr, full}. Version 1 clips have one
   * SDR `video` of unknown size and a still of frame 0 (the lossless `full`
   * PNG when there is one, else the `still` WebP).
   */
  TV.normalizeClip = function (c, version) {
    if (!c || typeof c !== 'object') return null;
    var out = { stage: [], lens: [], posters: TV.normalizePosters(c.poster), still: null, hdr: null, full: null };
    if (version >= 2) {
      var list = function (a) { return (Array.isArray(a) ? a : []).map(TV.normalizeSource).filter(Boolean); };
      out.stage = list(c.stage);
      out.lens = list(c.lens);
      var s = c.still;
      if (s && typeof s === 'object' && (str(s.hdr) || str(s.sdr))) {
        out.still = { hdr: str(s.hdr), sdr: str(s.sdr), width: num(s.width), height: num(s.height),
          frame: Math.max(0, Math.floor(Number(s.frame) || 0)) };
      }
      var h = c.hdr;
      if (h && typeof h === 'object') {
        out.hdr = { white_nits: num(h.white_nits), headroom: num(h.headroom), max_cll: num(h.max_cll), max_fall: num(h.max_fall) };
      }
      out.full = out.still ? out.still.sdr || out.still.hdr : null;
    } else {
      if (str(c.video)) out.stage = [TV.normalizeSource(c.video)];
      var img = str(c.full) || str(c.still);
      var size = Array.isArray(c.still_size) ? c.still_size : [];
      if (img) out.still = { hdr: null, sdr: img, width: num(size[0]), height: num(size[1]), frame: 0 };
      out.full = img;
    }
    return out;
  };

  /** Either manifest version in one shape; ids are deduplicated and clips without media dropped. */
  TV.normalize = function (raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var version = Number(raw.version) >= 2 ? 2 : 1;
    var aspect = Array.isArray(raw.aspect) && num(raw.aspect[0]) && num(raw.aspect[1]) ? [Number(raw.aspect[0]), Number(raw.aspect[1])] : [4, 3];
    var seen = {};
    var uniq = function (prefix) { return function (x) { var k = prefix + x.id; if (seen[k]) return false; seen[k] = true; return true; }; };
    var m = {
      version: version, fps: num(raw.fps) || TV.DEFAULT_FPS, aspect: aspect,
      presets: (Array.isArray(raw.presets) ? raw.presets : []).filter(function (p) { return p && str(p.id); })
        .map(function (p) { return { id: p.id, name: str(p.name) || p.id, blurb: str(p.blurb) || '' }; }).filter(uniq('p:')),
      games: (Array.isArray(raw.games) ? raw.games : []).filter(function (g) { return g && str(g.id); })
        .map(function (g) { return { id: g.id, title: str(g.title) || g.id, scene: str(g.scene) || '', default_preset: str(g.default_preset) }; }).filter(uniq('g:')),
      clips: {}
    };
    var clips = raw.clips && typeof raw.clips === 'object' ? raw.clips : {};
    Object.keys(clips).forEach(function (gid) {
      var byPreset = clips[gid] && typeof clips[gid] === 'object' ? clips[gid] : {};
      Object.keys(byPreset).forEach(function (pid) {
        var c = TV.normalizeClip(byPreset[pid], version);
        if (!TV.hasMedia(c)) return;
        (m.clips[gid] = m.clips[gid] || {})[pid] = c;
      });
    });
    return m;
  };

  /** Clip entry for a game/preset pair, or null. */
  TV.clipFor = function (m, gameId, presetId) {
    var g = m.clips && m.clips[gameId];
    return (g && g[presetId]) || null;
  };

  /** A clip can be shown when it has a stage clip, a poster or a still. */
  TV.hasMedia = function (clip) {
    return !!(clip && ((clip.stage && clip.stage.length) || (clip.posters && clip.posters.length) || clip.still));
  };

  /** Preset ids (in chip order) that have media for the game. */
  TV.available = function (m, gameId, broken) {
    return (m.presets || []).map(function (p) { return p.id; }).filter(function (id) {
      var clip = TV.clipFor(m, gameId, id);
      if (!TV.hasMedia(clip)) return false;
      // A clip whose videos all failed is still usable when it has a still or poster.
      return !(broken && broken[gameId + '/' + id] && !clip.still && !clip.posters.length);
    });
  };

  /** Keep `wanted` if the game has it, else the game's default, else the first available. */
  TV.choosePreset = function (m, gameId, wanted, broken) {
    var avail = TV.available(m, gameId, broken);
    var game = TV.gameById(m, gameId);
    if (avail.indexOf(wanted) >= 0) return wanted;
    if (game && avail.indexOf(game.default_preset) >= 0) return game.default_preset;
    return avail.length ? avail[0] : null;
  };

  TV.gameById = function (m, id) {
    return (m.games || []).filter(function (g) { return g.id === id; })[0] || null;
  };
  TV.presetById = function (m, id) {
    return (m.presets || []).filter(function (p) { return p.id === id; })[0] || null;
  };

  /** Next/previous entry of `list` after `current`, wrapping. */
  TV.step = function (list, current, delta) {
    if (!list.length) return null;
    var i = list.indexOf(current);
    if (i < 0) return list[0];
    return list[(i + delta + list.length) % list.length];
  };

  /** Number keys 1-9 pick the nth chip (in manifest order) when it is available. */
  TV.keyPreset = function (key, m, available) {
    if (!/^[1-9]$/.test(key)) return null;
    var p = (m.presets || [])[Number(key) - 1];
    return p && available.indexOf(p.id) >= 0 ? p.id : null;
  };

  /* ---- Capabilities and source choice -------------------------------- */

  /** Key of a source in the capability table filled by the page. */
  TV.capKey = function (s) {
    return s.type + '|' + (s.hdr ? 'pq' : 'sdr') + '|' + (s.width || 0) + 'x' + (s.height || 0);
  };

  /** navigator.mediaCapabilities.decodingInfo() argument, or null when the type names no codec. */
  TV.decodingConfig = function (s, fps) {
    if (!/codecs=/.test(s.type)) return null;
    var w = s.width || 960, h = s.height || 720, rate = fps || TV.DEFAULT_FPS;
    var video = { contentType: s.type, width: w, height: h, framerate: rate, bitrate: Math.round(w * h * rate * 0.1) };
    if (s.hdr) { video.transferFunction = 'pq'; video.colorGamut = 'rec2020'; }
    return { type: 'file', video: video };
  };

  /**
   * Whether a source may be used. `env.caps[capKey]` holds the page's probe
   * ({supported, smooth, powerEfficient}). An HDR source needs an HDR
   * display and a positive probe; an SDR source without a probe is assumed
   * to play (version 1 clips name no codec).
   */
  TV.playable = function (s, env) {
    if (env.broken && env.broken[s.src]) return false;
    if (s.hdr && !env.hdrDisplay) return false;
    var c = env.caps && env.caps[TV.capKey(s)];
    return c ? !!c.supported : !s.hdr;
  };

  function rank(s, caps) {
    var c = caps && caps[TV.capKey(s)];
    return c ? (c.powerEfficient ? 2 : 0) + (c.smooth ? 1 : 0) : 0;
  }

  /** First entry of the highest rank; manifest order breaks ties. */
  function best(list, caps) {
    return list.reduce(function (a, b) { return rank(b, caps) > rank(a, caps) ? b : a; });
  }

  /**
   * Of items with a known width, those of the widest width whose CSS size
   * (width / dpr) fits `availW`; when none fits, those of the narrowest
   * width, which the page then scales down. Items without a width are used
   * only when no item has one.
   */
  TV.bySize = function (items, dpr, availW) {
    var known = items.filter(function (s) { return s.width; });
    if (!known.length) return items.slice();
    var fits = known.filter(function (s) { return s.width / dpr <= availW + 1e-6; });
    var pool = fits.length ? fits : known;
    var width = pool.reduce(function (w, s) { return fits.length ? Math.max(w, s.width) : Math.min(w, s.width); }, pool[0].width);
    return known.filter(function (s) { return s.width === width; });
  };

  /**
   * Stage source: size first (see bySize), then HDR over SDR, then the
   * decoder's power-efficient and smooth flags, then manifest order.
   * env: {dpr, availW, hdrDisplay, caps, broken}. Null when nothing plays.
   */
  TV.chooseStage = function (sources, env) {
    var ok = (sources || []).filter(function (s) { return TV.playable(s, env); });
    if (!ok.length) return null;
    var same = TV.bySize(ok, env.dpr, env.availW);
    var hdr = same.filter(function (s) { return s.hdr; });
    return best(hdr.length ? hdr : same, env.caps);
  };

  /** Lens clip: HDR when it plays, else SDR; null when none plays. */
  TV.chooseLens = function (sources, env) {
    var ok = (sources || []).filter(function (s) { return TV.playable(s, env); });
    if (!ok.length) return null;
    var hdr = ok.filter(function (s) { return s.hdr; });
    return best(hdr.length ? hdr : ok, env.caps);
  };

  /**
   * Still for the lens: the HDR AVIF on an HDR display that decodes AVIF,
   * else the lossless SDR file. Files in env.broken are skipped.
   */
  TV.chooseStill = function (still, env) {
    if (!still) return null;
    var broken = env.broken || {};
    var hdr = still.hdr && !broken[still.hdr] ? still.hdr : null, sdr = still.sdr && !broken[still.sdr] ? still.sdr : null;
    if (!hdr && !sdr) return null;
    var useHdr = !!hdr && (!!env.hdrDisplay && env.avif !== false || !sdr);
    var src = useHdr ? hdr : sdr;
    return { src: src, hdr: useHdr, width: still.width, height: still.height, frame: still.frame };
  };

  /** Poster for a stage picture `width` source pixels wide: an exact match, else one of unknown size. */
  TV.choosePoster = function (posters, width) {
    var list = posters || [];
    return list.filter(function (p) { return width && p.width === width; })[0] ||
      list.filter(function (p) { return !p.width; })[0] || null;
  };

  /**
   * What Inspect can do for a clip: 'lens' (a lens clip plays and the stage
   * has a clip to follow), 'still' (a still frame) or 'none' with the reason
   * shown next to the disabled button.
   */
  TV.inspectTier = function (clip, env, stageSource) {
    if (!clip) return { tier: 'none', reason: TV.NO_CAPTURE };
    var lens = stageSource ? TV.chooseLens(clip.lens, env) : null;
    if (lens) return { tier: 'lens', lens: lens };
    var still = TV.chooseStill(clip.still, env);
    if (still) return { tier: 'still', still: still };
    return { tier: 'none', reason: clip.lens && clip.lens.length ? TV.NO_DECODER : TV.NO_CAPTURE };
  };

  /* ---- Geometry ------------------------------------------------------ */

  /**
   * Width available to the stage: the switcher's CSS width (fractional at
   * browser zoom levels) cut down to whole device pixels, so a source chosen
   * to fit is never narrowed by max-width: 100%.
   */
  TV.availWidth = function (cssW, dpr) {
    return cssW > 0 ? Math.floor(cssW * dpr + 1e-3) / dpr : 0;
  };

  /** CSS offset that moves `pos` (CSS px from the page origin) onto a whole device pixel. */
  TV.snapOffset = function (pos, dpr) {
    return Math.round(pos * dpr) / dpr - pos;
  };

  /**
   * Stage box for a srcW x srcH picture: one source pixel per device pixel
   * (CSS size = source / dpr) when that fits `availW` CSS px; otherwise the
   * widest whole number of device pixels that fits, with `scaled` set.
   */
  TV.stageSize = function (srcW, srcH, dpr, availW) {
    if (srcW / dpr <= availW + 1e-6) return { w: srcW / dpr, h: srcH / dpr, devW: srcW, devH: srcH, scaled: false };
    var devW = Math.max(1, Math.floor(availW * dpr + 1e-6));
    var devH = Math.max(1, Math.round(devW * srcH / srcW));
    return { w: devW / dpr, h: devH / dpr, devW: devW, devH: devH, scaled: true };
  };

  /**
   * Lens diameter in CSS px: 240 (160 on narrow windows), at most 60 % of
   * the stage's shorter side so a small native stage (960x720 at 3x is
   * 320x240 CSS px) still shows the picture around the lens.
   */
  TV.lensSize = function (stageW, stageH, narrow) {
    return Math.max(64, Math.min(narrow ? 160 : 240, Math.floor(0.6 * Math.min(stageW, stageH))));
  };

  /** Lens diameter: an even number of device pixels close to `css` CSS px. */
  TV.lensDiameter = function (css, dpr) {
    var dev = Math.max(2, 2 * Math.round(css * dpr / 2));
    return { dev: dev, css: dev / dpr };
  };

  /**
   * Lens box and lens media placement, all on whole device pixels.
   * p: {x, y} pointer in stage CSS px; {stageW, stageH} stage CSS size;
   * {srcW, srcH} size of the lens source; dpr; zoom (1, 2, 4); lens (CSS
   * diameter); touch (the lens then sits above the finger).
   * The source pixel under the pointer is shown at the lens centre, `zoom`
   * device pixels per source pixel.
   */
  TV.lensGeometry = function (p) {
    var dpr = p.dpr, z = p.zoom || 1;
    var L = TV.lensDiameter(p.lens, dpr).dev;
    var sw = Math.round(p.stageW * dpr), sh = Math.round(p.stageH * dpr);
    var cx = p.x * dpr, cy = (p.y - (p.touch ? p.lens * 0.6 + 16 : 0)) * dpr;
    var bx = clamp(Math.round(cx - L / 2), 0, Math.max(0, sw - L));
    var by = clamp(Math.round(cy - L / 2), 0, Math.max(0, sh - L));
    var sx = p.x / p.stageW * p.srcW, sy = p.y / p.stageH * p.srcH;
    var mx = Math.round(L / 2 - sx * z), my = Math.round(L / 2 - sy * z);
    return {
      size: L / dpr,
      box: { x: bx / dpr, y: by / dpr },
      media: { x: mx / dpr, y: my / dpr, w: p.srcW * z / dpr, h: p.srcH * z / dpr },
      dev: { size: L, x: bx, y: by, mx: mx, my: my, mw: p.srcW * z, mh: p.srcH * z },
      source: { x: sx, y: sy }
    };
  };

  /* ---- Keeping the lens clip in step ---------------------------------- */

  /** `d` wrapped into (-dur/2, dur/2]: both clips loop, so a lead of almost a loop is a small lag. */
  TV.wrap = function (d, dur) {
    if (!(dur > 0)) return d;
    d = ((d % dur) + dur) % dur;
    return d > dur / 2 ? d - dur : d;
  };

  /**
   * What to do with the lens clip given both clips' times. Above 1.5 frames
   * of drift: seek to the stage. Below a quarter frame: play at rate 1.
   * Between: nudge playbackRate to close the gap in about a second, within
   * 3 % either way.
   */
  TV.syncDecision = function (stageT, lensT, fps, dur) {
    var frame = 1 / (fps || TV.DEFAULT_FPS), drift = TV.wrap(lensT - stageT, dur);
    if (Math.abs(drift) > 1.5 * frame) return { action: 'seek', drift: drift, to: stageT, rate: 1 };
    if (Math.abs(drift) < 0.25 * frame) return { action: 'hold', drift: drift, rate: 1 };
    return { action: 'rate', drift: drift, rate: clamp(1 - drift, 0.97, 1.03) };
  };

  /** Seek target: the stage time plus the learned seek latency, inside the clip. */
  TV.seekTarget = function (stageT, lead, dur) {
    var t = stageT + lead;
    return dur > 0 ? ((t % dur) + dur) % dur : Math.max(0, t);
  };

  /** New seek lead from the drift measured after a seek (negative drift: the lens landed behind). */
  TV.nextLead = function (lead, driftAfter) {
    return clamp(lead - driftAfter, 0, 0.5);
  };

  /**
   * One step of the lens sync. `sv` is the stage clip and `lv` the lens clip
   * (<video> elements, or objects with the same fields in tests); `ins`
   * keeps the state between steps: {lead, busy, rec, seeks, drift}. o:
   * {fps, frozen, meta (the stage frame callback's metadata, if any),
   * current() (whether this sync run is still the live one), later
   * (setTimeout)}. When the lens clip's own frame callback is recent (rec),
   * both positions are taken at the same display time; otherwise from
   * currentTime.
   *
   * A corrective seek holds ins.busy until 100 ms after the lens clip's
   * 'seeked' (the landing error then adjusts the lead) or 2 s at the
   * latest. The lock is released even when the sync was restarted in the
   * meantime; only the lead update is skipped then, because the stage clip
   * may have changed. Returns the decision, or null when nothing was
   * compared.
   */
  TV.syncStep = function (sv, lv, ins, o) {
    if (o.frozen || sv.paused || lv.paused || lv.seeking || ins.busy || !(sv.duration > 0)) return null;
    var stageT, lensT, rec = ins.rec, meta = o.meta;
    if (meta && rec && Math.abs(meta.expectedDisplayTime - rec.at) < 50) {
      stageT = meta.mediaTime;
      lensT = rec.mediaTime + (meta.expectedDisplayTime - rec.at) / 1000 * lv.playbackRate;
    } else {
      stageT = sv.currentTime; lensT = lv.currentTime;
    }
    var d = TV.syncDecision(stageT, lensT, o.fps, sv.duration);
    ins.drift = d.drift;
    if (d.action === 'seek') {
      var lock = ins.busy = { drift: d.drift };
      ins.seeks = (ins.seeks || 0) + 1;
      lv.playbackRate = 1;
      var release = function () {
        if (ins.busy !== lock) return;
        ins.busy = false;
        if (o.current() && !sv.paused && !lv.paused) ins.lead = TV.nextLead(ins.lead, TV.wrap(lv.currentTime - sv.currentTime, sv.duration));
      };
      lv.addEventListener('seeked', function () { o.later(release, 100); }, { once: true });
      o.later(release, 2000);
      try { lv.currentTime = TV.seekTarget(sv.currentTime, ins.lead, sv.duration); } catch (e) { /* no metadata yet: the lock times out */ }
    } else if (Math.abs(lv.playbackRate - d.rate) > 1e-3) {
      lv.playbackRate = d.rate;
    }
    return d;
  };

  /** Time in the middle of frame `n`, where a seek shows exactly that frame. */
  TV.frameTime = function (n, fps) { return (n + 0.5) / (fps || TV.DEFAULT_FPS); };
  TV.frameIndex = function (t, fps) { return Math.max(0, Math.floor(t * (fps || TV.DEFAULT_FPS) + 1e-6)); };

  /* ---- Policy and text ------------------------------------------------- */

  /** Background prefetch is skipped on metered or slow connections. */
  TV.prefetchAllowed = function (conn) {
    if (!conn) return true;
    if (conn.saveData) return false;
    return !/^(slow-2g|2g|3g)$/.test(conn.effectiveType || '');
  };

  TV.caption = function (game, preset) {
    return [game.title, game.scene, preset.name, preset.blurb].filter(Boolean).join(' · ');
  };

  TV.lensLabel = function (zoom, presetName) {
    return zoom + ':1' + (presetName ? ' · ' + presetName : '');
  };

  TV.formatBytes = function (n) {
    if (!(n > 0)) return '';
    return n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' kB';
  };

  TV.sizeLabel = function (w, h) { return w && h ? w + '×' + h : 'full-resolution'; };

  /** "Loading the 3840×2880 clip: 12.4 MB of 48.0 MB" */
  TV.loadingText = function (what, w, h, loaded, total) {
    var s = 'Loading the ' + TV.sizeLabel(w, h) + ' ' + what;
    if (total > 0) return s + ': ' + TV.formatBytes(loaded || 1) + ' of ' + TV.formatBytes(total);
    return loaded > 0 ? s + ': ' + TV.formatBytes(loaded) : s;
  };

  /** Text next to the Inspect button. */
  TV.inspectNote = function (t) {
    if (t.tier === 'lens') return [TV.sizeLabel(t.lens.width, t.lens.height) + ' clip', TV.formatBytes(t.lens.bytes)].filter(Boolean).join(', ');
    if (t.tier === 'still') return TV.sizeLabel(t.still.width, t.still.height) + ' frame';
    return t.reason;
  };

  /**
   * The HDR/SDR chip: {text, title}. `source` is the stage source (null for
   * a still picture), `clip` the normalised clip, env as for chooseStage.
   */
  TV.rangeChip = function (source, clip, env) {
    if (source && source.hdr) {
      var h = (clip && clip.hdr) || {};
      var bits = ['HDR10 source (PQ, BT.2020)'];
      if (h.white_nits) bits.push('SDR white at ' + h.white_nits + ' nits');
      if (h.max_cll) bits.push('brightest pixel ' + h.max_cll + ' nits');
      return { text: 'HDR', title: bits.join(', ') };
    }
    var hasHdr = !!(clip && clip.stage.some(function (s) { return s.hdr; }));
    var why = !source ? 'still picture' :
      !hasHdr ? 'no HDR render of this clip yet' :
      !env.hdrDisplay ? 'this display does not report HDR' : 'this browser cannot decode the HDR file';
    return { text: 'SDR', title: 'SDR source: ' + why };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = TV;
  global.TVSwitcher = TV;
  if (typeof document === 'undefined') return;

  /* ------------------------------------------------------------------ */
  /* DOM component                                                       */
  /* ------------------------------------------------------------------ */

  /* 1x1 10-bit PQ AVIF: whether the browser decodes the HDR stills. */
  var AVIF_PROBE = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUEAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAHwAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAgAAAAIAAAAQcGl4aQAAAAADCgoKAAAADGF2MUOBIEAAAAAAE2NvbHJuY2x4AAkAEAAJgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAJ21kYXQSAAoHOAA2sJEAmTISGUJjBMTTTTNAAACQP5sMYIpa';

  function init(root) {
    var base = root.getAttribute('data-base') || '/';
    var q = function (sel) { return root.querySelector(sel); };
    var el = {
      tabs: q('.tv-tabs'), stage: q('.tv-stage'), frame: q('.tv-frame'), lens: q('.tv-lens'),
      lensLabel: q('.tv-lens-label'), play: q('.tv-play'), notice: q('.tv-notice'), fit: q('.tv-fit'),
      chips: q('.tv-chips'), next: q('.tv-next'), mute: q('.tv-mute'), freeze: q('.tv-freeze'),
      inspect: q('.tv-inspect'), inspectNote: q('.tv-inspect-note'), zooms: root.querySelectorAll('.tv-zoom button'),
      range: q('.tv-range'), linkFrame: q('.tv-link-frame'), linkClip: q('.tv-link-clip'), caption: q('.tv-caption-line')
    };
    var mq = function (s) { return global.matchMedia ? global.matchMedia(s) : null; };
    var reducedQuery = mq('(prefers-reduced-motion: reduce)');
    var hdrQuery = mq('(dynamic-range: high)');
    var st = {
      m: null, game: null, preset: null,
      videos: {}, sources: {},           // per preset of the current game: <video> and its chosen source
      broken: {}, brokenSrc: {}, caps: {}, avif: undefined,
      playing: !(reducedQuery && reducedQuery.matches), frozen: false, muted: true,
      inspecting: false, zoom: 1, tier: { tier: 'none', reason: TV.NO_CAPTURE }, insp: null, blobs: [],
      lensOn: false, pointer: { x: 0, y: 0, touch: false }, down: null, dragged: false,
      prefetching: false, seekLag: 0.06, syncGen: 0,
      dpr: 1, availW: 0, box: { w: 0, h: 0 }, shown: null,
      seed: null, firstPoster: true
    };
    var url = function (p) { return /^(https?:|blob:|data:)/.test(p) || p.charAt(0) === '/' ? p : base + p; };
    var noop = function () {};
    var msgs = { problem: '', loading: '' };   // the notice shows the loading text over a standing problem
    var video = function () { return st.videos[st.preset] || null; };
    var clip = function () { return st.m ? TV.clipFor(st.m, st.game, st.preset) : null; };
    var fps = function () { return st.m ? st.m.fps : TV.DEFAULT_FPS; };
    var hdrDisplay = function () { return !!(hdrQuery && hdrQuery.matches); };
    var env = function () {
      return { dpr: st.dpr, availW: st.availW, hdrDisplay: hdrDisplay(), caps: st.caps, broken: st.brokenSrc, avif: st.avif };
    };

    /* The static poster from the include is the stage picture until a clip has a frame. */
    el.frame.setAttribute('aria-hidden', 'true');
    st.seed = seedSize();
    layout();
    watchEnvironment();

    fetch(root.getAttribute('data-manifest')).then(function (r) {
      if (!r.ok) throw new Error('manifest ' + r.status);
      return r.json();
    }).then(function (raw) {
      var m = TV.normalize(raw);
      return probe(m).then(function () { build(m); });
    }).catch(function (e) {
      notice('problem', 'The clip list could not be loaded; showing the first frame.');
      if (global.console) console.warn('tv-switcher:', e);
    });

    /* ---- Capabilities ---------------------------------------------- */
    /** Fill st.caps for every clip file and st.avif; settles within 1.5 s whatever the browser does. */
    function probe(m) {
      var jobs = [], seen = {}, tester = document.createElement('video');
      var mc = navigator.mediaCapabilities;
      Object.keys(m.clips).forEach(function (g) {
        Object.keys(m.clips[g]).forEach(function (p) {
          var c = m.clips[g][p];
          c.stage.concat(c.lens).forEach(function (s) {
            var k = TV.capKey(s);
            if (seen[k]) return;
            seen[k] = true;
            if (!tester.canPlayType(s.type)) { st.caps[k] = { supported: false }; return; }
            var cfg = TV.decodingConfig(s, m.fps);
            if (!cfg || !mc || !mc.decodingInfo) { st.caps[k] = { supported: !s.hdr }; return; }
            jobs.push(mc.decodingInfo(cfg).then(function (r) {
              st.caps[k] = { supported: !!r.supported, smooth: !!r.smooth, powerEfficient: !!r.powerEfficient };
            }, function () { st.caps[k] = { supported: !s.hdr }; }));
          });
        });
      });
      jobs.push(new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () { st.avif = img.naturalWidth > 0; resolve(); };
        img.onerror = function () { st.avif = false; resolve(); };
        img.src = AVIF_PROBE;
      }));
      return Promise.race([Promise.all(jobs), new Promise(function (resolve) { setTimeout(resolve, 1500); })]);
    }

    function build(m) {
      st.m = m;
      root.classList.add('is-ready');
      buildTabs();
      buildChips();
      var game = root.getAttribute('data-game');
      if (!TV.gameById(m, game)) game = m.games[0] && m.games[0].id;
      if (!game) { notice('problem', 'No clip for this game yet.'); return; }
      selectGame(game, root.getAttribute('data-preset'));
      bindControls();
      bindLens();
    }

    /* ---- Tabs and chips ---------------------------------------------- */
    function buildTabs() {
      el.tabs.innerHTML = '';
      st.m.games.forEach(function (g) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'tv-tab'; b.setAttribute('role', 'tab');
        b.dataset.game = g.id; b.textContent = g.title;
        b.addEventListener('click', function () { selectGame(g.id, st.preset); });
        el.tabs.appendChild(b);
      });
      el.tabs.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var ids = st.m.games.map(function (g) { return g.id; });
        selectGame(TV.step(ids, st.game, d), st.preset);
        el.tabs.querySelector('[aria-selected="true"]').focus();
      });
    }

    function buildChips() {
      el.chips.innerHTML = '';
      st.m.presets.forEach(function (p, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'tv-chip'; b.setAttribute('role', 'radio');
        b.dataset.preset = p.id; b.dataset.tip = 'not rendered yet';
        var n = document.createElement('span');
        n.className = 'tv-chip-n'; n.textContent = String(i + 1);
        b.appendChild(n); b.appendChild(document.createTextNode(p.name));
        b.addEventListener('click', function () { if (b.getAttribute('aria-disabled') !== 'true') selectPreset(p.id); });
        el.chips.appendChild(b);
      });
    }

    function refreshTabsChips() {
      Array.prototype.forEach.call(el.tabs.children, function (b) {
        var on = b.dataset.game === st.game;
        b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      });
      var avail = TV.available(st.m, st.game, st.broken);
      Array.prototype.forEach.call(el.chips.children, function (b) {
        var id = b.dataset.preset, ok = avail.indexOf(id) >= 0, on = id === st.preset;
        b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1;
        b.setAttribute('aria-disabled', !ok);
        b.title = ok ? '' : b.dataset.tip;
      });
      el.next.disabled = avail.length < 2;
    }

    /* ---- Game and preset selection ---------------------------------- */
    function makeVideo(src, preload) {
      var v = document.createElement('video');
      v.className = 'tv-video'; v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.setAttribute('aria-hidden', 'true');
      v.setAttribute('disablepictureinpicture', '');
      v.preload = preload;
      v.src = url(src);
      return v;
    }

    /** Release a video element so its source stops buffering. */
    function dispose(v) { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }

    function wire(v, gameId, presetId, src) {
      v.addEventListener('error', function () { onVideoError(gameId, presetId, src); });
      v.addEventListener('canplaythrough', function () { if (v === video()) prefetch(); });
      v.addEventListener('loadedmetadata', function () { if (v === video() && st.shown && st.shown.el === v) showVideo(v); });
    }

    /**
     * Build the video stack of a game. `keepTime` rebuilds the current game
     * (a different source now fits the display) and continues at that time.
     */
    function selectGame(gameId, wantedPreset, keepTime) {
      var m = st.m;
      if (st.game === gameId && st.preset && keepTime === undefined) return;
      eachVideo(dispose);
      st.videos = {}; st.sources = {};
      st.prefetching = false;
      st.game = gameId;
      st.preset = TV.choosePreset(m, gameId, wantedPreset, st.broken);
      var e = env();
      m.presets.forEach(function (p) {
        var c = TV.clipFor(m, gameId, p.id);
        var s = c && TV.chooseStage(c.stage, e);
        if (!s) return;
        // Siblings get preload="none": the initial payload is one poster and one clip.
        var v = makeVideo(s.src, 'none');
        el.stage.insertBefore(v, el.frame.parentNode === el.stage ? el.frame : el.frame.parentNode);   // below the poster (or its <picture>)
        wire(v, gameId, p.id, s.src);
        st.videos[p.id] = v; st.sources[p.id] = s;
      });
      activate(true, null, keepTime);
    }

    function selectPreset(id) {
      if (!id || id === st.preset || !st.m) return;
      var prev = video();
      st.preset = id;
      activate(false, prev);
    }

    /** Make the current preset visible: seek-and-raise its video, or show its picture. */
    function activate(gameChanged, prev, keepTime) {
      var v = video(), c = clip();
      refreshTabsChips();
      notice('problem', !c ? 'No clip for this game yet.' :
        !v && st.broken[st.game + '/' + st.preset] ? 'The clip could not be loaded; showing the first frame.' : '');
      if (v) {
        ensureLoading(v);
        // Fresh stacks start from 0 on their own; a preset switch seeks to the
        // old clip's time (plus the lag the seek itself costs while the old
        // clip plays on).
        var live = !!prev && !gameChanged && !st.frozen && st.playing && !prev.paused;
        var t = keepTime != null ? keepTime :
          prev && !gameChanged ? TV.seekTarget(prev.currentTime, live ? st.seekLag : 0, prev.duration) : null;
        if (st.frozen) v.pause(); else if (st.playing) tryPlay(v);
        applyMute();
        if (gameChanged) showPlaceholder(c, st.sources[st.preset]);
        var mine = st.preset;
        var reveal = function () { if (st.preset === mine && video() === v) showVideo(v); };
        if (t == null) whenFrame(v, reveal);
        else seekThen(v, t, 250, function (landed) {
          if (st.preset !== mine) return;
          // Learn the lag from a completed seek so the next switch lands closer;
          // half the measured error per switch, wrapped because both clips loop.
          if (landed && live) st.seekLag = TV.nextLead(st.seekLag, TV.wrap(v.currentTime - prev.currentTime, v.duration) / 2);
          whenFrame(v, reveal);
        });
        if (v.readyState >= 4) prefetch();     // already buffered before we listened
      } else {
        showPicture(c);
      }
      updateText();
      refreshInspector();
    }

    /**
     * Call back once the video has a frame at its current position. After a
     * seek, readyState drops below HAVE_CURRENT_DATA and comes back with
     * 'seeked' or 'canplay'; 'loadeddata' fires only for the first frame.
     */
    function whenFrame(v, cb) {
      var evs = ['loadeddata', 'seeked', 'canplay'];
      function check() {
        if (v.readyState < 2 || v.seeking) return false;
        evs.forEach(function (e) { v.removeEventListener(e, check); });
        cb();
        return true;
      }
      if (!check()) evs.forEach(function (e) { v.addEventListener(e, check); });
    }

    /** Raise the video above the rest of the stack and size the stage to it. */
    function showVideo(v) {
      var s = st.sources[st.preset] || {};
      eachVideo(function (o) { o.classList.toggle('is-active', o === v); });
      st.shown = { el: v, w: s.width || v.videoWidth || st.seed.w, h: s.height || v.videoHeight || st.seed.h };
      el.frame.hidden = true;
      if (st.frozen) v.pause();
      layout();
      updateText();
    }

    /**
     * Poster while a new game's clip loads, shown only when it has the clip's
     * pixel size (a poster of another size would be scaled). The stage takes
     * the clip's size at once when the manifest gives it. The first
     * activation keeps the include's poster and never fetches a second one.
     */
    function showPlaceholder(c, s) {
      var w = s && s.width, h = s && s.height, img = el.frame;
      var fits = function (nw, nh) { return !w || (nw === w && nh === h); };
      var clipUp = function () { return st.shown && st.shown.el && st.shown.el !== img; };
      if (w) st.shown = { el: null, w: w, h: h };
      if (st.firstPoster) {
        st.firstPoster = false;
        var check = function () {
          if (clipUp() || !img.naturalWidth) return;
          if (fits(img.naturalWidth, img.naturalHeight)) {
            img.hidden = false;
            st.shown = { el: img, w: img.naturalWidth, h: img.naturalHeight };
          } else img.hidden = true;
          layout();
        };
        if (img.complete && img.naturalWidth) check();
        else { if (w) img.hidden = true; img.addEventListener('load', check, { once: true }); }
        layout();
        return;
      }
      img.hidden = true;
      layout();
      var p = TV.choosePoster(c && c.posters, w);
      if (p) setFrame(p.src, function (nw, nh) {
        if (!fits(nw, nh) || clipUp()) return;
        img.hidden = false;
        st.shown = { el: img, w: nw, h: nh };
        layout();
      });
    }

    /** No usable video: the poster (or the still) is the stage picture. */
    function showPicture(c) {
      eachVideo(function (o) { o.classList.remove('is-active'); });
      var list = (c ? c.posters : []).slice();
      var pick = TV.bySize(list, st.dpr, st.availW)[0];
      var src = pick ? pick.src : c && c.still ? c.still.sdr || c.still.hdr : null;
      st.firstPoster = false;
      if (!src) { el.frame.hidden = true; return; }
      setFrame(src, function (nw, nh) {
        el.frame.hidden = false;
        st.shown = { el: el.frame, w: nw, h: nh };
        layout();
      });
    }

    /**
     * Size of the include's poster as the browser picked it: the 2x poster
     * when the <source> media query matches, which is also when tv.css sizes
     * the stage for it.
     */
    function seedSize() {
      var w = Number(root.getAttribute('data-width')) || 960, h = Number(root.getAttribute('data-height')) || 720;
      var w2 = Number(root.getAttribute('data-width2')), h2 = Number(root.getAttribute('data-height2'));
      var source = el.frame.parentNode.tagName === 'PICTURE' && el.frame.parentNode.querySelector('source');
      var q = source && w2 && h2 ? mq(source.getAttribute('media')) : null;
      return q && q.matches ? { w: w2, h: h2 } : { w: w, h: h };
    }

    /** Remove the include's <source>, which would otherwise override the frame's src. */
    function dropSources() {
      var p = el.frame.parentNode, list = p.tagName === 'PICTURE' ? p.querySelectorAll('source') : [];
      Array.prototype.forEach.call(list, function (x) { x.remove(); });
      return list.length > 0;
    }

    /** Point the frame image at `src` and call back with its natural size once decoded. */
    function setFrame(src, cb) {
      var abs = url(src), mine = el.frame.dataset.want = abs;
      var done = function () {
        if (el.frame.dataset.want !== mine || !el.frame.naturalWidth) return;
        cb(el.frame.naturalWidth, el.frame.naturalHeight);
      };
      if (!dropSources() && el.frame.getAttribute('src') === abs && el.frame.complete) { done(); return; }
      el.frame.addEventListener('load', done, { once: true });
      el.frame.src = abs;
    }

    /** A preload="none" video starts buffering once its hint changes and load() re-runs selection. */
    function ensureLoading(v) {
      if (v.dataset.loading) return;
      v.dataset.loading = '1';
      if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
    }

    /**
     * Seek, then call back on 'seeked' (cb gets true), on a 'timeupdate'
     * outside a seek that has reached the target (a clip already playing
     * behind the stage fires timeupdate on its own, so only one within 0.1 s
     * counts), or after `ms` at the latest.
     */
    function seekThen(v, t, ms, cb) {
      var done = false, timer;
      function fin(landed) {
        if (done) return;
        done = true; clearTimeout(timer);
        v.removeEventListener('seeked', seeked); v.removeEventListener('timeupdate', near);
        cb(landed === true);
      }
      function seeked() { fin(true); }
      function near() { if (!v.seeking && Math.abs(v.currentTime - t) < 0.1) fin(); }
      v.addEventListener('seeked', seeked); v.addEventListener('timeupdate', near);
      timer = setTimeout(fin, ms);
      try { if (Math.abs(v.currentTime - t) > 0.02) v.currentTime = t; else fin(); } catch (e) { fin(); }
    }

    /** A file that failed: try the preset's next source, else fall back to its poster or still. */
    function onVideoError(gameId, presetId, src) {
      if (gameId !== st.game || !st.sources[presetId] || st.sources[presetId].src !== src) return;
      st.brokenSrc[src] = true;
      var old = st.videos[presetId], c = TV.clipFor(st.m, gameId, presetId);
      var s = c && TV.chooseStage(c.stage, env());
      var t = old.currentTime;
      if (s) {
        var v = makeVideo(s.src, old.preload);
        if (old.dataset.loading) v.dataset.loading = '1';
        el.stage.insertBefore(v, old);
        dispose(old);
        wire(v, gameId, presetId, s.src);
        st.videos[presetId] = v; st.sources[presetId] = s;
        if (presetId === st.preset) activate(false, null, t);
        else if (v.dataset.loading && st.playing && !st.frozen) tryPlay(v);   // in step behind the stage
        if (st.prefetching === presetId) watchPrefetch(presetId, v);        // the replacement finishes the prefetch
        return;
      }
      dispose(old);
      delete st.videos[presetId]; delete st.sources[presetId];
      st.broken[gameId + '/' + presetId] = true;
      if (st.prefetching === presetId) st.prefetching = false;
      if (presetId === st.preset) activate(true); else { refreshTabsChips(); prefetch(); }
    }

    /** Prefetch sibling clips one at a time after the active one is ready. */
    function prefetch() {
      if (st.prefetching || !st.playing || !TV.prefetchAllowed(navigator.connection)) return;
      var next = Object.keys(st.videos).filter(function (id) { return !st.videos[id].dataset.loading; })[0];
      if (!next) return;
      var v = st.videos[next];
      st.prefetching = next;
      watchPrefetch(next, v);
      ensureLoading(v);
      var a = video();
      if (st.frozen) { if (a) seekThen(v, a.currentTime, 250, noop); }
      else if (st.playing) tryPlay(v);         // keeps it in step behind the stage
    }

    /**
     * Move on to the next sibling once the prefetched one can play through,
     * fails, or after 20 s. Nothing happens when the stack was rebuilt or
     * the element was replaced after an error (the replacement is watched
     * instead).
     */
    function watchPrefetch(id, v) {
      var timer = setTimeout(done, 20000);
      function done() {
        clearTimeout(timer); v.removeEventListener('canplaythrough', done); v.removeEventListener('error', done);
        if (st.prefetching !== id || st.videos[id] !== v) return;
        st.prefetching = false; prefetch();
      }
      v.addEventListener('canplaythrough', done); v.addEventListener('error', done);
    }

    /* ---- Stage size and position ------------------------------------- */
    function currentDpr() { return global.devicePixelRatio || 1; }

    /**
     * Size the stage to the shown picture (source px / dpr, or scaled to fit)
     * and move it onto whole device pixels.
     */
    function layout() {
      st.dpr = currentDpr();
      root.style.setProperty('--tv-dpr', String(st.dpr));
      st.availW = measureWidth();
      var d = st.shown || st.seed;
      var s = TV.stageSize(d.w, d.h, st.dpr, st.availW);
      st.box = { w: s.w, h: s.h };
      el.stage.style.width = s.w + 'px';
      el.stage.style.height = s.h + 'px';
      el.fit.hidden = !s.scaled;
      root.classList.toggle('is-scaled', s.scaled);
      snap();
      if (st.lensOn) placeLens();
    }

    /** The switcher's width in whole device pixels (clientWidth rounds to whole CSS px). */
    function measureWidth() {
      return TV.availWidth(root.getBoundingClientRect().width, st.dpr) || st.availW;
    }

    function snap() {
      var cs = el.stage.style;
      cs.left = '0px'; cs.top = '0px';
      var r = el.stage.getBoundingClientRect();
      cs.left = TV.snapOffset(r.left + global.pageXOffset, st.dpr) + 'px';
      cs.top = TV.snapOffset(r.top + global.pageYOffset, st.dpr) + 'px';
    }

    /**
     * Window size, pixel ratio and HDR state decide the stage source. When
     * the choice changes (a window moved to another display, or narrowed
     * below the clip), the stack is rebuilt at the current time.
     */
    function onEnvironment() {
      if (!st.m) { layout(); return; }
      st.dpr = currentDpr();
      st.availW = measureWidth();
      var c = clip(), cur = st.sources[st.preset];
      var want = c ? TV.chooseStage(c.stage, env()) : null;
      if (want && (!cur || want.src !== cur.src)) {
        var v = video();
        selectGame(st.game, st.preset, v ? v.currentTime : 0);
        return;
      }
      layout();
      refreshInspector();
    }

    function watchEnvironment() {
      var pending = false;
      var soon = function () {
        if (pending) return;
        pending = true;
        global.requestAnimationFrame(function () { pending = false; onEnvironment(); });
      };
      global.addEventListener('resize', soon);
      global.addEventListener('load', soon);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
      var listen = function (query, fn) {
        if (!query) return;
        if (query.addEventListener) query.addEventListener('change', fn); else if (query.addListener) query.addListener(fn);
      };
      listen(hdrQuery, soon);
      (function watchDpr() {
        var dq = mq('(resolution: ' + currentDpr() + 'dppx)');
        if (!dq) return;
        var once = function () {
          if (dq.removeEventListener) dq.removeEventListener('change', once); else if (dq.removeListener) dq.removeListener(once);
          soon(); watchDpr();
        };
        listen(dq, once);
      })();
    }

    /* ---- Text, links, notices ---------------------------------------- */
    function updateText() {
      if (!st.m) return;
      var g = TV.gameById(st.m, st.game), p = TV.presetById(st.m, st.preset), c = clip();
      var s = video() ? st.sources[st.preset] : null;
      el.caption.textContent = g && p ? TV.caption(g, p) : '';
      var full = c && c.full;
      el.linkFrame.hidden = !full; if (full) el.linkFrame.href = url(full);
      var fw = c && c.still && c.still.width, fh = c && c.still && c.still.height;
      el.linkFrame.textContent = fw ? 'Open ' + TV.sizeLabel(fw, fh) + ' frame' : 'Open full-resolution frame';
      el.linkClip.hidden = !s; if (s) el.linkClip.href = url(s.src);
      var chip = TV.rangeChip(s, c, env());
      el.range.textContent = chip.text; el.range.title = chip.title;
      el.range.classList.toggle('is-hdr', chip.text === 'HDR');
      root.setAttribute('data-range', chip.text.toLowerCase());
      var t = st.tier, off = t.tier === 'none';
      Array.prototype.forEach.call(el.zooms, function (b) {
        b.disabled = off; b.setAttribute('aria-pressed', Number(b.dataset.zoom) === st.zoom);
      });
      el.inspect.disabled = off;
      el.inspect.setAttribute('aria-pressed', st.inspecting);
      el.inspect.title = off ? t.reason : '';
      el.inspectNote.textContent = TV.inspectNote(t);
      root.setAttribute('data-tier', t.tier);
      el.freeze.textContent = st.frozen ? 'Resume' : 'Freeze';
      el.freeze.setAttribute('aria-pressed', st.frozen);
      el.freeze.disabled = !video();
      el.stage.setAttribute('aria-pressed', st.frozen);
      el.stage.setAttribute('aria-label', !st.playing ? 'Play the clip' : st.frozen ? 'Resume the clip' : 'Freeze the picture');
      el.play.hidden = st.playing || !video();
      el.mute.textContent = st.muted ? 'Unmute' : 'Mute';
      el.mute.setAttribute('aria-pressed', !st.muted);
      el.stage.classList.toggle('is-inspecting', st.inspecting);
      el.stage.classList.toggle('is-frozen', st.frozen);
    }

    /** `kind` is 'problem' (stands until the selection changes) or 'loading' (transient, shown on top). */
    function notice(kind, text) {
      msgs[kind] = text || '';
      var shown = msgs.loading || msgs.problem;
      el.notice.textContent = shown;
      el.notice.hidden = !shown;
      root.classList.toggle('is-loading', !!msgs.loading);
    }

    /* ---- Controls ------------------------------------------------------ */
    /** play() that notices a blocked autoplay and falls back to the Play overlay. */
    function tryPlay(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function (err) {
        if (err && err.name === 'NotAllowedError' && st.playing) { st.playing = false; updateText(); }
      });
    }

    /** What a click on the stage (or Space) does: start playback, else toggle freeze. */
    function stageAction() {
      if (!st.playing) startPlayback();
      else if (video()) toggleFreeze();
    }

    /** In the still tier the stage is held on the still's frame; resuming ends the inspection. */
    function toggleFreeze() {
      if (st.frozen && st.insp && st.insp.tier === 'still') setInspecting(false);
      else setFrozen(!st.frozen);
    }

    function bindControls() {
      el.next.addEventListener('click', function () {
        selectPreset(TV.step(TV.available(st.m, st.game, st.broken), st.preset, 1));
      });
      el.mute.addEventListener('click', function () { st.muted = !st.muted; applyMute(); updateText(); });
      el.freeze.addEventListener('click', toggleFreeze);
      el.inspect.addEventListener('click', function () { setInspecting(!st.inspecting); });
      Array.prototype.forEach.call(el.zooms, function (b) {
        b.addEventListener('click', function () {
          st.zoom = Number(b.dataset.zoom);
          if (!st.inspecting) setInspecting(true);
          updateText(); placeLens();
        });
      });
      el.stage.addEventListener('click', function () {
        if (st.dragged) { st.dragged = false; return; }   // a finger drag with the lens is not a tap
        stageAction();
      });
      root.addEventListener('keydown', function (e) {
        if (e.altKey || e.ctrlKey || e.metaKey || el.tabs.contains(e.target)) return;
        var onControl = /^(BUTTON|A)$/.test(e.target.tagName);
        if (e.key === ' ' || (e.key === 'Enter' && e.target === el.stage)) {
          if (onControl) return;                // buttons and links keep their own Space/Enter
          e.preventDefault(); stageAction(); return;
        }
        var avail = TV.available(st.m, st.game, st.broken), id = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') id = TV.step(avail, st.preset, 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') id = TV.step(avail, st.preset, -1);
        else if (e.key === 'Home') id = avail[0];
        else if (e.key === 'End') id = avail[avail.length - 1];
        else id = TV.keyPreset(e.key, st.m, avail);
        if (!id) return;
        e.preventDefault();
        selectPreset(id);
        if (el.chips.contains(e.target)) el.chips.querySelector('[aria-checked="true"]').focus();
      });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden || !st.playing || st.frozen) return;
        eachVideo(function (v) { if (v.dataset.loading) v.play().catch(noop); });
        var lv = lensVideo(); if (lv) lv.play().catch(noop);
      });
    }

    function eachVideo(fn) { Object.keys(st.videos).forEach(function (id) { fn(st.videos[id]); }); }

    function applyMute() { var a = video(); eachVideo(function (v) { v.muted = st.muted || v !== a; }); }

    function startPlayback() {
      st.playing = true;
      if (!st.frozen) {
        eachVideo(function (v) { if (v.dataset.loading) v.play().catch(noop); });
        var lv = lensVideo(); if (lv) lv.play().catch(noop);
      }
      var v = video(); if (v) { ensureLoading(v); if (!st.frozen) tryPlay(v); }
      updateText(); prefetch();
    }

    /**
     * Freeze pauses every clip and the lens clip in the same task, then puts
     * them all on the middle of one frame (`at`, or the stage's current
     * frame) so the lens shows the frame the stage shows. Resume plays them
     * all from there.
     */
    function setFrozen(on, at) {
      st.frozen = on;
      var sv = video(), lv = lensVideo();
      if (on) {
        eachVideo(function (v) { v.pause(); });
        if (lv) lv.pause();
        var t = at != null ? at : sv ? TV.frameTime(TV.frameIndex(sv.currentTime, fps()), fps()) : 0;
        eachVideo(function (v) { if (v.dataset.loading || v === sv) seekTo(v, t); });
        if (lv) { seekTo(lv, t); lv.playbackRate = 1; }
      } else if (st.playing) {
        eachVideo(function (v) { if (v.dataset.loading) v.play().catch(noop); });
        if (lv) lv.play().catch(noop);
      }
      updateText();
    }

    function seekTo(v, t) { try { v.currentTime = t; } catch (e) { /* no metadata yet: seeks on load */ } }

    /* ---- Inspector ------------------------------------------------------ */
    function lensVideo() {
      var i = st.insp;
      return i && i.tier === 'lens' && i.ready ? i.media : null;
    }

    /** Recompute what Inspect can do for the current clip and apply it when inspecting. */
    function refreshInspector() {
      var s = video() ? st.sources[st.preset] : null;
      st.tier = TV.inspectTier(clip(), env(), s);
      if (st.tier.tier === 'none' && st.inspecting) setInspecting(false);
      else if (st.inspecting) startInspector();
      updateText();
    }

    function setInspecting(on) {
      if (on && st.tier.tier === 'none') return;
      st.inspecting = on;
      if (on) startInspector(); else stopInspector();
      updateText();
    }

    function inspectKey(t) { return t.tier + '|' + (t.lens ? t.lens.src : t.still ? t.still.src : ''); }

    /** Load the lens clip or the still for the current tier (once per file) and put it in the lens. */
    function startInspector() {
      var t = st.tier;
      if (t.tier === 'none') return;
      var key = inspectKey(t);
      if (st.insp && st.insp.key === key) {
        if (t.tier === 'still' && !st.frozen) holdStillFrame();
        if (t.tier === 'lens') startSync();
        return;
      }
      var held = stopInspector(true);
      if (held && t.tier !== 'still' && st.frozen) setFrozen(false);
      var ins = st.insp = { key: key, tier: t.tier, ready: false, lead: 0.08, busy: false, rec: null };
      var file = t.tier === 'lens' ? t.lens : t.still;
      ins.src = file.src;
      ins.w = file.width; ins.h = file.height;
      var media;
      if (t.tier === 'lens') {
        media = document.createElement('video');
        media.muted = true; media.loop = true; media.playsInline = true; media.preload = 'auto';
        media.setAttribute('playsinline', ''); media.setAttribute('muted', ''); media.setAttribute('disablepictureinpicture', '');
      } else {
        media = document.createElement('img');
        media.alt = ''; media.decoding = 'async';
        holdStillFrame();
      }
      media.className = 'tv-lens-media';
      ins.media = media;
      el.lens.insertBefore(media, el.lensLabel);
      var what = t.tier === 'lens' ? 'clip' : 'frame';
      var progress = function (loaded, total) {
        if (st.insp !== ins) return;
        ins.pct = total ? Math.floor(100 * loaded / total) : null;
        notice('loading', TV.loadingText(what, ins.w, ins.h, loaded, total));
        updateLensLabel();
      };
      progress(0, file.bytes);
      ins.abort = loadBlob(url(file.src), file.bytes, progress, function (objectUrl) {
        if (st.insp !== ins) return;
        notice('loading', '');
        var ready = function () {
          if (st.insp !== ins) return;
          ins.ready = true;
          ins.w = ins.w || media.videoWidth || media.naturalWidth;
          ins.h = ins.h || media.videoHeight || media.naturalHeight;
          if (t.tier === 'lens') alignLens();
          placeLens();
        };
        if (t.tier === 'lens') {
          media.addEventListener('loadeddata', ready, { once: true });
          media.addEventListener('error', function () { failed(ins, what); }, { once: true });
        } else {
          media.onload = function () { (media.decode ? media.decode() : Promise.resolve()).then(ready, ready); };
          media.onerror = function () { failed(ins, what); };
        }
        media.src = objectUrl;
      }, function () { failed(ins, what); });
      placeLens();
    }

    /**
     * A lens clip or still that did not load or decode: skip that file from
     * now on and try what is left (the other lens clip, then the still).
     * Only when nothing is left does Inspect stop with a notice.
     */
    function failed(ins, what) {
      if (st.insp !== ins) return;
      notice('loading', '');
      st.brokenSrc[ins.src] = true;
      forgetBlob(url(ins.src));
      refreshInspector();
      if (!st.inspecting) notice('problem', 'The full-resolution ' + what + ' could not be loaded.');
    }

    /** Still tier: every clip paused on the still's frame. */
    function holdStillFrame() {
      var t = st.tier;
      if (t.tier !== 'still') return;
      st.insp && (st.insp.froze = true);
      setFrozen(true, TV.frameTime(t.still.frame, fps()));
    }

    /** Remove the lens media; returns whether the still tier was holding the stage frozen. */
    function stopInspector(replacing) {
      var ins = st.insp, held = !!(ins && ins.froze);
      st.syncGen++;
      if (ins) {
        if (ins.abort) ins.abort();
        if (ins.media) {
          if (ins.media.tagName === 'VIDEO') { ins.media.pause(); ins.media.removeAttribute('src'); ins.media.load(); }
          ins.media.remove();
        }
        notice('loading', '');
        st.insp = null;
        if (held && !replacing && st.frozen) setFrozen(false);
      }
      if (!replacing) hideLens();
      return held;
    }

    function forgetBlob(src) {
      st.blobs = st.blobs.filter(function (b) {
        if (b.src !== src) return true;
        URL.revokeObjectURL(b.url);
        return false;
      });
    }

    /**
     * Fetch a file into an object URL with progress. Two files stay cached
     * so switching back and forth does not refetch. Returns an abort function.
     */
    function loadBlob(src, bytes, onProgress, onDone, onFail) {
      for (var i = 0; i < st.blobs.length; i++) {
        if (st.blobs[i].src === src) { var hit = st.blobs.splice(i, 1)[0]; st.blobs.push(hit); onDone(hit.url); return noop; }
      }
      var ctrl = global.AbortController ? new AbortController() : null;
      fetch(src, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
        if (!r.ok) throw new Error(src + ': ' + r.status);
        var total = Number(r.headers.get('content-length')) || bytes || 0;
        var type = r.headers.get('content-type') || '';
        if (!r.body || !r.body.getReader) return r.blob();
        var reader = r.body.getReader(), chunks = [], loaded = 0;
        return (function pump() {
          return reader.read().then(function (x) {
            if (x.done) return new Blob(chunks, { type: type });
            chunks.push(x.value); loaded += x.value.length;
            onProgress(loaded, total);
            return pump();
          });
        })();
      }).then(function (blob) {
        var u = URL.createObjectURL(blob);
        st.blobs.push({ src: src, url: u });
        while (st.blobs.length > 2) URL.revokeObjectURL(st.blobs.shift().url);
        onDone(u);
      }).catch(function (e) {
        if (e && e.name === 'AbortError') return;
        if (global.console) console.warn('tv-switcher:', e);
        onFail();
      });
      return function () { if (ctrl) ctrl.abort(); };
    }

    /** Put a freshly loaded lens clip on the stage's frame and start following it. */
    function alignLens() {
      var lv = lensVideo(), sv = video();
      if (!lv || !sv) return;
      if (st.frozen || !st.playing || sv.paused) {
        lv.pause();
        seekTo(lv, st.frozen ? sv.currentTime : TV.frameTime(TV.frameIndex(sv.currentTime, fps()), fps()));
      } else {
        seekTo(lv, TV.seekTarget(sv.currentTime, st.insp.lead, sv.duration));
        lv.play().catch(noop);
      }
      startSync();
    }

    /**
     * Follow the stage clip with the lens clip: each stage frame callback
     * runs TV.syncStep, which seeks or nudges the lens clip's rate. Called
     * again (on resize, a new stage element, a fresh lens clip), it replaces
     * the running loop.
     */
    function startSync() {
      var sv = video(), lv = lensVideo(), ins = st.insp;
      if (!sv || !lv) return;
      var g = ++st.syncGen;
      var hasRvfc = !!sv.requestVideoFrameCallback;
      var current = function () { return g === st.syncGen; };
      var later = function (fn, ms) { return global.setTimeout(fn, ms); };
      if (lv.requestVideoFrameCallback) (function lensTick(now, meta) {
        if (g !== st.syncGen) return;
        if (meta) ins.rec = { mediaTime: meta.mediaTime, at: meta.expectedDisplayTime };
        lv.requestVideoFrameCallback(lensTick);
      })();
      function tick(now, meta) {
        if (g !== st.syncGen) return;
        schedule();
        TV.syncStep(sv, lv, ins, { fps: fps(), frozen: st.frozen, meta: meta, current: current, later: later });
      }
      function schedule() {
        if (hasRvfc) sv.requestVideoFrameCallback(tick); else global.requestAnimationFrame(function () { tick(); });
      }
      schedule();
    }

    /* ---- Lens ----------------------------------------------------------- */
    function lensCss() { return TV.lensSize(st.box.w, st.box.h, global.innerWidth <= 640); }

    function bindLens() {
      el.stage.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch' && st.inspecting) showLens(e); });
      el.stage.addEventListener('pointermove', function (e) {
        if (!st.lensOn) {                        // Inspect switched on while already hovering
          if (st.inspecting && e.pointerType !== 'touch') showLens(e);
          return;
        }
        st.pointer = pointerPos(e);
        if (st.down && Math.hypot(e.clientX - st.down.x, e.clientY - st.down.y) > 8) st.dragged = true;
        placeLens();
      });
      el.stage.addEventListener('pointerdown', function (e) {
        st.down = { x: e.clientX, y: e.clientY }; st.dragged = false;
        if (e.pointerType === 'touch' && st.inspecting) { showLens(e); try { el.stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
      });
      ['pointerup', 'pointercancel'].forEach(function (t) {
        el.stage.addEventListener(t, function (e) { st.down = null; if (e.pointerType === 'touch') hideLens(); });
      });
      el.stage.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') hideLens(); });
    }

    function pointerPos(e) {
      var r = el.stage.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, touch: e.pointerType === 'touch' };
    }

    function showLens(e) {
      st.lensOn = true; st.pointer = pointerPos(e);
      el.lens.classList.add('is-on');
      placeLens();
    }

    function hideLens() { st.lensOn = false; el.lens.classList.remove('is-on'); }

    function updateLensLabel() {
      var ins = st.insp, p = TV.presetById(st.m, st.preset);
      el.lensLabel.textContent = !ins ? '' : ins.ready ? TV.lensLabel(st.zoom, p ? p.name : '') :
        'loading' + (ins.pct != null ? ' ' + ins.pct + '%' : '');
    }

    /** Lens box and media on whole device pixels; the source pixel under the pointer at the centre. */
    function placeLens() {
      updateLensLabel();
      if (!st.lensOn) return;
      var ins = st.insp;
      var g = TV.lensGeometry({
        x: st.pointer.x, y: st.pointer.y, stageW: st.box.w, stageH: st.box.h,
        srcW: (ins && ins.w) || 3840, srcH: (ins && ins.h) || 2880, dpr: st.dpr, zoom: st.zoom,
        lens: lensCss(), touch: st.pointer.touch
      });
      el.lens.style.width = el.lens.style.height = g.size + 'px';
      el.lens.style.transform = 'translate(' + g.box.x + 'px,' + g.box.y + 'px)';
      var media = ins && ins.media;
      if (!media) return;
      media.style.width = g.media.w + 'px';
      media.style.height = g.media.h + 'px';
      media.style.transform = 'translate(' + g.media.x + 'px,' + g.media.y + 'px)';
      media.classList.toggle('is-zoomed', st.zoom > 1);
    }
  }

  var roots = document.querySelectorAll('.tv[data-manifest]');
  Array.prototype.forEach.call(roots, init);
})(typeof window !== 'undefined' ? window : this);
