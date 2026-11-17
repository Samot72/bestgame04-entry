// Mahjong Garden's bootstrap: the canvas, the letterbox that fits the
// 1280x720 stage into any window, the fixed-step loop, and the screenshot
// short cut. With ?shot=<scene>&seed=<n> in the address it stages one
// deterministic scene, draws a single frame and raises window.__shotReady;
// without it, it plays. All rules live in world.js; this file only moves
// time, clicks and pixels.

import { MAX_FRAME, STEP, VIEW_H, VIEW_W } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawHud } from './hud.js';
import { isFree, tileCenter } from './layout.js';
import { drawWorld } from './render.js';
import { stageShot } from './shots.js';
import { createWorld } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const params = new URLSearchParams(window.location.search);

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let dpr = 1;

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  offsetX = (window.innerWidth - VIEW_W * scale) / 2;
  offsetY = (window.innerHeight - VIEW_H * scale) / 2;
}
window.addEventListener('resize', resize);
resize();

/** Client (pointer) coordinates into stage coordinates. */
function toStage(clientX, clientY) {
  return { x: (clientX - offsetX) / scale, y: (clientY - offsetY) / scale };
}

function draw(world, time) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#041f10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
  drawWorld(ctx, world.state, time);
  drawHud(ctx, world.state, world, time);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const audio = createAudio();
const shotName = params.get('shot');

if (shotName !== null) {
  // A staged frame: no loop, no listeners that matter, one exact picture.
  const seed = Number(params.get('seed')) || 1;
  const world = createWorld(audio, seed);
  stageShot(shotName, world);
  draw(world, 0.85);
  status.textContent = `Mahjong Garden, staged scene ${shotName}`;
  window.__shotReady = true;
} else {
  const input = createInput();
  input.attach(canvas);
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  const world = createWorld(audio);
  if (params.get('debug')) {
    // A handle for the headless smoke test: read the board, click honestly.
    window.__mahjong = {
      world,
      tileCenterPx: (id) => tileCenter(world.state.tiles[id]),
      tileFree: (id) => isFree(world.state.tiles, world.state.tiles[id]),
    };
  }
  let last = performance.now();
  let acc = 0;
  let lastScreen = '';
  function frame(now) {
    acc += Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    world.handleActions(input.takeActions());
    for (const click of input.takeClicks()) {
      const p = toStage(click.x, click.y);
      world.clickAt(p.x, p.y);
    }
    const pos = input.getPos();
    if (pos) {
      const p = toStage(pos.x, pos.y);
      world.setHover(p.x, p.y);
      world.state.hoverButton = null;
      for (const b of world.state.ui.buttons) {
        if (b.enabled && p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h) {
          world.state.hoverButton = b.id;
        }
      }
    } else {
      world.setHover(null);
      world.state.hoverButton = null;
    }
    while (acc >= STEP) {
      world.step(STEP);
      acc -= STEP;
    }
    draw(world, now / 1000);
    if (world.state.screen !== lastScreen) {
      lastScreen = world.state.screen;
      status.textContent = `Mahjong Garden — ${world.state.screen}, score ${world.state.score}`;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
