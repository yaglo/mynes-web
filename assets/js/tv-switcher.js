/* MyNES television switcher: the landing-page hero.
 *
 * One game recording plays on a stack of <video> elements, one per CRT
 * preset that has a clip. All clips of a game come from the same input
 * replay, so switching presets seeks the new clip to the old clip's time and
 * swaps visibility: the television changes while the game goes on. A round
 * lens magnifies the picture under the pointer. Live tier: the current video
 * frame drawn 3x with nearest-neighbour sampling, so the scanlines of the
 * clip are visible. Freeze tier: every clip is paused at time 0 (the frame
 * the 4K still was rendered from), the still is fetched, and the lens shows
 * it at one source pixel per device pixel (or 2:1, 4:1).
 *
 * Vanilla ES2018, no dependencies. Data comes from assets/hero/manifest.json;
 * the schema is documented in assets/hero/README.md. The pure helpers in
 * `TV` have no DOM dependency and are exported for tools/test_tv_switcher.js.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Pure helpers                                                        */
  /* ------------------------------------------------------------------ */
  var TV = {};

  /** Clip entry for a game/preset pair, or null. */
  TV.clipFor = function (m, gameId, presetId) {
    var g = m.clips && m.clips[gameId];
    return (g && g[presetId]) || null;
  };

  /** A clip can be shown when it has a video, a still or at least a poster. */
  TV.hasMedia = function (clip) {
    return !!(clip && (clip.video || clip.still || clip.poster));
  };

  /** Preset ids (in chip order) that have media for the game. */
  TV.available = function (m, gameId, broken) {
    return (m.presets || []).map(function (p) { return p.id; }).filter(function (id) {
      var clip = TV.clipFor(m, gameId, id);
      if (!TV.hasMedia(clip)) return false;
      // A clip whose video 404ed is still usable when it has a still or poster.
      return !(broken && broken[gameId + '/' + id] && !clip.still && !clip.poster);
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

  /** Letterboxed picture rectangle of a srcW:srcH image inside a stageW x stageH box (CSS px). */
  TV.contentRect = function (stageW, stageH, srcW, srcH) {
    if (!(stageW > 0 && stageH > 0 && srcW > 0 && srcH > 0)) return { x: 0, y: 0, w: stageW, h: stageH };
    var scale = Math.min(stageW / srcW, stageH / srcH);
    var w = srcW * scale, h = srcH * scale;
    return { x: (stageW - w) / 2, y: (stageH - h) / 2, w: w, h: h };
  };

  /** Stage CSS point -> source pixel coordinates (unclamped). */
  TV.sourcePoint = function (px, py, rect, srcW, srcH) {
    return { x: (px - rect.x) / rect.w * srcW, y: (py - rect.y) / rect.h * srcH };
  };

  /** Source pixels per lens device pixel for the live tier: `mag` times the stage scale. */
  TV.liveScale = function (rect, srcW, dpr, mag) {
    return srcW / (rect.w * mag * dpr);
  };

  /**
   * drawImage arguments for a lens of `L` device pixels centred on source
   * point `c` with `spp` source pixels per device pixel, clipped to the
   * image so edges show black instead of stretched pixels. Null when the
   * lens is entirely outside the picture.
   */
  TV.lensView = function (c, srcW, srcH, L, spp) {
    var size = L * spp;
    var sx0 = Math.round(c.x - size / 2), sy0 = Math.round(c.y - size / 2);
    var ix0 = Math.max(sx0, 0), iy0 = Math.max(sy0, 0);
    var ix1 = Math.min(sx0 + size, srcW), iy1 = Math.min(sy0 + size, srcH);
    if (ix1 <= ix0 || iy1 <= iy0) return null;
    return {
      sx: ix0, sy: iy0, sw: ix1 - ix0, sh: iy1 - iy0,
      dx: (ix0 - sx0) / spp, dy: (iy0 - sy0) / spp, dw: (ix1 - ix0) / spp, dh: (iy1 - iy0) / spp
    };
  };

  /** Lens box position (CSS px) kept inside the stage; the finger version sits above the touch point. */
  TV.lensBox = function (px, py, lens, stageW, stageH, touch) {
    var x = px - lens / 2, y = py - lens / 2 - (touch ? lens * 0.6 + 16 : 0);
    x = Math.max(0, Math.min(stageW - lens, x));
    y = Math.max(0, Math.min(stageH - lens, y));
    return { x: x, y: y };
  };

  /** Background prefetch is skipped on metered or slow connections. */
  TV.prefetchAllowed = function (conn) {
    if (!conn) return true;
    if (conn.saveData) return false;
    return !/^(slow-2g|2g|3g)$/.test(conn.effectiveType || '');
  };

  TV.caption = function (game, preset) {
    var s = game.title + ' · ' + (game.scene || '') + ' · ' + preset.name;
    return preset.blurb ? s + ' — ' + preset.blurb : s;
  };

  TV.lensLabel = function (tier, zoom, presetName) {
    return (tier === 'still' ? zoom + ':1' : '3× live') + ' · ' + presetName;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = TV;
  global.TVSwitcher = TV;
  if (typeof document === 'undefined') return;

  /* ------------------------------------------------------------------ */
  /* DOM component                                                       */
  /* ------------------------------------------------------------------ */
  function init(root) {
    var base = root.getAttribute('data-base') || '/';
    var q = function (sel) { return root.querySelector(sel); };
    var el = {
      tabs: q('.tv-tabs'), stage: q('.tv-stage'), frame: q('.tv-frame'), lens: q('.tv-lens'),
      canvas: q('.tv-lens canvas'), lensLabel: q('.tv-lens-label'), play: q('.tv-play'),
      notice: q('.tv-notice'), chips: q('.tv-chips'), next: q('.tv-next'), mute: q('.tv-mute'),
      freeze: q('.tv-freeze'), inspect: q('.tv-inspect'), zooms: root.querySelectorAll('.tv-zoom button'),
      linkFrame: q('.tv-link-frame'), linkClip: q('.tv-link-clip'), caption: q('.tv-caption-line')
    };
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = global.matchMedia && global.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var st = {
      m: null, game: null, preset: null, videos: {}, stills: {}, broken: {},
      playing: !reduced, frozen: false, muted: true, inspecting: !!finePointer, zoom: 1,
      lensOn: false, pointer: { x: 0, y: 0, touch: false }, down: null, dragged: false,
      gen: 0, prefetching: false, loadingStill: null,
      seekLag: 0.06   // seconds a seek-and-swap tends to take; the target is seeked that far ahead
    };
    var url = function (p) { return /^(https?:)?\/\//.test(p) || p.charAt(0) === '/' ? p : base + p; };
    var noop = function () {};
    var msgs = { problem: '', loading: '' };   // the notice shows the loading text over a standing problem
    var video = function () { return st.videos[st.preset] || null; };
    var clip = function () { return TV.clipFor(st.m, st.game, st.preset); };
    var brokenKey = function () { return st.game + '/' + st.preset; };

    /** play() that notices a blocked autoplay and falls back to the Play overlay. */
    function tryPlay(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function (err) {
        if (err && err.name === 'NotAllowedError' && st.playing) { st.playing = false; if (st.m) updateText(); }
      });
    }

    /* The static <video> from the include starts loading before this script runs. */
    var staticVideo = el.stage.querySelector('video');
    if (staticVideo && st.playing) tryPlay(staticVideo);

    fetch(root.getAttribute('data-manifest')).then(function (r) {
      if (!r.ok) throw new Error('manifest ' + r.status);
      return r.json();
    }).then(build).catch(function (e) {
      notice('problem', 'The clip list could not be loaded; showing one recording.');
      if (global.console) console.warn('tv-switcher:', e);
    });

    function build(m) {
      st.m = m;
      root.classList.add('is-ready');
      if (m.aspect && m.aspect.length === 2) el.stage.style.aspectRatio = m.aspect[0] + ' / ' + m.aspect[1];
      buildTabs();
      buildChips();
      var game = root.getAttribute('data-game');
      if (!TV.gameById(m, game)) game = m.games[0] && m.games[0].id;
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
        b.innerHTML = '<span class="tv-chip-n">' + (i + 1) + '</span>' + escapeHtml(p.name);
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
    /** Release a video element so its source stops buffering. */
    function dispose(v) { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }

    function selectGame(gameId, wantedPreset) {
      var m = st.m;
      if (st.game === gameId && st.preset) return;
      eachVideo(function (v) { if (v !== staticVideo) dispose(v); });   // the static one is judged below
      st.videos = {};
      st.prefetching = false;
      st.game = gameId;
      st.preset = TV.choosePreset(m, gameId, wantedPreset, st.broken);
      var clips = m.clips[gameId] || {};
      m.presets.forEach(function (p) {
        var c = clips[p.id];
        if (!c || !c.video) return;
        var v;
        if (staticVideo && staticVideo.dataset.game === gameId && staticVideo.dataset.preset === p.id &&
            staticVideo.getAttribute('src') === url(c.video)) {
          v = staticVideo;                       // adopt the element the HTML shipped
        } else {
          // Siblings get no poster yet: browsers fetch posters regardless of
          // preload, and the initial payload is one poster and one video.
          v = document.createElement('video');
          v.className = 'tv-video'; v.muted = true; v.loop = true; v.playsInline = true;
          v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
          v.preload = 'none';
          v.src = url(c.video);
          el.stage.insertBefore(v, el.frame);
        }
        v.dataset.preset = p.id;
        v.addEventListener('error', function () { onVideoError(gameId, p.id); });
        if (v.error) setTimeout(function () { onVideoError(gameId, p.id); }, 0);   // failed before we listened
        v.addEventListener('canplaythrough', function () { if (v === video()) prefetch(); });
        st.videos[p.id] = v;
      });
      if (staticVideo && st.videos[staticVideo.dataset.preset] !== staticVideo) { dispose(staticVideo); staticVideo = null; }
      activate(true);
    }

    function selectPreset(id) {
      if (!id || id === st.preset || !st.m) return;
      var prev = video();
      st.preset = id;
      activate(false, prev);
    }

    /** Make the current preset visible: seek-and-swap the video, or show the still. */
    function activate(gameChanged, prev) {
      var v = video(), c = clip(), broken = !!(v && st.broken[brokenKey()]);
      refreshTabsChips();
      updateText();
      notice('problem', !c ? 'No clip for this game yet.' :
        broken ? 'The clip could not be loaded' + (c.still || c.poster ? '; showing the still.' : '.') : '');
      st.gen++;
      if (v && !broken) {
        ensureLoading(v);
        // Fresh stacks start from 0 on their own; a preset switch seeks to the
        // old clip's time (plus the lag the seek itself costs while the old
        // clip plays on); a frozen stack always sits at 0.
        var live = !!prev && !gameChanged && !st.frozen && st.playing && !prev.paused;
        var t = st.frozen ? 0 : (prev && !gameChanged ? prev.currentTime + (live ? st.seekLag : 0) : null);
        if (st.frozen) v.pause(); else if (st.playing) tryPlay(v);
        applyMute();
        var mine = st.preset;
        if (t === null) showVideo(v);
        else seekThen(v, t, 250, function (landed) {
          if (st.preset !== mine) return;
          // Learn the lag from a completed seek so the next switch lands closer.
          if (landed && live) st.seekLag = Math.max(0, Math.min(0.5, (2 * st.seekLag + prev.currentTime - v.currentTime) / 2));
          showVideo(v);
        });
        if (v.readyState >= 4) prefetch();     // already buffered before we listened
      } else {
        showFrame(c);
      }
      if (st.frozen || !v || broken) loadStill();
      restartLens();
    }

    function showVideo(v) {
      eachVideo(function (o) { o.classList.toggle('is-active', o === v); });
      el.frame.hidden = true;
      if (st.frozen) v.pause();
    }

    /** No usable video: show the poster (or the still) as the stage picture. */
    function showFrame(c) {
      eachVideo(function (o) { o.classList.remove('is-active'); });
      var src = c && (c.poster || c.still);
      if (src) { el.frame.src = url(src); el.frame.hidden = false; }
      else el.frame.hidden = true;
    }

    /** A preload="none" video starts buffering once its hint changes and load() re-runs selection. */
    function ensureLoading(v) {
      if (v.dataset.loading) return;
      v.dataset.loading = '1';
      var c = TV.clipFor(st.m, st.game, v.dataset.preset);
      if (c && c.poster && !v.poster) v.poster = url(c.poster);
      if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
    }

    /**
     * Seek, then call back on 'seeked' (cb gets true), on a 'timeupdate'
     * that has reached the target (a clip already playing behind the stage
     * fires timeupdate on its own, so only one within 0.1 s counts), or
     * after `ms` at the latest.
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
      function near() { if (Math.abs(v.currentTime - t) < 0.1) fin(); }
      v.addEventListener('seeked', seeked); v.addEventListener('timeupdate', near);
      timer = setTimeout(fin, ms);
      try { if (Math.abs(v.currentTime - t) > 0.02) v.currentTime = t; else fin(); } catch (e) { fin(); }
    }

    /** A clip that failed to load: its chip stays when a still or poster can stand in. */
    function onVideoError(gameId, presetId) {
      st.broken[gameId + '/' + presetId] = true;
      if (gameId !== st.game) return;
      if (presetId === st.preset) activate(true); else refreshTabsChips();
    }

    /** Prefetch sibling clips one at a time after the active one is ready. */
    function prefetch() {
      if (st.prefetching || !st.playing || !TV.prefetchAllowed(navigator.connection)) return;
      var next = Object.keys(st.videos).filter(function (id) { return !st.videos[id].dataset.loading; })[0];
      if (!next) return;
      var v = st.videos[next];
      st.prefetching = true;
      var timer = setTimeout(done, 20000);
      function done() {
        clearTimeout(timer); v.removeEventListener('canplaythrough', done); v.removeEventListener('error', done);
        if (st.videos[next] !== v) return;     // the stack was replaced meanwhile
        st.prefetching = false; prefetch();
      }
      v.addEventListener('canplaythrough', done); v.addEventListener('error', done);
      ensureLoading(v);
      if (st.playing && !st.frozen) tryPlay(v);   // keeps it in step behind the stage
    }

    /* ---- Text, links, notices ---------------------------------------- */
    function updateText() {
      var g = TV.gameById(st.m, st.game), p = TV.presetById(st.m, st.preset), c = clip();
      el.caption.textContent = g && p ? TV.caption(g, p) : '';
      var full = c && (c.full || c.still);
      el.linkFrame.hidden = !full; if (full) el.linkFrame.href = url(full);
      el.linkClip.hidden = !(c && c.video); if (c && c.video) el.linkClip.href = url(c.video);
      var hasStill = !!(c && c.still);
      Array.prototype.forEach.call(el.zooms, function (b) { b.disabled = !hasStill; b.setAttribute('aria-pressed', Number(b.dataset.zoom) === st.zoom); });
      el.freeze.textContent = st.frozen ? 'Resume' : (hasStill ? 'Freeze at full detail' : 'Freeze');
      el.freeze.setAttribute('aria-pressed', st.frozen);
      el.stage.setAttribute('aria-pressed', st.frozen);
      el.stage.setAttribute('aria-label', st.playing ? 'Freeze the picture at full detail' : 'Play the clip');
      el.play.hidden = st.playing;
      el.mute.textContent = st.muted ? 'Unmute' : 'Mute';
      el.mute.setAttribute('aria-pressed', !st.muted);
      el.inspect.setAttribute('aria-pressed', st.inspecting);
      el.stage.classList.toggle('is-inspecting', st.inspecting);
      el.stage.classList.toggle('is-frozen', st.frozen);
    }

    /** `kind` is 'problem' (stands until the selection changes) or 'loading' (transient, shown on top). */
    function notice(kind, text) {
      msgs[kind] = text || '';
      var shown = msgs.loading || msgs.problem;
      el.notice.textContent = shown;
      el.notice.hidden = !shown;
    }

    function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }

    /* ---- Controls ------------------------------------------------------ */
    /** What a click on the stage (or Space) does: start playback, else toggle freeze. */
    function stageAction() { if (!st.playing) startPlayback(); else setFrozen(!st.frozen); }

    function bindControls() {
      el.next.addEventListener('click', function () {
        selectPreset(TV.step(TV.available(st.m, st.game, st.broken), st.preset, 1));
      });
      el.mute.addEventListener('click', function () { st.muted = !st.muted; applyMute(); updateText(); });
      el.freeze.addEventListener('click', function () { setFrozen(!st.frozen); });
      el.inspect.addEventListener('click', function () { st.inspecting = !st.inspecting; hideLens(); updateText(); });
      Array.prototype.forEach.call(el.zooms, function (b) {
        b.addEventListener('click', function () { st.zoom = Number(b.dataset.zoom); if (!st.frozen) setFrozen(true); updateText(); drawLens(); });
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
        if (!document.hidden && st.playing && !st.frozen) eachVideo(function (v) { if (v.dataset.loading) v.play().catch(noop); });
      });
    }

    function eachVideo(fn) { Object.keys(st.videos).forEach(function (id) { fn(st.videos[id]); }); }

    function applyMute() { var a = video(); eachVideo(function (v) { v.muted = st.muted || v !== a; }); }

    function startPlayback() {
      st.playing = true;
      eachVideo(function (v) { if (v.dataset.loading) v.play().catch(noop); });
      var v = video(); if (v) { ensureLoading(v); tryPlay(v); }
      updateText(); prefetch(); restartLens();
    }

    /** Freeze: every clip paused at time 0, the frame the 4K still shows. Resume: all play from 0, in step. */
    function setFrozen(on) {
      st.frozen = on;
      eachVideo(function (v) {
        if (!v.dataset.loading) return;
        try { v.currentTime = 0; } catch (e) { /* not loaded yet */ }
        if (on) v.pause(); else if (st.playing) v.play().catch(noop);
      });
      if (on) loadStill(); else if (st.loadingStill) notice('loading', '');
      updateText(); restartLens();
    }

    /* ---- Stills for the freeze tier -------------------------------------- */
    function stillFor(c) { return c && c.still ? st.stills[url(c.still)] : null; }

    /** Fetch the 4K still of the current clip once; the lens switches to it when it has decoded. */
    function loadStill() {
      var c = clip();
      if (!c || !c.still) return;
      var src = url(c.still), rec = st.stills[src];
      if (rec) { if (rec.ready) restartLens(); return; }
      rec = st.stills[src] = { img: new Image(), ready: false, w: c.still_size ? c.still_size[0] : 0, h: c.still_size ? c.still_size[1] : 0 };
      st.loadingStill = src;
      root.classList.add('is-loading');
      notice('loading', 'Loading the 4K frame…');
      rec.img.decoding = 'async';
      function settled() { if (st.loadingStill === src) { st.loadingStill = null; root.classList.remove('is-loading'); notice('loading', ''); } }
      rec.img.onload = function () {
        rec.ready = true; rec.w = rec.img.naturalWidth; rec.h = rec.img.naturalHeight;
        settled(); restartLens();
      };
      rec.img.onerror = function () {
        delete st.stills[src];
        settled(); notice('problem', 'The 4K frame could not be loaded; the lens shows the clip.');
      };
      rec.img.src = src;
    }

    /* ---- Lens ----------------------------------------------------------- */
    function lensSize() { return global.innerWidth <= 640 ? 160 : 240; }

    function bindLens() {
      el.stage.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch' && st.inspecting) showLens(e); });
      el.stage.addEventListener('pointermove', function (e) {
        if (!st.lensOn) {                        // Inspect switched on while already hovering
          if (st.inspecting && e.pointerType !== 'touch') showLens(e);
          return;
        }
        st.pointer = pointerPos(e);
        if (st.down && Math.hypot(e.clientX - st.down.x, e.clientY - st.down.y) > 8) st.dragged = true;
        placeLens(); drawLens();
      });
      el.stage.addEventListener('pointerdown', function (e) {
        st.down = { x: e.clientX, y: e.clientY }; st.dragged = false;
        if (e.pointerType === 'touch' && st.inspecting) { showLens(e); try { el.stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
      });
      ['pointerup', 'pointercancel'].forEach(function (t) {
        el.stage.addEventListener(t, function (e) { st.down = null; if (e.pointerType === 'touch') hideLens(); });
      });
      el.stage.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') hideLens(); });
      global.addEventListener('resize', function () { if (st.lensOn) { sizeLens(); placeLens(); drawLens(); } });
    }

    function pointerPos(e) {
      var r = el.stage.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, touch: e.pointerType === 'touch' };
    }

    function sizeLens() {
      var L = lensSize(), dpr = global.devicePixelRatio || 1;
      el.lens.style.width = el.lens.style.height = L + 'px';
      var px = Math.round(L * dpr);
      if (el.canvas.width !== px) { el.canvas.width = el.canvas.height = px; }
    }

    function showLens(e) {
      st.lensOn = true; st.pointer = pointerPos(e);
      sizeLens(); el.lens.hidden = false;
      placeLens(); restartLens();
      var c = clip();
      if (c && !c.video) loadStill();          // still-only clips use the freeze tier directly
    }

    function hideLens() { st.lensOn = false; el.lens.hidden = true; st.gen++; }

    function placeLens() {
      var L = lensSize(), b = TV.lensBox(st.pointer.x, st.pointer.y, L, el.stage.clientWidth, el.stage.clientHeight, st.pointer.touch);
      el.lens.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px)';
    }

    /**
     * What the lens shows. Freeze tier when the still is loaded and the clip
     * is frozen (or has no video); otherwise the live tier from the active
     * video, or from the stage picture when there is no video.
     */
    function lensSource() {
      var v = video(), c = clip(), rec = stillFor(c);
      var dpr = global.devicePixelRatio || 1;
      var useStill = rec && rec.ready && (st.frozen || !v || st.broken[brokenKey()]);
      if (useStill) return { el: rec.img, w: rec.w, h: rec.h, tier: 'still', spp: 1 / st.zoom, dpr: dpr };
      if (v && el.frame.hidden && v.readyState >= 2 && v.videoWidth) {
        return { el: v, w: v.videoWidth, h: v.videoHeight, tier: 'live', mag: 3, dpr: dpr };
      }
      if (!el.frame.hidden && el.frame.naturalWidth) return { el: el.frame, w: el.frame.naturalWidth, h: el.frame.naturalHeight, tier: 'live', mag: 3, dpr: dpr };
      return null;
    }

    function drawLens() {
      if (!st.lensOn) return;
      var ctx = el.canvas.getContext('2d'), L = el.canvas.width;
      if (!ctx) return;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, L, L);
      var s = lensSource(), p = TV.presetById(st.m, st.preset);
      el.lensLabel.textContent = s ? TV.lensLabel(s.tier, st.zoom, p ? p.name : '') : (st.loadingStill ? 'loading…' : '');
      if (!s) return;
      var rect = TV.contentRect(el.stage.clientWidth, el.stage.clientHeight, s.w, s.h);
      var spp = s.tier === 'still' ? s.spp : TV.liveScale(rect, s.w, s.dpr, s.mag);
      var view = TV.lensView(TV.sourcePoint(st.pointer.x, st.pointer.y, rect, s.w, s.h), s.w, s.h, L, spp);
      if (!view) return;
      ctx.imageSmoothingEnabled = false;
      try { ctx.drawImage(s.el, view.sx, view.sy, view.sw, view.sh, view.dx, view.dy, view.dw, view.dh); } catch (e) { /* frame not decodable yet */ }
    }

    /** Redraw per video frame while a clip plays under the lens; a generation counter ends stale loops. */
    function restartLens() {
      var g = ++st.gen;
      (function tick() {
        if (g !== st.gen || !st.lensOn) return;
        drawLens();
        var v = video();
        if (!v || v.paused || st.frozen) return;   // static picture: pointermove redraws
        if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(tick); else global.requestAnimationFrame(tick);
      })();
    }
  }

  var roots = document.querySelectorAll('.tv[data-manifest]');
  Array.prototype.forEach.call(roots, init);
})(typeof window !== 'undefined' ? window : this);
