'use strict';
/**
 * Presentation layer: icons, reusable components, and the document shell.
 * Pure functions in, HTML strings out (server-side rendered, zero client framework).
 */
const { escapeHtml, escapeJsonLd, fmtDuration, dateLabel, relTime } = require('./util');

/* ------------------------------------------------------------------ icons */

const ICONS = {
  instagram:
    '<path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.23 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 3.1a6.7 6.7 0 1 0 0 13.4 6.7 6.7 0 0 0 0-13.4Zm0 2.2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm6.9-2.6a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0Z"/>',
  tiktok:
    '<path d="M16.6 2h-3.1v13.1a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.4a5.9 5.9 0 0 0-.8 0 5.8 5.8 0 1 0 5.8 5.8V8.7a6.9 6.9 0 0 0 4 1.3V6.9a3.9 3.9 0 0 1-4-3.9V2Z"/>',
  youtube:
    '<path d="M21.6 7.3s-.2-1.4-.8-2c-.7-.8-1.6-.8-2-.9C16 4.2 12 4.2 12 4.2h0s-4 0-6.8.2c-.4 0-1.3 0-2 .9-.6.6-.8 2-.8 2S2.2 9 2.2 10.6v1.5c0 1.7.2 3.3.2 3.3s.2 1.4.8 2c.7.8 1.7.8 2.1.9 1.5.1 6.7.2 6.7.2s4 0 6.8-.2c.4 0 1.3 0 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.3v-1.5c0-1.6-.2-3.3-.2-3.3ZM9.9 14.2V8.3l5.3 3-5.3 2.9Z"/>',
  deezer:
    '<path d="M3 14.9h3.9v2.4H3v-2.4Zm0-3.9h3.9v2.4H3v-2.4Zm0-3.9h3.9v2.4H3V7.1Zm4.9 3.9h3.9v2.4H7.9v-2.4Zm0-3.9h3.9v2.4H7.9V7.1Zm0-3.9h3.9v2.4H7.9V3.2Zm4.9 7.8h3.9v2.4h-3.9v-2.4Zm0-3.9h3.9v2.4h-3.9V7.1Zm0-3.9h3.9v2.4h-3.9V3.2Zm4.9 7.8H21v2.4h-3.4v-2.4Zm0-3.9H21v2.4h-3.4V7.1Zm0-3.9H21v2.4h-3.4V3.2Z"/>',
  apple:
    '<path d="M16.4 12.5c0-1.6.8-2.8 2.4-3.6-.7-1-1.7-1.6-3-1.7-1.3-.1-2.5.7-3.1.7-.7 0-1.8-.7-3-.7-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3.1-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.9-2.2.9-1.2 1.3-2.5 1.3-2.6-.1 0-2.4-1-2.4-3.6ZM14.3 5.5c.7-.8 1.1-1.9 1-3-1 .1-2.2.7-2.9 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.6 2.9-1.4Z"/>',
  spotify:
    '<path d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm4.5 14.1a.8.8 0 0 1-1.1.3c-3-1.8-6.7-2.2-11.1-1.2a.8.8 0 1 1-.3-1.5c4.8-1.1 8.9-.6 12.2 1.4.4.2.5.7.3 1Zm1.2-2.7a1 1 0 0 1-1.3.3c-3.4-2.1-8.5-2.7-12.5-1.5a1 1 0 0 1-.6-1.9c4.6-1.4 10.3-.7 14.2 1.7.4.2.5.9.2 1.4Zm.1-2.8C14.1 8.4 7.8 8.2 4.4 9.2a1.2 1.2 0 1 1-.7-2.3C7.6 5.7 14.5 6 18.9 8.6a1.2 1.2 0 1 1-1.2 2.2Z"/>',
  amazon:
    '<path d="M14.7 15.4c-1.3 1-3.1 1.5-4.7 1.5-2.2 0-4.2-1.1-4.2-3.3 0-2.6 2.3-3.6 5.4-3.6 1.1 0 2.1.1 3.1.3v-.6c0-1.6-.9-2.3-2.6-2.3-1.2 0-2.4.3-3.5.8l-.3-1.7c1.4-.6 2.8-.9 4.3-.9 2.8 0 4.2 1.4 4.2 4.2v4.2c0 1 .3 1.6.8 2.1l-1.4 1.1c-.5-.5-.9-1-1.1-1.8Zm-.4-3.6c-.8-.2-1.6-.3-2.4-.3-1.7 0-2.7.6-2.7 1.9 0 1 .8 1.6 2 1.6 1.1 0 2.2-.4 3.1-1.1v-2.1ZM18 20.4c-2.6 1.3-5.9 1.9-8.7 1.9-2.5 0-5.2-.5-7.3-1.5-.4-.2-.4-.5 0-.5 2.3.5 4.7.8 7 .8 2.6 0 5.6-.5 8.4-1.6.9-.4 1.6.1.6.9Zm.9-1.9c-.3-.4-2.1-.2-2.9-.1-.2 0-.3-.2-.1-.4 1.4-1 3.7-.7 4-.4.3.4-.1 2.6-1.4 3.7-.2.2-.4.1-.3-.1.3-.8 1-2.3.7-2.7Z"/>',
  boomplay:
    '<path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm0 3.2c3.5 0 6.3 2.8 6.3 6.3S15.5 18.3 12 18.3 5.7 15.5 5.7 12 8.5 5.7 12 5.7Zm0 2.6A3.7 3.7 0 1 0 12 15.7 3.7 3.7 0 0 0 12 8.3Z"/>',
  audiomack:
    '<path d="M4 20V9.5h2.6V20H4Zm4.4 0V4h2.6v16H8.4Zm4.4 0v-8.2h2.6V20H12.8Zm4.4 0V7h2.6v13H17.2Z"/>',
  facebook:
    '<path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.2-1.5 1.5-1.5h1.7V3.6c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2H7v3.1h2.7v8h3.8Z"/>',
  x: '<path d="M17.5 3h3.1l-6.8 7.7L21.6 21h-5.9l-4.2-5.6L6.6 21H3.5l7.2-8.2L3 3h6l3.9 5.2L17.5 3Zm-1.1 16.2h1.7L7.5 4.7H5.7l10.7 14.5Z"/>',
  mail: '<path d="M3 5.5h18v13H3v-13Zm2 2v.4l7 4.6 7-4.6v-.4H5Zm14 2.6-7 4.6-7-4.6v6.4h14v-6.4Z"/>',
  play: '<path d="M8 5v14l11-7L8 5Z"/>',
  pause: '<path d="M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z"/>',
  next: '<path d="M6 5l9 7-9 7V5Zm10 0h2.5v14H16V5Z"/>',
  prev: '<path d="M18 5v14l-9-7 9-7ZM5.5 5H8v14H5.5V5Z"/>',
  arrow: '<path d="M13.2 5.6 11.8 7l3.9 3.9H4v2h11.7l-3.9 3.9 1.4 1.4L19.4 12l-6.2-6.4Z"/>',
  arrowUpRight: '<path d="M7 6h11v11h-2V9.4L7.4 18 6 16.6l8.6-8.6H7V6Z"/>',
  close: '<path d="M6.2 4.8 12 10.6l5.8-5.8 1.4 1.4L13.4 12l5.8 5.8-1.4 1.4L12 13.4l-5.8 5.8-1.4-1.4L10.6 12 4.8 6.2l1.4-1.4Z"/>',
  menu: '<path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z"/>',
  ticket: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7Zm2 2v.2a4 4 0 0 1 0 5.6V17h14v-2.2a4 4 0 0 1 0-5.6V9H5Zm5 1h2v4h-2v-4Z"/>',
  search: '<path d="M10.5 3a7.5 7.5 0 1 0 4.6 13.4l4.2 4.2 1.4-1.4-4.2-4.2A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"/>',
  download: '<path d="M11 3h2v8.2l3-3 1.4 1.5L12 15.3 6.6 9.7 8 8.2l3 3V3ZM4 18h16v2H4v-2Z"/>',
  volume: '<path d="M4 9h3.5L12 5v14l-4.5-4H4V9Zm10.5-1.4a5 5 0 0 1 0 8.8v-2.2a3 3 0 0 0 0-4.4V7.6Z"/>',
  spark: '<path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z"/>',
  grid: '<path d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z"/>',
  wave: '<path d="M2 12h3l2-6 3 12 3-9 2 6 2-3h5v2h-3.6l-2.6 4-2-6-2.9 8.6L8.4 8 6.6 14H2v-2Z"/>',
  calendar: '<path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm13 8H4v10h16V10ZM4 6v2h16V6h-2v2h-2V6H8v2H6V6H4Z"/>',
  pin: '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 2.2A4.8 4.8 0 0 1 16.8 9c0 3.3-4.8 9.2-4.8 9.2S7.2 12.3 7.2 9A4.8 4.8 0 0 1 12 4.2Zm0 2.3A2.5 2.5 0 1 1 9.5 9 2.5 2.5 0 0 1 12 6.5Z"/>',
  shield: '<path d="M12 2 4 5v7c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Zm0 2.2 6 2.2V12c0 3.9-2.5 6.7-6 7.9-3.5-1.2-6-4-6-7.9V6.4l6-2.2Z"/>',
};

function icon(name, cls = 'ico', extra = '') {
  const body = ICONS[name];
  if (!body) return '';
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;
}

const PLATFORM_ICON = {
  deezer: 'deezer',
  apple: 'apple',
  spotify: 'spotify',
  amazon: 'amazon',
  boomplay: 'boomplay',
  audiomack: 'audiomack',
  youtube: 'youtube',
  instagram: 'instagram',
  tiktok: 'tiktok',
  facebook: 'facebook',
  x: 'x',
};

/* -------------------------------------------------------------- primitives */

function reviewChip(content, flag = true, label = 'To confirm') {
  if (!content.meta.showReviewNotices || !flag) return '';
  return `<span class="chip chip--review" title="${escapeHtml(content.meta.reviewNoticeCopy)}">${icon('shield', 'ico ico--sm')}${escapeHtml(label)}</span>`;
}

function sectionHead({ kicker, title, lead, actions = '', id = '', align = '' }) {
  return `<div class="section-head ${align}">
    ${id ? `<span class="section-head__id mono">${escapeHtml(id)}</span>` : ''}
    ${kicker ? `<p class="section-head__kicker mono">${escapeHtml(kicker)}</p>` : ''}
    <h2 class="section-head__title">${title}</h2>
    ${lead ? `<p class="section-head__lead">${lead}</p>` : ''}
    ${actions ? `<div class="section-head__actions">${actions}</div>` : ''}
  </div>`;
}

function platformLinks(links = {}, { limit = 4, size = '' } = {}) {
  const order = ['deezer', 'apple', 'spotify', 'boomplay', 'audiomack', 'amazon', 'youtube'];
  const entries = order.filter((k) => links[k]).slice(0, limit);
  if (!entries.length) return '<p class="muted mono small">Streaming links to be added.</p>';
  return `<div class="platform-row ${size}">${entries
    .map(
      (k) =>
        `<a class="platform platform--${k}" href="${escapeHtml(links[k])}" target="_blank" rel="noopener noreferrer">${icon(
          PLATFORM_ICON[k],
          'ico ico--sm'
        )}<span>${k === 'apple' ? 'Apple Music' : k === 'youtube' ? 'YouTube' : k[0].toUpperCase() + k.slice(1)}</span></a>`
    )
    .join('')}</div>`;
}

/** Release artwork with an elegant, honest fallback tile when no file exists yet. */
function artTile(release, { lazy = true, cls = '' } = {}) {
  if (release.artwork) {
    return `<img class="art ${cls}" src="${escapeHtml(release.artwork)}" alt="${escapeHtml(
      `${release.title} — release artwork`
    )}" width="600" height="600" ${lazy ? 'loading="lazy" decoding="async"' : 'decoding="async" fetchpriority="high"'} />`;
  }
  return `<div class="art art--signal ${cls}" role="img" aria-label="${escapeHtml(
    `${release.title} — artwork pending`
  )}"><span class="art--signal__mark mono">ARTWORK</span><span class="art--signal__title">${escapeHtml(
    release.title
  )}</span><span class="art--signal__note mono">pending upload</span></div>`;
}

function releaseCard(content, release, { index = 0 } = {}) {
  const track = (release.tracks || [])[0] || {};
  const canPlay = Boolean(track.deezerId) && content.integrations.previews.enabled;
  const outbound = release.links && Object.values(release.links).find(Boolean);
  return `<article class="rel-card reveal" id="${escapeHtml(release.id)}" style="--i:${index}">
    <div class="rel-card__media">
      ${artTile(release)}
      <div class="rel-card__overlay">
        ${
          canPlay
            ? `<button class="btn-play" type="button" data-play="${escapeHtml(String(track.deezerId))}" data-title="${escapeHtml(
                track.title
              )}" data-release="${escapeHtml(release.title)}" data-art="${escapeHtml(
                release.artwork || ''
              )}" aria-label="Play a 30 second preview of ${escapeHtml(track.title)}">${icon('play')}</button>`
            : outbound
          ? `<a class="btn-play btn-play--link" href="${escapeHtml(
              outbound
            )}" target="_blank" rel="noopener noreferrer" aria-label="Stream ${escapeHtml(release.title)}">${icon(
              'arrowUpRight'
            )}</a>`
          : `<span class="rel-card__pending mono">Links pending</span>`
        }
      </div>
      <span class="rel-card__type mono">${escapeHtml(release.type)}</span>
    </div>
    <div class="rel-card__body">
      <div class="rel-card__meta mono">
        <span>${escapeHtml(String(release.year))}</span><span class="dot"></span><span>${escapeHtml(
    release.label || ''
  )}</span>${release.duration ? `<span class="dot"></span><span>${fmtDuration(release.duration)}</span>` : ''}
      </div>
      <h3 class="rel-card__title">${escapeHtml(release.title)}</h3>
      <p class="rel-card__summary">${escapeHtml(release.summary || '')}</p>
      ${
        outbound
          ? platformLinks(release.links, { limit: 3, size: 'platform-row--tight' })
          : `<p class="rel-card__linksnote mono small">${escapeHtml(
              release.linksNote || 'Official links to be added'
            )}</p>`
      }
    </div>
  </article>`;
}

function videoFacade(content, video) {
  const thumb = video.thumb
    ? `<img src="${escapeHtml(video.thumb)}" alt="" width="480" height="270" loading="lazy" decoding="async" />`
    : '';
  return `<article class="vid-card reveal">
    <button class="vid-card__frame" type="button" data-video="${escapeHtml(video.youtubeId)}" data-video-title="${escapeHtml(
    `${video.title} — ${video.channel}`
  )}" aria-label="Play ${escapeHtml(video.title)}">
      ${thumb}
      <span class="vid-card__scan"></span>
      <span class="vid-card__play">${icon('play')}</span>
      <span class="vid-card__dur mono">${escapeHtml(video.duration || '')}</span>
    </button>
    <div class="vid-card__body">
      <p class="mono small vid-card__kicker">${escapeHtml(video.category)} · ${escapeHtml(
    dateLabel(video.publishedAt, { month: 'short', year: 'numeric' })
  )}</p>
      <h3>${escapeHtml(video.title)}</h3>
      <p class="muted">${escapeHtml(video.description || '')}</p>
      <a class="text-link" href="https://www.youtube.com/watch?v=${escapeHtml(
        video.youtubeId
      )}" target="_blank" rel="noopener noreferrer">Watch on YouTube ${icon('arrowUpRight', 'ico ico--sm')}</a>
    </div>
  </article>`;
}

function newsCard(content, item, { compact = false } = {}) {
  return `<article class="news-card reveal ${compact ? 'news-card--compact' : ''}">
    <div class="news-card__top mono">
      <span class="news-card__cat">${escapeHtml(item.category)}</span>
      <time datetime="${escapeHtml(item.date)}">${escapeHtml(dateLabel(item.date))}</time>
    </div>
    <h3 class="news-card__title">${escapeHtml(item.title)}</h3>
    <p class="news-card__excerpt">${escapeHtml(item.excerpt || '')}</p>
    ${item.body && !compact ? `<p class="news-card__body">${escapeHtml(item.body)}</p>` : ''}
    ${
      item.link
        ? `<a class="text-link" href="${escapeHtml(item.link)}">Read ${icon('arrow', 'ico ico--sm')}</a>`
        : ''
    }
  </article>`;
}

function eventRow(event, { past = false } = {}) {
  const d = new Date(`${event.date}T12:00:00Z`);
  const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  const year = d.toLocaleDateString('en-GB', { year: 'numeric' });
  const soldOut = event.status === 'sold-out';
  return `<li class="event reveal">
    <div class="event__date"><span class="event__day">${escapeHtml(day)}</span><span class="event__month mono">${escapeHtml(
    `${month} ${year}`
  )}</span></div>
    <div class="event__main">
      <h3 class="event__title">${escapeHtml(event.title)}</h3>
      <p class="event__venue">${icon('pin', 'ico ico--sm')} ${escapeHtml(event.venue || '')}${
    event.city ? ` · ${escapeHtml(event.city)}` : ''
  }${event.country ? `, ${escapeHtml(event.country)}` : ''}</p>
      ${event.note ? `<p class="event__note muted small">${escapeHtml(event.note)}</p>` : ''}
    </div>
    <div class="event__action">
      ${
        past
          ? `<span class="chip">${escapeHtml(event.status === 'cancelled' ? 'Cancelled' : 'Played')}</span>`
          : soldOut
          ? `<span class="chip chip--sold">Sold out</span>`
          : event.ticketUrl
          ? `<a class="btn btn--sm btn--primary" href="${escapeHtml(event.ticketUrl)}" target="_blank" rel="noopener noreferrer">${icon(
              'ticket',
              'ico ico--sm'
            )} Tickets</a>`
          : `<span class="chip chip--soft">${escapeHtml(event.status === 'free' ? 'Free entry' : 'Details soon')}</span>`
      }
    </div>
  </li>`;
}

function socialIconLink(social, { withLabel = false, big = false } = {}) {
  const isOn = Boolean(social.url);
  const tag = isOn ? 'a' : 'span';
  const attrs = isOn
    ? `href="${escapeHtml(social.url)}" target="_blank" rel="noopener noreferrer"`
    : 'aria-disabled="true" title="Link pending artist confirmation"';
  return `<${tag} class="soc ${isOn ? 'is-on' : 'is-off'} ${big ? 'soc--big' : ''}" ${attrs}>
    ${icon(PLATFORM_ICON[social.id] || 'spark', 'ico')}
    ${withLabel ? `<span class="soc__label">${escapeHtml(social.label)}</span>` : ''}
    ${withLabel && !isOn ? '<span class="soc__label-note mono">pending</span>' : ''}
    ${withLabel && isOn && !social.verified ? '<span class="soc__label-note mono">confirm</span>' : ''}
  </${tag}>`;
}

/* ------------------------------------------------------------- JSON-LD graph */

function artistJsonLd(content) {
  const { artist, site, socials } = content;
  const sameAs = socials.filter((s) => s.url).map((s) => s.url);
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    '@id': `${site.url}/#artist`,
    name: artist.name,
    alternateName: artist.alsoKnownAs,
    genre: artist.influences.territories,
    description: site.description,
    url: site.url,
    image: `${site.url}${site.ogImage}`,
    foundingLocation: { '@type': 'Place', name: artist.origin },
    foundingDate: artist.activeSince,
    member: { '@type': 'Person', name: artist.aliasLine },
    sameAs,
  };
}

function pageJsonLd(content, page, extra = []) {
  const graph = [artistJsonLd(content), ...extra.filter(Boolean)];
  graph.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: content.site.name,
    url: content.site.url,
    inLanguage: 'en',
    publisher: { '@id': `${content.site.url}/#artist` },
  });
  if (page.breadcrumb) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumb.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: `${content.site.url}${b.href}`,
      })),
    });
  }
  return graph;
}

/* ------------------------------------------------------------------- shell */

function head(content, page) {
  const title = page.title || content.site.title;
  const description = page.description || content.site.description;
  const canonical = `${content.site.url}${page.path === '/' ? '/' : page.path}`;
  const ogImage = `${content.site.url}${page.image || content.site.ogImage}`;
  const ld = pageJsonLd(content, page, page.jsonLd || []);
  const noindex = page.noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large">';
  return `<meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(content.site.keywords)}" />
    <meta name="author" content="${escapeHtml(content.artist.aliasLine)}" />
    <meta name="theme-color" content="${escapeHtml(content.site.themeColor)}" />
    <meta name="color-scheme" content="dark" />
    ${noindex}
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="${escapeHtml(page.ogType || 'website')}" />
    <meta property="og:site_name" content="${escapeHtml(content.site.name)}" />
    <meta property="og:title" content="${escapeHtml(page.ogTitle || title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(`${content.site.name} — official artwork`)}" />
    <meta property="og:locale" content="${escapeHtml(content.site.locale)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.ogTitle || title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <link rel="icon" href="/img/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/img/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="preload" href="/fonts/syne-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/fonts/fonts.css" />
    <link rel="stylesheet" href="/css/main.css" />
    <script type="application/ld+json">${escapeJsonLd(ld)}</script>`;
}

function navBar(content, page) {
  const links = content.nav
    .map(
      (item) =>
        `<a href="${escapeHtml(item.href)}" class="nav__link ${
          page.path === item.href || (item.href !== '/' && page.path.startsWith(item.href)) ? 'is-active' : ''
        }">${escapeHtml(item.label)}</a>`
    )
    .join('');
  return `<header class="nav" id="site-nav">
    <div class="nav__inner">
      <a class="brand" href="/" aria-label="${escapeHtml(content.site.name)} — home">
        <span class="brand__mark">D_MAK</span>
        <span class="brand__sub mono">MUSIC</span>
      </a>
      <nav class="nav__links" aria-label="Primary">${links}</nav>
      <div class="nav__actions">
        <button class="nav__listen" type="button" data-open-player>
          ${icon('wave', 'ico ico--sm')}<span>Listen</span>
        </button>
        <button class="nav__burger" type="button" aria-expanded="false" aria-controls="nav-drawer" data-burger>
          <span class="sr-only">Open menu</span>${icon('menu')}
        </button>
      </div>
    </div>
  </header>
  <div class="drawer" id="nav-drawer" hidden>
    <div class="drawer__panel">
      <div class="drawer__head">
        <span class="mono small">Menu</span>
        <button class="drawer__close" type="button" data-drawer-close aria-label="Close menu">${icon('close')}</button>
      </div>
      <nav class="drawer__links" aria-label="Mobile">${content.nav
        .map(
          (item, i) =>
            `<a href="${escapeHtml(item.href)}" style="--i:${i}" class="${
              page.path === item.href ? 'is-active' : ''
            }"><span class="mono small">0${i + 1}</span>${escapeHtml(item.label)}</a>`
        )
        .join('')}</nav>
      <div class="drawer__foot">
        ${content.socials
          .filter((s) => s.url)
          .map((s) => socialIconLink(s))
          .join('')}
      </div>
    </div>
  </div>`;
}

function footer(content) {
  const socials = content.socials.filter((s) => s.url).map((s) => socialIconLink(s)).join('');
  const year = new Date().getFullYear();
  return `<footer class="footer">
    <div class="footer__glow" aria-hidden="true"></div>
    <div class="shell">
      <div class="footer__top">
        <div class="footer__brand">
          <p class="mono small">${escapeHtml(content.artist.tagline)}</p>
          <p class="footer__wordmark" aria-hidden="true">D_MAK</p>
          <p class="footer__origin mono small">${escapeHtml(content.artist.origin)} · est. ${escapeHtml(
    content.artist.activeSince
  )}</p>
        </div>
        <div class="footer__cols">
          <div class="footer__col">
            <p class="mono small footer__col-title">Explore</p>
            ${content.nav.map((n) => `<a href="${escapeHtml(n.href)}">${escapeHtml(n.label)}</a>`).join('')}
            <a href="/epk">Press kit (EPK)</a>
          </div>
          <div class="footer__col">
            <p class="mono small footer__col-title">Listen</p>
            ${content.socials
              .filter((s) => s.url && ['deezer', 'apple', 'spotify', 'amazon', 'youtube'].includes(s.id))
              .map(
                (s) =>
                  `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                    s.label
                  )}</a>`
              )
              .join('')}
            <a href="/music">All releases</a>
          </div>
          <div class="footer__col">
            <p class="mono small footer__col-title">Business</p>
            <a href="/connect#booking">Booking</a>
            <a href="/connect#press">Press &amp; media</a>
            <a href="/connect#management">Management</a>
            <a href="/admin" rel="nofollow">Site CMS</a>
          </div>
        </div>
        <form class="footer__sub" data-subscribe novalidate>
          <p class="mono small footer__col-title">Stay on the frequency</p>
          <p class="footer__sub-copy">Release news, video drops and show announcements. No noise.</p>
          <div class="field-inline">
            <label class="sr-only" for="footer-email">Email address</label>
            <input id="footer-email" type="email" name="email" placeholder="you@email.com" autocomplete="email" required />
            <button class="btn btn--primary btn--sm" type="submit"><span>Join</span>${icon('arrow', 'ico ico--sm')}</button>
          </div>
          <p class="form-note mono small" data-form-status role="status" aria-live="polite"></p>
        </form>
      </div>
      <div class="footer__bottom">
        <p class="mono small">© ${year} ${escapeHtml(content.site.name)}. All rights reserved.</p>
        <div class="footer__socials">${socials}</div>
        <div class="footer__legal mono small">
          <a href="/privacy">Privacy</a>
          <span class="dot"></span>
          <button type="button" class="linkish" data-analytics-info>Analytics: cookieless</button>
          <span class="dot"></span>
          <span>Content updated ${escapeHtml(dateLabel(content.meta.updatedAt))}</span>
        </div>
      </div>
      ${
        content.meta.showReviewNotices
          ? `<p class="footer__review mono small">${icon('shield', 'ico ico--sm')} ${escapeHtml(
              content.meta.reviewNoticeCopy
            )} <a href="/admin" rel="nofollow">Review list</a></p>`
          : ''
      }
    </div>
  </footer>`;
}

function playerDock(content) {
  const queue = require('./store').previewQueue(content);
  return `<section class="player" id="player" hidden aria-label="Music player">
    <div class="player__inner">
      <div class="player__now">
        <div class="player__art" data-player-art></div>
        <div class="player__meta">
          <p class="player__title" data-player-title>—</p>
          <p class="player__sub mono small" data-player-sub>—</p>
        </div>
      </div>
      <div class="player__controls">
        <button type="button" class="player__btn" data-player-prev aria-label="Previous track">${icon('prev')}</button>
        <button type="button" class="player__btn player__btn--main" data-player-toggle aria-label="Play">${icon('play')}</button>
        <button type="button" class="player__btn" data-player-next aria-label="Next track">${icon('next')}</button>
      </div>
      <div class="player__scrub">
        <span class="mono small" data-player-elapsed>0:00</span>
        <input type="range" min="0" max="100" value="0" step="0.1" aria-label="Seek" data-player-seek disabled />
        <span class="mono small" data-player-total>0:30</span>
      </div>
      <div class="player__side">
        <span class="player__badge mono small" data-player-badge>30s preview</span>
        <button type="button" class="player__btn player__btn--ghost" data-player-close aria-label="Close player">${icon(
          'close'
        )}</button>
      </div>
      <audio data-player-audio preload="none"></audio>
    </div>
    <p class="player__fallback mono small" data-player-fallback hidden></p>
    <script type="application/json" id="preview-queue">${escapeJsonLd(queue)}</script>
  </section>`;
}

function documentShell(content, page, bodyHtml) {
  return `<!doctype html>
<html lang="en" class="${page.htmlClass || ''}">
<head>${head(content, page)}</head>
<body class="page-${page.slug || 'home'}">
  <a class="skip" href="#main">Skip to content</a>
  <div class="grain" aria-hidden="true"></div>
  <div class="cursor" aria-hidden="true"><span></span></div>
  <div class="scroll-progress" aria-hidden="true"><i></i></div>
  ${navBar(content, page)}
  <main id="main">${bodyHtml}</main>
  ${footer(content)}
  ${playerDock(content)}
  <div class="lightbox" id="lightbox" hidden>
    <div class="lightbox__scrim" data-lightbox-close></div>
    <div class="lightbox__body" role="dialog" aria-modal="true" aria-label="Media viewer">
      <button class="lightbox__close" type="button" data-lightbox-close aria-label="Close">${icon('close')}</button>
      <div class="lightbox__content" data-lightbox-content></div>
    </div>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
  <script src="/js/main.js" defer></script>
</body>
</html>`;
}

module.exports = {
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
  artistJsonLd,
  documentShell,
  PLATFORM_ICON,
};
