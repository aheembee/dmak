# START HERE — D_MAK MUSIC website

This ZIP is the complete, working website: 11 pages, a music player that really plays,
an admin CMS, working forms, SEO/structured data and a press-kit PDF.

---

## Option 1 — Preview it on your computer (30 seconds)

```bash
unzip dmak-music-netlify.zip
cd dmak-music
cp .env.example .env                      # then set ADMIN_TOKEN (any long random string)
node server.js                            # Node 18+ — no npm install needed
```

Open <http://localhost:3000> · CMS at <http://localhost:3000/admin>

---

## Option 2 — Put it on Netlify (this is the deploy-ready path)

### Fastest: Netlify CLI

```bash
npm i -g netlify-cli
cd dmak-music
netlify login
netlify init --manual                 # create/link a site
netlify env:set ADMIN_TOKEN "pick-a-long-random-string"
netlify deploy --build --prod
```

### Or via GitHub (auto-deploy on every push)

1. Push this folder to a new GitHub repo.
2. Netlify → **Add new site → Import an existing project** → choose the repo.
3. Netlify reads `netlify.toml` automatically:
   publish directory `public`, functions directory `netlify/functions`, Node 20.
4. **Site configuration → Environment variables →** add `ADMIN_TOKEN`
   (and optionally `CONTACT_WEBHOOK_URL` — see the note below).
5. Deploy.

⚠️ **Don't use Netlify's drag-and-drop box.** That only uploads static files; the pages here
are server-rendered by a Netlify Function, so they would not appear. Use the CLI or Git method.

### One thing to know about Netlify

Netlify Functions have an ephemeral filesystem. Everything renders, the player works, forms
submit and the CMS unlocks — but **form entries and CMS saves are not permanent** there.
Two good options:

* **Recommended:** keep `content/site.json` as the source of truth (edit → commit → Netlify
  redeploys in ~30 s), and add a `CONTACT_WEBHOOK_URL` (Zapier / Make / n8n / your email API)
  so booking enquiries reach you.
* **Or** run the site on a Node host instead (Render, Railway, Fly.io, a small VPS, or the
  included `Dockerfile`) where `data/` is a real volume and `/admin` saves permanently.
  The same folder works in both places.

---

## Before going live, supply these (all editable in `/admin`)

1. Booking / management / press **email addresses** — no public one could be verified.
2. **Spotify, Boomplay, Audiomack, Facebook, X** profile URLs — the icons are greyed out
   (“pending”) until you paste them. Nothing is invented.
3. **Licensed artist photography** → drop files in `public/img/art/`, add them in the Gallery tab.
4. Confirm the items listed in **RESEARCH.md → “CONFIRM list”** (real-name spelling, which Apple
   Music page is his, whether *Misery* / *Bounce To This* / *Move It Down* are his releases).
5. Set **Site & SEO → Canonical URL** to your live domain, then turn off the
   *“to confirm”* notices once everything is checked.

Full documentation: **README.md**. Research log & sources: **RESEARCH.md**.
