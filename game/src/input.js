// Pointer and keyboard input for Mahjong Garden. The pointer's position
// and clicks are queued in client coordinates (main.js converts them to
// stage coordinates, since it owns the letterbox), and one-shot key
// presses are queued as named actions the world consumes once per frame,
// so a press between frames is never lost and never counted twice.

const KEY_ACTIONS = new Map([
  ['Space', 'confirm'],
  ['Enter', 'confirm'],
  ['KeyP', 'pause'],
  ['Escape', 'pause'],
  ['KeyM', 'mute'],
  ['KeyH', 'hint'],
  ['KeyU', 'undo'],
  ['KeyS', 'shuffle'],
  ['KeyN', 'newDeal'],
]);

export function createInput() {
  let pos = null;
  const clicks = [];
  const actions = new Set();

  function onKeyDown(event) {
    const action = KEY_ACTIONS.get(event.code);
    if (!action) return;
    if (!event.repeat) actions.add(action);
    event.preventDefault();
  }

  return {
    attach(target) {
      window.addEventListener('keydown', onKeyDown);
      target.addEventListener('pointermove', (event) => {
        pos = { x: event.clientX, y: event.clientY };
      });
      target.addEventListener('pointerdown', (event) => {
        pos = { x: event.clientX, y: event.clientY };
        clicks.push({ x: event.clientX, y: event.clientY });
      });
      target.addEventListener('pointerleave', () => { pos = null; });
    },
    /** The pointer's last client position, or null when it has left. */
    getPos() { return pos; },
    /** The clicks since the last call, in client coordinates. */
    takeClicks() {
      const taken = clicks.slice();
      clicks.length = 0;
      return taken;
    },
    /** The key actions since the last call, as a Set of names. */
    takeActions() {
      const taken = new Set(actions);
      actions.clear();
      return taken;
    },
  };
}
