# D_MAK MUSIC — official artist website

A production-ready, futuristic artist website for **D_MAK** (Wandera David Musamya), the
Ugandan recording artist from Busia. Server-rendered, zero npm dependencies, with a
built-in content CMS, a working music player, form handling, structured data and a
print-ready EPK.

```
node server.js      →  http://localhost:3000     (CMS at /admin)
```

No `npm install` required — the entire stack runs on the Node.js standard library
(Node 18+, developed on Node 20).

---

## 1. What is in the box

| Area | Implementation |
| --- | --- |
| Pages | `/` · `/music` · `/videos` · `/about` · `/news` · `/events` · `/gallery` · `/connect` · `/epk` · `/privacy` · `/admin` · custom 404 |
| Rendering | Server-side rendered HTML (`lib/pages.js`) + shared component library (`lib/ui.js`) |
| Styling | One hand-written CSS design system (`public/css/main.css`), self-hosted variable fonts, no frameworks, no CDN calls |
| Client JS | Vanilla ES5-safe modules (`public/js/main.js`), ~28 KB unminified |
| Music player | Persistent dock, play/pause/next/prev/seek, streams **30-second previews** through `GET /api/preview/:trackId` (Deezer public API, proxied server-side — no audio stored on this server) |
| Video | Click-to-load YouTube facades (no iframes until the visitor asks), `youtube-nocookie` embeds, graceful “watch on YouTube” fallback |
| Forms | Contact/booking (validation, honeypot, rate limiting, stored in `data/messages.json`) and newsletter (`data/subscribers.json`) — both with loading, success and error states |
| CMS | `/admin` — token-authenticated editor for bio, socials, releases, videos, news, events, gallery, booking and SEO. Writes to `content/site.json` through `PUT /api/admin/content` |
| Analytics | Cookieless, self-hosted pageview counter (`data/analytics.json`). No cookies, no IDs, no third parties |
| SEO | Per-page titles/descriptions, canonical URLs, Open Graph + Twitter cards, generated OG image, `MusicGroup` / `WebSite` / `MusicAlbum` / `MusicEvent` / `BreadcrumbList` JSON-LD, `sitemap.xml`, `robots.txt`, web manifest |
| Security | Strict CSP, `nosniff`, referrer policy, path-traversal guard on static files, timing-safe admin token comparison, rate limiting on all write endpoints, output escaping on every interpolation |
| Accessibility | Skip link, single `h1` per page, ARIA-labelled controls, visible focus rings, keyboard-operable player/lightbox/filters, `prefers-reduced-motion` respected, AA-contrast palette |
| Deployment | Node process + `Dockerfile`, optional nginx reverse-proxy sample, JSON files as the datastore (back them up) |

---

## 2. Run it

```bash
cp .env.example .env          # then edit ADMIN_TOKEN
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # generate a token
node server.js
```

Open <http://localhost:3000>. The CMS lives at <http://localhost:3000/admin>.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | no (default `3000`) | HTTP port |
| `HOST` | no (default `0.0.0.0`) | Bind address |
| `ADMIN_TOKEN` | **yes for CMS** | Bearer token for `/api/admin/*`. Without it the CMS returns 503 and stays locked |
| `PREVIEWS` | no (default `on`) | `off` disables the preview proxy entirely |
| `INSTAGRAM_ACCESS_TOKEN` | optional | Enables the live Instagram feed (`/api/instagram`). Without it the Connect page shows the verified static wall |
| `YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` | optional | For automatic channel sync (embeds work without them) |
| `CONTACT_WEBHOOK_URL` | optional | Forwards each enquiry as JSON (Zapier / Make / n8n / your own function / email API) |
| `NODE_ENV=production` | recommended | Hides internal error details from API responses |
| `LOG_REQUESTS=off` | optional | Quiets the request log |

**Never commit `.env`.** Nothing secret is ever printed into HTML or client JS — the admin
token is typed by the artist and held only in `sessionStorage` for the tab.

---

## 3. Editing the site (no code)

Everything public is driven by **`content/site.json`**, and there are two ways to edit it:

**A. The CMS at `/admin`** — recommended for the artist/manager.

1. Set `ADMIN_TOKEN` in `.env`, restart, open `/admin`.
2. Paste the token once per browser tab.
3. Pick a section tab (Artist, Socials, Releases, Videos, News, Events, Gallery, Booking, Site & SEO).
4. Edit fields, press **Save changes**. The public site updates on the next request.
5. The inbox tabs at the bottom show enquiries, subscribers and cookieless analytics.

**B. Directly editing `content/site.json`** — for bulk work or version control. The schema is
self-explanatory; the server picks up file changes without a restart.

### Common tasks

| Task | Where |
| --- | --- |
| Change bio / tagline / philosophy | CMS → **Artist** |
| Add a release | CMS → **Releases** → *+ Add release*. Add a Deezer **track ID** to enable the 30-second preview |
| Add a music video | CMS → **Videos** → *+ Add video*. `YouTube ID` = the part after `v=` |
| Announce a show | CMS → **Events** → *+ Add upcoming date* (ticket URL optional). Events are emitted as `MusicEvent` structured data |
| Post news | CMS → **News** (newest first automatically) |
| Upload photography | Put files in `public/img/art/`, then CMS → **Gallery** |
| Add Spotify / Boomplay / Audiomack | CMS → **Socials** — paste the URL and the icon activates site-wide. **Empty URL = greyed-out “pending” icon, never a fake link** |
| Set the booking email | CMS → **Booking** → *Booking email*. Until it is set, enquiries are stored in the private inbox only |
| Swap the social-share image | Replace `public/img/og/dmak-og.jpg` (1200×630) |
| Turn off “to confirm” notices | CMS → **Site & SEO** → *Show “to confirm” notices* → Off |

### Media conventions

* Cover art: square JPEG/PNG, 1000×1000 or larger → `public/img/covers/`
* Editorial photography: 1600 px+ long edge → `public/img/art/`
* OG image: exactly 1200×630 → `public/img/og/`
* Releases without an artwork file render a branded gradient tile marked *artwork pending upload* —
  the site never fakes an asset.

---

## 4. Regenerating the press kit PDF

`public/files/D_MAK_MUSIC_EPK.pdf` is a real A4 PDF generated from the `/epk` page's print
stylesheet. After editing the bio or discography, regenerate it:

```bash
# with the server running
npx playwright@latest install chromium
node -e "…see /scripts/make-epk-pdf.js…"      # or simply:
# visit /epk → “Print / Save as PDF” → save over the file in public/files/
```

The on-page **Download PDF** button always serves the committed file, so update it whenever
the EPK content changes.

---

## 5. Integrations

### Instagram (optional, off by default)
Real feed integration requires a Meta app:

1. Create a Meta app → add **Instagram Basic Display** (or Instagram Graph API for a
   Professional account).
2. Generate a long-lived access token for `@d_mak_music`.
3. Set `INSTAGRAM_ACCESS_TOKEN` and restart.

The server then exposes `GET /api/instagram`, and `/connect` swaps its static wall for live
media. **No token is present in this build, so the site shows verified static tiles and says
so on the page** — there is no faked “live” feed anywhere.

### YouTube
Embeds require nothing. Automatic channel sync (for pulling the latest uploads into the
Videos page) needs `YOUTUBE_API_KEY` + `YOUTUBE_CHANNEL_ID`.

### Music previews
`/api/preview/:trackId` resolves a fresh signed preview URL from Deezer's public API on each
request and streams it through this server (8-minute in-memory URL cache, 12-second timeout).
If Deezer is unreachable the player shows an honest “Preview unavailable” message with a link
to stream the full track. Set `PREVIEWS=off` to disable.

---

## 6. Deploying to Netlify

Netlify serves static files from a CDN, so this repo is wired for **Netlify Functions**:
`public/` is published as-is (CSS, JS, images, fonts, PDF are served straight from the edge) and
every page route plus `/api/*` is rewritten to `netlify/functions/server.js`, which is a thin
adapter around the same `lib/app.js` used by `node server.js`.

Everything needed is already in the repo: `netlify.toml` + `netlify/functions/server.js`.

### Deploy (either path)

**A — Git (recommended, gives you continuous deploys)**
1. Push this folder to a GitHub/GitLab repo.
2. Netlify → *Add new site* → *Import an existing project* → pick the repo.
3. Build command: `echo 'no build step'` · Publish directory: `public` (already set in `netlify.toml`).
4. *Site configuration → Environment variables* → add:
   * `ADMIN_TOKEN` = a long random string (required for `/admin`)
   * optionally `CONTACT_WEBHOOK_URL`, `INSTAGRAM_ACCESS_TOKEN`, `PREVIEWS=off`
5. Deploy. `netlify.toml` sets Node 20 and includes `content/`, `lib/`, `public/` in the function bundle.

**B — Netlify CLI**
```bash
npm i -g netlify-cli
netlify login
netlify init            # or: netlify link
netlify env:set ADMIN_TOKEN "your-long-random-token"
netlify deploy --build --prod
```

**C — Drag & drop** only publishes the static folder, so the server-rendered pages and the API
would not exist. Use A or B for this project.

### What behaves differently on Netlify (important)

| Feature | On Netlify Functions |
| --- | --- |
| Pages, SEO, JSON-LD, sitemap | Identical — rendered per request by the function |
| Music previews (`/api/preview/:id`) | Works — the proxy runs inside the function (Deezer fetch) |
| Contact + newsletter forms | Work, but write to `/tmp`, so **entries are lost when the instance recycles**. Set `CONTACT_WEBHOOK_URL` (Zapier/Make/n8n/email API) to actually receive them |
| `/admin` CMS | Unlocks and edits fine, but saves are **ephemeral** on Netlify. The CMS shows a “Serverless mode” notice explaining this |
| Cookieless analytics | Counted per warm instance only |
| Thumbnail/e-mail free storage of data | Needs an external store (KV, Supabase, Airtable, webhook) |

Two clean options if you need a permanently editable CMS:

1. **Keep Netlify for hosting** and treat `content/site.json` as the source of truth: edit →
   commit → Netlify redeploys (≈30 s). Free, versioned, zero infrastructure.
2. **Move the whole thing to a Node host** (Render, Railway, Fly.io, a €5 VPS, or the included
   Docker image) where `data/` is a real writable volume — then `/admin` saves and the inbox
   work exactly as designed. `netlify.toml` is simply ignored there.

---

## 7. Deployment (Node hosts, Docker)

**Any Node host** (Render, Railway, Fly, a VPS, cPanel-with-Node):

```bash
ADMIN_TOKEN=…  NODE_ENV=production PORT=3000 node server.js
```

**Docker**

```bash
docker build -t dmak-music .
docker run -p 3000:3000 -e ADMIN_TOKEN=change-me -v "$PWD/data:/app/data" dmak-music
```

Mount `data/` (messages, subscribers, analytics) and keep `content/site.json` in your repo or
a mounted volume so CMS edits survive redeploys.

**Reverse proxy** — sample in `deploy/nginx.conf` (TLS, gzip + brotli, long-cache for
`/fonts` `/img`, proxy to `127.0.0.1:3000`).

**Health check** — `GET /api/health` → `{ ok, uptime, previews, admin }`.

---

## 8. File map

```
server.js                 HTTP server, routing, API, preview proxy, sitemap
content/site.json         ← ALL public content (the CMS writes here)
data/                     messages.json · subscribers.json · analytics.json (runtime, back these up)
lib/util.js               escaping, JSON I/O, rate limiter, date/format helpers
lib/store.js              content loading/caching + derived views (featured, latest, queue)
lib/ui.js                 icons, components, JSON-LD, document shell
lib/pages.js              one renderer per page
public/css/main.css       design system (dark cinematic, glass, neon, print styles)
public/js/main.js         nav, reveals, canvas waveform, player, lightbox, filters, forms
public/js/admin.js        CMS client
public/fonts/             self-hosted Syne / Inter / JetBrains Mono (OFL)
public/img/               covers, art, og image, favicon
public/files/             EPK PDF
netlify.toml              Netlify publish + function rewrites + security headers
netlify/functions/server.js  Lambda-style adapter around lib/app.js
lib/app.js                the request handler shared by server.js and Netlify
deploy/nginx.conf         reverse-proxy sample
RESEARCH.md               research log: what was verified, what still needs the artist
```

---

## 9. Pre-launch checklist

- [ ] `ADMIN_TOKEN` set, `.env` not committed
- [ ] Booking / management / press email addresses added (currently routed to the private inbox)
- [ ] Spotify, Boomplay, Audiomack, Facebook, X links supplied (icons are greyed out until then)
- [ ] Licensed artist photography added to `public/img/art/`
- [ ] Confirm the research notes in `RESEARCH.md` marked **CONFIRM**
- [ ] Point `site.url` in the CMS at the live domain, then regenerate `sitemap.xml` (cached 1 h)
- [ ] Add real performance dates when booked; set `events.note` back to the default copy
- [ ] Replace or confirm the 30-second preview integration before disabling `PREVIEWS`
- [ ] Re-generate the EPK PDF after bio/discography edits
- [ ] On Netlify: set `ADMIN_TOKEN` + `CONTACT_WEBHOOK_URL`, and read “What behaves differently on Netlify”
