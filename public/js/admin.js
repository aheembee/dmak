/* ============================================================================
   D_MAK MUSIC — content CMS client
   Talks to /api/admin/* with a Bearer token that is never embedded in the page.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const gate = $('[data-admin-gate]');
  const app = $('[data-admin-app]');
  const tabsEl = $('[data-admin-tabs]');
  const editor = $('[data-admin-editor]');
  const loginForm = $('[data-admin-login]');
  const loginStatus = $('[data-admin-status]');
  const dirtyChip = $('[data-admin-dirty]');

  if (!gate || !app) return;

  let TOKEN = '';
  let content = null;
  let dirty = false;
  let activeTab = 'artist';

  const store = {
    get() { try { return window.sessionStorage.getItem('dmak-token'); } catch (e) { return null; } },
    set(v) { try { window.sessionStorage.setItem('dmak-token', v); } catch (e) {} },
    clear() { try { window.sessionStorage.removeItem('dmak-token'); } catch (e) {} },
  };

  /* --------------------------------------------------------------- helpers */

  function get(pathStr) {
    return pathStr.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), content);
  }

  function set(pathStr, value) {
    const keys = pathStr.split('.');
    const last = keys.pop();
    const target = keys.reduce((acc, key) => (acc == null ? acc : acc[key]), content);
    if (target == null) return;
    target[last] = value;
    dirty = true;
    if (dirtyChip) dirtyChip.hidden = false;
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function field({ label, path, type = 'text', hint = '' }) {
    const value = get(path);
    const common = `data-path="${esc(path)}" id="f-${esc(path.replace(/\./g, '-'))}"`;
    if (type === 'textarea') {
      return `<div class="admin-field"><label for="f-${esc(path.replace(/\./g, '-'))}">${esc(label)}</label>
        <textarea ${common}>${esc(value)}</textarea>${hint ? `<span class="muted small">${esc(hint)}</span>` : ''}</div>`;
    }
    if (type === 'checkbox') {
      return `<div class="admin-field"><label for="f-${esc(path.replace(/\./g, '-'))}">${esc(label)}</label>
        <select ${common}><option value="true"${value ? ' selected' : ''}>On</option><option value="false"${
        value ? '' : ' selected'
      }>Off</option></select></div>`;
    }
    return `<div class="admin-field"><label for="f-${esc(path.replace(/\./g, '-'))}">${esc(label)}</label>
      <input ${common} type="${type}" value="${esc(value)}" />${hint ? `<span class="muted small">${esc(hint)}</span>` : ''}</div>`;
  }

  function card(title, bodyHtml, { onRemove = null, extra = '' } = {}) {
    return `<div class="admin-card">
      <div class="admin-card__head"><strong>${esc(title)}</strong>${extra}</div>
      ${bodyHtml}
      ${onRemove ? `<div class="admin-actions"><button class="btn btn--ghost btn--sm" type="button" data-remove="${esc(onRemove)}">Remove</button></div>` : ''}
    </div>`;
  }

  /* ---------------------------------------------------------------- schema */

  const SECTIONS = {
    artist: {
      label: 'Artist',
      render() {
        const a = content.artist;
        return `
          <div class="admin-row">
            ${field({ label: 'Stage name', path: 'artist.name' })}
            ${field({ label: 'Legal / real name', path: 'artist.aliasLine' })}
            ${field({ label: 'Origin', path: 'artist.origin' })}
            ${field({ label: 'Active since', path: 'artist.activeSince' })}
          </div>
          ${field({ label: 'Tagline', path: 'artist.tagline' })}
          ${field({ label: 'Signature phrase', path: 'artist.signature' })}
          ${field({ label: 'Positioning statement', path: 'artist.positioning', type: 'textarea' })}
          ${field({ label: 'Short bio (homepage)', path: 'artist.shortBio', type: 'textarea' })}
          ${field({ label: 'Cinematic intro', path: 'artist.cinematicIntro', type: 'textarea' })}
          ${field({ label: 'Extended biography — separate paragraphs with a blank line', path: 'artist.longBioText', type: 'textarea' })}
          ${field({ label: 'Philosophy quote', path: 'artist.philosophy', type: 'textarea' })}
          ${field({ label: 'Creative vision', path: 'artist.vision', type: 'textarea' })}
          ${field({ label: 'Influences note', path: 'artist.influences.note', type: 'textarea' })}
          <div class="admin-row">
            ${field({ label: 'Influences confirmed?', path: 'artist.influences.verified', type: 'checkbox' })}
            ${field({ label: 'Language note', path: 'artist.facts.5.value' })}
          </div>
          <h3 class="h3-mono">Fast facts</h3>
          ${(a.facts || [])
            .map((f, i) => card(f.label || `Fact ${i + 1}`, `<div class="admin-row">${field({ label: 'Label', path: `artist.facts.${i}.label` })}${field({ label: 'Value', path: `artist.facts.${i}.value` })}</div>`, { onRemove: `artist.facts.${i}` }))
            .join('')}
          <button class="btn btn--ghost btn--sm" type="button" data-add="artist.facts">+ Add fact</button>`;
      },
      hydrate() {
        const a = content.artist;
        a.longBioText = (a.longBio || []).join('\n\n');
      },
      dehydrate() {
        const a = content.artist;
        a.longBio = String(a.longBioText || '')
          .split(/\n\s*\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        delete a.longBioText;
      },
    },

    socials: {
      label: 'Socials',
      render() {
        return (
          `<p class="muted small">A blank URL greys the icon out on the public site — nothing is ever linked to an unverified address.</p>` +
          content.socials
            .map(
              (s, i) =>
                card(
                  s.label || `Platform ${i + 1}`,
                  `<div class="admin-row">${field({ label: 'Platform', path: `socials.${i}.label` })}${field({ label: 'Handle', path: `socials.${i}.handle` })}</div>
                   ${field({ label: 'URL (leave blank to hide)', path: `socials.${i}.url` })}
                   <div class="admin-row">${field({ label: 'Verified with the artist?', path: `socials.${i}.verified`, type: 'checkbox' })}</div>
                   ${field({ label: 'Note', path: `socials.${i}.note`, type: 'textarea' })}`,
                  { onRemove: `socials.${i}` }
                )
            )
            .join('') +
          `<button class="btn btn--ghost btn--sm" type="button" data-add="socials">+ Add platform</button>`
        );
      },
    },

    releases: {
      label: 'Releases',
      render() {
        return (
          `<p class="muted small">Each card is one release. Artwork paths point at files in <span class="mono">/public/img/covers</span>. Leave artwork blank to show the branded “pending upload” tile.</p>` +
          content.releases
            .map((r, i) =>
              card(
                `${r.title} — ${r.year}`,
                `<div class="admin-row">${field({ label: 'Title', path: `releases.${i}.title` })}${field({ label: 'Type', path: `releases.${i}.type` })}</div>
                 <div class="admin-row">${field({ label: 'Release date', path: `releases.${i}.releaseDate`, type: 'date' })}${field({ label: 'Label / imprint', path: `releases.${i}.label` })}${field({ label: 'Duration (seconds)', path: `releases.${i}.duration`, type: 'number' })}</div>
                 ${field({ label: 'Artwork path', path: `releases.${i}.artwork`, hint: '/img/covers/name.jpg' })}
                 ${field({ label: 'Artwork credit', path: `releases.${i}.artworkCredit` })}
                 ${field({ label: 'Summary (card)', path: `releases.${i}.summary`, type: 'textarea' })}
                 ${field({ label: 'Story (detail)', path: `releases.${i}.story`, type: 'textarea' })}
                 ${field({ label: 'Credits — comma separated', path: `releases.${i}.creditsText` })}
                 <div class="admin-row">${field({ label: 'Deezer track ID (enables the 30s preview)', path: `releases.${i}.tracks.0.deezerId` })}${field({ label: 'Deezer album ID', path: `releases.${i}.deezerAlbumId` })}</div>
                 <div class="admin-row">${field({ label: 'Deezer album URL', path: `releases.${i}.links.deezer` })}${field({ label: 'Apple Music URL', path: `releases.${i}.links.apple` })}</div>
                 <div class="admin-row">${field({ label: 'Spotify URL', path: `releases.${i}.links.spotify` })}${field({ label: 'YouTube URL', path: `releases.${i}.links.youtube` })}${field({ label: 'Audiomack URL', path: `releases.${i}.links.audiomack` })}</div>
                 <div class="admin-row">${field({ label: 'Featured on homepage?', path: `releases.${i}.featured`, type: 'checkbox' })}${field({ label: 'Verification', path: `releases.${i}.verification` })}</div>`,
                { onRemove: `releases.${i}` }
              )
            )
            .join('') +
          `<button class="btn btn--ghost btn--sm" type="button" data-add="releases">+ Add release</button>`
        );
      },
      hydrate() {
        content.releases.forEach((r) => {
          r.creditsText = (r.credits || []).join(', ');
          if (!r.tracks || !r.tracks.length) r.tracks = [{ title: r.title, duration: r.duration || 0, deezerId: '' }];
          r.links = r.links || {};
        });
      },
      dehydrate() {
        content.releases.forEach((r) => {
          r.credits = String(r.creditsText || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          delete r.creditsText;
          r.year = String(new Date(r.releaseDate || Date.now()).getFullYear());
          if (r.tracks && r.tracks[0]) {
            r.tracks[0].title = r.tracks[0].title || r.title;
            r.tracks[0].duration = Number(r.tracks[0].duration || r.duration || 0);
            r.tracks[0].deezerId = r.tracks[0].deezerId ? Number(r.tracks[0].deezerId) : null;
          }
          r.duration = Number(r.duration || (r.tracks[0] && r.tracks[0].duration) || 0);
          r.deezerAlbumId = r.deezerAlbumId ? Number(r.deezerAlbumId) : null;
        });
      },
    },

    videos: {
      label: 'Videos',
      render() {
        return content.videos
          .map((v, i) =>
            card(
              v.title || `Video ${i + 1}`,
              `<div class="admin-row">${field({ label: 'Title', path: `videos.${i}.title` })}${field({ label: 'Category', path: `videos.${i}.category` })}</div>
               <div class="admin-row">${field({ label: 'YouTube ID', path: `videos.${i}.youtubeId`, hint: 'the part after v=' })}${field({ label: 'Published', path: `videos.${i}.publishedAt`, type: 'date' })}${field({ label: 'Duration', path: `videos.${i}.duration` })}</div>
               ${field({ label: 'Channel', path: `videos.${i}.channel` })}
               ${field({ label: 'Thumbnail path', path: `videos.${i}.thumb` })}
               ${field({ label: 'Description', path: `videos.${i}.description`, type: 'textarea' })}
               ${field({ label: 'Note (views etc.)', path: `videos.${i}.viewsNote` })}`,
              { onRemove: `videos.${i}` }
            )
          )
          .join('') +
          `<button class="btn btn--ghost btn--sm" type="button" data-add="videos">+ Add video</button>`;
      },
    },

    news: {
      label: 'News',
      render() {
        return content.news
          .map((n, i) =>
            card(
              n.title || `Item ${i + 1}`,
              `<div class="admin-row">${field({ label: 'Date', path: `news.${i}.date`, type: 'date' })}${field({ label: 'Category', path: `news.${i}.category` })}</div>
               ${field({ label: 'Title', path: `news.${i}.title` })}
               ${field({ label: 'Excerpt', path: `news.${i}.excerpt`, type: 'textarea' })}
               ${field({ label: 'Body (optional)', path: `news.${i}.body`, type: 'textarea' })}
               ${field({ label: 'Link', path: `news.${i}.link` })}`,
              { onRemove: `news.${i}` }
            )
          )
          .join('') +
          `<button class="btn btn--ghost btn--sm" type="button" data-add="news">+ Add news item</button>`;
      },
    },

    events: {
      label: 'Events',
      render() {
        const rows = (list, prefix) =>
          list
            .map((e, i) =>
              card(
                e.title || `Event ${i + 1}`,
                `<div class="admin-row">${field({ label: 'Title', path: `${prefix}.${i}.title` })}${field({ label: 'Date', path: `${prefix}.${i}.date`, type: 'date' })}</div>
                 <div class="admin-row">${field({ label: 'Venue', path: `${prefix}.${i}.venue` })}${field({ label: 'City', path: `${prefix}.${i}.city` })}${field({ label: 'Country', path: `${prefix}.${i}.country` })}</div>
                 <div class="admin-row">${field({ label: 'Ticket URL', path: `${prefix}.${i}.ticketUrl` })}${field({ label: 'Status (on-sale / sold-out / free)', path: `${prefix}.${i}.status` })}</div>
                 ${field({ label: 'Note', path: `${prefix}.${i}.note` })}`,
                { onRemove: `${prefix}.${i}` }
              )
            )
            .join('');
        return `<p class="muted small">Empty lists render an honest “no dates announced” panel — the site never shows a fake show.</p>
          ${field({ label: 'Empty-state note', path: 'events.note', type: 'textarea' })}
          <h3 class="h3-mono">Upcoming</h3>
          ${rows(content.events.upcoming || [], 'events.upcoming')}
          <button class="btn btn--ghost btn--sm" type="button" data-add="events.upcoming">+ Add upcoming date</button>
          <h3 class="h3-mono">Past</h3>
          ${rows(content.events.past || [], 'events.past')}
          <button class="btn btn--ghost btn--sm" type="button" data-add="events.past">+ Add past date</button>`;
      },
    },

    gallery: {
      label: 'Gallery',
      render() {
        return (
          `<p class="muted small">Drop licensed shoot images into <span class="mono">/public/img/art/</span> and add their paths here.</p>` +
          content.gallery
            .map((g, i) =>
              card(
                g.title || `Image ${i + 1}`,
                `<div class="admin-row">${field({ label: 'Title', path: `gallery.${i}.title` })}${field({ label: 'Category', path: `gallery.${i}.category` })}</div>
                 ${field({ label: 'Image path', path: `gallery.${i}.src` })}
                 <div class="admin-row">${field({ label: 'Credit', path: `gallery.${i}.credit` })}${field({ label: 'Year', path: `gallery.${i}.year` })}</div>`,
                { onRemove: `gallery.${i}` }
              )
            )
            .join('') +
          `<button class="btn btn--ghost btn--sm" type="button" data-add="gallery">+ Add image</button>`
        );
      },
    },

    contact: {
      label: 'Booking',
      render() {
        return `
          ${field({ label: 'Booking email', path: 'contact.bookingEmail', hint: 'Shows as the primary contact when filled.' })}
          ${field({ label: 'Management email', path: 'contact.managementEmail' })}
          ${field({ label: 'Press email', path: 'contact.pressEmail' })}
          ${field({ label: 'Location', path: 'contact.location' })}
          ${field({ label: 'Inbox note', path: 'contact.inboxNote', type: 'textarea' })}
          <h3 class="h3-mono">Enquiry routes</h3>
          ${content.contact.routes
            .map((r, i) =>
              card(
                r.label || `Route ${i + 1}`,
                `<div class="admin-row">${field({ label: 'Label', path: `contact.routes.${i}.label` })}${field({ label: 'ID', path: `contact.routes.${i}.id` })}</div>
                 ${field({ label: 'Description', path: `contact.routes.${i}.description` })}`,
                { onRemove: `contact.routes.${i}` }
              )
            )
            .join('')}
          <button class="btn btn--ghost btn--sm" type="button" data-add="contact.routes">+ Add route</button>`;
      },
    },

    site: {
      label: 'Site & SEO',
      render() {
        return `
          ${field({ label: 'Site title', path: 'site.title' })}
          ${field({ label: 'Canonical URL', path: 'site.url' })}
          ${field({ label: 'Meta description', path: 'site.description', type: 'textarea' })}
          ${field({ label: 'Keywords', path: 'site.keywords', type: 'textarea' })}
          ${field({ label: 'OG image path', path: 'site.ogImage' })}
          <div class="admin-row">
            ${field({ label: 'Cookieless analytics', path: 'site.analytics.enabled', type: 'checkbox' })}
            ${field({ label: 'Show “to confirm” notices', path: 'meta.showReviewNotices', type: 'checkbox' })}
          </div>
          ${field({ label: 'Review notice copy', path: 'meta.reviewNoticeCopy', type: 'textarea' })}
          <h3 class="h3-mono">Integrations (read-only — configured by environment variables)</h3>
          <div class="admin-card">
            <p class="muted small"><b>Instagram:</b> ${esc(content.integrations.instagram.setup)}</p>
            <p class="muted small"><b>YouTube:</b> ${esc(content.integrations.youtube.setup)}</p>
            <p class="muted small"><b>Previews:</b> ${esc(content.integrations.previews.note)}</p>
          </div>`;
      },
    },
  };

  /* ------------------------------------------------------------- rendering */

  function renderTabs() {
    tabsEl.innerHTML = Object.entries(SECTIONS)
      .map(
        ([key, s]) =>
          `<button type="button" data-tab="${key}" class="${key === activeTab ? 'is-active' : ''}">${esc(s.label)}</button>`
      )
      .join('');
  }

  function renderEditor() {
    const section = SECTIONS[activeTab];
    if (section.hydrate) section.hydrate();
    editor.innerHTML = section.render();
  }

  function rerender() {
    if (SECTIONS[activeTab].dehydrate) SECTIONS[activeTab].dehydrate();
    renderEditor();
  }

  /* ---------------------------------------------------------------- events */

  if (tabsEl) {
    tabsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      if (SECTIONS[activeTab].dehydrate) SECTIONS[activeTab].dehydrate();
      activeTab = btn.getAttribute('data-tab');
      renderTabs();
      renderEditor();
    });
  }

  if (editor) {
    editor.addEventListener('input', (e) => {
      const target = e.target.closest('[data-path]');
      if (!target) return;
      const pathStr = target.getAttribute('data-path');
      let value = target.type === 'checkbox' ? target.checked : target.value;
      if (target.tagName === 'SELECT' && (target.value === 'true' || target.value === 'false')) {
        value = target.value === 'true';
      }
      set(pathStr, value);
    });

    editor.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add]');
      if (addBtn) {
        const pathStr = addBtn.getAttribute('data-add');
        if (SECTIONS[activeTab].dehydrate) SECTIONS[activeTab].dehydrate();
        const keys = pathStr.split('.');
        const last = keys.pop();
        const parent = keys.reduce((acc, k) => (acc == null ? acc : acc[k]), content);
        if (!Array.isArray(parent[last])) parent[last] = [];
        const blank = {
          'artist.facts': { label: 'New fact', value: '' },
          socials: { id: 'custom', label: 'New platform', handle: '', url: '', verified: false, note: '' },
          releases: {
            id: `release-${Date.now()}`,
            title: 'New release',
            type: 'Single',
            releaseDate: new Date().toISOString().slice(0, 10),
            year: String(new Date().getFullYear()),
            label: '',
            artwork: '',
            artworkCredit: '',
            duration: 0,
            featured: false,
            summary: '',
            story: '',
            credits: [],
            tracks: [{ title: 'New release', duration: 0, deezerId: null }],
            links: {},
            verification: 'confirm',
          },
          videos: { id: `video-${Date.now()}`, title: 'New video', category: 'Music Video', youtubeId: '', thumbnail: '', description: '', verification: 'confirm' },
          news: { id: `news-${Date.now()}`, date: new Date().toISOString().slice(0, 10), category: 'Update', title: 'New update', excerpt: '', body: '', link: '' },
          'events.upcoming': { id: `event-${Date.now()}`, title: 'New show', date: new Date().toISOString().slice(0, 10), venue: '', city: '', country: 'Uganda', ticketUrl: '', status: 'on-sale' },
          'events.past': { id: `event-${Date.now()}`, title: 'Past show', date: new Date().toISOString().slice(0, 10), venue: '', city: '', country: 'Uganda', status: 'played' },
          gallery: { id: `img-${Date.now()}`, src: '', title: 'New image', category: 'Editorial', credit: '', year: String(new Date().getFullYear()) },
          'contact.routes': { id: 'new-route', label: 'New route', description: '', verified: true },
        }[pathStr] || { label: 'New item' };
        parent[last].push(JSON.parse(JSON.stringify(blank)));
        dirty = true;
        if (dirtyChip) dirtyChip.hidden = false;
        renderEditor();
        return;
      }

      const removeBtn = e.target.closest('[data-remove]');
      if (removeBtn) {
        const pathStr = removeBtn.getAttribute('data-remove');
        if (SECTIONS[activeTab].dehydrate) SECTIONS[activeTab].dehydrate();
        const keys = pathStr.split('.');
        const index = Number(keys.pop());
        const parent = keys.reduce((acc, k) => (acc == null ? acc : acc[k]), content);
        if (Array.isArray(parent) && Number.isInteger(index)) {
          parent.splice(index, 1);
          dirty = true;
          if (dirtyChip) dirtyChip.hidden = false;
          renderEditor();
        }
      }
    });
  }

  /* ----------------------------------------------------------------- auth */

  async function api(pathStr, options = {}) {
    const res = await fetch(pathStr, {
      ...options,
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        authorization: `Bearer ${TOKEN}`,
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  async function loadContent() {
    // Always bypass the HTTP cache so the CMS never shows a stale document.
    const res = await fetch(`/api/content?cb=${Date.now()}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Could not load content.');
    content = await res.json();
  }

  async function unlock(token) {
    TOKEN = token;
    await api('/api/admin/auth', { method: 'POST' });
    await loadContent();
    store.set(token);
    gate.hidden = true;
    app.hidden = false;
    renderTabs();
    renderEditor();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('#admin-token');
      loginStatus.textContent = 'Checking token…';
      loginStatus.classList.remove('is-error');
      try {
        await unlock(input.value.trim());
        loginStatus.textContent = 'Unlocked.';
        input.value = '';
      } catch (err) {
        loginStatus.textContent = err.message;
        loginStatus.classList.add('is-error');
      }
    });
  }

  /* ----------------------------------------------------------------- save */

  const saveBtn = $('[data-admin-save]');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (SECTIONS[activeTab].dehydrate) SECTIONS[activeTab].dehydrate();
      const saveStatus = $('[data-admin-save-status]');
      saveBtn.disabled = true;
      const original = saveBtn.innerHTML;
      saveBtn.textContent = 'Saving…';
      if (saveStatus) { saveStatus.textContent = ''; saveStatus.style.color = ''; }
      try {
        await api('/api/admin/content', { method: 'PUT', body: JSON.stringify(content) });
        dirty = false;
        if (dirtyChip) dirtyChip.hidden = true;
        saveBtn.textContent = 'Saved ✓';
        if (saveStatus) saveStatus.textContent = `Saved ${new Date().toLocaleTimeString()}`;
        setTimeout(() => { saveBtn.innerHTML = original; }, 1600);
      } catch (err) {
        saveBtn.textContent = 'Save failed';
        if (saveStatus) { saveStatus.textContent = err.message; saveStatus.style.color = '#ff8ba5'; }
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  const reloadBtn = $('[data-admin-reload]');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', async () => {
      if (dirty && !window.confirm('Discard unsaved changes?')) return;
      await loadContent();
      dirty = false;
      if (dirtyChip) dirtyChip.hidden = true;
      renderEditor();
    });
  }

  window.addEventListener('beforeunload', (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* ---------------------------------------------------------------- inbox */

  const inboxBody = $('[data-inbox-body]');
  $$('[data-inbox]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const view = btn.getAttribute('data-inbox');
      inboxBody.innerHTML = '<p class="muted small">Loading…</p>';
      try {
        const data = await api(`/api/admin/inbox?view=${encodeURIComponent(view)}`);
        if (view === 'analytics') {
          inboxBody.innerHTML = `<div class="admin-bar"><span>Pageviews: <b>${data.total}</b></span><span class="muted small">${esc(
            data.note || ''
          )}</span></div>
            <h4 class="h3-mono">Top pages</h4>
            <ul class="plain">${(data.top || [])
              .map((t) => `<li class="inbox-item"><span class="mono">${esc(t.path)}</span><span>${t.count} views</span></li>`)
              .join('') || '<li class="muted small">No hits recorded yet.</li>'}</ul>
            <h4 class="h3-mono">Last 14 days</h4>
            <ul class="plain">${(data.days || [])
              .map((d) => `<li class="inbox-item"><span class="mono">${esc(d.date)}</span><span>${d.count}</span></li>`)
              .join('') || '<li class="muted small">No hits recorded yet.</li>'}</ul>`;
          return;
        }
        if (!data.items.length) {
          inboxBody.innerHTML = '<p class="muted small">Nothing here yet.</p>';
          return;
        }
        inboxBody.innerHTML =
          `<div class="admin-bar"><span>Total: <b>${data.total}</b></span><span class="muted small">Showing latest ${data.items.length}</span></div>` +
          data.items
            .map((item) =>
              view === 'messages'
                ? `<div class="inbox-item">
                     <span class="mono">${esc(item.type)} · ${esc(item.receivedAt.slice(0, 16).replace('T', ' '))}</span>
                     <strong>${esc(item.name)} — ${esc(item.email)}</strong>
                     ${item.organisation ? `<span class="muted small">${esc(item.organisation)}</span>` : ''}
                     ${item.eventDate ? `<span class="muted small">Event date: ${esc(item.eventDate)}</span>` : ''}
                     <p>${esc(item.message)}</p>
                     <a class="text-link" href="mailto:${esc(item.email)}">Reply by email</a>
                   </div>`
                : `<div class="inbox-item"><span class="mono">${esc(item.joinedAt.slice(0, 10))}</span><strong>${esc(
                    item.email
                  )}</strong><span class="muted small">${esc(item.country || '—')} · via ${esc(item.source || 'site')}</span></div>`
            )
            .join('');
      } catch (err) {
        inboxBody.innerHTML = `<p class="muted small">${esc(err.message)}</p>`;
      }
    });
  });

  /* ------------------------------------------------------------ auto-unlock */

  const existing = store.get();
  if (existing) {
    unlock(existing).catch(() => {
      store.clear();
      TOKEN = '';
    });
  }
})();
