'use strict';
/**
 * Netlify Function entry point.
 *
 * The site is a server-rendered Node app (lib/app.js). Netlify Functions receive
 * a Lambda-style event, so this adapter bridges the two:
 *
 *   Netlify event  →  fake IncomingMessage / ServerResponse  →  handleRequest()
 *                  →  { statusCode, headers, body }
 *
 * Static assets (/css, /js, /img, /fonts, /files) never reach this function —
 * netlify.toml publishes `public/` to the CDN and only page routes and /api/*
 * are rewritten here.
 */
const { Readable, Writable } = require('stream');
const { handleRequest } = require('../../lib/app');

const FUNCTION_PREFIX = '/.netlify/functions/server';

/** Resolve the originally requested path (rewrites can hide it). */
function resolvePath(event) {
  const headerPath = event.headers && (event.headers['x-nf-original-path'] || event.headers['x-original-url']);
  let pathname = event.path || '/';
  if (pathname.startsWith(FUNCTION_PREFIX)) {
    // Direct function invocation or a rewrite that replaced the path.
    const raw = event.rawUrl || (event.headers && event.headers.referer) || '/';
    try {
      pathname = new URL(raw).pathname;
    } catch (err) {
      pathname = '/';
    }
  }
  const qs = event.rawQuery || event.rawQueryString || '';
  const query = qs ? `?${qs.replace(/^\?/, '')}` : '';
  return `${pathname || '/'}${query}`;
}

function makeRequest(event) {
  const body = event.body
    ? event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'utf8')
    : Buffer.alloc(0);

  const req = new Readable({ read() {} });
  const headers = {};
  for (const [key, value] of Object.entries(event.headers || {})) headers[key.toLowerCase()] = value;

  req.method = event.httpMethod || 'GET';
  req.url = resolvePath(event);
  req.headers = headers;
  req.httpVersion = '1.1';
  req.socket = {
    remoteAddress:
      (headers['x-nf-client-connection-ip'] || headers['x-forwarded-for'] || '0.0.0.0').split(',')[0].trim(),
  };
  if (body.length && req.method !== 'GET' && req.method !== 'HEAD') req.push(body);
  req.push(null);
  return req;
}

function makeResponse() {
  const chunks = [];
  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      callback();
    },
  });

  res.statusCode = 200;
  res.headersSent = false;
  res.headers = {};

  res.writeHead = function writeHead(status, headers) {
    res.statusCode = status;
    if (headers) Object.assign(res.headers, headers);
    res.headersSent = true;
    return res;
  };
  res.setHeader = function setHeader(name, value) {
    res.headers[name] = value;
  };
  res.getHeader = function getHeader(name) {
    return res.headers[name];
  };
  res.removeHeader = function removeHeader(name) {
    delete res.headers[name];
  };
  res.getHeaders = function getHeaders() {
    return res.headers;
  };

  res.result = () =>
    Promise.resolve().then(() => {
      const bodyBuffer = Buffer.concat(chunks);
      const type = String(res.headers['Content-Type'] || res.headers['content-type'] || '');
      const isText = /text|json|javascript|xml|svg|manifest/.test(type);
      const headers = { ...res.headers };
      delete headers['Content-Length'];
      delete headers['Transfer-Encoding'];
      return {
        statusCode: res.statusCode,
        headers,
        body: isText ? bodyBuffer.toString('utf8') : bodyBuffer.toString('base64'),
        isBase64Encoded: !isText,
      };
    });

  return res;
}

exports.handler = async function handler(event) {
  // Serverless storage is ephemeral (only /tmp is writable), so point the data
  // directory there unless the deployment sets DATA_DIR explicitly.
  if (!process.env.DATA_DIR) process.env.DATA_DIR = '/tmp/dmak-data';

  const req = makeRequest(event);
  const res = makeResponse();

  const finished = new Promise((resolve) => {
    res.on('finish', resolve);
    res.on('error', resolve);
  });

  await handleRequest(req, res);
  await new Promise((resolve) => {
    if (res.writableFinished) return resolve();
    res.once('finish', resolve);
    res.once('close', resolve);
    // If the handler never explicitly ended the stream, end it now.
    setTimeout(() => {
      if (!res.writableEnded) res.end();
      resolve();
    }, 20);
  });
  await finished;

  const response = await res.result();
  return response;
};
