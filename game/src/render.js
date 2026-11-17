// Drawing the table and the board: a deep-green felt with a faint lattice
// and garden corners, a soft pool of light under the tiles, then every
// tile in draw order (low layers and back rows first), with blocked tiles
// dimmed, the selection lifted and ringed in gold, hint pairs pulsing, and
// the sparks and floating scores of the last match above it all.

import { COLORS, PANEL_X, TILE_H, TILE_W, TOPBAR_H, VIEW_H, VIEW_W } from './config.js';
import { drawOrder, isFree, tilePx, tilePy } from './layout.js';
import { drawTile } from './tiles.js';
import { SCREEN_PLAY } from './world.js';

function drawBackground(ctx) {
  const grad = ctx.createRadialGradient(
    VIEW_W * 0.42, VIEW_H * 0.46, 120,
    VIEW_W * 0.42, VIEW_H * 0.46, 780,
  );
  grad.addColorStop(0, COLORS.feltCore);
  grad.addColorStop(0.55, COLORS.feltMid);
  grad.addColorStop(1, COLORS.feltEdge);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // The faint lattice woven into the felt.
  ctx.strokeStyle = COLORS.feltLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -VIEW_H; x < VIEW_W; x += 46) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x + VIEW_H, VIEW_H);
    ctx.moveTo(x + VIEW_H, 0);
    ctx.lineTo(x, VIEW_H);
  }
  ctx.stroke();
  // A pool of light under the board.
  const pool = ctx.createRadialGradient(520, 400, 60, 520, 400, 470);
  pool.addColorStop(0, 'rgba(255, 240, 190, 0.10)');
  pool.addColorStop(1, 'rgba(255, 240, 190, 0)');
  ctx.fillStyle = pool;
  ctx.fillRect(0, TOPBAR_H, PANEL_X, VIEW_H - TOPBAR_H);
  drawGardenCorners(ctx);
}

// Quiet garden motifs in the corners: bamboo stalks bottom-left, a
// blossom branch top-right, both kept faint so the board stays the subject.
function drawGardenCorners(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#7fc46a';
  ctx.fillStyle = '#7fc46a';
  for (const [bx, bh] of [[26, 210], [52, 300], [80, 160]]) {
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(bx, VIEW_H);
    ctx.lineTo(bx, VIEW_H - bh);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let y = VIEW_H - 40; y > VIEW_H - bh; y -= 52) {
      ctx.beginPath();
      ctx.moveTo(bx - 6, y);
      ctx.lineTo(bx + 6, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(bx + 16, VIEW_H - bh + 26, 15, 6, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#a87c4f';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(1150, 0);
  ctx.quadraticCurveTo(1170, 70, 1240, 110);
  ctx.stroke();
  ctx.fillStyle = '#e79ec0';
  for (const [fx, fy, fr] of [[1172, 52, 13], [1204, 82, 16], [1232, 104, 11], [1158, 22, 9]]) {
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawWorld(ctx, state, time) {
  drawBackground(ctx);
  const inPlay = state.screen === SCREEN_PLAY;
  const hintIds = state.hintPair ? new Set(state.hintPair) : null;
  const hintPulse = 0.5 + 0.5 * Math.sin(time * 6);
  for (const tile of drawOrder(state.tiles)) {
    const free = inPlay && isFree(state.tiles, tile);
    const selected = tile.id === state.selectedId;
    drawTile(ctx, tile, tilePx(tile), tilePy(tile), {
      dim: inPlay && !state.paused && !free,
      selected,
      hover: inPlay && !state.paused && tile.id === state.hoverId && free && !selected,
      hint: hintIds && hintIds.has(tile.id) ? hintPulse : 0,
      lift: selected ? 4 : 0,
    });
  }
  // Sparks from the last match.
  for (const s of state.sparks) {
    ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Floating score texts.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.min(1, f.life / 0.6);
    ctx.font = `700 ${f.size}px system-ui, sans-serif`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(4, 26, 13, 0.8)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  void TILE_W;
  void TILE_H;
}
