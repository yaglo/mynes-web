#!/usr/bin/env node
/* Pixel checks of the renders in a built site, in headless Chrome.
 *
 * K64: at device pixel ratios 1, 1.5, 2 and 3 (viewport 1280 CSS px, sRGB
 * output), every SDR crop (img.render), both renders of each comparison
 * slider and the visible part of each pan viewer must appear on screen
 * exactly as in the file the browser chose, pixel for pixel. That holds only
 * when nothing scales the image and it is painted on whole device pixels.
 * The screenshot is taken at the element's position rounded to device
 * pixels, where the browser paints it.
 * K65: at 360 CSS px, no page scrolls sideways.
 * Archived pages keep their old images and are skipped; so are HDR files
 * (a screenshot is SDR) and pages without renders (K64).
 *
 * Run:  node tools/check_render_pixels.js SITE_DIR [--json] [--pages /a/,/b/]
 * SITE_DIR is a build of the site (bundle exec jekyll build). The browser is
 * $CHROME, else Chrome for Testing under ~/.cache/puppeteer. Exit status: 0
 * when every check passes, 1 when one fails, 3 when no browser was found.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const zlib = require('zlib');
const { spawn } = require('child_process');

const PREFIX = '/mynes-web/';
const RATIOS = (process.env.RATIOS || '1,1.5,2,3').split(',').map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- PNG ---- */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let i = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0;
  const idat = [];
  while (i < buf.length) {
    const len = buf.readUInt32BE(i), kind = buf.toString('latin1', i + 4, i + 8), data = buf.subarray(i + 8, i + 8 + len);
    if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; type = data[9]; interlace = data[12]; }
    else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
    i += 12 + len;
  }
  if (depth !== 8 || (type !== 2 && type !== 6) || interlace) throw new Error(`unsupported PNG (depth ${depth}, type ${type}, interlace ${interlace})`);
  const bpp = type === 2 ? 3 : 4, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(w * h * 3);
  let prev = Buffer.alloc(stride), p = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[p++], line = Buffer.from(raw.subarray(p, p + stride));
    p += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      line[x] = v & 255;
    }
    for (let x = 0; x < w; x++) for (let k = 0; k < 3; k++) out[(y * w + x) * 3 + k] = line[x * bpp + k];
    prev = line;
  }
  return { width: w, height: h, rgb: out };
}

/** Pixels differing between region (sx, sy, w, h) of a and the whole of b; returns [count, first]. */
function compare(a, sx, sy, b) {
  let bad = 0, first = null;
  for (let y = 0; y < b.height; y++) for (let x = 0; x < b.width; x++) {
    const ia = ((sy + y) * a.width + sx + x) * 3, ib = (y * b.width + x) * 3;
    if (a.rgb[ia] !== b.rgb[ib] || a.rgb[ia + 1] !== b.rgb[ib + 1] || a.rgb[ia + 2] !== b.rgb[ib + 2]) {
      bad++;
      if (!first) first = `(${x}, ${y}) file ${a.rgb.slice(ia, ia + 3).join(',')} screen ${b.rgb.slice(ib, ib + 3).join(',')}`;
    }
  }
  return [bad, first];
}

/* ---- browser ---- */
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
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
  walk(path.join(os.homedir(), '.cache/puppeteer/chrome'), 0);
  found.sort();
  return found.length ? found[found.length - 1] : null;
}

function launch(bin) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'render-chrome-'));
  const proc = spawn(bin, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--no-first-run',
    '--no-default-browser-check', '--force-color-profile=srgb', '--hide-scrollbars', '--mute-audio', 'about:blank'],
  { stdio: ['ignore', 'ignore', 'pipe'] });
  return new Promise((resolve, reject) => {
    let err = '';
    const t = setTimeout(() => reject(new Error('Chrome did not start: ' + err.slice(-300))), 20000);
    proc.stderr.on('data', (d) => {
      err += d;
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(err);
      if (m) { clearTimeout(t); resolve({ proc, ws: m[1], profile }); }
    });
  });
}

function connect(url) {
  const ws = new WebSocket(url);
  let n = 0;
  const calls = new Map(), subs = new Set();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id) { const c = calls.get(m.id); calls.delete(m.id); if (m.error) c.bad(new Error(c.method + ': ' + m.error.message)); else c.ok(m.result); }
    else for (const f of subs) f(m);
  };
  const cdp = {
    send(method, params, sessionId) {
      const id = ++n;
      ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
      return new Promise((ok, bad) => calls.set(id, { ok, bad, method }));
    },
    wait(method, sessionId, ms) {
      return new Promise((ok, bad) => {
        const f = (m) => { if (m.method === method && m.sessionId === sessionId) { clearTimeout(t); subs.delete(f); ok(m.params); } };
        const t = setTimeout(() => { subs.delete(f); bad(new Error('timed out waiting for ' + method)); }, ms || 90000);
        subs.add(f);
      });
    },
    close() { ws.close(); }
  };
  return new Promise((ok, bad) => { ws.onopen = () => ok(cdp); ws.onerror = () => bad(new Error('no DevTools connection')); });
}

function serve(dir) {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.json': 'application/json', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = p.startsWith(PREFIX) ? path.join(dir, p.slice(PREFIX.length)) : null;
    if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!file || !file.startsWith(dir) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, base: 'http://127.0.0.1:' + server.address().port + PREFIX })));
}

async function openPage(cdp, width, height, dpr) {
  const { browserContextId } = await cdp.send('Target.createBrowserContext');
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => cdp.send(m, p, sessionId);
  await s('Page.enable');
  await s('Runtime.enable');
  await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: false });
  return {
    async goto(url) {
      // Large lazy images can hold the load event back; the checks wait for each image themselves.
      const load = cdp.wait('Page.loadEventFired', sessionId, 30000).catch(() => null);
      await s('Page.navigate', { url });
      await load;
    },
    async eval(expr) {
      const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('page: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text));
      return r.result.value;
    },
    /** The viewport as the screen shows it, in device pixels. */
    async shot() {
      const r = await s('Page.captureScreenshot', { format: 'png', fromSurface: true });
      return decodePng(Buffer.from(r.data, 'base64'));
    },
    async close() { await cdp.send('Target.closeTarget', { targetId }); await cdp.send('Target.disposeBrowserContext', { browserContextId }); }
  };
}

/* In the page: load every lazy image, wait for the renders, and describe them. */
const PREPARE = `(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  const imgs = [...document.querySelectorAll('main img.render')];
  await Promise.all(imgs.map((i) => i.complete && i.naturalWidth ? 0 : new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); setTimeout(r, 15000); })));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  document.querySelectorAll('.compare-divider').forEach((d) => { d.style.display = 'none'; });
  const out = [];
  imgs.forEach((img, i) => {
    img.dataset.checkIndex = i;
    const pan = img.closest('.pan'), cmp = img.closest('.compare');
    out.push({ i, src: img.currentSrc, pan: !!pan, compare: cmp ? (img.closest('.compare-over') ? 'over' : 'under') : null });
  });
  return out;
})()`;

/* Scrolls the render to the top of the viewport, waits until it is decoded
   and painted, and returns its box in viewport CSS px. */
function rectExpr(i, part) {
  return `(async () => {
    const img = document.querySelector('[data-check-index="${i}"]');
    const f = img.closest('figure');
    ${part}
    const target = img.closest('.pan') || img;
    try { await img.decode(); } catch (e) { /* not decodable: the comparison fails */ }
    await new Promise((r) => setTimeout(r, 200));   // render.js aligns boxes 50 ms after a load
    // Scroll by a whole number of CSS px that is also a whole number of device px
    // (2 CSS px at ratio 1.5), as a reader's scrolling does.
    const d = devicePixelRatio;
    let step = 1;
    while (step < 8 && Math.abs(step * d - Math.round(step * d)) > 1e-6) step++;
    window.scrollTo(0, Math.max(0, Math.round((target.getBoundingClientRect().top + scrollY - 8) / step) * step));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const r = target.getBoundingClientRect();
    const box = img.closest('.pan');
    const clip = img.closest('.render-scroll');
    const cw = clip ? Math.min(r.width, clip.getBoundingClientRect().right - r.left) : r.width;
    return { x: r.left, y: r.top, w: box ? box.clientWidth : cw, h: box ? box.clientHeight : r.height, full: r.width,
             sl: box ? box.scrollLeft : 0, st: box ? box.scrollTop : 0, dpr: devicePixelRatio, src: img.currentSrc,
             vw: innerWidth, vh: innerHeight };
  })()`;
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const pi = args.indexOf('--pages');
  const only = pi >= 0 ? args[pi + 1].split(',') : null;
  const site = path.resolve(args.find((a, k) => !a.startsWith('--') && args[k - 1] !== '--pages') || '_site');
  const bin = findChrome();
  if (!bin) { console.error('check_render_pixels: no Chrome found (set $CHROME)'); process.exit(3); }
  const hits = [];
  const report = (check, rel, url, text) => {
    hits.push({ check, where: rel, page: url, text });
    if (json) console.log(JSON.stringify({ check, where: rel, page: url, text }));
    else console.log(`${rel}: ${check} fail: ${text}`);
  };

  const pages = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) {
        const rel = path.relative(site, p).split(path.sep).join('/');
        const url = '/' + rel.replace(/index\.html$/, '');
        const text = fs.readFileSync(p, 'utf8');
        if (!/<main\b/.test(text) || url.startsWith('/archive/') || url.startsWith('/tools/')) continue;
        if (only && !only.includes(url)) continue;
        pages.push({ rel, url, renders: /class="render[ "]/.test(text) && /<img class="render/.test(text) });
      }
    }
  };
  walk(site);

  const { server, base } = await serve(site);
  const chrome = await launch(bin);
  const cdp = await connect(chrome.ws);
  const files = new Map();
  const fileFor = (src) => {
    const p = decodeURIComponent(new URL(src).pathname);
    const f = path.join(site, p.slice(PREFIX.length));
    if (!files.has(f)) files.set(f, /\.png$/i.test(f) ? decodePng(fs.readFileSync(f)) : null);
    return files.get(f);
  };
  let checked = 0;
  try {
    for (const pg of pages) {
      // K65: no sideways scrolling at 360 CSS px.
      const narrow = await openPage(cdp, 360, 740, 2);
      await narrow.goto(base + pg.url.slice(1));
      const sw = await narrow.eval('[document.documentElement.scrollWidth, innerWidth]');
      if (sw[0] > sw[1]) report('K65', pg.rel, pg.url, `page is ${sw[0]} CSS px wide in a ${sw[1]} px window`);
      await narrow.close();
      if (!pg.renders) continue;
      for (const dpr of RATIOS) {
        const page = await openPage(cdp, 1280, 1200, dpr);
        await page.goto(base + pg.url.slice(1));
        const items = await page.eval(PREPARE);
        for (const it of items) {
          const setups = it.compare === 'over' ? ['f.compareSlider && f.compareSlider.setHeld(true);']
            : it.compare === 'under' ? ['if (f.compareSlider) { f.compareSlider.setHeld(false); f.compareSlider.set(0); }'] : [''];
          for (const setup of setups) {
            const r = await page.eval(rectExpr(it.i, setup));
            if (/\.avif$/i.test(r.src.split('?')[0])) continue;
            const file = fileFor(r.src);
            if (!file) continue;
            const dx = r.x * dpr, dy = r.y * dpr, dw = Math.round(r.w * dpr), dh = Math.round(r.h * dpr);
            const where = `${pg.rel} (ratio ${dpr}, ${path.basename(r.src)})`;
            // Layout positions can be fractional (line heights, rem margins); the browser
            // snaps the image to the device pixel grid when it paints, so compare there.
            const off = Math.abs(dx - Math.round(dx)) > 0.01 || Math.abs(dy - Math.round(dy)) > 0.01;
            const sx = Math.round(r.sl * dpr), sy = Math.round(r.st * dpr);
            const w = Math.min(dw, file.width - sx), h = Math.min(dh, file.height - sy);
            if (!it.pan && (Math.round(r.full * dpr) !== file.width || dh !== file.height)) {
              report('K64', where, pg.url, `shown at ${Math.round(r.full * dpr)}x${dh} device px, file is ${file.width}x${file.height}`);
              continue;
            }
            let screen = await page.shot();
            // The browser paints the image at its layout position snapped to device
            // pixels; its rounding may differ from Math.round by one pixel, so the
            // nearest exact match within one pixel counts.
            let best = null;
            for (const [ox, oy] of [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
              const x0 = Math.round(dx) + ox, y0 = Math.round(dy) + oy;
              const vis = { width: Math.min(w, screen.width - x0 - 1), height: Math.min(h, screen.height - y0 - 1) };
              if (x0 < 0 || y0 < 0 || vis.width <= 0 || vis.height <= 0) continue;
              const shot = { width: vis.width, height: vis.height, rgb: Buffer.alloc(vis.width * vis.height * 3) };
              for (let y = 0; y < vis.height; y++) {
                screen.rgb.copy(shot.rgb, y * vis.width * 3, ((y0 + y) * screen.width + x0) * 3, ((y0 + y) * screen.width + x0 + vis.width) * 3);
              }
              const [bad, first] = compare(file, sx, sy, shot);
              if (!best || bad < best.bad) best = { bad, first, w: vis.width, h: vis.height, ox, oy };
              if (!bad) break;
            }
            if (best && best.bad && !it.retried) {
              // A large image can still be rastering; look once more before failing.
              it.retried = true;
              await sleep(1500);
              screen = await page.shot();
              const x0 = Math.round(dx) + best.ox, y0 = Math.round(dy) + best.oy;
              const shot = { width: best.w, height: best.h, rgb: Buffer.alloc(best.w * best.h * 3) };
              for (let y = 0; y < best.h; y++) {
                screen.rgb.copy(shot.rgb, y * best.w * 3, ((y0 + y) * screen.width + x0) * 3, ((y0 + y) * screen.width + x0 + best.w) * 3);
              }
              const [bad2, first2] = compare(file, sx, sy, shot);
              if (bad2 < best.bad) Object.assign(best, { bad: bad2, first: first2 });
            }
            if (process.env.DUMP_DIR && best && best.bad) {
              const x0 = Math.round(dx) + best.ox, y0 = Math.round(dy) + best.oy;
              const W = Math.min(best.w + 8, screen.width - x0 + 4), H = Math.min(best.h + 8, screen.height - y0 + 4);
              const buf = Buffer.alloc(W * H * 3);
              for (let y = 0; y < H; y++) screen.rgb.copy(buf, y * W * 3, ((y0 - 4 + y) * screen.width + x0 - 4) * 3, ((y0 - 4 + y) * screen.width + x0 - 4 + W) * 3);
              fs.writeFileSync(path.join(process.env.DUMP_DIR, `r${dpr}-${path.basename(r.src)}.ppm`), Buffer.concat([Buffer.from(`P6 ${W} ${H} 255\n`), buf]));
            }
            if (!best) { report('K64', where, pg.url, 'render is outside the viewport'); continue; }
            const { bad, first } = best;
            const w2 = best.w, h2 = best.h;
            checked++;
            if (bad) report('K64', where, pg.url, `${bad} of ${w2 * h2} pixels differ from the file, first at ${first}` +
              (off ? `; the layout puts it at (${dx.toFixed(2)}, ${dy.toFixed(2)}) device px` : ''));
          }
        }
        await page.close();
      }
    }
  } finally {
    cdp.close();
    chrome.proc.kill();
    server.close();
    try { fs.rmSync(chrome.profile, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  }
  const msg = `check_render_pixels: ${pages.length} pages, ${checked} render screenshots compared at ratios ${RATIOS.join(', ')}, ${hits.length} failures`;
  if (json) console.log(JSON.stringify({ summary: msg })); else console.log(msg);
  process.exit(hits.length ? 1 : 0);
}

main().catch((e) => { console.error(e.stack || String(e)); process.exit(2); });
