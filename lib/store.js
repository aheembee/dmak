'use strict';
/**
 * Content store. Everything the site renders comes from content/site.json so the
 * artist or manager can edit it in /admin without touching code.
 */
const path = require('path');
const { readJson, writeJson, ROOT, DATA_DIR } = require('./util');

const CONTENT_FILE = path.join(ROOT, 'content', 'site.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

let cache = null;
let cacheStamp = 0;

function getContent() {
  const fs = require('fs');
  let stamp = 0;
  try {
    stamp = fs.statSync(CONTENT_FILE).mtimeMs;
  } catch (err) {
    stamp = 0;
  }
  if (cache && stamp === cacheStamp) return cache;
  cache = readJson(CONTENT_FILE, null);
  if (!cache) throw new Error('content/site.json is missing or invalid JSON');
  cacheStamp = stamp;
  return cache;
}

function saveContent(next) {
  writeJson(CONTENT_FILE, next);
  cache = next;
  cacheStamp = require('fs').statSync(CONTENT_FILE).mtimeMs;
  return next;
}

/** Derived, sorted views used across pages. */
function derive(content = getContent()) {
  const releases = [...content.releases].sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
  const featured = [...content.releases]
    .filter((r) => r.featured)
    .sort((a, b) => (a.featuredRank || 99) - (b.featuredRank || 99));
  const news = [...content.news].sort((a, b) => (a.date < b.date ? 1 : -1));
  const videos = [...content.videos].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  const latest = releases[0] || null;
  const currentlyPlaying = featured.length ? featured : releases.slice(0, 5);
  const activeSocials = content.socials.filter((s) => s.url);
  const pendingSocials = content.socials.filter((s) => !s.url);
  const yearCount = new Set(releases.map((r) => r.year)).size;
  return {
    releases,
    featured,
    news,
    videos,
    latest,
    currentlyPlaying,
    activeSocials,
    pendingSocials,
    stats: {
      releases: releases.length,
      years: yearCount,
      firstYear: releases.length ? releases[releases.length - 1].year : '',
      latestYear: releases.length ? releases[0].year : '',
    },
  };
}

/** Flattened preview queue for the interactive player. */
function previewQueue(content = getContent()) {
  const queue = [];
  for (const release of [...content.releases].sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1))) {
    for (const track of release.tracks || []) {
      if (!track.deezerId) continue;
      queue.push({
        trackId: String(track.deezerId),
        title: track.title,
        release: release.title,
        releaseId: release.id,
        duration: track.duration,
        artwork: release.artwork || '',
        links: release.links || {},
      });
    }
  }
  return queue;
}

module.exports = {
  CONTENT_FILE,
  MESSAGES_FILE,
  SUBSCRIBERS_FILE,
  ANALYTICS_FILE,
  getContent,
  saveContent,
  derive,
  previewQueue,
};
