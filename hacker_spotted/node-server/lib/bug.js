'use strict';

// The bug is described in a 100 x 100 space, then sampled onto a character grid.

const BLOBS = [
  { cx: 50, cy: 25, rx: 10, ry: 8 }, // head
  { cx: 50, cy: 39, rx: 21, ry: 6 }, // shoulders
  { cx: 50, cy: 61, rx: 21, ry: 24 }, // body
];

// Left-side poly-lines; the right side is mirrored.
const LIMBS = [
  [[45, 19], [41, 12], [36, 11]], // antenna
  [[32, 38], [20, 38], [15, 32]], // front leg
  [[31, 55], [20, 54], [11, 55]], // middle leg
  [[33, 70], [25, 77], [22, 86], [21, 91]], // back leg
];

const LIMB_WIDTH = 2.4;

function inEllipse(x, y, e) {
  const dx = (x - e.cx) / e.rx;
  const dy = (y - e.cy) / e.ry;
  return dx * dx + dy * dy <= 1;
}

function distToSegment(px, py, [ax, ay], [bx, by]) {
  const vx = bx - ax;
  const vy = by - ay;
  let t = ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

function onLimb(x, y) {
  for (const mirror of [false, true]) {
    for (const limb of LIMBS) {
      for (let i = 0; i + 1 < limb.length; i++) {
        let a = limb[i];
        let b = limb[i + 1];
        if (mirror) {
          a = [100 - a[0], a[1]];
          b = [100 - b[0], b[1]];
        }
        if (distToSegment(x, y, a, b) <= LIMB_WIDTH) return true;
      }
    }
  }
  return false;
}

/** Whether a point in the 100x100 space is part of the bug. */
function inside(x, y) {
  // thin split down the back, like beetle wings
  if (y > 44 && y < 82 && Math.abs(x - 50) < 0.7) return false;
  if (BLOBS.some((e) => inEllipse(x, y, e))) return true;
  return onLimb(x, y);
}

/** Small seeded PRNG (mulberry32) so tests can get repeatable output. */
function makeRandom(seed) {
  let s = seed >>> 0;
  return function random() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LIMITS = { minCols: 30, maxCols: 160 };

/**
 * Build the art grid.
 * Each cell is [char, level] where level is 0 (empty), 1-3 (bug, dim to bright) or 4 (faint noise).
 * Rows are derived from cols so the bug stays roughly square on screen.
 */
function buildArt({ cols = 100, seed = Date.now(), noise = 0.05 } = {}) {
  cols = Math.round(Number(cols));
  if (!Number.isFinite(cols)) throw new RangeError('cols must be a number');
  cols = Math.max(LIMITS.minCols, Math.min(LIMITS.maxCols, cols));
  const rows = Math.round(cols * 0.55);
  const random = makeRandom(seed);

  const grid = [];
  for (let r = 0; r < rows; r++) {
    const line = [];
    for (let c = 0; c < cols; c++) {
      const x = ((c + 0.5) * 100) / cols;
      const y = ((r + 0.5) * 100) / rows;
      const digit = String(Math.floor(random() * 10));
      if (inside(x, y)) {
        const n = random();
        if (n < 0.08) line.push([' ', 0]);
        else if (n < 0.4) line.push([digit, 1]);
        else if (n < 0.8) line.push([digit, 2]);
        else line.push([digit, 3]);
      } else if (random() < noise) {
        line.push([digit, 4]);
      } else {
        line.push([' ', 0]);
      }
    }
    grid.push(line);
  }
  return { cols, rows, grid };
}

/** Plain-text version of the art (handy for terminals and tests). */
function toText(art) {
  return art.grid.map((line) => line.map(([ch]) => ch).join('')).join('\n');
}

module.exports = { inside, buildArt, toText, makeRandom, LIMITS };
