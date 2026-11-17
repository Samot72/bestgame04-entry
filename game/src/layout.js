// The garden layout and the geometry of freedom. Slots live on a half-tile
// grid: a tile at (x, y, z) covers the 2x2 block from (x, y), one layer up
// is z+1. A tile is FREE when no tile overlaps it from a higher layer and
// at least one of its long sides (left or right) has room to slide out.
//
// Deals are guaranteed solvable: faces are assigned along a legal removal
// order — the generator plays the board away in pairs of free tiles, then
// deals one matching face-pair onto each recorded removal pair, so the
// recorded order is always a winning line through the deal.

import { HX, HY, LAYER_DX, LAYER_DY, PANEL_X, TILE_H, TILE_LIP, TILE_W, TOPBAR_H, VIEW_H } from './config.js';
import { buildFacePairs } from './tiles.js';

// The garden: four stacked beds and two wing towers (the half-offset
// singles at the far left and right). X is a tile, . is air.
const LAYERS = [
  {
    ox: 0, oy: 0,
    rows: [
      '.XXXXXXXXXX.',
      'XXXXXXXXXXXX',
      'XX.XXXXXX.XX',
      'XXXXXXXXXXXX',
      'XXXXXXXXXXXX',
      'XX.XXXXXX.XX',
      'XXXXXXXXXXXX',
      '.XXXXXXXXXX.',
    ],
  },
  {
    ox: 2, oy: 1,
    rows: [
      '.XXXXXX.',
      'XXXXXXXX',
      'XXXXXXXX',
      'XXXXXXXX',
      '.XXXXXX.',
    ],
  },
  {
    ox: 3, oy: 3,
    rows: [
      'XXXXXX',
      'XXXXXX',
    ],
  },
  {
    ox: 5, oy: 3,
    rows: [
      'XX',
      'XX',
    ],
  },
];

// Half-offset towers: two tiles each side, stacked, bridging rows 3 and 4.
const EXTRA_SLOTS = [
  { x: -2, y: 7, z: 0 }, { x: -2, y: 7, z: 1 },
  { x: 24, y: 7, z: 0 }, { x: 24, y: 7, z: 1 },
];

/** Every slot of the layout: [{x, y, z}] in half-tile units (144). */
export function buildSlots() {
  const slots = [];
  LAYERS.forEach((layer, z) => {
    layer.rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c += 1) {
        if (row[c] === 'X') slots.push({ x: (layer.ox + c) * 2, y: (layer.oy + r) * 2, z });
      }
    });
  });
  for (const s of EXTRA_SLOTS) slots.push({ ...s });
  return slots;
}

const SLOTS = buildSlots();
const MIN_X = Math.min(...SLOTS.map((s) => s.x));
const MAX_X = Math.max(...SLOTS.map((s) => s.x));
const MIN_Y = Math.min(...SLOTS.map((s) => s.y));
const MAX_Y = Math.max(...SLOTS.map((s) => s.y));
const MAX_Z = Math.max(...SLOTS.map((s) => s.z));

/** The pixel origin that centres the whole layout in the play area. */
export function boardOrigin() {
  const left = MIN_X * HX + LAYER_DX * MAX_Z;
  const right = (MAX_X + 2) * HX + TILE_LIP + 2;
  const top = MIN_Y * HY + LAYER_DY * MAX_Z;
  const bottom = (MAX_Y + 2) * HY + TILE_LIP + 8;
  return {
    x: Math.round((PANEL_X - (right - left)) / 2 - left),
    y: Math.round(TOPBAR_H + (VIEW_H - TOPBAR_H - (bottom - top)) / 2 - top),
  };
}

const ORIGIN = boardOrigin();

/** Top-left pixel of a tile (before any selection lift). */
export function tilePx(tile) {
  return ORIGIN.x + tile.x * HX + tile.z * LAYER_DX;
}
export function tilePy(tile) {
  return ORIGIN.y + tile.y * HY + tile.z * LAYER_DY;
}
export function tileCenter(tile) {
  return { x: tilePx(tile) + TILE_W / 2, y: tilePy(tile) + TILE_H / 2 };
}

function overlaps2D(a, b) {
  return a.x < b.x + 2 && b.x < a.x + 2 && a.y < b.y + 2 && b.y < a.y + 2;
}

/** Is any present tile on a higher layer overlapping this one? */
export function isCovered(tiles, t) {
  for (const u of tiles) {
    if (u !== t && u.present && u.z > t.z && overlaps2D(u, t)) return true;
  }
  return false;
}

/** Is this tile's left (dir -1) or right (dir +1) side blocked by a
 *  same-layer neighbour too close to slide past? */
export function sideBlocked(tiles, t, dir) {
  for (const u of tiles) {
    if (u === t || !u.present || u.z !== t.z) continue;
    if (Math.abs(u.y - t.y) >= 2) continue;
    if (dir < 0 && u.x < t.x && t.x - (u.x + 2) < 2) return true;
    if (dir > 0 && u.x > t.x && u.x - (t.x + 2) < 2) return true;
  }
  return false;
}

/** The mahjong solitaire rule: uncovered, and a long side open. */
export function isFree(tiles, t) {
  return t.present && !isCovered(tiles, t)
    && (!sideBlocked(tiles, t, -1) || !sideBlocked(tiles, t, 1));
}

/** Draw order: low layers and back rows first, so fronts overlap backs. */
export function drawOrder(tiles) {
  return tiles
    .filter((t) => t.present)
    .sort((a, b) => (a.z - b.z) || (a.y - b.y) || (a.x - b.x));
}

/** The topmost present tile whose face contains the point, or null. */
export function pickTile(tiles, px, py) {
  const ordered = drawOrder(tiles);
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const t = ordered[i];
    const x = tilePx(t);
    const y = tilePy(t);
    if (px >= x && px < x + TILE_W && py >= y && py < y + TILE_H) return t;
  }
  return null;
}

function shuffledPairs(rng) {
  const pairs = buildFacePairs();
  for (let i = pairs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

/**
 * Assign faces to the present tiles of `tiles` so the position is solvable,
 * by playing it away virtually in pairs of free tiles and dealing one
 * matching face-pair onto each recorded removal pair. Returns the removal
 * order ([[idA, idB], ...]) — a winning line — or null if this attempt
 * deadlocked (the caller retries; the RNG stream keeps it deterministic).
 */
export function assignFaces(tiles, rng) {
  const present = tiles.filter((t) => t.present);
  const removal = [];
  const view = present.map((t) => ({ ...t, present: true }));
  let remaining = view.length;
  while (remaining > 0) {
    const free = view.filter((t) => t.present && isFree(view, t));
    if (free.length < 2) return null;
    const a = free[Math.floor(rng() * free.length)];
    let b = a;
    while (b === a) b = free[Math.floor(rng() * free.length)];
    a.present = false;
    b.present = false;
    removal.push([a.id, b.id]);
    remaining -= 2;
  }
  const facePairs = shuffledPairs(rng);
  const real = new Map(tiles.map((t) => [t.id, t]));
  removal.forEach(([ia, ib], k) => {
    real.get(ia).face = facePairs[k][0];
    real.get(ib).face = facePairs[k][1];
  });
  return removal;
}

/**
 * A fresh deal on the full layout: 144 tiles with faces assigned along a
 * legal removal order. Deterministic in the RNG stream: attempts repeat
 * until one plays the whole board away.
 */
export function generateDeal(rng) {
  const slots = buildSlots();
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const tiles = slots.map((s, i) => ({ id: i, x: s.x, y: s.y, z: s.z, present: true, face: null }));
    const solution = assignFaces(tiles, rng);
    if (solution) return { tiles, solution };
  }
  throw new Error('Mahjong Garden: could not deal a solvable board');
}
