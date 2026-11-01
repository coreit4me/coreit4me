'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { inside, buildArt, toText, LIMITS } = require('../lib');

test('shape: body, head and legs are inside; corners are outside', () => {
  assert.ok(inside(40, 60), 'body');
  assert.ok(inside(50, 25), 'head');
  assert.ok(inside(12, 55), 'left middle leg tip');
  assert.ok(inside(88, 55), 'right middle leg tip (mirrored)');
  assert.ok(!inside(2, 2), 'top-left corner');
  assert.ok(!inside(98, 98), 'bottom-right corner');
  assert.ok(!inside(50, 60), 'split down the back');
});

test('shape is left/right symmetric', () => {
  for (let y = 0; y <= 100; y += 2.5) {
    for (let x = 0; x <= 49; x += 2.5) {
      assert.equal(inside(x, y), inside(100 - x, y), `(${x}, ${y})`);
    }
  }
});

test('buildArt returns a grid of the requested size', () => {
  const art = buildArt({ cols: 80, seed: 1 });
  assert.equal(art.cols, 80);
  assert.equal(art.rows, 44);
  assert.equal(art.grid.length, art.rows);
  for (const line of art.grid) assert.equal(line.length, art.cols);
});

test('cells are only digits or spaces, with valid levels', () => {
  const art = buildArt({ cols: 60, seed: 7 });
  for (const line of art.grid) {
    for (const [ch, level] of line) {
      assert.match(ch, /^[0-9 ]$/);
      assert.ok([0, 1, 2, 3, 4].includes(level));
      if (level === 0) assert.equal(ch, ' ');
    }
  }
});

test('same seed gives the same art; different seeds differ', () => {
  const a = toText(buildArt({ cols: 50, seed: 42 }));
  const b = toText(buildArt({ cols: 50, seed: 42 }));
  const c = toText(buildArt({ cols: 50, seed: 43 }));
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('cols is clamped to safe limits', () => {
  assert.equal(buildArt({ cols: 1, seed: 1 }).cols, LIMITS.minCols);
  assert.equal(buildArt({ cols: 99999, seed: 1 }).cols, LIMITS.maxCols);
  assert.throws(() => buildArt({ cols: 'abc' }), RangeError);
});

test('the bug covers a sensible share of the grid', () => {
  const art = buildArt({ cols: 100, seed: 3, noise: 0 });
  const cells = art.grid.flat();
  const lit = cells.filter(([, level]) => level >= 1 && level <= 3).length;
  const share = lit / cells.length;
  assert.ok(share > 0.15 && share < 0.5, `share was ${share}`);
});
