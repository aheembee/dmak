'use strict';
/**
 * Page renderers. Each export returns { page, body } consumed by documentShell().
 */
const {
  icon,
  reviewChip,
  sectionHead,
  platformLinks,
  artTile,
  releaseCard,
  videoFacade,
  newsCard,
  eventRow,
  socialIconLink,
} = require('./ui');
const { escapeHtml, fmtDuration, dateLabel, relTime, IS_SERVERLESS } = require('./util');
const { derive } = require('./store');

const c = (content) => content; // readability helper

/** Marquee content: genre territories + aliases, escaped, separated by diamonds. */
function marqueeItems(content) {
  const parts = [
    ...content.artist.influences.territories,
    ...content.artist.alsoKnownAs.slice(0, 3),
    `${content.artist.origin}`,
  ].map((t) => escapeHtml(t));
  return `${parts.join(' <i>&#9670;</i> ')} <i>&#9670;</i> `;
}

/* ------------------------------------------------------------------- HOME */

function home(content) {
  const d = derive(content);
  const latest = d.latest;
  const featuredVideo = d.videos[0];
  const heroTrack = latest && latest.tracks && latest.tracks[0];

  const body = `
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__bg" aria-hidden="true">
      <div class="hero__art" style="--art:url('${escapeHtml(latest && latest.artwork ? latest.artwork : '')}')"></div>
      <div class="hero__grad"></div>
      <div class="hero__grid"></div>
      <canvas class="hero__wave" data-wave aria-hidden="true"></canvas>
    </div>

    <div class="shell hero__inner">
      <div class="hero__top mono small">
        <span class="hero__status"><i class="pulse"></i> Official site</span>
        <span class="hero__coord">${escapeHtml(content.artist.origin)} · 0°28′N 34°05′E</span>
      </div>

      <div class="hero__lead">
        <p class="hero__kicker mono">${escapeHtml(content.artist.activeSince)} → now</p>
        <h1 class="hero__title" id="hero-title">
          <span class="hero__title-a" data-split>D_MAK</span>
          <span class="hero__title-b mono">MUSIC</span>
        </h1>
        <p class="hero__tagline">${escapeHtml(content.artist.signature)}</p>
        <p class="hero__sub">${escapeHtml(content.artist.positioning)}</p>
      </div>

      <div class="hero__cta">
        ${
          heroTrack && heroTrack.deezerId && content.integrations.previews.enabled
            ? `<button class="btn btn--primary btn--lg" type="button" data-play="${escapeHtml(
                String(heroTrack.deezerId)
              )}" data-title="${escapeHtml(heroTrack.title)}" data-release="${escapeHtml(
                latest.title
              )}" data-art="${escapeHtml(latest.artwork || '')}">
                ${icon('play', 'ico ico--sm')}<span>Play “${escapeHtml(latest.title)}”</span></button>`
            : `<a class="btn btn--primary btn--lg" href="/music"><span>Enter the music</span>${icon('arrow', 'ico ico--sm')}</a>`
        }
        <a class="btn btn--ghost btn--lg" href="/videos">${icon('play', 'ico ico--sm')}<span>Watch videos</span></a>
        <a class="btn btn--text btn--lg" href="/connect#booking">Book D_MAK ${icon('arrowUpRight', 'ico ico--sm')}</a>
      </div>

      <div class="hero__strip">
        <a class="hero__latest" href="/music#${escapeHtml(latest.id)}">
          <span class="mono small">Latest release</span>
          <strong>${escapeHtml(latest.title)}</strong>
          <span class="mono small">${escapeHtml(dateLabel(latest.releaseDate))} · ${escapeHtml(latest.type)}</span>
        </a>
        <div class="hero__stats">
          <div><strong>${d.stats.releases}</strong><span class="mono small">Releases</span></div>
          <div><strong>${escapeHtml(d.stats.years)}</strong><span class="mono small">Years releasing</span></div>
          <div><strong>${escapeHtml(content.artist.origin.split(',')[0])}</strong><span class="mono small">Origin</span></div>
        </div>
        <div class="hero__socials">${content.socials.filter((s) => s.url).slice(0, 6).map((s) => socialIconLink(s)).join('')}</div>
      </div>
    </div>
  </section>

  <div class="marquee" aria-hidden="true">
    <div class="marquee__track">
      ${Array.from({ length: 2 })
        .map(() => `<span>${marqueeItems(content)}</span>`)
        .join('')}
    </div>
  </div>

  <section class="feature shell" aria-labelledby="feature-title">
    <div class="feature__art reveal">
      ${artTile(latest, { lazy: false })}
      <p class="feature__credit mono small">${escapeHtml(latest.artworkCredit || '')}</p>
    </div>
    <div class="feature__body">
      ${sectionHead({
        kicker: 'Featured release',
        title: `<span id="feature-title">${escapeHtml(latest.title)}</span>`,
        id: '01',
      })}
      <p class="feature__story">${escapeHtml(latest.story || latest.summary || '')}</p>
      <ul class="tracklist">
        ${(latest.tracks || [])
          .map(
            (t, i) => `<li class="tracklist__row">
              <span class="mono small">${String(i + 1).padStart(2, '0')}</span>
              <span class="tracklist__name">${escapeHtml(t.title)}</span>
              <span class="mono small tracklist__dur">${fmtDuration(t.duration)}</span>
              ${
                t.deezerId && content.integrations.previews.enabled
                  ? `<button class="tracklist__play" type="button" data-play="${escapeHtml(String(t.deezerId))}" data-title="${escapeHtml(
                      t.title
                    )}" data-release="${escapeHtml(latest.title)}" data-art="${escapeHtml(
                      latest.artwork || ''
                    )}" aria-label="Preview ${escapeHtml(t.title)}">${icon('play', 'ico ico--sm')}</button>`
                  : ''
              }
            </li>`
          )
          .join('')}
      </ul>
      <div class="feature__meta mono small">
        ${escapeHtml(latest.label || '')}${latest.releaseDate ? ` · ${escapeHtml(dateLabel(latest.releaseDate))}` : ''}
      </div>
      ${platformLinks(latest.links, { limit: 5 })}
      <div class="feature__actions">
        <a class="btn btn--ghost btn--sm" href="/music#${escapeHtml(latest.id)}">Release details ${icon('arrow', 'ico ico--sm')}</a>
        ${reviewChip(content, latest.verification !== 'verified')}
      </div>
    </div>
  </section>

  <section class="rotation shell" aria-labelledby="rotation-title">
    ${sectionHead({
      id: '02',
      kicker: 'On rotation',
      title: '<span id="rotation-title">The catalogue, playable</span>',
      lead: 'Thirty-second previews stream straight from the source. Full songs on every platform.',
      actions: `<a class="btn btn--ghost btn--sm" href="/music">All releases ${icon('arrow', 'ico ico--sm')}</a>`,
    })}
    <ol class="rotation__list">
      ${d.releases
        .filter((r) => (r.tracks || []).some((t) => t.deezerId))
        .map(
          (r, i) => `<li class="rotation__row reveal" style="--i:${i}">
            <button class="rotation__play" type="button" data-play="${escapeHtml(
              String(r.tracks[0].deezerId)
            )}" data-title="${escapeHtml(r.tracks[0].title)}" data-release="${escapeHtml(r.title)}" data-art="${escapeHtml(
            r.artwork || ''
          )}" aria-label="Preview ${escapeHtml(r.title)}">${icon('play', 'ico ico--sm')}<span class="rotation__pulse"></span></button>
            <span class="rotation__index mono small">${String(i + 1).padStart(2, '0')}</span>
            <span class="rotation__name">${escapeHtml(r.title)}</span>
            <span class="rotation__label mono small">${escapeHtml(r.label || '')}</span>
            <span class="rotation__year mono small">${escapeHtml(String(r.year))}</span>
            <span class="rotation__dur mono small">${fmtDuration(r.duration)}</span>
          </li>`
        )
        .join('')}
    </ol>
  </section>

  ${
    featuredVideo
      ? `<section class="feature-video shell" aria-labelledby="fv-title">
    ${sectionHead({
      id: '03',
      kicker: 'Featured video',
      title: '<span id="fv-title">The visuals</span>',
      actions: `<a class="btn btn--ghost btn--sm" href="/videos">Video gallery ${icon('arrow', 'ico ico--sm')}</a>`,
    })}
    <div class="feature-video__grid">
      ${videoFacade(content, featuredVideo)}
      <div class="feature-video__side">
        <p class="mono small">${escapeHtml(featuredVideo.viewsNote || '')}</p>
        <p>${escapeHtml(featuredVideo.description || '')}</p>
        <ul class="mini-list">
          ${(content.videos || [])
            .slice(1, 5)
            .map(
              (v) => `<li><button type="button" data-video="${escapeHtml(v.youtubeId)}" data-video-title="${escapeHtml(
                v.title
              )}">${icon('play', 'ico ico--sm')} ${escapeHtml(v.title)}</button></li>`
            )
            .join('') || '<li class="muted small">More videos to be published.</li>'}
        </ul>
        <a class="btn btn--ghost btn--sm" href="${escapeHtml(
          (content.socials.find((s) => s.id === 'youtube') || {}).url || 'https://www.youtube.com'
        )}" target="_blank" rel="noopener noreferrer">${icon('youtube', 'ico ico--sm')} Subscribe on YouTube</a>
      </div>
    </div>
  </section>`
      : ''
  }

  <section class="about-teaser" aria-labelledby="at-title">
    <div class="shell about-teaser__grid">
      <div class="about-teaser__quote reveal">
        <span class="mono small">Artist note</span>
        <blockquote>“${escapeHtml(content.artist.philosophy)}”</blockquote>
        <p class="mono small">— ${escapeHtml(content.artist.name)}, ${escapeHtml(content.artist.origin)}</p>
        <a class="btn btn--ghost btn--sm" href="/about">Read the full story ${icon('arrow', 'ico ico--sm')}</a>
      </div>
      <dl class="facts reveal">
        ${content.artist.facts
          .map(
            (f) => `<div class="facts__row"><dt class="mono small">${escapeHtml(f.label)}</dt><dd>${escapeHtml(
              f.value
            )}</dd></div>`
          )
          .join('')}
      </dl>
    </div>
  </section>

  <section class="shell news-strip" aria-labelledby="ns-title">
    ${sectionHead({
      id: '04',
      kicker: 'Latest updates',
      title: '<span id="ns-title">Signals</span>',
      actions: `<a class="btn btn--ghost btn--sm" href="/news">All news ${icon('arrow', 'ico ico--sm')}</a>`,
    })}
    <div class="news-strip__grid">
      ${d.news.slice(0, 3).map((n) => newsCard(content, n, { compact: true })).join('')}
    </div>
  </section>

  <section class="shell events-strip" aria-labelledby="es-title">
    ${sectionHead({
      id: '05',
      kicker: 'Live',
      title: '<span id="es-title">On stage</span>',
      actions: `<a class="btn btn--ghost btn--sm" href="/events">All dates ${icon('arrow', 'ico ico--sm')}</a>`,
    })}
    ${
      content.events.upcoming.length
        ? `<ul class="event-list">${content.events.upcoming.map((e) => eventRow(e)).join('')}</ul>`
        : `<div class="empty reveal">
            <p class="mono small">No dates announced</p>
            <p class="empty__copy">${escapeHtml(content.events.note)}</p>
            <a class="btn btn--primary btn--sm" href="/connect#booking">${icon('ticket', 'ico ico--sm')} Enquire about a show</a>
          </div>`
    }
  </section>

  <section class="fanwall" aria-labelledby="fw-title">
    <div class="shell fanwall__inner">
      <div class="fanwall__copy">
        <p class="mono small">Fan community</p>
        <h2 id="fw-title">Naawe — <span class="muted">with you</span></h2>
        <p>Join the list. Release drops, video premieres and ticket presales land in your inbox before they land anywhere else.</p>
        <form class="fanwall__form" data-subscribe novalidate>
          <label class="sr-only" for="fan-email">Email address</label>
          <input id="fan-email" type="email" name="email" placeholder="you@email.com" autocomplete="email" required />
          <label class="sr-only" for="fan-country">Country</label>
          <input id="fan-country" type="text" name="country" placeholder="Country (optional)" autocomplete="country-name" />
          <button class="btn btn--primary" type="submit"><span>Join the list</span>${icon('arrow', 'ico ico--sm')}</button>
          <p class="form-note mono small" data-form-status role="status" aria-live="polite"></p>
        </form>
        <p class="fanwall__fine mono small">${icon('shield', 'ico ico--sm')} Email only. Unsubscribe any time. Never sold.</p>
      </div>
      <div class="fanwall__socials">
        ${content.socials
          .filter((s) => s.url)
          .map((s) => socialIconLink(s, { withLabel: true, big: true }))
          .join('')}
        ${content.socials
          .filter((s) => !s.url)
          .map((s) => socialIconLink(s, { withLabel: true, big: true }))
          .join('')}
      </div>
    </div>
  </section>`;

  return {
    page: {
      slug: 'home',
      path: '/',
      title: `${content.site.name} — ${content.artist.tagline}`,
      description: content.site.description,
      jsonLd: [
        latest
          ? {
              '@context': 'https://schema.org',
              '@type': 'MusicAlbum',
              name: latest.title,
              byArtist: { '@id': `${content.site.url}/#artist` },
              datePublished: latest.releaseDate,
              numTracks: (latest.tracks || []).length,
              image: `${content.site.url}${latest.artwork || content.site.ogImage}`,
            }
          : null,
      ],
    },
    body,
  };
}

/* ------------------------------------------------------------------ ABOUT */

function about(content) {
  const d = derive(content);
  const portrait = (content.gallery.find((g) => g.category === 'Campaign') || content.gallery[0] || {}).src;
  const body = `
  <section class="page-hero">
    <div class="shell">
      <p class="page-hero__kicker mono">02 — About the artist</p>
      <h1 class="page-hero__title">The story<br /><span class="muted">behind the frequency</span></h1>
      <p class="page-hero__lead">${escapeHtml(content.artist.cinematicIntro)}</p>
    </div>
  </section>

  <section class="shell about-grid">
    <div class="about-grid__aside">
      <figure class="portrait reveal">
        ${portrait ? `<img src="${escapeHtml(portrait)}" alt="D_MAK — editorial artwork" width="900" height="900" loading="lazy" />` : ''}
        <figcaption class="mono small">Official release artwork · ${escapeHtml(content.artist.origin)}</figcaption>
      </figure>
      <div class="about-grid__facts">
        <dl class="facts">
          ${content.artist.facts
            .map(
              (f) => `<div class="facts__row"><dt class="mono small">${escapeHtml(f.label)}</dt><dd>${escapeHtml(
                f.value
              )}</dd></div>`
            )
            .join('')}
        </dl>
        ${reviewChip(content, content.artist.influences.verified === false, 'Influences to confirm')}
      </div>
    </div>
    <div class="about-grid__main">
      ${content.artist.longBio
        .map((p, i) => `<p class="prose ${i === 0 ? 'prose--lead' : ''} reveal">${escapeHtml(p)}</p>`)
        .join('')}

      <div class="quote-block reveal">
        <p class="mono small">Philosophy</p>
        <blockquote>“${escapeHtml(content.artist.philosophy)}”</blockquote>
      </div>
      <div class="quote-block reveal">
        <p class="mono small">Creative vision</p>
        <p class="prose">${escapeHtml(content.artist.vision)}</p>
      </div>

      <h2 class="h3-mono">Musical identity</h2>
      <ul class="tag-cloud">
        ${content.artist.influences.territories.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}
      </ul>
      <p class="muted small">${escapeHtml(content.artist.influences.note)}</p>

      <h2 class="h3-mono">Career timeline</h2>
      <ol class="timeline">
        ${content.artist.careerHighlights
          .map(
            (h) => `<li class="timeline__item reveal">
              <span class="timeline__year mono">${escapeHtml(h.year)}</span>
              <div class="timeline__body">
                <h3>${escapeHtml(h.title)}</h3>
                <p>${escapeHtml(h.text)}</p>
                ${reviewChip(content, h.verification !== 'verified')}
              </div>
            </li>`
          )
          .join('')}
      </ol>

      <div class="epk-cta reveal">
        <div>
          <p class="mono small">Press &amp; promoters</p>
          <h3>Electronic Press Kit</h3>
          <p class="muted">Fast facts, short bio, release list, artwork pack and a print-ready A4 sheet.</p>
        </div>
        <div class="epk-cta__actions">
          <a class="btn btn--primary" href="/epk">Open EPK ${icon('arrow', 'ico ico--sm')}</a>
          <a class="btn btn--ghost" href="/connect#press">Press enquiries</a>
        </div>
      </div>
    </div>
  </section>`;

  return {
    page: {
      slug: 'about',
      path: '/about',
      title: `About D_MAK — ${content.artist.aliasLine}`,
      description: `The story of D_MAK (Wandera David Musamya), a Ugandan recording artist from Busia. Biography, career timeline, musical identity and creative vision.`,
      breadcrumb: [{ name: 'Home', href: '/' }, { name: 'About', href: '/about' }],
    },
    body,
  };
}

/* ------------------------------------------------------------------ MUSIC */

function music(content) {
  const d = derive(content);
  const types = ['All', ...new Set(d.releases.map((r) => r.type))];
  const body = `
  <section class="page-hero page-hero--music">
    <div class="shell">
      <p class="page-hero__kicker mono">01 — Discography</p>
      <h1 class="page-hero__title">Music<span class="muted"> / ${d.stats.releases} releases</span></h1>
      <p class="page-hero__lead">${escapeHtml(content.artist.shortBio)}</p>
      <div class="page-hero__meta mono small">
        <span>${escapeHtml(d.stats.firstYear)} → ${escapeHtml(d.stats.latestYear)}</span><span class="dot"></span>
        <span>${escapeHtml(content.artist.origin)}</span><span class="dot"></span>
        <span>Imprints: ${escapeHtml([...new Set(d.releases.map((r) => r.label))].filter(Boolean).join(' · '))}</span>
      </div>
    </div>
  </section>

  <section class="shell disc">
    <div class="disc__toolbar">
      <div class="filters" role="group" aria-label="Filter releases by type">
        ${types
          .map(
            (t, i) =>
              `<button class="filter ${i === 0 ? 'is-active' : ''}" type="button" data-filter-type="${escapeHtml(
                t
              )}" aria-pressed="${i === 0}">${escapeHtml(t)}<span class="mono small">${
                t === 'All' ? d.releases.length : d.releases.filter((r) => r.type === t).length
              }</span></button>`
          )
          .join('')}
      </div>
      <label class="search">
        ${icon('search', 'ico ico--sm')}
        <span class="sr-only">Search releases</span>
        <input type="search" placeholder="Search titles, labels, years…" data-disc-search autocomplete="off" />
      </label>
    </div>
    <p class="disc__count mono small" data-disc-count>Showing all ${d.releases.length} releases</p>
    <div class="disc__grid" data-disc-grid>
      ${d.releases.map((r, i) => releaseCard(content, r, { index: i })).join('')}
    </div>
    <p class="disc__empty empty" hidden data-disc-empty>
      <span class="mono small">No match</span> Nothing in the catalogue matches that search yet.
    </p>
  </section>

  <section class="shell credits">
    ${sectionHead({
      kicker: 'Behind the records',
      title: 'Credits &amp; imprints',
      lead: 'Every release on this page is documented from public retail metadata.',
    })}
    <div class="credits__grid">
      <div class="credits__col">
        <p class="mono small">Production</p>
        <ul class="plain">
          <li>Melo Killit — producer</li>
          <li>Silence — producer</li>
          <li>Davmak — writer / composer</li>
        </ul>
      </div>
      <div class="credits__col">
        <p class="mono small">Imprints</p>
        <ul class="plain">
          <li>Yuut Empire — 2023–2024 releases</li>
          <li>Davmak city — 2025 releases</li>
          <li>Silence town — 2025 releases</li>
        </ul>
      </div>
      <div class="credits__col">
        <p class="mono small">Visual direction</p>
        <ul class="plain">
          <li>Kai Designz — Naawe artwork</li>
          <li>Yuut Empire — Bitandike / Ogonda Nnyo covers</li>
        </ul>
      </div>
    </div>
    <p class="muted small">Previews are 30-second clips streamed from Deezer's public API. Catalogue metadata mirrored from public retail listings; corrections welcome at <a class="text-link" href="/connect#management">management</a>.</p>
  </section>`;

  return {
    page: {
      slug: 'music',
      path: '/music',
      title: `Music — D_MAK discography (${d.stats.firstYear}–${d.stats.latestYear})`,
      description: 'Every D_MAK release in one place: singles, collaborations and credits, with 30-second previews and links to every streaming platform.',
      breadcrumb: [{ name: 'Home', href: '/' }, { name: 'Music', href: '/music' }],
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'D_MAK discography',
          itemListElement: d.releases.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'MusicAlbum',
              name: r.title,
              datePublished: r.releaseDate,
              url: `${content.site.url}/music#${r.id}`,
            },
          })),
        },
      ],
    },
    body,
  };
}

/* ----------------------------------------------------------------- VIDEOS */

function videos(content) {
  const d = derive(content);
  const body = `
  <section class="page-hero">
    <div class="shell">
      <p class="page-hero__kicker mono">03 — Visuals</p>
      <h1 class="page-hero__title">Videos<span class="muted"> &amp; visual archive</span></h1>
      <p class="page-hero__lead">Official music videos, and the slots reserved for the visualizers, live footage and studio films still to come.</p>
    </div>
  </section>

  <section class="shell vid">
    <div class="vid__grid">
      ${d.videos.map((v) => videoFacade(content, v)).join('')}
      ${content.videoSlots
        .map(
          (slot) => `<article class="vid-slot reveal">
            <div class="vid-slot__frame mono">${icon('play', 'ico ico--sm')}<span>Reserved</span></div>
            <p class="mono small">${escapeHtml(slot.category)}</p>
            <p class="muted small">${escapeHtml(slot.note)}</p>
          </article>`
        )
        .join('')}
    </div>
  </section>

  <section class="shell vid-cta">
    <div class="vid-cta__card">
      <div>
        <p class="mono small">Daily clips</p>
        <h2>The TikTok archive</h2>
        <p class="muted">Video snippets, shoot days and unreleased hooks land on TikTok first — #ogonda, #nkulina and #tubikole sounds.</p>
      </div>
      <div class="vid-cta__actions">
        <a class="btn btn--primary" href="${escapeHtml(
          (content.socials.find((s) => s.id === 'tiktok') || {}).url || '#'
        )}" target="_blank" rel="noopener noreferrer">${icon('tiktok', 'ico ico--sm')} Open TikTok</a>
        <a class="btn btn--ghost" href="${escapeHtml(
          (content.socials.find((s) => s.id === 'youtube') || {}).url || '#'
        )}" target="_blank" rel="noopener noreferrer">${icon('youtube', 'ico ico--sm')} YouTube channel</a>
      </div>
    </div>
  </section>`;

  return {
    page: {
      slug: 'videos',
      path: '/videos',
      title: 'Videos — D_MAK official music videos',
      description: 'D_MAK official music videos and visual archive, including the Nkulina official video via Yuut Empire.',
      breadcrumb: [{ name: 'Home', href: '/' }, { name: 'Videos', href: '/videos' }],
    },
    body,
  };
}

/* ------------------------------------------------------------------- NEWS */

function news(content) {
  const d = derive(content);
  const cats = ['All', ...new Set(d.news.map((n) => n.category))];
  const body = `
  <section class="page-hero">
    <div class="shell">
      <p class="page-hero__kicker mono">04 — Newsroom</p>
      <h1 class="page-hero__title">News<span class="muted"> &amp; updates</span></h1>
      <p class="page-hero__lead">Release notes, collaborations and announcements — dated, sourced and kept in order.</p>
    </div>
  </section>
  <section class="shell news-page">
    <div class="filters filters--wrap" role="group" aria-label="Filter news by category">
      ${cats
        .map(
          (t, i) =>
            `<button class="filter ${i === 0 ? 'is-active' : ''}" type="button" data-filter-news="${escapeHtml(t)}" aria-pressed="${
              i === 0
            }">${escapeHtml(t)}</button>`
        )
        .join('')}
    </div>
    <div class="news-page__list" data-news-list>
      ${d.news
        .map(
          (n) => `<div class="news-page__item" data-news-cat="${escapeHtml(n.category)}">${newsCard(content, n)}</div>`
        )
        .join('')}
    </div>
  </section>`;

  return {
    page: {
      slug: 'news',
      path: '/news',
      title: 'News & updates — D_MAK',
      description: 'The latest D_MAK release news, collaborations, video premieres and announcements.',
      breadcrumb: [{ name: 'Home', href: '/' }, { name: 'News', href: '/news' }],
    },
    body,
  };
}

/* ----------------------------------------------------------------- EVENTS */

function events(content) {
  const upcoming = content.events.upcoming || [];
  const past = content.events.past || [];
  const body = `
  <section class="page-hero">
    <div class="shell">
      <p class="page-hero__kicker mono">05 — Live</p>
      <h1 class="page-hero__title">Events<span class="muted"> &amp;</span><br /><span class="muted">performances</span></h1>
      <p class="page-hero__lead">Where to catch D_MAK live. Dates are published here the moment they are confirmed — nothing is listed that is not booked.</p>
    </div>
  </section>

  <section class="shell events-page">
    <h2 class="h3-mono">Upcoming</h2>
    ${
      upcoming.length
        ? `<ul class="event-list">${upcoming.map((e) => eventRow(e)).join('')}</ul>`
        : `<div class="empty reveal">
            <p class="mono small">No dates announced</p>
            <p class="empty__copy">${escapeHtml(content.events.note)}</p>
            <div class="empty__actions">
              <a class="btn btn--primary" href="/connect#booking">${icon('ticket', 'ico ico--sm')} Book D_MAK</a>
              <a class="btn btn--ghost" href="/connect" data-open-player-hint>Join the mailing list</a>
            </div>
          </div>`
    }

    <h2 class="h3-mono">Past performances</h2>
    ${
      past.length
        ? `<ul class="event-list event-list--past">${past.map((e) => eventRow(e, { past: true })).join('')}</ul>`
        : `<div class="empty empty--soft reveal">
            <p class="mono small">Archive empty</p>
            <p class="empty__copy">No verified past performance dates are documented yet. Promoters and event organisers can send confirmed history to management and it will be archived here.</p>
          </div>`
    }
  </section>`;

  return {
    page: {
      slug: 'events',
      path: '/events',
      title: 'Events & live dates — D_MAK',
      description: 'Upcoming D_MAK performances, concerts and festival appearances, plus ticket links and booking contact.',
      breadcrumb: [{ name: 'Home', href: '/' }, { name: 'Events', href: '/events' }],
      jsonLd: upcoming.length
        ? upcoming.map((e) => ({
            '@context': 'https://schema.org',
            '@type': 'MusicEvent',
            name: e.title,
            startDate: e.date,
            location: { '@type': 'Place', name: e.venue, address: e.city },
            performer: { '@id': `${content.site.url}/#artist` },
            ...(e.ticketUrl ? { offers: { '@type': 'Offer', url: e.ticketUrl } } : {}),
          }))
        : [],
    },
    body,
  };
}

/* ---------------------------------------------------------------- GALLERY */

function gallery(content) {
  const cats = ['All', ...new Set(content.gallery.map((g) => g.category))];
  const body = `
  <section class="page-hero">
    <div class="shell">
      <p class="page-hero__kicker mono">06 — Visuals</p>
      <h1 class="page-hero__title">Gallery<span class="muted"> / campaigns</span></h1>
      <p class="page-hero__lead">Cover artwork, campaign visuals and video stills from the D_MAK catalogue. Editorial photography is added as it is licensed.</p>
    </div>
  </section>
  <section class="shell gal">
    <div class="filters filters--wrap" role="group" aria-label="Filter gallery">
      ${cats
        .map(
          (t, i) =>
            `<button class="filter ${i === 0 ? 'is-active' : ''}" type="button" data-filter-gallery="${escapeHtml(t)}" aria-pressed="${
              i === 0
            }">${escapeHtml(t)}<span class="mono small">${
              t === 'All' ? content.gallery.length : content.gallery.filter((g) => g.category === t).length
            }</span></button>`
        )
        .join('')}
    </div>
    <div class="gal__grid">
      ${content.gallery
        .map(
          (g, i) => `<figure class="gal__item reveal" style="--i:${i}" data-gal-cat="${escapeHtml(g.category)}">
            <button type="button" class="gal__btn" data-lightbox-img="${escapeHtml(g.src)}" data-lightbox-title="${escapeHtml(
            g.title
          )}" aria-label="Open ${escapeHtml(g.title)}">
              <img src="${escapeHtml(g.src)}" alt="${escapeHtml(g.title)}" loading="lazy" decoding="async" width="800" height="800" />
            </button>
            <figcaption>
              <span class="gal__title">${escapeHtml(g.title)}</span>
              <span class="mono small">${escapeHtml(g.year || '')}${g.credit ? ` · ${escapeHtml(g.credit)}` : ''}</span>
            </figcaption>
          </figure>`
        )
        .join('')}
    </div>
    <div class="gal__note reveal">
      <p class="mono small">Editorial photography</p>
      <p class="muted">No verified press or editorial photography of D_MAK was publicly accessible during research. Licensed shoot images should be supplied by management and dropped into <span class="mono">/public/img/art</span> — they will appear here automatically once added in the CMS.</p>
      <a class="btn btn--ghost btn--sm" href="/connect#press">Request press images ${icon('arrow', 'ico ico--sm')}</a>
    </div>
  </section>`;

  return {
    page: {
      slug: 'gallery',
      path: '/gallery',
      title: 'Gallery — D_MAK artwork & campaigns',
      description: 'D_MAK cover artwork, campaign visuals and video stills from the official catalogue.',
      breadcrumb: [{ name: 'Home', href: '/' }, { name: 'Gallery', href: '/gallery' }],
    },
    body,
  };
}

/* ---------------------------------------------------------------- CONNECT */

function connect(content) {
  const routes = content.contact.routes;
  const verified = content.socials.filter((s) => s.url);
  const pending = content.socials.filter((s) => !s.url);
  const body = `
  <section class="page-hero">
    <div class="shell">
      <p class="page-hero__kicker mono">07 — Connect</p>
      <h1 class="page-hero__title">Connect<span class="muted"> / bookings</span></h1>
      <p class="page-hero__lead">Shows, features, press, management — and every verified place you can follow the music.</p>
    </div>
  </section>

  <section class="shell connect">
    <div class="connect__socials">
      <h2 class="h3-mono">Official accounts</h2>
      <div class="soc-grid">
        ${verified.map((s) => socialIconLink(s, { withLabel: true, big: true })).join('')}
      </div>
      ${
        pending.length
          ? `<div class="connect__pending">
              <p class="mono small">Awaiting confirmation</p>
              <div class="soc-grid soc-grid--off">
                ${pending.map((s) => socialIconLink(s, { withLabel: true, big: true })).join('')}
              </div>
              <p class="muted small">Icons shown greyed out are placeholders for platforms where no official profile could be verified. No link is invented — the artist or manager supplies the URL and it goes live instantly.</p>
            </div>`
          : ''
      }
    </div>

    <div class="connect__form-wrap">
      <form class="contact-form" id="booking" data-contact novalidate>
        <p class="mono small">Direct line</p>
        <h2 class="h3-mono">Send an enquiry</h2>
        <p class="muted small">Choose a route so it reaches the right inbox. Every message is validated and stored in the artist's private inbox.</p>

        <fieldset class="form-field">
          <legend class="mono small">Enquiry type</legend>
          <div class="route-grid">
            ${routes
              .map(
                (r, i) => `<label class="route ${i === 0 ? 'is-checked' : ''}">
                  <input type="radio" name="type" value="${escapeHtml(r.id)}" ${i === 0 ? 'checked' : ''} />
                  <span class="route__label">${escapeHtml(r.label)}</span>
                  <span class="route__desc">${escapeHtml(r.description)}</span>
                </label>`
              )
              .join('')}
          </div>
        </fieldset>

        <div class="form-row">
          <div class="form-field">
            <label for="cf-name" class="mono small">Full name <span aria-hidden="true">*</span></label>
            <input id="cf-name" name="name" type="text" required minlength="2" maxlength="120" autocomplete="name" aria-describedby="cf-name-err" />
            <p class="field-error mono small" id="cf-name-err" data-error></p>
          </div>
          <div class="form-field">
            <label for="cf-email" class="mono small">Email <span aria-hidden="true">*</span></label>
            <input id="cf-email" name="email" type="email" required autocomplete="email" aria-describedby="cf-email-err" />
            <p class="field-error mono small" id="cf-email-err" data-error></p>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="cf-org" class="mono small">Company / organisation</label>
            <input id="cf-org" name="organisation" type="text" maxlength="120" autocomplete="organization" />
          </div>
          <div class="form-field">
            <label for="cf-date" class="mono small">Event date (if relevant)</label>
            <input id="cf-date" name="eventDate" type="date" />
          </div>
        </div>

        <div class="form-field">
          <label for="cf-message" class="mono small">Message <span aria-hidden="true">*</span></label>
          <textarea id="cf-message" name="message" rows="5" required minlength="20" maxlength="4000" aria-describedby="cf-message-err"></textarea>
          <p class="field-error mono small" id="cf-message-err" data-error></p>
        </div>

        <div class="form-field form-field--check">
          <label class="check">
            <input type="checkbox" name="consent" required />
            <span>I agree to my message being stored so the artist's team can reply.</span>
          </label>
          <p class="field-error mono small" data-error></p>
        </div>

        <div class="hp" aria-hidden="true">
          <label for="cf-website">Leave this field empty</label>
          <input id="cf-website" name="website" type="text" tabindex="-1" autocomplete="off" />
        </div>

        <div class="form-actions">
          <button class="btn btn--primary btn--lg" type="submit" data-submit>
            <span data-submit-label>Send enquiry</span>${icon('arrow', 'ico ico--sm')}
          </button>
          <p class="form-note mono small" data-form-status role="status" aria-live="polite"></p>
        </div>
        <p class="muted small">${escapeHtml(content.contact.inboxNote)}</p>
      </form>

      <aside class="contact-aside">
        <div class="contact-card">
          <p class="mono small">Management &amp; booking</p>
          ${
            content.contact.bookingEmail
              ? `<a class="contact-card__mail" href="mailto:${escapeHtml(content.contact.bookingEmail)}">${escapeHtml(
                  content.contact.bookingEmail
                )}</a>`
              : `<p class="contact-card__mail contact-card__mail--pending">Booking email pending ${reviewChip(
                  content,
                  true
                )}</p>
                 <p class="muted small">No public booking address was verifiable at research time. Enquiries sent through this form are delivered to the private site inbox — add an address in the CMS to route email copies too.</p>`
          }
          <div class="contact-card__meta mono small">
            ${content.contact.location ? `<span>${icon('pin', 'ico ico--sm')} ${escapeHtml(content.contact.location)}</span>` : ''}
            <span>${icon('calendar', 'ico ico--sm')} Typical reply: 3–5 working days</span>
          </div>
        </div>
        <div class="contact-card">
          <p class="mono small">For promoters</p>
          <ul class="plain small">
            <li>Artist: D_MAK (Wandera David Musamya)</li>
            <li>Territory: Uganda / East Africa</li>
            <li>Set formats: 20 / 40 / 60 min</li>
          </ul>
          <p class="muted small">Rider and technical requirements available on request through the booking form.</p>
          <a class="btn btn--ghost btn--sm" href="/epk">Open the EPK ${icon('arrow', 'ico ico--sm')}</a>
        </div>
      </aside>
    </div>
  </section>

  <section class="shell instagram-fallback">
    ${sectionHead({
      kicker: 'Instagram',
      title: 'The feed',
      lead: content.integrations.instagram.enabled
        ? 'Live from @d_mak_music.'
        : 'This site renders a verified static wall instead of faking a live feed. A legitimate connection needs a Meta access token — setup is documented for the artist.',
    })}
    <div class="ig-wall" data-ig-wall>
      ${content.gallery
        .slice(0, 6)
        .map(
          (g) => `<a class="ig-tile" href="${escapeHtml(
            (content.socials.find((s) => s.id === 'instagram') || {}).url || '#'
          )}" target="_blank" rel="noopener noreferrer">
            <img src="${escapeHtml(g.src)}" alt="${escapeHtml(g.title)}" loading="lazy" width="400" height="400" />
            <span class="ig-tile__badge mono small">${icon('instagram', 'ico ico--sm')} ${escapeHtml(g.year || '')}</span>
          </a>`
        )
        .join('')}
    </div>
    <p class="muted small">${escapeHtml(content.integrations.instagram.fallbackNote)} Setup: <span class="mono">INSTAGRAM_ACCESS_TOKEN</span> (see README).</p>
  </section>`;

  return {
    page: {
      slug: 'connect',
      path: '/connect',
      title: 'Connect & booking — D_MAK',
      description: 'Contact D_MAK for bookings, collaborations, press and management, and follow every verified official account.',
      breadcrumb: [{ name: 'Home', href: '/' }, { name: 'Connect', href: '/connect' }],
    },
    body,
  };
}

/* -------------------------------------------------------------------- EPK */

function epk(content) {
  const d = derive(content);
  const printAction = `<button class="btn btn--primary" type="button" data-print>${icon('download', 'ico ico--sm')} Print / Save as PDF</button>`;
  const body = `
  <section class="page-hero epk-hero">
    <div class="shell">
      <p class="page-hero__kicker mono">Press kit</p>
      <h1 class="page-hero__title">${escapeHtml(content.epk.title)}</h1>
      <p class="page-hero__lead">${escapeHtml(content.epk.headline)}</p>
      <div class="epk-hero__actions no-print">
        <a class="btn btn--primary" href="/files/D_MAK_MUSIC_EPK.pdf" download>${icon('download', 'ico ico--sm')} Download PDF</a>
        ${printAction}
        <a class="btn btn--ghost" href="/connect#press">Press contact</a>
      </div>
    </div>
  </section>

  <article class="shell epk">
    <div class="epk__sheet">
      <header class="epk__sheet-head">
        <div>
          <p class="mono small">${escapeHtml(content.site.name)}</p>
          <h2>D_MAK</h2>
          <p class="mono small">${escapeHtml(content.artist.aliasLine)} · ${escapeHtml(content.artist.origin)}</p>
        </div>
        <p class="epk__oneline">${escapeHtml(content.epk.oneLiner)}</p>
      </header>

      <section class="epk__block">
        <h3 class="mono small">Fast facts</h3>
        <dl class="epk__facts">
          ${content.epk.fastFacts
            .map((f) => `<div><dt class="mono small">${escapeHtml(f.label)}</dt><dd>${escapeHtml(f.value)}</dd></div>`)
            .join('')}
        </dl>
      </section>

      <section class="epk__block">
        <h3 class="mono small">Biography — 120 words</h3>
        <p>${escapeHtml(content.artist.longBio[0])}</p>
        <p>${escapeHtml(content.artist.longBio[1])}</p>
      </section>

      <section class="epk__block">
        <h3 class="mono small">Discography</h3>
        <table class="epk__table">
          <thead><tr><th>Year</th><th>Release</th><th>Type</th><th>Label</th></tr></thead>
          <tbody>
            ${d.releases
              .map(
                (r) => `<tr><td>${escapeHtml(String(r.year))}</td><td>${escapeHtml(r.title)}</td><td>${escapeHtml(
                  r.type
                )}</td><td>${escapeHtml(r.label || '—')}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
      </section>

      <section class="epk__block">
        <h3 class="mono small">Quote</h3>
        <blockquote>“${escapeHtml(content.artist.philosophy)}”</blockquote>
        <p class="mono small">— D_MAK</p>
      </section>

      <section class="epk__block">
        <h3 class="mono small">Assets</h3>
        <ul class="plain">
          ${content.epk.assets
            .map(
              (a) =>
                `<li>${a.path ? `<a class="text-link" href="${escapeHtml(a.path)}" download>${escapeHtml(a.label)}</a>` : `<strong>${escapeHtml(a.label)}</strong>`} — ${escapeHtml(a.note)}</li>`
            )
            .join('')}
        </ul>
      </section>

      <section class="epk__block">
        <h3 class="mono small">Contacts</h3>
        <ul class="plain">
          <li>Booking — <a class="text-link" href="/connect#booking">site booking form</a></li>
          <li>Press — <a class="text-link" href="/connect#press">press enquiries</a></li>
          <li>Management — <a class="text-link" href="/connect#management">management enquiries</a></li>
        </ul>
        <p class="muted small">${escapeHtml(content.contact.inboxNote)}</p>
      </section>

      <footer class="epk__sheet-foot mono small">
        <span>${escapeHtml(content.site.url)}</span>
        <span>Updated ${escapeHtml(dateLabel(content.meta.updatedAt))}</span>
      </footer>
    </div>
  </article>`;

  return {
    page: {
      slug: 'epk',
      path: '/epk',
      title: 'Electronic press kit — D_MAK',
      description: 'D_MAK electronic press kit: fast facts, biography, discography, quotes and asset list for promoters, press and partners.',
      breadcrumb: [{ name: 'Home', href: '/' }, { name: 'EPK', href: '/epk' }],
    },
    body,
  };
}

/* ---------------------------------------------------------------- PRIVACY */

function privacy(content) {
  const body = `
  <section class="page-hero page-hero--slim">
    <div class="shell">
      <p class="page-hero__kicker mono">Legal</p>
      <h1 class="page-hero__title">Privacy</h1>
      <p class="page-hero__lead">Short, because this site collects as little as possible.</p>
    </div>
  </section>
  <section class="shell prose-page">
    <h2>What is collected</h2>
    <p><strong>Enquiries.</strong> If you use the contact form, the details you type (name, email, organisation, event date, message) are stored on this server so the artist's team can reply.</p>
    <p><strong>Mailing list.</strong> If you subscribe, your email address and optional country are stored on this server. Every message includes an unsubscribe route; one request removes you permanently.</p>
    <p><strong>Analytics.</strong> ${escapeHtml(content.site.analytics.note)} No cookies, no fingerprinting, no third-party scripts, no advertising pixels.</p>
    <h2>What is not collected</h2>
    <p>No account is required to use this site. No payment data is collected here. Nothing is sold or shared with data brokers.</p>
    <h2>Audio previews</h2>
    <p>Thirty-second preview clips are streamed through this server from Deezer's public API so no third-party player script is embedded. ${escapeHtml(
      content.integrations.previews.note
    )}</p>
    <h2>Your rights</h2>
    <p>Email the artist's team through the <a class="text-link" href="/connect">contact page</a> to request a copy of anything stored about you, or to have it deleted.</p>
    <h2>Data location</h2>
    <p>All stored data lives in plain JSON files on the server that hosts this site (<span class="mono">data/messages.json</span>, <span class="mono">data/subscribers.json</span>). No external database is involved.</p>
  </section>`;

  return {
    page: {
      slug: 'privacy',
      path: '/privacy',
      title: 'Privacy — D_MAK MUSIC',
      description: 'How this site handles contact enquiries, mailing list data and privacy-conscious analytics.',
      breadcrumb: [{ name: 'Home', href: '/' }, { name: 'Privacy', href: '/privacy' }],
    },
    body,
  };
}

/* ------------------------------------------------------------------ ADMIN */

function admin(content) {
  const body = `
  <section class="admin" id="admin">
    <div class="shell">
      <div class="admin__head">
        <div>
          <p class="page-hero__kicker mono">Control room</p>
          <h1 class="admin__title">Content <span class="muted">CMS</span></h1>
        </div>
        <p class="admin__lead">Edit the site's content without touching code. Everything here writes to <span class="mono">content/site.json</span> through an authenticated API.</p>
      </div>

      ${
        IS_SERVERLESS
          ? `<div class="admin__notice">
              <p class="mono small">${icon('shield', 'ico ico--sm')} Serverless mode</p>
              <p class="muted small">This deployment runs as a Netlify Function, where the filesystem is ephemeral.
              Editing content here works for the current instance but is <strong>not permanent</strong> on Netlify — the
              durable way to change content in this mode is to edit <span class="mono">content/site.json</span>, commit and
              let Netlify redeploy. Enquiries and subscribers are also ephemeral: set
              <span class="mono">CONTACT_WEBHOOK_URL</span> (and a newsletter webhook) so nothing is lost. For a full
              self-hosted CMS, run <span class="mono">node server.js</span> on any Node host or the bundled Docker image.</p>
            </div>`
          : ''
      }

      <div class="admin__gate" data-admin-gate>
        <form class="admin__login" data-admin-login>
          <label class="mono small" for="admin-token">Admin token</label>
          <input id="admin-token" name="token" type="password" autocomplete="current-password" placeholder="ADMIN_TOKEN from your environment" required />
          <button class="btn btn--primary" type="submit">Unlock ${icon('arrow', 'ico ico--sm')}</button>
          <p class="form-note mono small" data-admin-status role="status" aria-live="polite"></p>
          <p class="muted small">Set <span class="mono">ADMIN_TOKEN</span> in your environment before deploying. The token is verified server-side and never stored in the page. See README → “Running the CMS”.</p>
        </form>
      </div>

      <div class="admin__app" data-admin-app hidden>
        <div class="admin__toolbar">
          <nav class="admin__tabs" data-admin-tabs aria-label="Content sections"></nav>
          <div class="admin__toolbar-actions">
            <span class="chip" data-admin-dirty hidden>Unsaved changes</span>
            <span class="mono small admin__save-status" data-admin-save-status role="status" aria-live="polite"></span>
            <button class="btn btn--ghost btn--sm" type="button" data-admin-reload>Reload</button>
            <button class="btn btn--primary btn--sm" type="button" data-admin-save>${icon('download', 'ico ico--sm')} Save changes</button>
          </div>
        </div>
        <form class="admin__editor" data-admin-editor novalidate></form>
        <div class="admin__inbox">
          <h2 class="h3-mono">Inbox</h2>
          <div class="admin__inbox-actions">
            <button class="btn btn--ghost btn--sm" type="button" data-inbox="messages">Enquiries</button>
            <button class="btn btn--ghost btn--sm" type="button" data-inbox="subscribers">Subscribers</button>
            <button class="btn btn--ghost btn--sm" type="button" data-inbox="analytics">Analytics</button>
          </div>
          <div class="admin__inbox-body" data-inbox-body><p class="muted small">Choose a view.</p></div>
        </div>
      </div>
    </div>
  </section>
  <script src="/js/admin.js" defer></script>`;

  return {
    page: {
      slug: 'admin',
      path: '/admin',
      title: 'Content CMS — D_MAK MUSIC',
      description: 'Private content management for the D_MAK MUSIC website.',
      noindex: true,
    },
    body,
  };
}

/* -------------------------------------------------------------------- 404 */

function notFound(content) {
  const d = derive(content);
  const body = `
  <section class="lost">
    <div class="shell lost__inner">
      <p class="mono small lost__code">Error 404 — signal lost</p>
      <h1 class="lost__title">This<br />frequency<br /><span class="muted">does not exist.</span></h1>
      <p class="lost__copy">The page you were looking for has moved, been renamed, or was never recorded. Everything the artist has released is one jump away.</p>
      <div class="lost__actions">
        <a class="btn btn--primary btn--lg" href="/">Back to home ${icon('arrow', 'ico ico--sm')}</a>
        <a class="btn btn--ghost btn--lg" href="/music">Browse the music</a>
      </div>
      <div class="lost__suggest">
        <p class="mono small">Latest releases</p>
        <ul class="plain">
          ${d.releases
            .slice(0, 4)
            .map((r) => `<li><a class="text-link" href="/music#${escapeHtml(r.id)}">${escapeHtml(r.title)} — ${escapeHtml(r.year)}</a></li>`)
            .join('')}
        </ul>
      </div>
    </div>
    <div class="lost__glow" aria-hidden="true"></div>
  </section>`;

  return {
    page: {
      slug: '404',
      path: '/404',
      title: 'Page not found — D_MAK MUSIC',
      description: 'That page could not be found.',
      noindex: true,
    },
    body,
  };
}

module.exports = { home, about, music, videos, news, events, gallery, connect, epk, privacy, admin, notFound };
