// The screenshot scenes behind ?shot=title|play|late|win|over&seed=n.
// Each is the real game, staged: the title idles over a dealt garden, the
// play scene is a deal twelve pairs in with a tile already selected, the
// late scene is the same garden worn down to its last forty tiles, and
// win/over set the run's end states with their real panels. The seed fixes
// the deal, so a scene is the same frame every time.

import { SCREEN_OVER, SCREEN_WIN } from './world.js';

function celebrate(state) {
  // A frozen firework of gold sparks over the cleared garden.
  const spots = [[290, 170], [990, 170], [290, 570], [990, 570], [640, 120]];
  for (const [sx, sy] of spots) {
    for (let i = 0; i < 18; i += 1) {
      const a = (i / 18) * Math.PI * 2;
      state.sparks.push({
        x: sx, y: sy,
        vx: Math.cos(a) * 90, vy: Math.sin(a) * 90,
        life: 0.8, maxLife: 0.85, color: '#e8c35a', size: 4.2,
      });
    }
  }
}

/** Stage the named scene on `world`. */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    world.startGame();
    world.debugSolve(12);
    state.elapsed = 97;
    state.combo = 3;
    state.lastMatchAt = state.elapsed - 1.2;
    const move = world.findMove();
    if (move) state.selectedId = move[0].id;
    return;
  }
  if (name === 'late') {
    world.startGame();
    world.debugSolve(52);
    state.elapsed = 486;
    return;
  }
  if (name === 'win') {
    world.startGame();
    world.debugSolve(72);
    state.elapsed = 743;
    state.hintsLeft = 2;
    state.shufflesLeft = 1;
    state.score = 7290;
    state.best = 7290;
    state.endStats = {
      score: 7290, bonus: 90, time: 743, pairs: 72, hintsLeft: 2, shufflesLeft: 1,
    };
    state.screen = SCREEN_WIN;
    celebrate(state);
    return;
  }
  if (name === 'over') {
    world.startGame();
    world.debugSolve(58);
    state.elapsed = 512;
    state.score = 5800;
    state.shufflesLeft = 0;
    state.endStats = {
      score: 5800, bonus: 0, time: 512, pairs: 58, hintsLeft: state.hintsLeft, shufflesLeft: 0,
    };
    state.screen = SCREEN_OVER;
    return;
  }
  // Anything else is the title: the backdrop deal idling behind the panel.
  world.state.screen = 'title';
}
