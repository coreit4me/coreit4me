'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { buildArt, toText } = require('./bug');

const PAGE = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'));
const BUG_JS = fs.readFileSync(path.join(__dirname, 'bug.js'));

function sendJSON(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

/**
 * Create the HTTP server (not yet listening).
 *
 * Routes:
 *   GET /                         the mobile-friendly page
 *   GET /bug.js                   the bug shape code, for the browser
 *   GET /api/art?cols=80&seed=1   art as JSON
 *   GET /api/art.txt?cols=80      art as plain text
 *   GET /health                   {"status":"ok"}
 */
function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }

    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(PAGE);
    }

    if (url.pathname === '/bug.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
      return res.end(BUG_JS);
    }

    if (url.pathname === '/health') {
      return sendJSON(res, 200, { status: 'ok' });
    }

    if (url.pathname === '/api/art' || url.pathname === '/api/art.txt') {
      const opts = {};
      for (const key of ['cols', 'seed']) {
        if (!url.searchParams.has(key)) continue;
        const value = Number(url.searchParams.get(key));
        if (!Number.isFinite(value)) {
          return sendJSON(res, 400, { error: `${key} must be a number` });
        }
        opts[key] = value;
      }
      const art = buildArt(opts);
      if (url.pathname.endsWith('.txt')) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(toText(art) + '\n');
      }
      return sendJSON(res, 200, art);
    }

    sendJSON(res, 404, { error: 'not found' });
  });
}

module.exports = { createServer };
