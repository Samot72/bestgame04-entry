// The tiles themselves: the 144 faces of the set (three suits, winds,
// dragons, flowers and seasons) and every stroke of their art. All faces
// are drawn with canvas vector shapes — no images, no webfonts, no CJK
// glyphs — so a tile reads clearly at any size: blue ringed dots, green
// bamboo, black-and-red character medallions, navy wind compasses, the
// three dragons, and the eight bonus tiles.

import { COLORS, SERIF, TILE_H, TILE_LIP, TILE_W } from './config.js';

/** The key two faces match on: identical faces, except flowers match any
 *  flower and seasons match any season. */
export function matchKey(face) {
  if (face.kind === 'flower') return 'flower';
  if (face.kind === 'season') return 'season';
  if (face.kind === 'wind') return `wind-${face.d}`;
  if (face.kind === 'dragon') return `dragon-${face.d}`;
  return `${face.kind}-${face.n}`;
}

/** A short spoken name for a face, for the status line. */
export function faceName(face) {
  if (face.kind === 'dots') return `${face.n} of dots`;
  if (face.kind === 'bam') return `${face.n} of bamboo`;
  if (face.kind === 'char') return `character ${face.n}`;
  if (face.kind === 'wind') return `${face.d} wind`;
  if (face.kind === 'dragon') return `${face.d} dragon`;
  if (face.kind === 'flower') return `flower ${face.n}`;
  return `season ${face.n}`;
}

/** The full set as 72 matching pairs: [[face, face], ...] (144 tiles). */
export function buildFacePairs() {
  const pairs = [];
  for (const kind of ['dots', 'bam', 'char']) {
    for (let n = 1; n <= 9; n += 1) {
      pairs.push([{ kind, n }, { kind, n }]);
      pairs.push([{ kind, n }, { kind, n }]);
    }
  }
  for (const d of ['E', 'S', 'W', 'N']) {
    pairs.push([{ kind: 'wind', d }, { kind: 'wind', d }]);
    pairs.push([{ kind: 'wind', d }, { kind: 'wind', d }]);
  }
  for (const d of ['red', 'green', 'white']) {
    pairs.push([{ kind: 'dragon', d }, { kind: 'dragon', d }]);
    pairs.push([{ kind: 'dragon', d }, { kind: 'dragon', d }]);
  }
  // The bonus tiles pair across their own four designs.
  pairs.push([{ kind: 'flower', n: 1 }, { kind: 'flower', n: 2 }]);
  pairs.push([{ kind: 'flower', n: 3 }, { kind: 'flower', n: 4 }]);
  pairs.push([{ kind: 'season', n: 1 }, { kind: 'season', n: 2 }]);
  pairs.push([{ kind: 'season', n: 3 }, { kind: 'season', n: 4 }]);
  return pairs;
}

/** A rounded-rectangle path (roundRect with a fallback for older engines). */
export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// ---------------------------------------------------------------- faces

// Pip layouts on a 3x3 grid, shared by the dots and the bamboo.
const PIPS = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
  7: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0], [2, 1], [2, 2]],
  8: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
  9: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
};
const PIP_COLORS = [COLORS.blue, COLORS.green, COLORS.red];

function drawDot(ctx, cx, cy, r, color) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fdfaf0';
  ctx.fill();
  ctx.lineWidth = Math.max(1.6, r * 0.42);
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawDots(ctx, face, x, y, w, h) {
  if (face.n === 1) {
    // One grand ring: three concentric bands and a star of spokes.
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) * 0.34;
    drawDot(ctx, cx, cy, r, COLORS.red);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = COLORS.green;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.blue;
    ctx.fill();
    return;
  }
  const cellW = w / 3;
  const cellH = h / 3;
  const r = Math.min(cellW, cellH) * 0.33;
  PIPS[face.n].forEach(([c, row], i) => {
    drawDot(ctx, x + cellW * (c + 0.5), y + cellH * (row + 0.5), r, PIP_COLORS[(i + face.n) % 3]);
  });
}

function drawStick(ctx, cx, cy, w, h, color) {
  // One bamboo stick: two plump segments and the node between them.
  const hw = w / 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.26, hw, h * 0.24, 0, 0, Math.PI * 2);
  ctx.ellipse(cx, cy + h * 0.26, hw, h * 0.24, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(20, 60, 25, 0.55)';
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.26, hw * 0.45, h * 0.1, 0, 0, Math.PI * 2);
  ctx.ellipse(cx, cy + h * 0.26, hw * 0.45, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();
}

function drawBamboo(ctx, face, x, y, w, h) {
  if (face.n === 1) {
    // One grand shoot with two leaves.
    const cx = x + w / 2;
    drawStick(ctx, cx, y + h / 2, w * 0.4, h * 0.86, COLORS.green);
    ctx.fillStyle = '#57a047';
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.24, y + h * 0.2, w * 0.16, h * 0.07, -0.7, 0, Math.PI * 2);
    ctx.ellipse(cx + w * 0.24, y + h * 0.3, w * 0.16, h * 0.07, 0.7, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const cellW = w / 3;
  const cellH = h / 3;
  PIPS[face.n].forEach(([c, row], i) => {
    const center = face.n % 2 === 1 && c === 1 && row === 1;
    const color = center || (face.n === 8 && row === 1) ? COLORS.red : COLORS.green;
    drawStick(ctx, x + cellW * (c + 0.5), y + cellH * (row + 0.5), cellW * 0.52, cellH * 0.8, color);
    void i;
  });
}

function drawCharacter(ctx, face, x, y, w, h) {
  const cx = x + w / 2;
  ctx.fillStyle = COLORS.ink;
  ctx.font = `700 ${Math.round(h * 0.34)}px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(face.n), cx, y + h * 0.24);
  // The red WAN medallion below.
  const mw = w * 0.78;
  const mh = h * 0.36;
  const mx = cx - mw / 2;
  const my = y + h * 0.56;
  rr(ctx, mx, my, mw, mh, 4);
  ctx.fillStyle = COLORS.red;
  ctx.fill();
  ctx.fillStyle = '#fff6dd';
  ctx.font = `700 ${Math.round(mh * 0.52)}px ${SERIF}`;
  ctx.fillText('WAN', cx, my + mh * 0.54);
}

function drawWind(ctx, face, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) * 0.36;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#e9eef7';
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = COLORS.navy;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.stroke();
  // Compass ticks.
  ctx.strokeStyle = COLORS.navy;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i += 1) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
    ctx.lineTo(cx + Math.cos(a) * r * 0.97, cy + Math.sin(a) * r * 0.97);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.navy;
  ctx.font = `700 ${Math.round(r * 1.05)}px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(face.d, cx, cy + r * 0.05);
}

function drawDragon(ctx, face, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (face.d === 'white') {
    // The blank dragon: a double blue frame on the empty face.
    rr(ctx, x + w * 0.14, y + h * 0.14, w * 0.72, h * 0.72, 5);
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = COLORS.blue;
    ctx.stroke();
    rr(ctx, x + w * 0.26, y + h * 0.26, w * 0.48, h * 0.48, 4);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    return;
  }
  if (face.d === 'red') {
    const r = Math.min(w, h) * 0.3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#e2604f';
    ctx.fillRect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff6dd';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.red;
    ctx.fill();
    return;
  }
  // Green: a four-pointed star burst.
  const r = Math.min(w, h) * 0.38;
  ctx.fillStyle = COLORS.green;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.38;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#fff6dd';
  ctx.fill();
}

const FLOWER_COLORS = ['#d4698f', '#e08a3c', '#8a63b8', '#c03428'];

function drawFlower(ctx, face, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h * 0.44;
  const color = FLOWER_COLORS[face.n - 1];
  const pr = Math.min(w, h) * 0.17;
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i += 1) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * pr * 1.05, cy + Math.sin(a) * pr * 1.05, pr * 0.82, pr * 0.6, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, pr * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.gold;
  ctx.fill();
  // Stem and leaf.
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + pr);
  ctx.quadraticCurveTo(cx + 2, y + h * 0.78, cx - 2, y + h * 0.92);
  ctx.stroke();
  ctx.fillStyle = '#57a047';
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.13, y + h * 0.8, w * 0.11, h * 0.045, 0.6, 0, Math.PI * 2);
  ctx.fill();
  // The design's number, as small gold dots along the bottom.
  ctx.fillStyle = COLORS.goldSoft;
  for (let i = 0; i < face.n; i += 1) {
    ctx.beginPath();
    ctx.arc(x + w * 0.5 + (i - (face.n - 1) / 2) * 7, y + h * 0.95, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSeason(ctx, face, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (face.n === 1) {
    // Spring: blossoms on a bare branch.
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.82);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.5, x + w * 0.8, y + h * 0.18);
    ctx.stroke();
    ctx.fillStyle = '#e79ec0';
    for (const [bx, by, br] of [[0.38, 0.6, 0.13], [0.58, 0.42, 0.16], [0.76, 0.24, 0.12]]) {
      ctx.beginPath();
      ctx.arc(x + w * bx, y + h * by, Math.min(w, h) * br, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  if (face.n === 2) {
    // Summer: a gold sun.
    const r = Math.min(w, h) * 0.24;
    ctx.strokeStyle = '#e0a41a';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2);
      ctx.lineTo(cx + Math.cos(a) * r * 1.65, cy + Math.sin(a) * r * 1.65);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffc93c';
    ctx.fill();
    ctx.strokeStyle = '#e0a41a';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    return;
  }
  if (face.n === 3) {
    // Autumn: a maple-ish leaf.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#d2691e';
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const rad = (i % 2 === 0 ? 0.34 : 0.18) * Math.min(w, h);
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a4b12';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, Math.min(w, h) * 0.1);
    ctx.lineTo(0, Math.min(w, h) * 0.42);
    ctx.stroke();
    ctx.restore();
    return;
  }
  // Winter: a snowflake.
  ctx.strokeStyle = '#5b8fc9';
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 6; i += 1) {
    const a = (i * Math.PI) / 3;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const r = Math.min(w, h) * 0.32;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * r, cy + dy * r);
    ctx.moveTo(cx + dx * r * 0.55, cy + dy * r * 0.55);
    ctx.lineTo(cx + dx * r * 0.55 + Math.cos(a + 0.6) * r * 0.3, cy + dy * r * 0.55 + Math.sin(a + 0.6) * r * 0.3);
    ctx.moveTo(cx + dx * r * 0.55, cy + dy * r * 0.55);
    ctx.lineTo(cx + dx * r * 0.55 + Math.cos(a - 0.6) * r * 0.3, cy + dy * r * 0.55 + Math.sin(a - 0.6) * r * 0.3);
    ctx.stroke();
  }
}

/** Draw one face's art inside the given box. */
export function drawFace(ctx, face, x, y, w, h) {
  if (face.kind === 'dots') drawDots(ctx, face, x, y, w, h);
  else if (face.kind === 'bam') drawBamboo(ctx, face, x, y, w, h);
  else if (face.kind === 'char') drawCharacter(ctx, face, x, y, w, h);
  else if (face.kind === 'wind') drawWind(ctx, face, x, y, w, h);
  else if (face.kind === 'dragon') drawDragon(ctx, face, x, y, w, h);
  else if (face.kind === 'flower') drawFlower(ctx, face, x, y, w, h);
  else drawSeason(ctx, face, x, y, w, h);
}

/**
 * Draw a whole tile at pixel position (px, py): shadow, the side lip that
 * gives it thickness, the ivory face and its art. Options: dim (a blocked
 * tile), selected, hover, hint (0..1 pulse strength), lift (px raised).
 */
export function drawTile(ctx, tile, px, py, opts = {}) {
  const { dim = false, selected = false, hover = false, hint = 0, lift = 0 } = opts;
  const x = px;
  const y = py - lift;
  // Shadow on the felt.
  rr(ctx, x + 4, y + 6, TILE_W, TILE_H, 8);
  ctx.fillStyle = COLORS.tileShadow;
  ctx.fill();
  // The side: a full tile shape peeking out below-right.
  rr(ctx, x + 2, y + TILE_LIP, TILE_W, TILE_H, 8);
  ctx.fillStyle = COLORS.tileSide;
  ctx.fill();
  // The face.
  const grad = ctx.createLinearGradient(x, y, x, y + TILE_H);
  grad.addColorStop(0, COLORS.tileFaceHi);
  grad.addColorStop(0.75, COLORS.tileFace);
  grad.addColorStop(1, COLORS.tileEdge);
  rr(ctx, x, y, TILE_W, TILE_H, 8);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(122, 100, 58, 0.6)';
  ctx.stroke();
  drawFace(ctx, tile.face, x + 6, y + 6, TILE_W - 12, TILE_H - 12);
  if (dim) {
    rr(ctx, x, y, TILE_W, TILE_H, 8);
    ctx.fillStyle = COLORS.blocked;
    ctx.fill();
  }
  if (hint > 0) {
    rr(ctx, x - 2, y - 2, TILE_W + 4, TILE_H + 4, 10);
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(232, 195, 90, ${0.35 + 0.6 * hint})`;
    ctx.stroke();
  }
  if (selected) {
    rr(ctx, x - 1.5, y - 1.5, TILE_W + 3, TILE_H + 3, 9);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(232, 195, 90, 0.35)';
    ctx.stroke();
    rr(ctx, x - 1.5, y - 1.5, TILE_W + 3, TILE_H + 3, 9);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = COLORS.gold;
    ctx.stroke();
  } else if (hover) {
    rr(ctx, x - 1, y - 1, TILE_W + 2, TILE_H + 2, 9);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(255, 246, 221, 0.75)';
    ctx.stroke();
  }
}
