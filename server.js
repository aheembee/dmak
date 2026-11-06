'use strict';
/**
 * D_MAK MUSIC — local / container entry point.
 * All request handling lives in lib/app.js so the same code can run as a
 * Netlify Function (see netlify/functions/server.js).
 */
const http = require('http');
const { handleRequest } = require('./lib/app');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN = Boolean(process.env.ADMIN_TOKEN);
const PREVIEWS_ON = String(process.env.PREVIEWS || 'on').toLowerCase() !== 'off';

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('[d_mak] unhandled', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal error');
    } else {
      res.end();
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n  D_MAK MUSIC — site running`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → CMS at /admin ${ADMIN ? '(token configured)' : '(DISABLED — set ADMIN_TOKEN)'}`);
  console.log(`  → previews ${PREVIEWS_ON ? 'on' : 'off'}\n`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
