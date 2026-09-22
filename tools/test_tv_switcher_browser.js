#!/usr/bin/env node
/* Browser checks for the television switcher. The fixture preview and the
 * landing page run in headless Chrome, driven through the DevTools protocol
 * (Node 22's WebSocket, no packages), and a local server that can delay,
 * throttle or corrupt single files. These cover what the Node tests of the
 * pure helpers cannot reach: focus, live regions, the seed poster, prefetch,
 * the lens sync and the fallbacks after a file fails.
 *
 * Run:  node tools/test_tv_switcher_browser.js [site-dir]
 * site-dir is a build that includes the fixture page:
 *   bundle exec jekyll build --config _config.yml,tools/tv-fixture/preview.yml --destination DIR
 * Without it the script runs that build into a temporary directory.
 * The browser is $CHROME, else Chrome for Testing under ~/.cache/puppeteer;
 * without one the checks are skipped.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const PREFIX = '/mynes-web/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- site ---- */
function siteDir() {
  if (process.argv[2]) return path.resolve(process.argv[2]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv-preview-'));
  const r = spawnSync('bundle', ['exec', 'jekyll', 'build', '--config', '_config.yml,tools/tv-fixture/preview.yml', '--destination', dir],
    { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) { process.stderr.write(r.stdout + r.stderr); throw new Error('jekyll build failed'); }
  return dir;
}

/* ---- server: range requests, and per-test rules that delay, throttle or corrupt files ---- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.mp4': 'video/mp4', '.webp': 'image/webp', '.png': 'image/png', '.avif': 'image/avif', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.ico': 'image/x-icon' };

function junk(n) {
  const b = Buffer.alloc(n);
  let x = 12345;
  for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) >>> 0; b[i] = x >>> 24; }
  return b;
}

function startServer(dir) {
  const srv = { rules: [], log: [] };
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    srv.log.push({ path: p, range: req.headers.range || null, t: Date.now() });
    let file = p.startsWith(PREFIX) ? path.join(dir, p.slice(PREFIX.length)) : null;
    if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!file || !file.startsWith(dir) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    const rule = srv.rules.find((r) => r.re.test(p)) || {};
    let body = rule.corrupt ? junk(2000) : fs.readFileSync(file);
    const head = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
    let status = 200;
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m) {
      const size = body.length;
      const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
      const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
      if (start >= size) { res.writeHead(416, { 'Content-Range': 'bytes */' + size }); res.end(); return; }
      head['Content-Range'] = 'bytes ' + start + '-' + end + '/' + size;
      body = body.subarray(start, end + 1);
      status = 206;
    }
    head['Content-Length'] = body.length;
    const send = () => {
      if (res.destroyed) return;
      res.writeHead(status, head);
      if (!rule.rate) { res.end(body); return; }
      const step = Math.max(1, Math.round(rule.rate / 20));
      let at = 0;
      const pump = () => {
        if (res.destroyed) return;
        res.write(body.subarray(at, at + step)); at += step;
        if (at >= body.length) res.end(); else setTimeout(pump, 50);
      };
      pump();
    };
    if (rule.delay) setTimeout(send, rule.delay); else send();
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    srv.base = 'http://127.0.0.1:' + server.address().port + PREFIX;
    srv.close = () => server.close();
    resolve(srv);
  }));
}

/* ---- browser ---- */
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const cache = path.join(os.homedir(), '.cache/puppeteer');
  const found = [];
  const walk = (d, depth) => {
    if (depth > 6 || !fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.name === 'Google Chrome for Testing' && !e.isDirectory()) found.push(p);
      else if (e.name === 'chrome' && !e.isDirectory() && /chrome-linux/.test(p)) found.push(p);
      else if (e.isDirectory()) walk(p, depth + 1);
    }
  };
  walk(path.join(cache, 'chrome'), 0);
  found.sort();
  if (found.length) return found[found.length - 1];
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return fs.existsSync(mac) ? mac : null;
}

function launch(bin) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tv-chrome-'));
  const proc = spawn(bin, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--no-first-run',
    '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--hide-scrollbars',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  return new Promise((resolve, reject) => {
    let err = '';
    const t = setTimeout(() => reject(new Error('Chrome did not start: ' + err.slice(-400))), 20000);
    proc.stderr.on('data', (d) => {
      err += d;
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(err);
      if (m) { clearTimeout(t); resolve({ proc, ws: m[1], profile }); }
    });
  });
}

class CDP {
  static connect(url) {
    const ws = new WebSocket(url);
    return new Promise((ok, bad) => { ws.onopen = () => ok(new CDP(ws)); ws.onerror = () => bad(new Error('no DevTools connection')); });
  }
  constructor(ws) {
    this.ws = ws; this.n = 0; this.calls = new Map(); this.subs = new Set();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id) {
        const c = this.calls.get(m.id);
        this.calls.delete(m.id);
        if (m.error) c.bad(new Error(c.method + ': ' + m.error.message)); else c.ok(m.result);
      } else for (const f of this.subs) f(m);
    };
  }
  send(method, params, sessionId) {
    const id = ++this.n;
    this.ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
    return new Promise((ok, bad) => this.calls.set(id, { ok, bad, method }));
  }
  wait(method, sessionId, ms) {
    return new Promise((ok, bad) => {
      const f = (m) => { if (m.method === method && m.sessionId === sessionId) { clearTimeout(t); this.subs.delete(f); ok(m.params); } };
      const t = setTimeout(() => { this.subs.delete(f); bad(new Error('timed out waiting for ' + method)); }, ms || 15000);
      this.subs.add(f);
    });
  }
}

const KEYS = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, ' ': 32, Enter: 13, Tab: 9, Home: 36, End: 35 };

async function openPage(cdp, opt) {
  const { browserContextId } = await cdp.send('Target.createBrowserContext');
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => cdp.send(m, p, sessionId);
  const errors = [];
  const onEvent = (m) => {
    if (m.sessionId === sessionId && m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errors.push((d.exception && d.exception.description) || d.text);
    }
  };
  cdp.subs.add(onEvent);
  await s('Page.enable');
  await s('Runtime.enable');
  await s('Emulation.setFocusEmulationEnabled', { enabled: true });
  await s('Emulation.setDeviceMetricsOverride', { width: opt.width || 1280, height: opt.height || 900, deviceScaleFactor: opt.dpr || 1, mobile: false });
  if (opt.noScript) await s('Emulation.setScriptExecutionDisabled', { value: true });
  if (opt.init) await s('Page.addScriptToEvaluateOnNewDocument', { source: opt.init });
  const page = {
    errors,
    async eval(expr) {
      const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('page: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text));
      return r.result.value;
    },
    async goto(url) {
      const load = cdp.wait('Page.loadEventFired', sessionId, 20000);
      await s('Page.navigate', { url });
      await load;
    },
    async until(expr, what, ms) {
      const end = Date.now() + (ms || 10000);
      for (;;) {
        const v = await page.eval(expr);
        if (v) return v;
        if (Date.now() > end) throw new Error('timed out: ' + (what || expr));
        await sleep(50);
      }
    },
    async key(key) {
      const code = /^[0-9]$/.test(key) ? 'Digit' + key : key === ' ' ? 'Space' : key;
      const vk = KEYS[key] || key.toUpperCase().charCodeAt(0);
      const text = key.length === 1 ? key : undefined;
      await s('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, text });
      await s('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
    },
    async close() {
      cdp.subs.delete(onEvent);
      await cdp.send('Target.closeTarget', { targetId });
      await cdp.send('Target.disposeBrowserContext', { browserContextId });
    }
  };
  return page;
}

/* ---- page-side helpers ---- */
const STATE = `(() => {
  const r = document.querySelector('.tv'), a = r.querySelector('.tv-video.is-active'), f = r.querySelector('.tv-frame');
  const chip = r.querySelector('.tv-chip[aria-checked="true"]'), n = r.querySelector('.tv-notice'), b = r.querySelector('.tv-stage').getBoundingClientRect();
  return {
    ready: r.classList.contains('is-ready'), tier: r.dataset.tier || null, preset: chip ? chip.dataset.preset : null,
    active: a ? a.getAttribute('src').split('/').slice(-2).join('/') : null, activeReady: !!a && a.readyState >= 2,
    stageW: b.width, stageH: b.height, frameHidden: f.hidden, frameW: f.naturalWidth,
    notice: n.hidden ? '' : n.textContent, note: r.querySelector('.tv-inspect-note').textContent,
    inspecting: r.querySelector('.tv-inspect').getAttribute('aria-pressed') === 'true', chips: r.querySelectorAll('.tv-chip').length,
    fit: !r.querySelector('.tv-fit').hidden, focusInside: r.contains(document.activeElement), focus: document.activeElement.className
  };
})()`;

/** Median drift of the lens clip against the stage clip, in frames (both clips loop). */
const DRIFT = `(async () => {
  const lv = document.querySelector('.tv-lens video'), sv = document.querySelector('.tv-video.is-active'), out = [];
  for (let i = 0; i < 9; i++) {
    const dur = sv.duration;
    let d = ((lv.currentTime - sv.currentTime) % dur + dur) % dur;
    if (d > dur / 2) d -= dur;
    out.push(d * 60.0988);
    await new Promise((r) => setTimeout(r, 25));
  }
  out.sort((a, b) => Math.abs(a) - Math.abs(b));
  return out[4];
})()`;

const OFFSET = `(() => {
  const lv = document.querySelector('.tv-lens video'), sv = document.querySelector('.tv-video.is-active');
  lv.currentTime = (sv.currentTime + 0.25) % sv.duration;
  return true;
})()`;

async function lensPage(ctx, opt) {
  const page = await ctx.open(Object.assign({ dpr: 2 }, opt));
  await page.goto(ctx.srv.base + 'tools/tv-fixture/');
  await page.until(STATE + '.activeReady', 'stage clip playing');
  await page.until(STATE + '.tier', 'inspect tier');
  return page;
}

/* ---- checks ---- */
const checks = [];
const check = (name, fn) => checks.push({ name, fn });
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

check('stage clip at one source pixel per device pixel at DPR 1, 2 and 3', async (ctx) => {
  for (const [dpr, clip] of [[1, 'stage-960-sdr.mp4'], [2, 'stage-1920-sdr.mp4'], [3, 'stage-1920-sdr.mp4']]) {
    const page = await ctx.open({ dpr });
    await page.goto(ctx.srv.base + 'tools/tv-fixture/');
    await page.until(STATE + '.activeReady', 'stage clip playing at ' + dpr + 'x');
    const r = await page.eval(`(() => { const a = document.querySelector('.tv-video.is-active'), b = document.querySelector('.tv-stage').getBoundingClientRect();
      return { src: a.getAttribute('src').split('/').pop(), vw: a.videoWidth, vh: a.videoHeight, w: b.width * devicePixelRatio, h: b.height * devicePixelRatio,
        x: b.left * devicePixelRatio, fit: !document.querySelector('.tv-fit').hidden }; })()`);
    assert(r.src === clip, dpr + 'x: ' + r.src);
    assert(Math.abs(r.w - r.vw) < 1e-6 && Math.abs(r.h - r.vh) < 1e-6 && !r.fit, dpr + 'x: ' + JSON.stringify(r));
    assert(Math.abs(r.x - Math.round(r.x)) < 1e-3, dpr + 'x: stage not on a device pixel: ' + r.x);
  }
  return null;
});


check('2x display: the seed poster matches the stage clip, no layout shift', async (ctx) => {
  ctx.srv.rules.push({ re: /stage-.*\.mp4$/, delay: 1200 });
  const page = await ctx.open({ dpr: 2, init: `
    window.__samples = []; window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    (function sample() {
      const st = document.querySelector('.tv-stage');
      if (st) {
        const f = st.querySelector('.tv-frame'), r = st.getBoundingClientRect(), a = st.querySelector('.tv-video.is-active');
        window.__samples.push({ w: r.width, h: r.height, hidden: f.hidden, nw: f.naturalWidth, video: !!a && a.readyState >= 2 });
      }
      if (performance.now() < 5000) requestAnimationFrame(sample);
    })();` });
  await page.goto(ctx.srv.base + 'tools/tv-fixture/');
  await page.until(STATE + '.activeReady', 'stage clip playing');
  await sleep(300);
  const samples = await page.eval('window.__samples');
  const cls = await page.eval('window.__cls');
  const st = await page.eval(STATE);
  assert(st.active === 'fixture_grille/stage-1920-sdr.mp4', 'stage clip ' + st.active);
  const sizes = [...new Set(samples.map((x) => x.w + 'x' + x.h))];
  assert(sizes.length === 1 && sizes[0] === '960x720', 'stage CSS sizes seen: ' + sizes.join(', '));
  const waiting = samples.filter((x) => x.nw > 0 && !x.video);
  assert(waiting.length > 0, 'the poster never loaded before the clip');
  assert(waiting.every((x) => !x.hidden && x.nw === 1920), 'poster hidden or of the wrong size before the clip had a frame');
  assert(cls < 0.01, 'layout shift ' + cls.toFixed(4));
  return page;
});

check('fractional switcher width: no source wider than the box', async (ctx) => {
  const page = await ctx.open({ dpr: 2 });
  await page.goto(ctx.srv.base + 'tools/tv-fixture/');
  await page.until(STATE + '.activeReady', 'stage clip playing');
  const measure = async (w) => {
    await page.eval(`(() => { let s = document.getElementById('tv-test-width'); if (!s) { s = document.createElement('style'); s.id = 'tv-test-width'; document.head.appendChild(s); }
      s.textContent = '.tv { width: ${w}px !important; }'; window.dispatchEvent(new Event('resize')); return true; })()`);
    await sleep(400);
    await page.until(STATE + '.activeReady', 'stage clip playing at ' + w);
    return page.eval(`(() => { const a = document.querySelector('.tv-video.is-active'), r = document.querySelector('.tv-stage').getBoundingClientRect();
      return { src: a.getAttribute('src').split('/').pop(), vw: a.videoWidth, dev: r.width * devicePixelRatio, box: document.querySelector('.tv').getBoundingClientRect().width,
        fit: !document.querySelector('.tv-fit').hidden }; })()`);
  };
  let m = await measure(959.6);
  assert(m.src === 'stage-960-sdr.mp4' && Math.abs(m.dev - 960) < 1e-6 && !m.fit, '959.6 px: ' + JSON.stringify(m));
  m = await measure(960);
  assert(m.src === 'stage-1920-sdr.mp4' && Math.abs(m.dev - 1920) < 1e-6 && !m.fit, '960 px: ' + JSON.stringify(m));
  m = await measure(357.6);
  assert(m.fit && Number.isInteger(Math.round(m.dev * 1e6) / 1e6) && m.dev <= 357.6 * 2, '357.6 px: ' + JSON.stringify(m));
  return page;
});

check('no JavaScript: the fit note shows exactly when the poster is scaled', async (ctx) => {
  const cases = [[2, 1280, false], [1, 1280, false], [3, 1280, false], [2.5, 1280, true], [1.75, 1280, true], [2.2, 1280, true], [2, 400, true], [3, 400, false]];
  for (const [dpr, width, scaled] of cases) {
    const page = await ctx.open({ dpr, width, noScript: true });
    await page.goto(ctx.srv.base + 'tools/tv-fixture/');
    const r = await page.eval(`(() => { const f = document.querySelector('.tv-frame'), b = f.getBoundingClientRect();
      const notes = [...document.querySelectorAll('.tv-fit')].filter((n) => getComputedStyle(n).display !== 'none' && n.offsetParent);
      return { dev: b.width * devicePixelRatio, nw: f.naturalWidth, note: notes.length > 0, noteText: notes.map((n) => n.textContent).join('|') }; })()`);
    await page.close();
    const resampled = Math.abs(r.dev - r.nw) > 0.01;
    assert(resampled === scaled, `dpr ${dpr} width ${width}: poster ${r.nw} px shown at ${r.dev.toFixed(2)} device px`);
    assert(r.note === scaled, `dpr ${dpr} width ${width}: note ${r.note ? 'shown' : 'hidden'} (${r.noteText})`);
  }
  return null;
});

check('lens sync keeps working when it is restarted during its own seek', async (ctx) => {
  const page = await lensPage(ctx);
  const tier = (await page.eval(STATE)).tier;
  if (tier !== 'lens') return { page, skip: 'this browser has no lens tier (' + tier + ')' };
  await page.eval(`document.querySelector('.tv-inspect').click(), true`);
  await page.until(`(() => { const v = document.querySelector('.tv-lens video'); return v && v.readyState >= 3 && !v.seeking && !v.paused; })()`, 'lens clip playing');
  await sleep(1000);
  // Control: an offset lens clip is brought back.
  await page.eval(OFFSET);
  await sleep(1500);
  let d = await page.eval(DRIFT);
  assert(Math.abs(d) < 2, 'control: drift ' + d.toFixed(2) + ' frames');
  // Offset again and restart the sync (a resize) right after its corrective seek starts.
  const raced = await page.eval(`new Promise((done) => {
    const lv = document.querySelector('.tv-lens video'), sv = document.querySelector('.tv-video.is-active');
    let n = 0;
    const on = () => { if (++n === 2) { lv.removeEventListener('seeking', on); window.dispatchEvent(new Event('resize')); done(true); } };
    lv.addEventListener('seeking', on);
    lv.currentTime = (sv.currentTime + 0.25) % sv.duration;
    setTimeout(() => done(false), 3000);
  })`);
  assert(raced, 'the sync did not seek after the offset');
  await sleep(1500);
  for (let i = 0; i < 3; i++) {
    await page.eval(OFFSET);
    await sleep(1500);
    d = await page.eval(DRIFT);
    assert(Math.abs(d) < 2, 'after the restart, offset ' + (i + 1) + ': drift ' + d.toFixed(2) + ' frames');
  }
  return page;
});

check('a lens clip that fails falls back to the still', async (ctx) => {
  ctx.srv.rules.push({ re: /\/lens-[^/]*\.mp4$/, corrupt: true });
  const page = await lensPage(ctx);
  const before = await page.eval(STATE);
  if (before.tier !== 'lens') return { page, skip: 'this browser has no lens tier (' + before.tier + ')' };
  await page.eval(`document.querySelector('.tv-inspect').click(), true`);
  await page.until(`(() => { const i = document.querySelector('.tv-lens img'); return i && i.complete && i.naturalWidth > 0; })()`, 'still in the lens');
  const st = await page.eval(STATE);
  assert(st.tier === 'still' && st.inspecting, 'tier ' + st.tier + ', inspecting ' + st.inspecting);
  assert(st.note === '3840×2880 frame', 'note ' + st.note);
  assert(!/could not be loaded/.test(st.notice), 'notice ' + st.notice);
  const src = await page.eval(`document.querySelector('.tv-lens img').getAttribute('src')`);
  assert(/^blob:/.test(src), 'lens image ' + src);
  await page.close();
  // Every lens clip and both still files fail: Inspect stops with a notice.
  ctx.srv.rules.push({ re: /\/still-[^/]*$/, corrupt: true });
  const p2 = await lensPage(ctx);
  await p2.eval(`document.querySelector('.tv-inspect').click(), true`);
  await p2.until(STATE + '.notice.includes("could not be loaded")', 'problem notice');
  const end = await p2.eval(STATE);
  assert(!end.inspecting && /could not be loaded/.test(end.notice), JSON.stringify(end));
  const tried = ctx.srv.log.map((r) => r.path.split('/').pop()).filter((f) => /^(lens|still)-/.test(f));
  assert(['lens-sdr-hevc.mp4', 'still-sdr.png', 'still-hdr.avif'].every((f) => tried.includes(f)), 'files tried: ' + tried.join(', '));
  return p2;
});

check('sibling prefetch goes on after a sibling file fails', async (ctx) => {
  ctx.srv.rules.push({ re: /fixture_slot\/stage-1920-sdr\.mp4$/, corrupt: true });
  const page = await ctx.open({ dpr: 2 });
  await page.goto(ctx.srv.base + 'tools/tv-fixture/');
  await page.until(STATE + '.activeReady', 'stage clip playing');
  const t0 = Date.now();
  while (!ctx.srv.log.some((r) => /fixture_dots\/stage-1920-sdr\.mp4$/.test(r.path))) {
    assert(Date.now() - t0 < 10000, 'fixture_dots was never fetched; requests: ' +
      [...new Set(ctx.srv.log.map((r) => r.path.split('/').slice(-2).join('/')).filter((p) => /mp4$/.test(p)))].join(', '));
    await sleep(100);
  }
  assert(ctx.srv.log.some((r) => /fixture_slot\/stage-960-sdr\.mp4$/.test(r.path)), 'the failed sibling was not replaced by its next source');
  return page;
});

check('a decodingInfo that throws does not stop the switcher', async (ctx) => {
  const page = await ctx.open({ dpr: 2, init: `navigator.mediaCapabilities.decodingInfo = function () { throw new TypeError('stub'); };` });
  await page.goto(ctx.srv.base + 'tools/tv-fixture/');
  await page.until(STATE + '.activeReady', 'stage clip playing');
  const st = await page.eval(STATE);
  assert(st.ready && st.chips === 4 && !st.notice, JSON.stringify(st));
  return page;
});

check('focus stays in the switcher when a preset switch disables the focused button', async (ctx) => {
  // Landing page (version 1): preset 2 has no clip, so Freeze is off there.
  let page = await ctx.open({ dpr: 2 });
  await page.goto(ctx.srv.base);
  await page.until(STATE + '.activeReady', 'stage clip playing');
  await page.eval(`document.querySelector('.tv-freeze').focus(), true`);
  await page.key('2');
  let st = await page.eval(STATE);
  assert(st.preset === 'jvc_d_series_2000' && st.focusInside, 'after 2: preset ' + st.preset + ', focus on ' + st.focus);
  assert(await page.eval(`document.querySelector('.tv-freeze').getAttribute('aria-disabled') === 'true'`), 'Freeze is not marked unavailable');
  await page.key('1');
  st = await page.eval(STATE);
  assert(st.preset === 'sony_pvm_14l2', 'after 1: preset ' + st.preset);
  await page.close();
  // Fixture: preset 3 has nothing to inspect.
  page = await ctx.open({ dpr: 2 });
  await page.goto(ctx.srv.base + 'tools/tv-fixture/');
  await page.until(STATE + '.activeReady', 'stage clip playing');
  await page.until(`document.querySelector('.tv-inspect').getAttribute('aria-disabled') !== 'true'`, 'Inspect available');
  await page.eval(`document.querySelector('.tv-inspect').focus(), true`);
  await page.key('3');
  st = await page.eval(STATE);
  assert(st.preset === 'fixture_dots' && st.focusInside && /tv-inspect/.test(st.focus), 'after 3: preset ' + st.preset + ', focus on ' + st.focus);
  await page.key(' ');
  st = await page.eval(STATE);
  assert(!st.inspecting, 'Space on the unavailable Inspect button started inspecting');
  await page.key('ArrowLeft');
  st = await page.eval(STATE);
  assert(st.preset === 'fixture_slot', 'after ArrowLeft: preset ' + st.preset);
  return page;
});

/* ---- run ---- */
(async () => {
  const bin = findChrome();
  if (!bin) { console.log('tv-switcher browser checks skipped: no Chrome found (set CHROME)'); return; }
  const dir = siteDir();
  assert(fs.existsSync(path.join(dir, 'tools/tv-fixture/index.html')), dir + ' has no fixture page; build with tools/tv-fixture/preview.yml');
  const srv = await startServer(dir);
  const chrome = await launch(bin);
  const cdp = await CDP.connect(chrome.ws);
  const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
  let passed = 0, failed = 0, skipped = 0;
  for (const c of checks) {
    if (only && !only.test(c.name)) continue;
    srv.rules = []; srv.log = [];
    const pages = [];
    const ctx = { srv, open: async (opt) => { const p = await openPage(cdp, opt || {}); pages.push(p); return p; } };
    try {
      const r = await c.fn(ctx);
      if (r && r.skip) { skipped++; console.log('skip  ' + c.name + ': ' + r.skip); }
      else {
        const errs = pages.flatMap((p) => p.errors);
        assert(!errs.length, 'page errors: ' + errs.join(' | '));
        passed++; console.log('ok    ' + c.name);
      }
    } catch (e) {
      const errs = pages.flatMap((p) => p.errors);
      failed++; console.log('FAIL  ' + c.name + '\n      ' + e.message + (errs.length ? '\n      page errors: ' + errs.join(' | ') : ''));
    }
    for (const p of pages) await p.close().catch(() => {});
  }
  const exited = new Promise((r) => chrome.proc.once('exit', r));
  chrome.proc.kill();
  await exited;
  srv.close();
  try { fs.rmSync(chrome.profile, { recursive: true, force: true }); } catch (e) { /* Chrome may still be closing files */ }
  console.log('tv-switcher browser checks: ' + passed + ' passed, ' + failed + ' failed' + (skipped ? ', ' + skipped + ' skipped' : ''));
  process.exitCode = failed ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(1); });
