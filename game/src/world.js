// Mahjong Garden's rules and state, with no drawing in it: the deal, the
// selection, matching, scoring and combos, hints, undo, shuffles, the
// clock, and the win / no-moves ends. Every deal is solvable by
// construction (see layout.js); the stored solution also powers the hint,
// which always points down a winning line when one is still on the board.

import {
  COMBO_MAX, COMBO_WINDOW, HINTS_PER_DEAL, HINT_BONUS, PAIR_SCORE,
  SHUFFLES_PER_DEAL, SHUFFLE_BONUS,
} from './config.js';
import { assignFaces, generateDeal, isFree, pickTile, tileCenter } from './layout.js';
import { createRandom } from './random.js';
import { faceName, matchKey } from './tiles.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const BACKDROP_SEED = 7;

export function createWorld(audio, fixedSeed = null) {
  const state = {
    screen: SCREEN_TITLE,
    paused: false,
    tiles: [],
    solution: [],
    seed: BACKDROP_SEED,
    selectedId: -1,
    hoverId: -1,
    deniedId: -1,
    deniedTimer: 0,
    score: 0,
    best: 0,
    elapsed: 0,
    movesMade: 0,
    hintsLeft: HINTS_PER_DEAL,
    shufflesLeft: SHUFFLES_PER_DEAL,
    combo: 0,
    lastMatchAt: -Infinity,
    hintPair: null,
    hintTimer: 0,
    undoStack: [],
    message: '',
    messageTimer: 0,
    sparks: [],
    floaters: [],
    endStats: null,
    ui: { buttons: [] },
  };

  function deal(seed) {
    const { tiles, solution } = generateDeal(createRandom(seed * 7919 + 13));
    state.tiles = tiles;
    state.solution = solution;
    state.seed = seed;
    state.selectedId = -1;
    state.hoverId = -1;
    state.deniedId = -1;
    state.deniedTimer = 0;
    state.score = 0;
    state.elapsed = 0;
    state.movesMade = 0;
    state.hintsLeft = HINTS_PER_DEAL;
    state.shufflesLeft = SHUFFLES_PER_DEAL;
    state.combo = 0;
    state.lastMatchAt = -Infinity;
    state.hintPair = null;
    state.hintTimer = 0;
    state.undoStack = [];
    state.message = '';
    state.messageTimer = 0;
    state.sparks = [];
    state.floaters = [];
    state.endStats = null;
    state.paused = false;
  }

  function startGame(seed = null) {
    const use = seed !== null ? seed : (fixedSeed !== null ? fixedSeed : Math.floor(Math.random() * 1e9) + 1);
    deal(use);
    state.screen = SCREEN_PLAY;
    audio.deal();
  }

  function remaining() {
    return state.tiles.reduce((n, t) => n + (t.present ? 1 : 0), 0);
  }

  function freeTiles() {
    return state.tiles.filter((t) => t.present && isFree(state.tiles, t));
  }

  /** A matching pair among the free tiles, preferring the stored winning
   *  line so a hint never leads the player astray. */
  function findMove() {
    const byId = new Map(state.tiles.map((t) => [t.id, t]));
    for (const [ia, ib] of state.solution) {
      const a = byId.get(ia);
      const b = byId.get(ib);
      if (a.present && b.present && isFree(state.tiles, a) && isFree(state.tiles, b)) return [a, b];
    }
    const free = freeTiles();
    const seen = new Map();
    for (const t of free) {
      const key = matchKey(t.face);
      if (seen.has(key)) return [seen.get(key), t];
      seen.set(key, t);
    }
    return null;
  }

  /** How many pairs could be matched right now. */
  function availableMoves() {
    const counts = new Map();
    for (const t of freeTiles()) {
      const key = matchKey(t.face);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    let moves = 0;
    for (const n of counts.values()) moves += Math.floor(n / 2);
    return moves;
  }

  function setMessage(text, seconds = 3) {
    state.message = text;
    state.messageTimer = seconds;
  }

  function burst(tile, color, count = 10) {
    const c = tileCenter(tile);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 130;
      state.sparks.push({
        x: c.x, y: c.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.55 + Math.random() * 0.3, maxLife: 0.85,
        color, size: 2 + Math.random() * 2.5,
      });
    }
  }

  function floatText(x, y, text, color = '#fff6dd', size = 22) {
    state.floaters.push({ x, y, text, color, size, life: 1.15 });
  }

  function afterChange() {
    if (remaining() === 0) {
      const bonus = state.hintsLeft * HINT_BONUS + state.shufflesLeft * SHUFFLE_BONUS;
      state.score += bonus;
      state.best = Math.max(state.best, state.score);
      state.endStats = {
        score: state.score, bonus, time: state.elapsed,
        pairs: state.movesMade, hintsLeft: state.hintsLeft, shufflesLeft: state.shufflesLeft,
      };
      state.screen = SCREEN_WIN;
      state.selectedId = -1;
      state.hintPair = null;
      audio.win();
      return;
    }
    if (availableMoves() === 0) {
      if (state.shufflesLeft > 0) {
        setMessage('No moves left — Shuffle (S) or Undo (U) to play on!', 6);
        audio.invalid();
      } else {
        state.best = Math.max(state.best, state.score);
        state.endStats = {
          score: state.score, bonus: 0, time: state.elapsed,
          pairs: state.movesMade, hintsLeft: state.hintsLeft, shufflesLeft: 0,
        };
        state.screen = SCREEN_OVER;
        state.selectedId = -1;
        state.hintPair = null;
        audio.lose();
      }
    }
  }

  function removePair(a, b) {
    state.undoStack.push({
      aId: a.id, bId: b.id,
      score: state.score, combo: state.combo,
      lastMatchAt: state.lastMatchAt, movesMade: state.movesMade,
    });
    a.present = false;
    b.present = false;
    state.movesMade += 1;
    if (state.elapsed - state.lastMatchAt <= COMBO_WINDOW) {
      state.combo = Math.min(state.combo + 1, COMBO_MAX);
    } else {
      state.combo = 1;
    }
    state.lastMatchAt = state.elapsed;
    const points = PAIR_SCORE * state.combo;
    state.score += points;
    const ca = tileCenter(a);
    const cb = tileCenter(b);
    burst(a, '#e8c35a');
    burst(b, '#e8c35a');
    floatText((ca.x + cb.x) / 2, (ca.y + cb.y) / 2 - 10,
      state.combo >= 2 ? `+${points}  COMBO x${state.combo}` : `+${points}`,
      state.combo >= 2 ? '#e8c35a' : '#fff6dd', state.combo >= 2 ? 24 : 21);
    state.selectedId = -1;
    state.hintPair = null;
    state.hintTimer = 0;
    audio.match(state.combo);
    afterChange();
  }

  function clickTile(tile) {
    if (state.screen !== SCREEN_PLAY || state.paused || !tile.present) return;
    if (!isFree(state.tiles, tile)) {
      state.deniedId = tile.id;
      state.deniedTimer = 0.35;
      setMessage('That tile is blocked — it needs a free side and nothing on top.', 2.2);
      audio.invalid();
      return;
    }
    if (state.selectedId === tile.id) {
      state.selectedId = -1;
      audio.click();
      return;
    }
    if (state.selectedId === -1) {
      state.selectedId = tile.id;
      audio.select();
      return;
    }
    const other = state.tiles[state.selectedId];
    if (other && other.present && matchKey(other.face) === matchKey(tile.face)) {
      removePair(other, tile);
    } else {
      state.selectedId = tile.id;
      audio.select();
    }
  }

  function hint() {
    if (state.screen !== SCREEN_PLAY || state.paused) return;
    if (state.hintsLeft <= 0) {
      setMessage('No hints left this deal.', 2.2);
      audio.invalid();
      return;
    }
    const move = findMove();
    if (!move) {
      setMessage('No moves on the board — Shuffle or Undo.', 2.2);
      audio.invalid();
      return;
    }
    state.hintsLeft -= 1;
    state.hintPair = [move[0].id, move[1].id];
    state.hintTimer = 3;
    setMessage(`Try the ${faceName(move[0].face)} pair.`, 3);
    audio.hint();
  }

  function undo() {
    if ((state.screen !== SCREEN_PLAY && state.screen !== SCREEN_OVER) || state.paused) return;
    const last = state.undoStack.pop();
    if (!last) {
      setMessage('Nothing to undo.', 2);
      audio.invalid();
      return;
    }
    state.tiles[last.aId].present = true;
    state.tiles[last.bId].present = true;
    state.score = last.score;
    state.combo = last.combo;
    state.lastMatchAt = last.lastMatchAt;
    state.movesMade = last.movesMade;
    state.selectedId = -1;
    state.hintPair = null;
    state.hintTimer = 0;
    if (state.screen === SCREEN_OVER) state.screen = SCREEN_PLAY;
    setMessage('Pair restored.', 1.6);
    audio.undo();
  }

  function shuffle() {
    if (state.screen !== SCREEN_PLAY || state.paused) return;
    if (state.shufflesLeft <= 0) {
      setMessage('No shuffles left this deal.', 2.2);
      audio.invalid();
      return;
    }
    if (remaining() === 0) return;
    const rng = createRandom((state.seed + state.movesMade * 131 + state.shufflesLeft * 17 + 5) * 7919 + 13);
    let solution = null;
    for (let attempt = 0; attempt < 500 && !solution; attempt += 1) {
      solution = assignFaces(state.tiles, rng);
    }
    if (!solution) return;
    state.solution = solution;
    state.shufflesLeft -= 1;
    state.undoStack = [];
    state.selectedId = -1;
    state.hintPair = null;
    state.hintTimer = 0;
    setMessage('Tiles shuffled — a winning line runs through them again.', 3);
    audio.shuffle();
  }

  function doButton(id) {
    if (id === 'hint') hint();
    else if (id === 'undo') undo();
    else if (id === 'shuffle') shuffle();
    else if (id === 'pause') {
      if (state.screen === SCREEN_PLAY) state.paused = !state.paused;
    } else if (id === 'newdeal') startGame();
  }

  /** A click in stage coordinates: buttons first, then the board. */
  function clickAt(px, py) {
    if (state.screen === SCREEN_TITLE) {
      startGame();
      return;
    }
    if (state.screen === SCREEN_WIN || state.screen === SCREEN_OVER) {
      startGame();
      return;
    }
    for (const b of state.ui.buttons) {
      if (b.enabled && px >= b.x && px < b.x + b.w && py >= b.y && py < b.y + b.h) {
        doButton(b.id);
        return;
      }
    }
    if (state.paused) return;
    const tile = pickTile(state.tiles, px, py);
    if (tile) clickTile(tile);
  }

  function setHover(px, py) {
    if (state.screen !== SCREEN_PLAY || state.paused || px === null) {
      state.hoverId = -1;
      return;
    }
    const tile = pickTile(state.tiles, px, py);
    state.hoverId = tile ? tile.id : -1;
  }

  function handleActions(acts) {
    if (acts.has('mute')) audio.toggleMute();
    if (acts.has('confirm')) {
      if (state.screen === SCREEN_TITLE || state.screen === SCREEN_WIN || state.screen === SCREEN_OVER) startGame();
      else if (state.paused) state.paused = false;
    }
    if (acts.has('pause')) {
      if (state.screen === SCREEN_PLAY) state.paused = !state.paused;
    }
    if (state.screen === SCREEN_PLAY && !state.paused) {
      if (acts.has('hint')) hint();
      if (acts.has('undo')) undo();
      if (acts.has('shuffle')) shuffle();
    }
    if (acts.has('newDeal') && state.screen === SCREEN_PLAY) startGame();
  }

  /** Advance timers and effects. The clock runs only in open play. */
  function step(dt) {
    if (state.screen === SCREEN_PLAY && !state.paused) state.elapsed += dt;
    if (state.messageTimer > 0) state.messageTimer = Math.max(0, state.messageTimer - dt);
    if (state.messageTimer === 0) state.message = '';
    if (state.hintTimer > 0) {
      state.hintTimer = Math.max(0, state.hintTimer - dt);
      if (state.hintTimer === 0) state.hintPair = null;
    }
    if (state.deniedTimer > 0) {
      state.deniedTimer = Math.max(0, state.deniedTimer - dt);
      if (state.deniedTimer === 0) state.deniedId = -1;
    }
    for (const s of state.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 260 * dt;
      s.life -= dt;
    }
    state.sparks = state.sparks.filter((s) => s.life > 0);
    for (const f of state.floaters) {
      f.y -= 34 * dt;
      f.life -= dt;
    }
    state.floaters = state.floaters.filter((f) => f.life > 0);
  }

  /** Staging helper for screenshot scenes: quietly remove the first n
   *  pairs of the winning line (they are free in that order by design). */
  function debugSolve(n) {
    const byId = new Map(state.tiles.map((t) => [t.id, t]));
    let done = 0;
    for (const [ia, ib] of state.solution) {
      if (done >= n) break;
      const a = byId.get(ia);
      const b = byId.get(ib);
      if (a.present && b.present) {
        a.present = false;
        b.present = false;
        done += 1;
      }
    }
    state.movesMade += done;
    state.score += done * PAIR_SCORE;
    state.selectedId = -1;
    return done;
  }

  deal(BACKDROP_SEED);

  return {
    state,
    startGame,
    clickAt,
    setHover,
    handleActions,
    step,
    findMove,
    availableMoves,
    remaining,
    debugSolve,
  };
}

/** mm:ss for the clock and the end panels. */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
