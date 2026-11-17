// The frame around the board: the top bar (score, clock, pairs, moves),
// the side panel with the action buttons (whose rectangles are published
// on state.ui.buttons for the click handler), the combo meter and status
// message, and the full-screen panels for title, pause, win and defeat.
// Three decorated tiles dress the title panel — the red dragon, a flower
// and the one of bamboo, drawn by the same tile artist as the board.

import { COLORS, COMBO_WINDOW, PANEL_X, SANS, SERIF, TOPBAR_H, VIEW_H, VIEW_W } from './config.js';
import { drawTile, rr } from './tiles.js';
import { formatTime, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';

function text(ctx, str, x, y, { size = 20, color = COLORS.cream, align = 'left', font = SANS, weight = 400 } = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawTopBar(ctx, state, world) {
  ctx.fillStyle = 'rgba(3, 22, 10, 0.85)';
  ctx.fillRect(0, 0, VIEW_W, TOPBAR_H);
  ctx.fillStyle = COLORS.goldSoft;
  ctx.fillRect(0, TOPBAR_H - 2, VIEW_W, 2);
  text(ctx, 'MAHJONG GARDEN', 22, TOPBAR_H / 2, { size: 21, color: COLORS.gold, font: SERIF, weight: 700 });
  const y = TOPBAR_H / 2;
  const stats = [
    ['SCORE', String(state.score)],
    ['TIME', formatTime(state.elapsed)],
    ['PAIRS LEFT', String(world.remaining() / 2)],
    ['MOVES', String(world.availableMoves())],
    ['BEST', String(Math.max(state.best, state.score))],
  ];
  let x = 300;
  for (const [label, value] of stats) {
    text(ctx, label, x, y - 11, { size: 11, color: 'rgba(255,246,221,0.55)' });
    text(ctx, value, x, y + 12, { size: 19, weight: 700 });
    x += label === 'PAIRS LEFT' ? 128 : 108;
  }
  if (state.paused) text(ctx, 'PAUSED', PANEL_X - 18, y, { size: 15, color: COLORS.gold, align: 'right', weight: 700 });
}

const BUTTON_DEFS = [
  { id: 'hint', label: (s) => `Hint  (${s.hintsLeft})` },
  { id: 'undo', label: () => 'Undo' },
  { id: 'shuffle', label: (s) => `Shuffle  (${s.shufflesLeft})` },
  { id: 'pause', label: (s) => (s.paused ? 'Resume' : 'Pause') },
  { id: 'newdeal', label: () => 'New Deal' },
];

function buttonEnabled(state, id) {
  if (state.screen !== SCREEN_PLAY) return id === 'newdeal';
  if (id === 'hint') return state.hintsLeft > 0;
  if (id === 'undo') return state.undoStack.length > 0;
  if (id === 'shuffle') return state.shufflesLeft > 0;
  return true;
}

function drawPanel(ctx, state, world, time) {
  const x = PANEL_X + 14;
  const w = VIEW_W - PANEL_X - 28;
  text(ctx, 'ACTIONS', x, TOPBAR_H + 26, { size: 12, color: 'rgba(255,246,221,0.55)' });
  const buttons = [];
  let y = TOPBAR_H + 44;
  for (const def of BUTTON_DEFS) {
    const enabled = buttonEnabled(state, def.id);
    const hover = state.hoverButton === def.id && enabled;
    rr(ctx, x, y, w, 44, 9);
    ctx.fillStyle = enabled ? (hover ? 'rgba(232,195,90,0.28)' : 'rgba(255,246,221,0.10)') : 'rgba(255,246,221,0.04)';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = enabled ? COLORS.panelLine : 'rgba(232,195,90,0.12)';
    ctx.stroke();
    text(ctx, def.label(state), x + w / 2, y + 23, {
      size: 17, align: 'center', weight: 600,
      color: enabled ? COLORS.cream : 'rgba(255,246,221,0.35)',
    });
    buttons.push({ id: def.id, x, y, w, h: 44, enabled });
    y += 56;
  }
  state.ui.buttons = buttons;

  // The combo meter: how long the chain window stays open.
  y += 8;
  text(ctx, 'COMBO', x, y, { size: 12, color: 'rgba(255,246,221,0.55)' });
  if (state.combo >= 2 && state.screen === SCREEN_PLAY) {
    const frac = Math.max(0, 1 - (state.elapsed - state.lastMatchAt) / COMBO_WINDOW);
    text(ctx, `x${state.combo}`, x + w, y, { size: 20, color: COLORS.gold, align: 'right', weight: 700 });
    rr(ctx, x, y + 12, w, 7, 3.5);
    ctx.fillStyle = 'rgba(255,246,221,0.12)';
    ctx.fill();
    rr(ctx, x, y + 12, Math.max(0, w * frac), 7, 3.5);
    ctx.fillStyle = COLORS.gold;
    ctx.fill();
  } else {
    text(ctx, 'match fast to build it', x + w, y, { size: 12, color: 'rgba(255,246,221,0.4)', align: 'right' });
  }

  // The status message, word-wrapped into the panel.
  if (state.message) {
    ctx.font = `15px ${SANS}`;
    const words = state.message.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > w - 4 && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    lines.forEach((ln, i) => text(ctx, ln, x, y + 52 + i * 20, { size: 15, color: COLORS.gold }));
  }

  // Help, along the panel's foot.
  const help = [
    'Click two matching free tiles.',
    'A tile is free with a long side',
    'open and nothing on top of it.',
    '',
    'H hint · U undo · S shuffle',
    'P pause · M mute · N new deal',
  ];
  help.forEach((ln, i) => text(ctx, ln, x, VIEW_H - 118 + i * 19, { size: 13.5, color: 'rgba(255,246,221,0.5)' }));
  void time;
  void world;
}

function drawPanelBox(ctx, w, h) {
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  rr(ctx, x, y, w, h, 16);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = COLORS.panelLine;
  ctx.stroke();
  return { x, y };
}

function dimStage(ctx) {
  ctx.fillStyle = 'rgba(3, 22, 10, 0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTitle(ctx, state, time) {
  dimStage(ctx);
  const { x, y } = drawPanelBox(ctx, 640, 470);
  const cx = VIEW_W / 2;
  text(ctx, 'MAHJONG', cx, y + 66, { size: 62, color: COLORS.gold, align: 'center', font: SERIF, weight: 700 });
  text(ctx, 'G A R D E N', cx, y + 116, { size: 27, color: COLORS.cream, align: 'center', font: SERIF, weight: 700 });
  text(ctx, 'Mahjong solitaire on a deep-green table', cx, y + 152, { size: 16.5, color: 'rgba(255,246,221,0.75)', align: 'center' });
  // Three dressed tiles: red dragon, a flower, the one of bamboo.
  const faces = [{ kind: 'dragon', d: 'red' }, { kind: 'flower', n: 1 }, { kind: 'bam', n: 1 }];
  faces.forEach((face, i) => {
    drawTile(ctx, { face }, cx - 96 + i * 72, y + 178, {});
  });
  const lines = [
    'Clear the garden by matching pairs of free tiles.',
    'A tile is free when nothing sits on it and a long side is open.',
    'Every deal can be cleared — hints follow the winning line.',
  ];
  lines.forEach((ln, i) => text(ctx, ln, cx, y + 296 + i * 24, { size: 15.5, color: 'rgba(255,246,221,0.85)', align: 'center' }));
  const pulse = 0.65 + 0.35 * Math.sin(time * 3);
  ctx.globalAlpha = pulse;
  text(ctx, 'Click or press Space to play', cx, y + 408, { size: 20, color: COLORS.gold, align: 'center', weight: 700 });
  ctx.globalAlpha = 1;
  void x;
  void state;
}

function drawEndPanel(ctx, state, won) {
  dimStage(ctx);
  const { y } = drawPanelBox(ctx, 560, 400);
  const cx = VIEW_W / 2;
  const s = state.endStats || { score: state.score, bonus: 0, time: state.elapsed, pairs: state.movesMade, hintsLeft: state.hintsLeft, shufflesLeft: state.shufflesLeft };
  text(ctx, won ? 'Garden Cleared!' : 'No Moves Left', cx, y + 62, {
    size: 42, color: won ? COLORS.gold : '#e2604f', align: 'center', font: SERIF, weight: 700,
  });
  const rows = [
    ['Pairs matched', String(s.pairs)],
    ['Time', formatTime(s.time)],
    ...(won && s.bonus > 0 ? [['Unused hint & shuffle bonus', `+${s.bonus}`]] : []),
    ['Final score', String(s.score)],
    ['Best', String(Math.max(state.best, s.score))],
  ];
  rows.forEach(([label, value], i) => {
    const ry = y + 128 + i * 36;
    text(ctx, label, cx - 170, ry, { size: 17, color: 'rgba(255,246,221,0.8)' });
    text(ctx, value, cx + 170, ry, { size: 19, color: COLORS.cream, align: 'right', weight: 700 });
  });
  text(ctx, won ? 'Click or press Space for a new deal' : 'Click or press Space to try a new deal', cx, y + 348, {
    size: 17.5, color: COLORS.gold, align: 'center', weight: 700,
  });
}

function drawPaused(ctx) {
  dimStage(ctx);
  const { y } = drawPanelBox(ctx, 420, 190);
  text(ctx, 'Paused', VIEW_W / 2, y + 72, { size: 38, color: COLORS.gold, align: 'center', font: SERIF, weight: 700 });
  text(ctx, 'Press P or click Resume to play on', VIEW_W / 2, y + 122, { size: 16, color: COLORS.cream, align: 'center' });
}

/** The whole frame: top bar and side panel always, overlays per screen. */
export function drawHud(ctx, state, world, time) {
  drawTopBar(ctx, state, world);
  drawPanel(ctx, state, world, time);
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state, time);
  else if (state.screen === SCREEN_WIN) drawEndPanel(ctx, state, true);
  else if (state.screen === SCREEN_OVER) drawEndPanel(ctx, state, false);
  else if (state.paused) drawPaused(ctx);
}
