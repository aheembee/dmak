# PUSH TO GITHUB → DEPLOY ON NETLIFY

Target repository: **https://github.com/aheembee/dmak**

Everything is already committed locally in this folder (branch `main`, remote `origin` set).
You only need to authenticate once.

---

## 1. Push (pick one)

### Option A — the script (easiest)

```bash
cd dmak-music          # the folder you unzipped
./push-to-github.sh
```

It will init the repo if needed, create the first commit, set `origin` to
`https://github.com/aheembee/dmak.git` and push to `main`. Git will ask for credentials once.

### Option B — manual

```bash
cd dmak-music
git init -b main                     # skipped automatically if .git already exists
git add -A
git -c user.name="D_MAK Music" -c user.email="web@dmakmusic.com" commit -m "D_MAK MUSIC — official artist website"
git branch -M main
git remote add origin https://github.com/aheembee/dmak.git   # or: git remote set-url origin …
git push -u origin main
```

### Authentication: use a Personal Access Token, not your password

GitHub stopped accepting account passwords over HTTPS. Create a **fine-grained token**
(Settings → Developer settings → Personal access tokens → Fine-grained tokens) with
**Contents: Read and write** on `aheembee/dmak`.

When Git asks:

```
Username: aheembee
Password: <paste the token>        ← the token, not your GitHub password
```

Then store it so you don't retype it:

```bash
git config --global credential.helper store      # or: 'osxkeychain' on macOS
```

> If the repository already has a commit (e.g. a README created on GitHub), pull first:
> `git pull --rebase origin main` then `git push -u origin main`.
>
> ⚠️ Never paste a token into a chat window or commit it. `.env` is already git-ignored, and
> the admin token lives only in Netlify's environment variables.

---

## 2. Deploy on Netlify

**Recommended: connect the GitHub repo (continuous deploys on every push).**

1. Netlify → **Add new site → Import an existing project → GitHub**
2. Authorise Netlify, pick **aheembee/dmak**
3. Build settings are read from `netlify.toml` — confirm they show:
   * Build command: `echo 'D_MAK MUSIC — no build step required'`
   * Publish directory: `public`
   * Functions directory: `netlify/functions`
4. **Site configuration → Environment variables → Add a variable**
   | Key | Value |
   | --- | --- |
   | `ADMIN_TOKEN` | a long random string — generate with `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"` |
   | `CONTACT_WEBHOOK_URL` | *(optional but recommended)* a Zapier / Make / n8n webhook so booking enquiries actually reach you |
   | `PREVIEWS` | `on` (default) — set `off` to disable the 30-second Deezer previews |
   | `INSTAGRAM_ACCESS_TOKEN` | *(optional)* enables the live Instagram feed |
5. **Deploy site.** First build takes ~40 s (no dependencies to install).

**Alternative — drag the built folder:** don't. Netlify's drop box only uploads static files and
this site's pages are rendered by a Netlify Function. Use the Git import above.

---

## 3. Verify the live deploy

```bash
BASE=https://<your-site>.netlify.app
node scripts/smoke-test.js $BASE     # 26 checks: routes, API, auth guard, 404
```

Or by hand:

| Check | Expected |
| --- | --- |
| `/` | dark cinematic homepage with the D_MAK hero |
| `/music` | 9 releases; filter + search work |
| Play button | 30-second preview streams |
| `/admin` | token gate appears; unlocks with your `ADMIN_TOKEN` |
| `/connect` form | submits and shows a success message |
| `/nonexistent` | branded 404 page |
| `/sitemap.xml`, `/robots.txt` | served |

### Remember the serverless caveat
On Netlify, form entries and CMS saves land in `/tmp` and are lost when the function instance
recycles. Either point `CONTACT_WEBHOOK_URL` at a real inbox, or run the same repo on a Node
host (Render/Railway/Fly/VPS/`Dockerfile`) where `data/` is a persistent volume.
See `README.md` → “What behaves differently on Netlify”.

---

## 4. After the first deploy

1. `/admin` → **Site & SEO** → set **Canonical URL** to your live domain.
2. Add booking / management / press email addresses, and the missing Spotify / Boomplay /
   Audiomack / Facebook / X links (icons stay greyed “pending” until you do).
3. Work through the **CONFIRM list** in `RESEARCH.md`.
4. Turn **“to confirm” notices** off once everything is signed off.
