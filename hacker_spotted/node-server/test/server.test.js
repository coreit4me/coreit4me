'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../lib');

let server;
let base;

test.before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((resolve) => server.close(resolve)));

test('GET / serves a mobile-ready HTML page', async () => {
  const res = await fetch(base + '/');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const html = await res.text();
  assert.match(html, /name="viewport"/);
  assert.match(html, /background: #000/);
  assert.match(html, /#39ff14/);
});

test('GET /health', async () => {
  const res = await fetch(base + '/health');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('GET /api/art returns JSON art sized for a phone', async () => {
  const res = await fetch(base + '/api/art?cols=60&seed=5');
  assert.equal(res.status, 200);
  const art = await res.json();
  assert.equal(art.cols, 60);
  assert.equal(art.grid.length, art.rows);
});

test('GET /api/art with the same seed is repeatable', async () => {
  const a = await (await fetch(base + '/api/art?cols=40&seed=9')).json();
  const b = await (await fetch(base + '/api/art?cols=40&seed=9')).json();
  assert.deepEqual(a, b);
});

test('GET /api/art.txt returns plain text', async () => {
  const res = await fetch(base + '/api/art.txt?cols=40&seed=1');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/plain/);
  const lines = (await res.text()).trimEnd().split('\n');
  assert.equal(lines.length, 22);
});

test('bad input is rejected', async () => {
  const res = await fetch(base + '/api/art?cols=banana');
  assert.equal(res.status, 400);
});

test('unknown routes 404 and non-GET is 405', async () => {
  assert.equal((await fetch(base + '/nope')).status, 404);
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
});
