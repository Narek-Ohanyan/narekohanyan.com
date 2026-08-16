#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   Local development server
   ───────────────────────────────────────────────────────────────────────
   `python3 -m http.server` serves files but cannot run the Gemini proxy, so
   the AI features fail locally. This serves the static site AND /api/gemini
   using the same api/_gemini-core.js the deployed function uses — so what
   works here works in production, and there is only one copy of the logic.

       node dev-server.js            → http://localhost:4173

   The key is read from the environment, or from a .env file beside this one.
   .env is gitignored; never put a key in a tracked file.
   ═══════════════════════════════════════════════════════════════════════ */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4173;

/* ── .env (only what we need: KEY=VALUE, # comments) ─────────────────── */
(function loadEnv() {
  const f = path.join(ROOT, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    const v = m[2].trim().replace(/^["']|["']$/g, '');
    if (v && !process.env[m[1]]) process.env[m[1]] = v;
  }
}());

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.pdf': 'application/pdf',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ 'Cache-Control': 'no-store' }, headers || {}));
  res.end(body);
}

/* Range support so <video> can seek — without it Safari refuses to play. */
function serveFile(req, res, file) {
  const stat = fs.statSync(file);
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;

  if (range && /^bytes=\d*-\d*$/.test(range)) {
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = s ? parseInt(s, 10) : 0;
    const end = e ? parseInt(e, 10) : stat.size - 1;
    if (start >= stat.size || end >= stat.size) {
      return send(res, 416, '', { 'Content-Range': `bytes */${stat.size}` });
    }
    res.writeHead(206, {
      'Content-Type': type, 'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': end - start + 1
    });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }

  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size,
                       'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  /* ── the proxy, same core as the deployed function ─────────────────── */
  if (pathname === '/api/gemini') {
    let core;
    try { core = require('./api/_gemini-core.js'); }
    catch (e) { return send(res, 500, JSON.stringify({ error: 'proxy core missing' }),
                            { 'Content-Type': 'application/json' }); }

    let raw = '';
    if (req.method === 'POST') {
      raw = await new Promise(r => { let b = ''; req.on('data', c => { b += c; }); req.on('end', () => r(b)); });
    }
    const { status, body } = await core.handle({
      method: req.method,
      headers: { origin: req.headers.origin || '', referer: req.headers.referer || '' },
      rawBody: raw,
      ip: req.socket.remoteAddress
    });
    const h = { 'Content-Type': 'application/json' };
    if (req.headers.origin) h['Access-Control-Allow-Origin'] = req.headers.origin;
    return send(res, status, body === null ? '' : JSON.stringify(body), h);
  }

  /* ── static files ──────────────────────────────────────────────────── */
  let file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT)) return send(res, 403, 'Forbidden');   // no traversal

  try {
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      const idx = path.join(file, 'index.html');
      if (fs.existsSync(idx)) file = idx;
    } else if (!fs.existsSync(file)) {
      // pretty URLs: /Essay → Essay/index.html
      if (fs.existsSync(file + '/index.html')) file = file + '/index.html';
      else if (fs.existsSync(file + '.html')) file = file + '.html';
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
    return serveFile(req, res, file);
  } catch (e) {
    return send(res, 500, 'Server error', { 'Content-Type': 'text/plain' });
  }
});

server.listen(PORT, () => {
  const keyed = !!process.env.GEMINI_API_KEY;
  console.log(`\n  Site      http://localhost:${PORT}`);
  console.log(`  Essay     http://localhost:${PORT}/Essay`);
  console.log(`  Proxy     /api/gemini  —  GEMINI_API_KEY ${keyed ? 'loaded' : 'NOT SET'}`);
  if (!keyed) {
    console.log('\n  The AI buttons will return an error until a key is set.');
    console.log('  Put it in .env (gitignored):   GEMINI_API_KEY=your-key-here\n');
  } else {
    console.log('');
  }
});
