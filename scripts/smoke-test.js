#!/usr/bin/env node
/**
 * Minimal smoke test: `node scripts/smoke-test.js [baseUrl]`
 * Checks every route, key static files, the API contract and the admin auth guard.
 */
const base = process.argv[2] || `http://localhost:${process.env.PORT || 3000}`;

const routes = [
  '/',
  '/music',
  '/videos',
  '/about',
  '/news',
  '/events',
  '/gallery',
  '/connect',
  '/epk',
  '/privacy',
  '/admin',
];

const files = [
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.webmanifest',
  '/css/main.css',
  '/js/main.js',
  '/js/admin.js',
  '/img/og/dmak-og.jpg',
  '/img/favicon.svg',
  '/files/D_MAK_MUSIC_EPK.pdf',
];

(async () => {
  let failed = 0;
  const check = (label, ok, detail = '') => {
    if (!ok) failed += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  };

  for (const route of routes) {
    const res = await fetch(base + route);
    check(`GET ${route}`, res.status === 200, String(res.status));
  }

  for (const file of files) {
    const res = await fetch(base + file);
    check(`GET ${file}`, res.status === 200, String(res.status));
  }

  const missing = await fetch(`${base}/definitely-not-a-page`);
  check('custom 404 returns 404', missing.status === 404, String(missing.status));

  const health = await (await fetch(`${base}/api/health`)).json();
  check('health endpoint', health.ok === true, JSON.stringify(health));

  const content = await (await fetch(`${base}/api/content`)).json();
  check(
    'content has releases',
    Array.isArray(content.releases) && content.releases.length > 0,
    `${content.releases.length} releases`
  );
  check(
    'every release resolves somewhere',
    content.releases.every((r) => r.id && (r.pendingLinks || r.links.deezer || r.links.apple || r.links.youtube))
  );
  check(
    'no invented social links (empty url stays empty)',
    content.socials.filter((s) => !s.url).length > 0
  );

  const badContact = await fetch(`${base}/api/contact`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'x', email: 'nope', message: 'short', consent: false }),
  });
  check('contact validation rejects bad input', badContact.status === 422, String(badContact.status));

  const unauthInbox = await fetch(`${base}/api/admin/inbox?view=messages`);
  check('admin API rejects anonymous access', [401, 503].includes(unauthInbox.status), String(unauthInbox.status));

  const unauthSave = await fetch(`${base}/api/admin/content`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  check('admin write rejects anonymous access', [401, 503].includes(unauthSave.status), String(unauthSave.status));

  console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
  process.exit(failed ? 1 : 0);
})();
