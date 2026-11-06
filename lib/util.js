'use strict';
/**
 * Small shared utilities. No dependencies — the whole site runs on Node's stdlib.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

/**
 * Writable data directory. Serverless platforms (Netlify Functions) expose only
 * /tmp, so DATA_DIR lets the same code run there without pretending writes are
 * permanent — see README → "Deploying to Netlify".
 */
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT, 'data');

/** True when running inside a serverless function rather than a Node process. */
const IS_SERVERLESS = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (err) {
  /* read-only filesystem — writes will surface as errors at request time */
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape for use inside a <script type="application/ld+json"> block. */
function escapeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/&/g, '\\u0026');
}

function fmtDuration(totalSeconds) {
  const s = Number(totalSeconds) || 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function dateLabel(iso, opts) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', opts || { day: '2-digit', month: 'short', year: 'numeric' });
}

function relTime(iso) {
  if (!iso) return '';
  const then = new Date(`${iso}T12:00:00Z`).getTime();
  const diffDays = Math.round((Date.now() - then) / 86400000);
  if (diffDays < 0) return 'scheduled';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} months ago`;
  return `${Math.round(diffDays / 365)} years ago`;
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

/** Atomic-ish write so a crash mid-write cannot leave a truncated JSON file. */
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

function appendJsonArray(file, entry, cap = 5000) {
  const list = readJson(file, []);
  list.push(entry);
  if (list.length > cap) list.splice(0, list.length - cap);
  writeJson(file, list);
  return entry;
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function requestId() {
  return crypto.randomBytes(6).toString('hex');
}

/** Very small in-memory rate limiter keyed by a caller-supplied string. */
function createRateLimiter({ windowMs = 60000, max = 8 } = {}) {
  const hits = new Map();
  return function check(key) {
    const now = Date.now();
    const bucket = hits.get(key) || [];
    const fresh = bucket.filter((t) => now - t < windowMs);
    fresh.push(now);
    hits.set(key, fresh);
    if (hits.size > 5000) hits.clear();
    return fresh.length <= max;
  };
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || '').trim());

module.exports = {
  ROOT,
  DATA_DIR,
  IS_SERVERLESS,
  escapeHtml,
  escapeJsonLd,
  fmtDuration,
  dateLabel,
  relTime,
  slugify,
  readJson,
  writeJson,
  appendJsonArray,
  timingSafeEqual,
  requestId,
  createRateLimiter,
  isEmail,
};
