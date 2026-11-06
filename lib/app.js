'use strict';
/**
 * D_MAK MUSIC — zero-dependency Node server.
 * Static assets + server-rendered pages + JSON API + admin CMS + protected
 * preview-clip proxy. Run with:  node server.js   (PORT / ADMIN_TOKEN / etc. via env)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const {
  ROOT,
  IS_SERVERLESS,
  escapeHtml,
  readJson,
  writeJson,
  appendJsonArray,
  timingSafeEqual,
  createRateLimiter,
  isEmail,
  requestId,
} = require('./util');
const store = require('./store');
const ui = require('./ui');
const pages = require('./pages');

/* ------------------------------------------------------------------- env */

// Tiny .env loader so nobody needs dotenv.
function loadEnvFile() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const PREVIEWS_ON = String(process.env.PREVIEWS || 'on').toLowerCase() !== 'off';
const PUBLIC_DIR = path.join(ROOT, 'public');
const IS_DEV = process.env.NODE_ENV !== 'production';

// Make sure the runtime data files exist (serverless /tmp starts empty).
const fsSeed = require('fs');
const pathSeed = require('path');
const { DATA_DIR } = require('./util');
for (const [name, seed] of [
  ['messages.json', []],
  ['subscribers.json', []],
  ['analytics.json', { total: 0, paths: {}, days: {} }],
]) {
  const file = pathSeed.join(DATA_DIR, name);
  if (!fsSeed.existsSync(file)) {
    try { fsSeed.writeFileSync(file, JSON.stringify(seed)); } catch (err) { /* read-only */ }
  }
}

if (!ADMIN_TOKEN) {
  console.warn('[d_mak] ADMIN_TOKEN is not set — the CMS is disabled until you set it (see .env.example).');
}

/* ------------------------------------------------------------- responses */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
};

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "font-src 'self'",
      "media-src 'self' blob:",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
      "connect-src 'self'",
      "base-uri 'none'",
      "form-action 'self'",
    ].join('; '),
  };
}

function send(res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
  const accept = res.req.headers['accept-encoding'] || '';
  const type = headers['Content-Type'] || 'text/html; charset=utf-8';
  const compressible = /text|json|javascript|xml|svg|manifest/.test(type) && buf.length > 1024;
  const h = { ...securityHeaders(), ...headers };

  if (compressible && /\bgzip\b/.test(accept)) {
    const gz = zlib.gzipSync(buf);
    h['Content-Encoding'] = 'gzip';
    h['Vary'] = 'Accept-Encoding';
    h['Content-Length'] = gz.length;
    res.writeHead(status, h);
    return res.end(gz);
  }
  h['Content-Length'] = buf.length;
  res.writeHead(status, h);
  if (res.req.method === 'HEAD') return res.end();
  res.end(buf);
}

function sendJson(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
}

function renderPage(res, pageFactory, { status = 200 } = {}) {
  const content = store.getContent();
  const { page, body } = pageFactory(content);
  const html = ui.documentShell(content, page, body);
  send(res, status, html, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
}

/* -------------------------------------------------------------- body read */

function readBody(req, limitBytes = 100_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(Object.assign(new Error('Invalid JSON body'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function clientKey(req) {
  const fwd = req.headers['x-forwarded-for'];
  return String((fwd ? fwd.split(',')[0] : req.socket.remoteAddress) || 'unknown').trim();
}

/* ----------------------------------------------------------- rate limits */

const limits = {
  contact: createRateLimiter({ windowMs: 10 * 60_000, max: 6 }),
  subscribe: createRateLimiter({ windowMs: 10 * 60_000, max: 10 }),
  auth: createRateLimiter({ windowMs: 10 * 60_000, max: 12 }),
  hit: createRateLimiter({ windowMs: 60_000, max: 120 }),
};

function requireAdmin(req, res) {
  if (!ADMIN_TOKEN) {
    sendJson(res, 503, { ok: false, error: 'CMS disabled: ADMIN_TOKEN is not configured on the server.' });
    return false;
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token && timingSafeEqual(token, ADMIN_TOKEN)) return true;
  // Only *failed* attempts are rate limited, so normal CMS editing is never throttled.
  if (!limits.auth(clientKey(req))) {
    sendJson(res, 429, { ok: false, error: 'Too many failed attempts. Try again in a few minutes.' });
    return false;
  }
  sendJson(res, 401, { ok: false, error: 'Invalid admin token.' });
  return false;
}

/* ---------------------------------------------------------- static files */

function serveStatic(req, res, pathname) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, rel);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  let stat;
  try {
    stat = fs.statSync(filePath);
    if (stat.isDirectory()) throw new Error('dir');
  } catch (err) {
    return false;
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const immutable = ['.woff2', '.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.ico', '.mp3', '.pdf'].includes(ext);
  const etag = `W/"${stat.size}-${Number(stat.mtimeMs).toString(36)}"`;
  const headers = {
    'Content-Type': type,
    'Cache-Control': immutable ? 'public, max-age=2592000, immutable' : 'public, max-age=300',
    ETag: etag,
  };
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }
  if (req.method === 'HEAD') {
    res.writeHead(200, { ...securityHeaders(), ...headers });
    return res.end();
  }
  res.writeHead(200, { ...securityHeaders(), ...headers, 'Content-Length': stat.size });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

/* -------------------------------------------------------- preview proxy */

const previewCache = new Map(); // trackId -> { url, at }

async function resolvePreview(trackId) {
  const cached = previewCache.get(trackId);
  if (cached && Date.now() - cached.at < 8 * 60_000) return cached.url;
  const apiRes = await fetch(`https://api.deezer.com/track/${encodeURIComponent(trackId)}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(7000),
  });
  if (!apiRes.ok) throw new Error(`Deezer API ${apiRes.status}`);
  const data = await apiRes.json();
  if (!data || !data.preview) throw new Error('No preview available for this track');
  previewCache.set(trackId, { url: data.preview, at: Date.now() });
  return data.preview;
}

async function handlePreview(req, res, trackId) {
  if (!PREVIEWS_ON) {
    return sendJson(res, 503, { ok: false, error: 'Previews are disabled on this deployment (PREVIEWS=off).' });
  }
  if (!/^\d{1,20}$/.test(trackId)) {
    return sendJson(res, 400, { ok: false, error: 'Invalid track id.' });
  }
  try {
    const url = await resolvePreview(trackId);
    const audio = await fetch(url, {
      headers: { accept: 'audio/mpeg,*/*', 'user-agent': 'dmakmusic.com preview proxy' },
      signal: AbortSignal.timeout(12000),
    });
    if (!audio.ok || !audio.body) throw new Error(`Audio fetch failed (${audio.status})`);
    res.writeHead(200, {
      ...securityHeaders(),
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=900',
      'Accept-Ranges': 'none',
    });
    const reader = audio.body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) return res.end();
      if (!res.write(Buffer.from(value))) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
      return pump();
    };
    await pump();
  } catch (err) {
    if (!res.headersSent) {
      sendJson(res, 502, {
        ok: false,
        error: 'Preview unavailable right now. Stream the full track on Deezer.',
        detail: IS_DEV ? String(err.message) : undefined,
      });
    } else {
      res.end();
    }
  }
}

/* ------------------------------------------------------------ API routes */

function sanitizeText(value, max = 4000) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .trim()
    .slice(0, max);
}

async function handleContact(req, res) {
  if (!limits.contact(clientKey(req))) {
    return sendJson(res, 429, { ok: false, error: 'Too many messages from this connection. Please try again later.' });
  }
  const body = await readBody(req);
  if (sanitizeText(body.website, 200)) {
    // honeypot filled — pretend success, store nothing
    return sendJson(res, 200, { ok: true, id: requestId() });
  }
  const errors = {};
  const name = sanitizeText(body.name, 120);
  const email = sanitizeText(body.email, 200).toLowerCase();
  const message = sanitizeText(body.message, 4000);
  const type = sanitizeText(body.type, 40) || 'booking';
  if (name.length < 2) errors.name = 'Please enter your name.';
  if (!isEmail(email)) errors.email = 'Enter a valid email address.';
  if (message.length < 20) errors.message = 'Please add at least 20 characters so the team can help.';
  if (body.consent !== true) errors.consent = 'Please confirm you agree to your message being stored.';
  if (Object.keys(errors).length) return sendJson(res, 422, { ok: false, errors });

  const entry = appendJsonArray(store.MESSAGES_FILE, {
    id: requestId(),
    receivedAt: new Date().toISOString(),
    type,
    name,
    email,
    organisation: sanitizeText(body.organisation, 120),
    eventDate: sanitizeText(body.eventDate, 40),
    message,
    read: false,
  });

  // Optional outbound delivery — only if the deployment configures a webhook.
  const hook = process.env.CONTACT_WEBHOOK_URL;
  if (hook) {
    fetch(hook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(6000),
    }).catch((err) => console.warn('[d_mak] contact webhook failed:', err.message));
  }

  return sendJson(res, 201, { ok: true, id: entry.id });
}

async function handleSubscribe(req, res) {
  if (!limits.subscribe(clientKey(req))) {
    return sendJson(res, 429, { ok: false, error: 'Too many attempts. Please try again shortly.' });
  }
  const body = await readBody(req);
  if (sanitizeText(body.website, 200)) return sendJson(res, 200, { ok: true });
  const email = sanitizeText(body.email, 200).toLowerCase();
  if (!isEmail(email)) return sendJson(res, 422, { ok: false, errors: { email: 'Enter a valid email address.' } });

  const list = readJson(store.SUBSCRIBERS_FILE, []);
  if (list.some((s) => s.email === email)) {
    return sendJson(res, 200, { ok: true, duplicate: true, message: 'You are already on the list.' });
  }
  appendJsonArray(store.SUBSCRIBERS_FILE, {
    id: requestId(),
    email,
    country: sanitizeText(body.country, 80),
    source: sanitizeText(body.source, 40) || 'site',
    joinedAt: new Date().toISOString(),
  });
  return sendJson(res, 201, { ok: true, message: 'You are on the list.' });
}

function handleHit(req, res) {
  if (!limits.hit(clientKey(req))) return sendJson(res, 429, { ok: false });
  const content = store.getContent();
  if (!content.site.analytics.enabled) return sendJson(res, 200, { ok: true, disabled: true });
  const body = readJson(store.ANALYTICS_FILE, { total: 0, paths: {}, days: {} });
  return readBody(req).then((payload) => {
    const raw = sanitizeText(payload.path, 200) || '/';
    const clean = raw.split('?')[0].slice(0, 120).replace(/[^a-zA-Z0-9\-_/.§]/g, '') || '/';
    const day = new Date().toISOString().slice(0, 10);
    body.total = (body.total || 0) + 1;
    body.paths = body.paths || {};
    body.paths[clean] = (body.paths[clean] || 0) + 1;
    body.days = body.days || {};
    body.days[day] = (body.days[day] || 0) + 1;
    writeJson(store.ANALYTICS_FILE, body);
    return sendJson(res, 200, { ok: true });
  });
}

async function handleAdminContentPut(req, res) {
  if (!requireAdmin(req, res)) return;
  const body = await readBody(req, 2_000_000);
  if (!body || typeof body !== 'object' || !body.artist || !body.releases) {
    return sendJson(res, 422, { ok: false, error: 'Content must include at least artist and releases.' });
  }
  body.meta = { ...(body.meta || {}), updatedAt: new Date().toISOString().slice(0, 10) };
  store.saveContent(body);
  return sendJson(res, 200, { ok: true, savedAt: new Date().toISOString(), content: body });
}

function handleAdminInbox(req, res, url) {
  if (!requireAdmin(req, res)) return;
  const view = url.searchParams.get('view') || 'messages';
  if (view === 'messages') {
    const list = readJson(store.MESSAGES_FILE, []).slice().reverse().slice(0, 200);
    return sendJson(res, 200, { ok: true, view, items: list, total: readJson(store.MESSAGES_FILE, []).length });
  }
  if (view === 'subscribers') {
    const list = readJson(store.SUBSCRIBERS_FILE, []).slice().reverse().slice(0, 500);
    return sendJson(res, 200, { ok: true, view, items: list, total: readJson(store.SUBSCRIBERS_FILE, []).length });
  }
  if (view === 'analytics') {
    const data = readJson(store.ANALYTICS_FILE, { total: 0, paths: {}, days: {} });
    const top = Object.entries(data.paths || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([path_, count]) => ({ path: path_, count }));
    const days = Object.entries(data.days || {})
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 14)
      .map(([date, count]) => ({ date, count }));
    return sendJson(res, 200, { ok: true, view, total: data.total || 0, top, days, note: store.getContent().site.analytics.note });
  }
  return sendJson(res, 400, { ok: false, error: 'Unknown view.' });
}

/* --------------------------------------------------------------- sitemap */

function sitemapXml(content) {
  const base = content.site.url;
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: '/', priority: '1.0' },
    { loc: '/music', priority: '0.9' },
    { loc: '/videos', priority: '0.8' },
    { loc: '/about', priority: '0.8' },
    { loc: '/news', priority: '0.7' },
    { loc: '/events', priority: '0.7' },
    { loc: '/gallery', priority: '0.6' },
    { loc: '/connect', priority: '0.7' },
    { loc: '/epk', priority: '0.5' },
    { loc: '/privacy', priority: '0.2' },
  ].map((u) => `  <url><loc>${base}${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

/* ---------------------------------------------------------------- router */

const ROUTES = {
  '/': pages.home,
  '/about': pages.about,
  '/music': pages.music,
  '/videos': pages.videos,
  '/news': pages.news,
  '/events': pages.events,
  '/gallery': pages.gallery,
  '/connect': pages.connect,
  '/epk': pages.epk,
  '/privacy': pages.privacy,
  '/admin': pages.admin,
};

async function handleRequest(req, res) {
  res.req = req;
  const started = Date.now();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  try {
    /* ---- API ---- */
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/health') {
        return sendJson(res, 200, {
          ok: true,
          uptime: Math.round(process.uptime()),
          previews: PREVIEWS_ON,
          admin: Boolean(ADMIN_TOKEN),
        });
      }
      if (pathname === '/api/content' && req.method === 'GET') {
        return sendJson(res, 200, store.getContent(), { 'Cache-Control': 'public, max-age=60' });
      }
      if (pathname === '/api/preview' || pathname.startsWith('/api/preview/')) {
        const trackId = url.searchParams.get('track') || pathname.split('/')[3] || '';
        return handlePreview(req, res, trackId);
      }
      if (pathname === '/api/hit' && req.method === 'POST') return handleHit(req, res);
      if (pathname === '/api/contact' && req.method === 'POST') return handleContact(req, res);
      if (pathname === '/api/subscribe' && req.method === 'POST') return handleSubscribe(req, res);
      if (pathname === '/api/instagram') {
        const token = process.env.INSTAGRAM_ACCESS_TOKEN;
        if (!token) {
          // Not an error — simply "no live feed configured". Keeps the browser
          // console clean and the Connect page renders its verified fallback.
          return sendJson(res, 200, {
            ok: true,
            live: false,
            reason: 'Instagram integration not configured.',
            setup: store.getContent().integrations.instagram.setup,
          });
        }
        try {
          const r = await fetch(
            `https://graph.instagram.com/me/media?fields=id,caption,media_url,thumbnail_url,permalink,media_type,timestamp&limit=9&access_token=${encodeURIComponent(
              token
            )}`,
            { signal: AbortSignal.timeout(8000) }
          );
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ? data.error.message : `Graph API ${r.status}`);
          return sendJson(res, 200, { ok: true, live: true, items: data.data || [] }, { 'Cache-Control': 'public, max-age=300' });
        } catch (err) {
          return sendJson(res, 502, { ok: false, live: false, error: 'Instagram feed unavailable', detail: err.message });
        }
      }
      if (pathname === '/api/admin/auth' && req.method === 'POST') {
        if (!requireAdmin(req, res)) return;
        return sendJson(res, 200, { ok: true });
      }
      if (pathname === '/api/admin/content' && req.method === 'PUT') return handleAdminContentPut(req, res);
      if (pathname === '/api/admin/inbox' && req.method === 'GET') return handleAdminInbox(req, res, url);
      return sendJson(res, 404, { ok: false, error: 'Unknown API endpoint.' });
    }

    /* ---- generated files ---- */
    if (pathname === '/sitemap.xml') {
      return send(res, 200, sitemapXml(store.getContent()), {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      });
    }
    if (pathname === '/robots.txt') {
      const content = store.getContent();
      return send(
        res,
        200,
        `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${content.site.url}/sitemap.xml\n`,
        { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      );
    }
    if (pathname === '/manifest.webmanifest') {
      const content = store.getContent();
      return sendJson(
        res,
        200,
        {
          name: content.site.name,
          short_name: 'D_MAK',
          description: content.site.description,
          start_url: '/',
          display: 'standalone',
          background_color: '#08060f',
          theme_color: content.site.themeColor,
          icons: [
            { src: '/img/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
            { src: '/img/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
          ],
        },
        { 'Content-Type': 'application/manifest+json; charset=utf-8' }
      );
    }

    /* ---- pages ---- */
    if (ROUTES[pathname] && (req.method === 'GET' || req.method === 'HEAD')) {
      return renderPage(res, ROUTES[pathname]);
    }

    /* ---- static ---- */
    if (req.method === 'GET' || req.method === 'HEAD') {
      const served = serveStatic(req, res, pathname);
      if (served !== false) return served;
    }

    /* ---- 404 ---- */
    return renderPage(res, pages.notFound, { status: 404 });
  } catch (err) {
    console.error('[d_mak] request error', req.method, pathname, err);
    if (res.headersSent) return res.end();
    const status = err.status || 500;
    return sendJson(res, status, {
      ok: false,
      error: status === 500 ? 'Something went wrong on the server.' : err.message,
    });
  } finally {
    if (process.env.LOG_REQUESTS !== 'off') {
      const ms = Date.now() - started;
      console.log(`${req.method} ${pathname} ${res.statusCode} ${ms}ms`);
    }
  }
}

module.exports = { handleRequest, IS_SERVERLESS, ADMIN_TOKEN, PREVIEWS_ON };
